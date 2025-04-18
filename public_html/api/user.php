<?php
/**
 * User Data Functions
 * Path: /exercise-app/api/user.php
 */

// Include database connection and auth functions
require_once 'db.php';
require_once 'auth.php';

/**
 * User Class
 */
class User {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get user profile data
     * @param int $userId
     * @return array User profile data
     */
    public function getProfile($userId) {
        // Get user data
        $user = $this->db->getRow(
            "SELECT user_id, username, email, weight, height, goal, created_at 
             FROM users 
             WHERE user_id = ?",
            [$userId]
        );
        
        if (!$user) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'User not found'
            ];
        }
        
        // Get weight history
        $weightHistory = $this->db->getRows(
            "SELECT weight_id, weight, logged_at, notes 
             FROM weight_logs 
             WHERE user_id = ? 
             ORDER BY logged_at DESC 
             LIMIT 10",
            [$userId]
        );
        
        // Get workout stats
        $workoutStats = $this->getWorkoutStats($userId);
        
        // Get recent PR's
        $personalRecords = $this->getPersonalRecords($userId);
        
        // Return complete profile data
        return [
            'error' => false,
            'user' => $user,
            'weightHistory' => $weightHistory,
            'workoutStats' => $workoutStats,
            'personalRecords' => $personalRecords
        ];
    }
    
    /**
     * Get workout statistics
     * @param int $userId
     * @return array Workout statistics
     */
    public function getWorkoutStats($userId) {
        // Get total workouts completed
        $totalWorkouts = $this->db->getValue(
            "SELECT COUNT(*) FROM workout_logs WHERE user_id = ?",
            [$userId]
        );
        
        // Get workouts completed in the last 30 days
        $recentWorkouts = $this->db->getValue(
            "SELECT COUNT(*) 
             FROM workout_logs 
             WHERE user_id = ? AND completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            [$userId]
        );
        
        // Get total BJJ sessions
        $totalBjj = $this->db->getValue(
            "SELECT COUNT(*) FROM bjj_sessions WHERE user_id = ?",
            [$userId]
        );
        
        // Get BJJ sessions in the last 30 days
        $recentBjj = $this->db->getValue(
            "SELECT COUNT(*) 
             FROM bjj_sessions 
             WHERE user_id = ? AND session_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            [$userId]
        );
        
        // Calculate total volume (optional, can be intensive for large datasets)
        $totalVolume = $this->db->getValue(
            "SELECT SUM(el.weight * el.reps) 
             FROM exercise_logs el
             JOIN workout_logs wl ON el.log_id = wl.log_id
             WHERE wl.user_id = ?",
            [$userId]
        );
        
        return [
            'totalWorkouts' => (int)$totalWorkouts,
            'recentWorkouts' => (int)$recentWorkouts,
            'totalBjj' => (int)$totalBjj,
            'recentBjj' => (int)$recentBjj,
            'totalVolume' => (float)$totalVolume
        ];
    }
    
    /**
     * Get personal records
     * @param int $userId
     * @param int $limit Limit the number of records returned
     * @return array Personal records
     */
    public function getPersonalRecords($userId, $limit = 5) {
        // Get personal records with exercise names
        $records = $this->db->getRows(
            "SELECT pr.pr_id, pr.exercise_id, e.name AS exercise_name, 
                    pr.weight, pr.reps, pr.achieved_at, pr.notes
             FROM personal_records pr
             JOIN exercises e ON pr.exercise_id = e.exercise_id
             WHERE pr.user_id = ?
             ORDER BY pr.achieved_at DESC
             LIMIT ?",
            [$userId, $limit]
        );
        
        return $records;
    }
    
    /**
     * Add weight log
     * @param int $userId
     * @param float $weight
     * @param string $notes
     * @return array Response
     */
    public function addWeightLog($userId, $weight, $notes = '') {
        // Insert weight log
        $logId = $this->db->insert('weight_logs', [
            'user_id' => $userId,
            'weight' => $weight,
            'logged_at' => date('Y-m-d H:i:s'),
            'notes' => $notes
        ]);
        
        if (!$logId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to log weight'
            ];
        }
        
        // Update user's current weight
        $this->db->update(
            'users',
            ['weight' => $weight],
            'user_id = ?',
            [$userId]
        );
        
        // Get the newly created log
        $log = $this->db->getRow(
            "SELECT weight_id, weight, logged_at, notes 
             FROM weight_logs 
             WHERE weight_id = ?",
            [$logId]
        );
        
        return [
            'error' => false,
            'message' => 'Weight logged successfully',
            'log' => $log
        ];
    }
    
    /**
     * Get weight history
     * @param int $userId
     * @param int $limit
     * @param int $offset
     * @return array Weight history
     */
    public function getWeightHistory($userId, $limit = 30, $offset = 0) {
        // Get weight logs
        $logs = $this->db->getRows(
            "SELECT weight_id, weight, logged_at, notes 
             FROM weight_logs 
             WHERE user_id = ? 
             ORDER BY logged_at DESC 
             LIMIT ? OFFSET ?",
            [$userId, $limit, $offset]
        );
        
        // Get total count
        $total = $this->db->getValue(
            "SELECT COUNT(*) FROM weight_logs WHERE user_id = ?",
            [$userId]
        );
        
        return [
            'error' => false,
            'logs' => $logs,
            'total' => (int)$total
        ];
    }
    
    /**
     * Add BJJ session
     * @param int $userId
     * @param array $sessionData
     * @return array Response
     */
    public function addBjjSession($userId, $sessionData) {
        // Validate required fields
        if (!isset($sessionData['session_date']) || !isset($sessionData['duration'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Session date and duration are required'
            ];
        }
        
        // Prepare data for insertion
        $data = [
            'user_id' => $userId,
            'session_date' => $sessionData['session_date'],
            'duration' => $sessionData['duration']
        ];
        
        // Add optional fields if provided
        if (isset($sessionData['techniques_practiced'])) {
            $data['techniques_practiced'] = $sessionData['techniques_practiced'];
        }
        
        if (isset($sessionData['notes'])) {
            $data['notes'] = $sessionData['notes'];
        }
        
        if (isset($sessionData['rating'])) {
            $data['rating'] = $sessionData['rating'];
        }
        
        // Insert BJJ session
        $sessionId = $this->db->insert('bjj_sessions', $data);
        
        if (!$sessionId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to log BJJ session'
            ];
        }
        
        // Get the newly created session
        $session = $this->db->getRow(
            "SELECT session_id, session_date, duration, techniques_practiced, notes, rating 
             FROM bjj_sessions 
             WHERE session_id = ?",
            [$sessionId]
        );
        
        return [
            'error' => false,
            'message' => 'BJJ session logged successfully',
            'session' => $session
        ];
    }
    
    /**
     * Get BJJ session history
     * @param int $userId
     * @param int $limit
     * @param int $offset
     * @return array BJJ session history
     */
    public function getBjjHistory($userId, $limit = 30, $offset = 0) {
        // Get BJJ sessions
        $sessions = $this->db->getRows(
            "SELECT session_id, session_date, duration, techniques_practiced, notes, rating 
             FROM bjj_sessions 
             WHERE user_id = ? 
             ORDER BY session_date DESC 
             LIMIT ? OFFSET ?",
            [$userId, $limit, $offset]
        );
        
        // Get total count
        $total = $this->db->getValue(
            "SELECT COUNT(*) FROM bjj_sessions WHERE user_id = ?",
            [$userId]
        );
        
        return [
            'error' => false,
            'sessions' => $sessions,
            'total' => (int)$total
        ];
    }
    
    /**
     * Get BJJ session details
     * @param int $userId
     * @param int $sessionId
     * @return array BJJ session details
     */
    public function getBjjSessionDetails($userId, $sessionId) {
        // Get BJJ session
        $session = $this->db->getRow(
            "SELECT session_id, session_date, duration, techniques_practiced, notes, rating 
             FROM bjj_sessions 
             WHERE user_id = ? AND session_id = ?",
            [$userId, $sessionId]
        );
        
        if (!$session) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'BJJ session not found'
            ];
        }
        
        return [
            'error' => false,
            'session' => $session
        ];
    }
    
    /**
     * Update BJJ session
     * @param int $userId
     * @param int $sessionId
     * @param array $sessionData
     * @return array Response
     */
    public function updateBjjSession($userId, $sessionId, $sessionData) {
        // Check if session exists and belongs to user
        $sessionExists = $this->db->getValue(
            "SELECT COUNT(*) FROM bjj_sessions WHERE session_id = ? AND user_id = ?",
            [$sessionId, $userId]
        );
        
        if (!$sessionExists) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'BJJ session not found'
            ];
        }
        
        // Allowed fields to update
        $allowedFields = ['session_date', 'duration', 'techniques_practiced', 'notes', 'rating'];
        
        // Filter data to include only allowed fields
        $data = array_intersect_key($sessionData, array_flip($allowedFields));
        
        // Update session
        $result = $this->db->update(
            'bjj_sessions',
            $data,
            'session_id = ? AND user_id = ?',
            [$sessionId, $userId]
        );
        
        if ($result) {
            // Get updated session
            $session = $this->db->getRow(
                "SELECT session_id, session_date, duration, techniques_practiced, notes, rating 
                 FROM bjj_sessions 
                 WHERE session_id = ?",
                [$sessionId]
            );
            
            return [
                'error' => false,
                'message' => 'BJJ session updated successfully',
                'session' => $session
            ];
        } else {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to update BJJ session'
            ];
        }
    }
    
    /**
     * Delete BJJ session
     * @param int $userId
     * @param int $sessionId
     * @return array Response
     */
    public function deleteBjjSession($userId, $sessionId) {
        // Check if session exists and belongs to user
        $sessionExists = $this->db->getValue(
            "SELECT COUNT(*) FROM bjj_sessions WHERE session_id = ? AND user_id = ?",
            [$sessionId, $userId]
        );
        
        if (!$sessionExists) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'BJJ session not found'
            ];
        }
        
        // Delete session
        $result = $this->db->delete(
            'bjj_sessions',
            'session_id = ? AND user_id = ?',
            [$sessionId, $userId]
        );
        
        if ($result) {
            return [
                'error' => false,
                'message' => 'BJJ session deleted successfully'
            ];
        } else {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to delete BJJ session'
            ];
        }
    }
}

// Process API requests based on method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Handle GET requests for user data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create user instance
    $user = new User();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'profile':
            // Get user profile
            $result = $user->getProfile($userId);
            break;
            
        case 'weight':
            // Get weight history
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $result = $user->getWeightHistory($userId, $limit, $offset);
            break;
            
        case 'bjj':
            // Get BJJ history
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $result = $user->getBjjHistory($userId, $limit, $offset);
            break;
            
        case 'stats':
            // Get workout stats
            $result = [
                'error' => false,
                'stats' => $user->getWorkoutStats($userId)
            ];
            break;
            
        case 'prs':
            // Get personal records
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $result = [
                'error' => false,
                'records' => $user->getPersonalRecords($userId, $limit)
            ];
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
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle POST requests for user data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create user instance
    $user = new User();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'weight':
            // Add weight log
            if (!isset($data['weight'])) {
                http_response_code(HTTP_BAD_REQUEST);
                $result = [
                    'error' => true,
                    'message' => 'Weight is required'
                ];
                break;
            }
            
            $notes = isset($data['notes']) ? $data['notes'] : '';
            $result = $user->addWeightLog($userId, (float)$data['weight'], $notes);
            break;
            
        case 'bjj':
            // Add BJJ session
            $result = $user->addBjjSession($userId, $data);
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
    // Handle PUT requests for user data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $endpoint = prev($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create user instance
    $user = new User();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'bjj':
            // Update BJJ session
            $result = $user->updateBjjSession($userId, (int)$resourceId, $data);
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
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Handle DELETE requests for user data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $endpoint = prev($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create user instance
    $user = new User();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'bjj':
            // Delete BJJ session
            $result = $user->deleteBjjSession($userId, (int)$resourceId);
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
}