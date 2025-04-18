<?php
/**
 * Exercise Functions
 * Path: /exercise-app/api/exercise.php
 */

// Include database connection and auth functions
require_once 'db.php';
require_once 'auth.php';

/**
 * Exercise Class
 */
class Exercise {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all exercises
     * @param int|null $categoryId Filter by category
     * @return array Exercises
     */
    public function getExercises($categoryId = null) {
        // Base query
        $sql = "SELECT e.exercise_id, e.name, e.description, e.category_id, ec.name AS category_name,
                       e.equipment_needed, e.muscle_group, e.instructions, 
                       e.video_url, e.image_url, e.is_compound
                FROM exercises e
                JOIN exercise_categories ec ON e.category_id = ec.category_id";
        
        $params = [];
        
        // Add category filter if provided
        if ($categoryId !== null) {
            $sql .= " WHERE e.category_id = ?";
            $params[] = $categoryId;
        }
        
        // Order by name
        $sql .= " ORDER BY e.name ASC";
        
        // Get exercises
        $exercises = $this->db->getRows($sql, $params);
        
        return [
            'error' => false,
            'exercises' => $exercises
        ];
    }
    
    /**
     * Get exercise categories
     * @return array Exercise categories
     */
    public function getExerciseCategories() {
        // Get categories
        $categories = $this->db->getRows(
            "SELECT category_id, name, description,
                    (SELECT COUNT(*) FROM exercises WHERE category_id = ec.category_id) AS exercise_count
             FROM exercise_categories ec
             ORDER BY name ASC"
        );
        
        return [
            'error' => false,
            'categories' => $categories
        ];
    }
    
    /**
     * Get exercise details
     * @param int $exerciseId
     * @param int $userId For getting user's history with this exercise
     * @return array Exercise details
     */
    public function getExerciseDetails($exerciseId, $userId = null) {
        // Get exercise
        $exercise = $this->db->getRow(
            "SELECT e.exercise_id, e.name, e.description, e.category_id, ec.name AS category_name,
                    e.equipment_needed, e.muscle_group, e.instructions, 
                    e.video_url, e.image_url, e.is_compound
             FROM exercises e
             JOIN exercise_categories ec ON e.category_id = ec.category_id
             WHERE e.exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Get user's history with this exercise if user ID provided
        $history = [];
        $personalRecords = [];
        
        if ($userId) {
            // Get recent logs
            $history = $this->db->getRows(
                "SELECT el.exercise_log_id, el.set_number, el.reps, el.weight, el.notes,
                        wl.completed_at, w.name as workout_name
                 FROM exercise_logs el
                 JOIN workout_logs wl ON el.log_id = wl.log_id
                 JOIN workouts w ON wl.workout_id = w.workout_id
                 WHERE wl.user_id = ? AND el.exercise_id = ?
                 ORDER BY wl.completed_at DESC, el.set_number ASC
                 LIMIT 30",
                [$userId, $exerciseId]
            );
            
            // Get personal records
            $personalRecords = $this->db->getRows(
                "SELECT pr_id, weight, reps, achieved_at, notes
                 FROM personal_records
                 WHERE user_id = ? AND exercise_id = ?
                 ORDER BY weight DESC, reps DESC
                 LIMIT 10",
                [$userId, $exerciseId]
            );
        }
        
        return [
            'error' => false,
            'exercise' => $exercise,
            'history' => $history,
            'personalRecords' => $personalRecords
        ];
    }
    
    /**
     * Search exercises
     * @param string $query Search query
     * @param int|null $categoryId Filter by category
     * @return array Matching exercises
     */
    public function searchExercises($query, $categoryId = null) {
        // Base query
        $sql = "SELECT e.exercise_id, e.name, e.description, e.category_id, ec.name AS category_name,
                       e.equipment_needed, e.muscle_group, e.instructions, 
                       e.video_url, e.image_url, e.is_compound
                FROM exercises e
                JOIN exercise_categories ec ON e.category_id = ec.category_id
                WHERE e.name LIKE ? OR e.description LIKE ? OR e.muscle_group LIKE ?";
        
        $params = [
            '%' . $query . '%',
            '%' . $query . '%',
            '%' . $query . '%'
        ];
        
        // Add category filter if provided
        if ($categoryId !== null) {
            $sql .= " AND e.category_id = ?";
            $params[] = $categoryId;
        }
        
        // Order by relevance (name match first)
        $sql .= " ORDER BY CASE WHEN e.name LIKE ? THEN 0 ELSE 1 END, e.name ASC";
        $params[] = $query . '%';
        
        // Get exercises
        $exercises = $this->db->getRows($sql, $params);
        
        return [
            'error' => false,
            'exercises' => $exercises
        ];
    }
    
    /**
     * Create a new exercise
     * @param array $exerciseData
     * @return array Response with the created exercise
     */
    public function createExercise($exerciseData) {
        // Validate required fields
        if (!isset($exerciseData['name']) || !isset($exerciseData['category_id'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Exercise name and category are required'
            ];
        }
        
        // Prepare exercise data for insertion
        $data = [
            'name' => $exerciseData['name'],
            'category_id' => $exerciseData['category_id']
        ];
        
        // Add optional fields if provided
        $optionalFields = [
            'description', 'equipment_needed', 'muscle_group', 'instructions',
            'video_url', 'image_url', 'is_compound'
        ];
        
        foreach ($optionalFields as $field) {
            if (isset($exerciseData[$field])) {
                $data[$field] = $exerciseData[$field];
            }
        }
        
        // Insert exercise
        $exerciseId = $this->db->insert('exercises', $data);
        
        if (!$exerciseId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to create exercise'
            ];
        }
        
        // Get the created exercise
        return $this->getExerciseDetails($exerciseId);
    }
    
    /**
     * Update an exercise
     * @param int $exerciseId
     * @param array $exerciseData
     * @return array Response with the updated exercise
     */
    public function updateExercise($exerciseId, $exerciseData) {
        // Check if exercise exists
        $exercise = $this->db->getRow(
            "SELECT exercise_id FROM exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Allowed fields to update
        $allowedFields = [
            'name', 'category_id', 'description', 'equipment_needed', 'muscle_group',
            'instructions', 'video_url', 'image_url', 'is_compound'
        ];
        
        // Filter data to include only allowed fields
        $data = array_intersect_key($exerciseData, array_flip($allowedFields));
        
        if (empty($data)) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'No valid fields to update'
            ];
        }
        
        // Update exercise
        $result = $this->db->update(
            'exercises',
            $data,
            'exercise_id = ?',
            [$exerciseId]
        );
        
        if (!$result) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to update exercise'
            ];
        }
        
        // Get the updated exercise
        return $this->getExerciseDetails($exerciseId);
    }
    
    /**
     * Delete an exercise
     * @param int $exerciseId
     * @return array Response
     */
    public function deleteExercise($exerciseId) {
        // Check if exercise exists
        $exercise = $this->db->getRow(
            "SELECT exercise_id FROM exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Check if exercise is used in any workouts
        $usageCount = $this->db->getValue(
            "SELECT COUNT(*) FROM workout_exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if ($usageCount > 0) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Cannot delete exercise that is used in workouts'
            ];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Delete personal records for this exercise
            $this->db->delete(
                'personal_records',
                'exercise_id = ?',
                [$exerciseId]
            );
            
            // Delete exercise logs for this exercise
            $this->db->delete(
                'exercise_logs',
                'exercise_id = ?',
                [$exerciseId]
            );
            
            // Delete the exercise
            $this->db->delete(
                'exercises',
                'exercise_id = ?',
                [$exerciseId]
            );
            
            // Commit transaction
            $this->db->commit();
            
            return [
                'error' => false,
                'message' => 'Exercise deleted successfully'
            ];
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->db->rollback();
            
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Create a new exercise category
     * @param array $categoryData
     * @return array Response with the created category
     */
    public function createCategory($categoryData) {
        // Validate required fields
        if (!isset($categoryData['name'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Category name is required'
            ];
        }
        
        // Prepare category data for insertion
        $data = [
            'name' => $categoryData['name']
        ];
        
        // Add description if provided
        if (isset($categoryData['description'])) {
            $data['description'] = $categoryData['description'];
        }
        
        // Insert category
        $categoryId = $this->db->insert('exercise_categories', $data);
        
        if (!$categoryId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to create category'
            ];
        }
        
        // Get the created category
        $category = $this->db->getRow(
            "SELECT category_id, name, description FROM exercise_categories WHERE category_id = ?",
            [$categoryId]
        );
        
        return [
            'error' => false,
            'message' => 'Category created successfully',
            'category' => $category
        ];
    }
    
    /**
     * Update an exercise category
     * @param int $categoryId
     * @param array $categoryData
     * @return array Response with the updated category
     */
    public function updateCategory($categoryId, $categoryData) {
        // Check if category exists
        $category = $this->db->getRow(
            "SELECT category_id FROM exercise_categories WHERE category_id = ?",
            [$categoryId]
        );
        
        if (!$category) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Category not found'
            ];
        }
        
        // Allowed fields to update
        $allowedFields = ['name', 'description'];
        
        // Filter data to include only allowed fields
        $data = array_intersect_key($categoryData, array_flip($allowedFields));
        
        if (empty($data)) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'No valid fields to update'
            ];
        }
        
        // Update category
        $result = $this->db->update(
            'exercise_categories',
            $data,
            'category_id = ?',
            [$categoryId]
        );
        
        if (!$result) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to update category'
            ];
        }
        
        // Get the updated category
        $updatedCategory = $this->db->getRow(
            "SELECT category_id, name, description FROM exercise_categories WHERE category_id = ?",
            [$categoryId]
        );
        
        return [
            'error' => false,
            'message' => 'Category updated successfully',
            'category' => $updatedCategory
        ];
    }
    
    /**
     * Delete an exercise category
     * @param int $categoryId
     * @return array Response
     */
    public function deleteCategory($categoryId) {
        // Check if category exists
        $category = $this->db->getRow(
            "SELECT category_id FROM exercise_categories WHERE category_id = ?",
            [$categoryId]
        );
        
        if (!$category) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Category not found'
            ];
        }
        
        // Check if category is used by any exercises
        $usageCount = $this->db->getValue(
            "SELECT COUNT(*) FROM exercises WHERE category_id = ?",
            [$categoryId]
        );
        
        if ($usageCount > 0) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Cannot delete category that is used by exercises'
            ];
        }
        
        // Delete the category
        $result = $this->db->delete(
            'exercise_categories',
            'category_id = ?',
            [$categoryId]
        );
        
        if (!$result) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to delete category'
            ];
        }
        
        return [
            'error' => false,
            'message' => 'Category deleted successfully'
        ];
    }
    
    /**
     * Get personal records for an exercise
     * @param int $exerciseId
     * @param int $userId
     * @return array Personal records
     */
    public function getPersonalRecords($exerciseId, $userId) {
        // Get exercise
        $exercise = $this->db->getRow(
            "SELECT name FROM exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Get personal records
        $records = $this->db->getRows(
            "SELECT pr_id, weight, reps, achieved_at, notes
             FROM personal_records
             WHERE user_id = ? AND exercise_id = ?
             ORDER BY weight DESC, reps DESC",
            [$userId, $exerciseId]
        );
        
        return [
            'error' => false,
            'exercise' => $exercise,
            'records' => $records
        ];
    }
    
    /**
     * Add a personal record
     * @param int $userId
     * @param int $exerciseId
     * @param array $recordData
     * @return array Response
     */
    public function addPersonalRecord($userId, $exerciseId, $recordData) {
        // Validate required fields
        if (!isset($recordData['weight']) || !isset($recordData['reps'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Weight and reps are required'
            ];
        }
        
        // Check if exercise exists
        $exercise = $this->db->getRow(
            "SELECT name FROM exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Check if it's actually a PR (heavier weight for same reps)
        $existingPr = $this->db->getRow(
            "SELECT pr_id, weight, reps 
             FROM personal_records 
             WHERE user_id = ? AND exercise_id = ? AND reps = ?
             ORDER BY weight DESC
             LIMIT 1",
            [$userId, $exerciseId, $recordData['reps']]
        );
        
        $isPr = !$existingPr || $recordData['weight'] > $existingPr['weight'];
        
        if (!$isPr) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => "Not a personal record. Current record is " . $existingPr['weight'] . " lbs for " . $existingPr['reps'] . " reps."
            ];
        }
        
        // Prepare PR data for insertion
        $data = [
            'user_id' => $userId,
            'exercise_id' => $exerciseId,
            'weight' => $recordData['weight'],
            'reps' => $recordData['reps'],
            'achieved_at' => isset($recordData['achieved_at']) ? $recordData['achieved_at'] : date('Y-m-d H:i:s')
        ];
        
        // Add notes if provided
        if (isset($recordData['notes'])) {
            $data['notes'] = $recordData['notes'];
        }
        
        // Insert PR
        $prId = $this->db->insert('personal_records', $data);
        
        if (!$prId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to add personal record'
            ];
        }
        
        // Get the created PR
        $pr = $this->db->getRow(
            "SELECT pr_id, weight, reps, achieved_at, notes
             FROM personal_records
             WHERE pr_id = ?",
            [$prId]
        );
        
        return [
            'error' => false,
            'message' => 'Personal record added successfully',
            'record' => $pr,
            'exercise' => $exercise
        ];
    }
    
    /**
     * Delete a personal record
     * @param int $prId
     * @param int $userId
     * @return array Response
     */
    public function deletePersonalRecord($prId, $userId) {
        // Check if PR exists and belongs to user
        $pr = $this->db->getRow(
            "SELECT pr_id FROM personal_records WHERE pr_id = ? AND user_id = ?",
            [$prId, $userId]
        );
        
        if (!$pr) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Personal record not found or access denied'
            ];
        }
        
        // Delete the PR
        $result = $this->db->delete(
            'personal_records',
            'pr_id = ?',
            [$prId]
        );
        
        if (!$result) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to delete personal record'
            ];
        }
        
        return [
            'error' => false,
            'message' => 'Personal record deleted successfully'
        ];
    }
}

// Process API requests based on method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Handle GET requests for exercise data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create exercise instance
    $exercise = new Exercise();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'exercises':
            // Get all exercises or filter by category
            $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
            
            // Check if search query is provided
            if (isset($_GET['q']) && !empty($_GET['q'])) {
                $result = $exercise->searchExercises($_GET['q'], $categoryId);
            } else {
                $result = $exercise->getExercises($categoryId);
            }
            break;
            
        case 'categories':
            // Get exercise categories
            $result = $exercise->getExerciseCategories();
            break;
            
        default:
            // Check if it's a specific exercise ID
            if (is_numeric($endpoint)) {
                // Get exercise details
                $result = $exercise->getExerciseDetails((int)$endpoint, $userId);
            } else {
                // Invalid endpoint
                http_response_code(HTTP_NOT_FOUND);
                $result = [
                    'error' => true,
                    'message' => 'Endpoint not found'
                ];
            }
    }
    
    // Return JSON response
    echo json_encode($result);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle POST requests for exercise data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create exercise instance
    $exercise = new Exercise();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'exercises':
            // Create new exercise (admin only)
            requireAdmin();
            $result = $exercise->createExercise($data);
            break;
            
        case 'categories':
            // Create new category (admin only)
            requireAdmin();
            $result = $exercise->createCategory($data);
            break;
            
        case 'records':
            // Add personal record
            $userId = requireAuth();
            
            if (!isset($data['exercise_id'])) {
                http_response_code(HTTP_BAD_REQUEST);
                $result = [
                    'error' => true,
                    'message' => 'Exercise ID is required'
                ];
                break;
            }
            
            $result = $exercise->addPersonalRecord($userId, $data['exercise_id'], $data);
            break;
            
        default:
            // Invalid endpoint
            http_response_code(HTTP_NOT_FOUND);
            $result = [
                'error' => true,
                'message' => 'Endpoint not found'
            ];
    }
    
    // Return JSON response
    echo json_encode($result);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Handle PUT requests for exercise data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $resourceType = prev($pathParts);
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create exercise instance
    $exercise = new Exercise();
    
    // Process based on resource type
    switch ($resourceType) {
        case 'exercises':
            // Update exercise (admin only)
            requireAdmin();
            $result = $exercise->updateExercise((int)$resourceId, $data);
            break;
            
        case 'categories':
            // Update category (admin only)
            requireAdmin();
            $result = $exercise->updateCategory((int)$resourceId, $data);
            break;
            
        default:
            // Invalid resource type
            http_response_code(HTTP_NOT_FOUND);
            $result = [
                'error' => true,
                'message' => 'Endpoint not found'
            ];
    }
    
    // Return JSON response
    echo json_encode($result);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Handle DELETE requests for exercise data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $resourceType = prev($pathParts);
    
    // Create exercise instance
    $exercise = new Exercise();
    
    // Process based on resource type
    switch ($resourceType) {
        case 'exercises':
            // Delete exercise (admin only)
            requireAdmin();
            $result = $exercise->deleteExercise((int)$resourceId);
            break;
            
        case 'categories':
            // Delete category (admin only)
            requireAdmin();
            $result = $exercise->deleteCategory((int)$resourceId);
            break;
            
        case 'records':
            // Delete personal record
            $userId = requireAuth();
            $result = $exercise->deletePersonalRecord((int)$resourceId, $userId);
            break;
            
        default:
            // Invalid resource type
            http_response_code(HTTP_NOT_FOUND);
            $result = [
                'error' => true,
                'message' => 'Endpoint not found'
            ];
    }
    
    // Return JSON response
    echo json_encode($result);
}