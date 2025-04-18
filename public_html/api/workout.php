<?php
/**
 * Workout Functions
 * Path: /exercise-app/api/workout.php
 */

// Include database connection and auth functions
require_once 'db.php';
require_once 'auth.php';

/**
 * Workout Class
 */
class Workout {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all workout plans for a user
     * @param int $userId
     * @return array Workout plans
     */
    public function getWorkoutPlans($userId) {
        // Get user's workout plans
        $userPlans = $this->db->getRows(
            "SELECT wp.plan_id, wp.name, wp.description, wp.frequency, wp.goal, wp.created_at,
                    (SELECT COUNT(*) FROM workouts w WHERE w.plan_id = wp.plan_id) AS workout_count
             FROM workout_plans wp
             WHERE wp.user_id = ? AND wp.is_template = 0
             ORDER BY wp.created_at DESC",
            [$userId]
        );
        
        // Get available template plans
        $templatePlans = $this->db->getRows(
            "SELECT wp.plan_id, wp.name, wp.description, wp.frequency, wp.goal, wp.created_at,
                    (SELECT COUNT(*) FROM workouts w WHERE w.plan_id = wp.plan_id) AS workout_count,
                    1 AS is_template
             FROM workout_plans wp
             WHERE wp.is_template = 1
             ORDER BY wp.name ASC"
        );
        
        return [
            'error' => false,
            'userPlans' => $userPlans,
            'templatePlans' => $templatePlans
        ];
    }
    
    /**
     * Get workout plan details
     * @param int $planId
     * @param int $userId (for access control)
     * @return array Workout plan details
     */
    public function getWorkoutPlanDetails($planId, $userId) {
        // Get plan details
        $plan = $this->db->getRow(
            "SELECT wp.plan_id, wp.name, wp.description, wp.frequency, wp.goal, wp.created_at, wp.is_template
             FROM workout_plans wp
             WHERE wp.plan_id = ? AND (wp.user_id = ? OR wp.is_template = 1)",
            [$planId, $userId]
        );
        
        if (!$plan) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Workout plan not found or access denied'
            ];
        }
        
        // Get workouts in the plan
        $workouts = $this->db->getRows(
            "SELECT w.workout_id, w.name, w.description, w.day_of_week
             FROM workouts w
             WHERE w.plan_id = ?
             ORDER BY w.day_of_week ASC",
            [$planId]
        );
        
        // Get exercises for each workout
        foreach ($workouts as &$workout) {
            $workout['exercises'] = $this->db->getRows(
                "SELECT we.workout_exercise_id, e.exercise_id, e.name, e.category_id,
                        e.equipment_needed, e.muscle_group, e.is_compound,
                        we.sets, we.reps, we.rest_period, we.notes, we.order_num
                 FROM workout_exercises we
                 JOIN exercises e ON we.exercise_id = e.exercise_id
                 WHERE we.workout_id = ?
                 ORDER BY we.order_num ASC",
                [$workout['workout_id']]
            );
        }
        
        return [
            'error' => false,
            'plan' => $plan,
            'workouts' => $workouts
        ];
    }
    
    /**
     * Create a new workout plan
     * @param int $userId
     * @param array $planData
     * @return array Response with the created plan
     */
    public function createWorkoutPlan($userId, $planData) {
        // Validate required fields
        if (!isset($planData['name']) || !isset($planData['frequency'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Plan name and frequency are required'
            ];
        }
        
        // Prepare plan data for insertion
        $data = [
            'user_id' => $userId,
            'name' => $planData['name'],
            'frequency' => $planData['frequency'],
            'created_at' => date('Y-m-d H:i:s'),
            'is_template' => 0
        ];
        
        // Add optional fields if provided
        if (isset($planData['description'])) {
            $data['description'] = $planData['description'];
        }
        
        if (isset($planData['goal'])) {
            $data['goal'] = $planData['goal'];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Insert plan
            $planId = $this->db->insert('workout_plans', $data);
            
            if (!$planId) {
                throw new Exception('Failed to create workout plan');
            }
            
            // Insert workouts if provided
            if (isset($planData['workouts']) && is_array($planData['workouts'])) {
                foreach ($planData['workouts'] as $workoutData) {
                    // Validate required workout fields
                    if (!isset($workoutData['name'])) {
                        throw new Exception('Workout name is required');
                    }
                    
                    // Prepare workout data
                    $workoutInsert = [
                        'plan_id' => $planId,
                        'name' => $workoutData['name']
                    ];
                    
                    // Add optional workout fields
                    if (isset($workoutData['description'])) {
                        $workoutInsert['description'] = $workoutData['description'];
                    }
                    
                    if (isset($workoutData['day_of_week'])) {
                        $workoutInsert['day_of_week'] = $workoutData['day_of_week'];
                    }
                    
                    // Insert workout
                    $workoutId = $this->db->insert('workouts', $workoutInsert);
                    
                    if (!$workoutId) {
                        throw new Exception('Failed to create workout');
                    }
                    
                    // Insert exercises if provided
                    if (isset($workoutData['exercises']) && is_array($workoutData['exercises'])) {
                        $orderNum = 1;
                        
                        foreach ($workoutData['exercises'] as $exerciseData) {
                            // Validate required exercise fields
                            if (!isset($exerciseData['exercise_id']) || !isset($exerciseData['sets'])) {
                                throw new Exception('Exercise ID and sets are required');
                            }
                            
                            // Prepare exercise data
                            $exerciseInsert = [
                                'workout_id' => $workoutId,
                                'exercise_id' => $exerciseData['exercise_id'],
                                'sets' => $exerciseData['sets'],
                                'order_num' => $orderNum++
                            ];
                            
                            // Add optional exercise fields
                            if (isset($exerciseData['reps'])) {
                                $exerciseInsert['reps'] = $exerciseData['reps'];
                            }
                            
                            if (isset($exerciseData['rest_period'])) {
                                $exerciseInsert['rest_period'] = $exerciseData['rest_period'];
                            }
                            
                            if (isset($exerciseData['notes'])) {
                                $exerciseInsert['notes'] = $exerciseData['notes'];
                            }
                            
                            // Insert exercise
                            $exerciseId = $this->db->insert('workout_exercises', $exerciseInsert);
                            
                            if (!$exerciseId) {
                                throw new Exception('Failed to add exercise to workout');
                            }
                        }
                    }
                }
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get the created plan with details
            return $this->getWorkoutPlanDetails($planId, $userId);
            
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
     * Update a workout plan
     * @param int $planId
     * @param int $userId
     * @param array $planData
     * @return array Response
     */
    public function updateWorkoutPlan($planId, $userId, $planData) {
        // Check if plan exists and belongs to user
        $plan = $this->db->getRow(
            "SELECT plan_id FROM workout_plans WHERE plan_id = ? AND user_id = ? AND is_template = 0",
            [$planId, $userId]
        );
        
        if (!$plan) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Workout plan not found or access denied'
            ];
        }
        
        // Allowed fields to update
        $allowedFields = ['name', 'description', 'frequency', 'goal'];
        
        // Filter data to include only allowed fields
        $data = array_intersect_key($planData, array_flip($allowedFields));
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Update plan
            $result = $this->db->update(
                'workout_plans',
                $data,
                'plan_id = ?',
                [$planId]
            );
            
            if (!$result) {
                throw new Exception('Failed to update workout plan');
            }
            
            // Handle workouts if provided
            if (isset($planData['workouts']) && is_array($planData['workouts'])) {
                // Get existing workouts
                $existingWorkouts = $this->db->getRows(
                    "SELECT workout_id FROM workouts WHERE plan_id = ?",
                    [$planId]
                );
                
                $existingWorkoutIds = array_column($existingWorkouts, 'workout_id');
                $updatedWorkoutIds = [];
                
                foreach ($planData['workouts'] as $workoutData) {
                    // Check if workout has ID (update) or not (create)
                    if (isset($workoutData['workout_id']) && in_array($workoutData['workout_id'], $existingWorkoutIds)) {
                        // Update existing workout
                        $workoutId = $workoutData['workout_id'];
                        $updatedWorkoutIds[] = $workoutId;
                        
                        // Allowed workout fields to update
                        $allowedWorkoutFields = ['name', 'description', 'day_of_week'];
                        
                        // Filter workout data
                        $workoutUpdateData = array_intersect_key($workoutData, array_flip($allowedWorkoutFields));
                        
                        if (!empty($workoutUpdateData)) {
                            $this->db->update(
                                'workouts',
                                $workoutUpdateData,
                                'workout_id = ?',
                                [$workoutId]
                            );
                        }
                        
                        // Handle exercises if provided
                        if (isset($workoutData['exercises']) && is_array($workoutData['exercises'])) {
                            // Get existing exercises
                            $existingExercises = $this->db->getRows(
                                "SELECT workout_exercise_id FROM workout_exercises WHERE workout_id = ?",
                                [$workoutId]
                            );
                            
                            $existingExerciseIds = array_column($existingExercises, 'workout_exercise_id');
                            $updatedExerciseIds = [];
                            
                            $orderNum = 1;
                            foreach ($workoutData['exercises'] as $exerciseData) {
                                if (isset($exerciseData['workout_exercise_id']) && in_array($exerciseData['workout_exercise_id'], $existingExerciseIds)) {
                                    // Update existing exercise
                                    $exerciseId = $exerciseData['workout_exercise_id'];
                                    $updatedExerciseIds[] = $exerciseId;
                                    
                                    // Allowed exercise fields to update
                                    $allowedExerciseFields = ['exercise_id', 'sets', 'reps', 'rest_period', 'notes'];
                                    
                                    // Filter exercise data
                                    $exerciseUpdateData = array_intersect_key($exerciseData, array_flip($allowedExerciseFields));
                                    $exerciseUpdateData['order_num'] = $orderNum++;
                                    
                                    if (!empty($exerciseUpdateData)) {
                                        $this->db->update(
                                            'workout_exercises',
                                            $exerciseUpdateData,
                                            'workout_exercise_id = ?',
                                            [$exerciseId]
                                        );
                                    }
                                } else {
                                    // Add new exercise
                                    if (!isset($exerciseData['exercise_id']) || !isset($exerciseData['sets'])) {
                                        throw new Exception('Exercise ID and sets are required');
                                    }
                                    
                                    // Prepare exercise data
                                    $exerciseInsert = [
                                        'workout_id' => $workoutId,
                                        'exercise_id' => $exerciseData['exercise_id'],
                                        'sets' => $exerciseData['sets'],
                                        'order_num' => $orderNum++
                                    ];
                                    
                                    // Add optional exercise fields
                                    if (isset($exerciseData['reps'])) {
                                        $exerciseInsert['reps'] = $exerciseData['reps'];
                                    }
                                    
                                    if (isset($exerciseData['rest_period'])) {
                                        $exerciseInsert['rest_period'] = $exerciseData['rest_period'];
                                    }
                                    
                                    if (isset($exerciseData['notes'])) {
                                        $exerciseInsert['notes'] = $exerciseData['notes'];
                                    }
                                    
                                    // Insert exercise
                                    $newExerciseId = $this->db->insert('workout_exercises', $exerciseInsert);
                                    
                                    if (!$newExerciseId) {
                                        throw new Exception('Failed to add exercise to workout');
                                    }
                                    
                                    $updatedExerciseIds[] = $newExerciseId;
                                }
                            }
                            
                            // Delete exercises that were not updated or added
                            $exercisesToDelete = array_diff($existingExerciseIds, $updatedExerciseIds);
                            
                            foreach ($exercisesToDelete as $exerciseToDelete) {
                                $this->db->delete(
                                    'workout_exercises',
                                    'workout_exercise_id = ?',
                                    [$exerciseToDelete]
                                );
                            }
                        }
                    } else {
                        // Create new workout
                        // Validate required workout fields
                        if (!isset($workoutData['name'])) {
                            throw new Exception('Workout name is required');
                        }
                        
                        // Prepare workout data
                        $workoutInsert = [
                            'plan_id' => $planId,
                            'name' => $workoutData['name']
                        ];
                        
                        // Add optional workout fields
                        if (isset($workoutData['description'])) {
                            $workoutInsert['description'] = $workoutData['description'];
                        }
                        
                        if (isset($workoutData['day_of_week'])) {
                            $workoutInsert['day_of_week'] = $workoutData['day_of_week'];
                        }
                        
                        // Insert workout
                        $workoutId = $this->db->insert('workouts', $workoutInsert);
                        
                        if (!$workoutId) {
                            throw new Exception('Failed to create workout');
                        }
                        
                        $updatedWorkoutIds[] = $workoutId;
                        
                        // Insert exercises if provided
                        if (isset($workoutData['exercises']) && is_array($workoutData['exercises'])) {
                            $orderNum = 1;
                            
                            foreach ($workoutData['exercises'] as $exerciseData) {
                                // Validate required exercise fields
                                if (!isset($exerciseData['exercise_id']) || !isset($exerciseData['sets'])) {
                                    throw new Exception('Exercise ID and sets are required');
                                }
                                
                                // Prepare exercise data
                                $exerciseInsert = [
                                    'workout_id' => $workoutId,
                                    'exercise_id' => $exerciseData['exercise_id'],
                                    'sets' => $exerciseData['sets'],
                                    'order_num' => $orderNum++
                                ];
                                
                                // Add optional exercise fields
                                if (isset($exerciseData['reps'])) {
                                    $exerciseInsert['reps'] = $exerciseData['reps'];
                                }
                                
                                if (isset($exerciseData['rest_period'])) {
                                    $exerciseInsert['rest_period'] = $exerciseData['rest_period'];
                                }
                                
                                if (isset($exerciseData['notes'])) {
                                    $exerciseInsert['notes'] = $exerciseData['notes'];
                                }
                                
                                // Insert exercise
                                $exerciseId = $this->db->insert('workout_exercises', $exerciseInsert);
                                
                                if (!$exerciseId) {
                                    throw new Exception('Failed to add exercise to workout');
                                }
                            }
                        }
                    }
                }
                
                // Delete workouts that were not updated or added
                $workoutsToDelete = array_diff($existingWorkoutIds, $updatedWorkoutIds);
                
                foreach ($workoutsToDelete as $workoutToDelete) {
                    // Delete exercises in the workout first
                    $this->db->delete(
                        'workout_exercises',
                        'workout_id = ?',
                        [$workoutToDelete]
                    );
                    
                    // Delete the workout
                    $this->db->delete(
                        'workouts',
                        'workout_id = ?',
                        [$workoutToDelete]
                    );
                }
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get the updated plan with details
            return $this->getWorkoutPlanDetails($planId, $userId);
            
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
     * Delete a workout plan
     * @param int $planId
     * @param int $userId
     * @return array Response
     */
    public function deleteWorkoutPlan($planId, $userId) {
        // Check if plan exists and belongs to user
        $plan = $this->db->getRow(
            "SELECT plan_id FROM workout_plans WHERE plan_id = ? AND user_id = ? AND is_template = 0",
            [$planId, $userId]
        );
        
        if (!$plan) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Workout plan not found or access denied'
            ];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Get all workouts in the plan
            $workouts = $this->db->getRows(
                "SELECT workout_id FROM workouts WHERE plan_id = ?",
                [$planId]
            );
            
            // Delete exercises in all workouts
            foreach ($workouts as $workout) {
                $this->db->delete(
                    'workout_exercises',
                    'workout_id = ?',
                    [$workout['workout_id']]
                );
            }
            
            // Delete all workouts in the plan
            $this->db->delete(
                'workouts',
                'plan_id = ?',
                [$planId]
            );
            
            // Delete the plan
            $this->db->delete(
                'workout_plans',
                'plan_id = ?',
                [$planId]
            );
            
            // Commit transaction
            $this->db->commit();
            
            return [
                'error' => false,
                'message' => 'Workout plan deleted successfully'
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
     * Copy a template plan to user's plans
     * @param int $templateId
     * @param int $userId
     * @return array Response
     */
    public function copyTemplatePlan($templateId, $userId) {
        // Check if template plan exists
        $template = $this->db->getRow(
            "SELECT plan_id, name, description, frequency, goal FROM workout_plans WHERE plan_id = ? AND is_template = 1",
            [$templateId]
        );
        
        if (!$template) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Template plan not found'
            ];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Create new plan based on template
            $newPlanId = $this->db->insert('workout_plans', [
                'user_id' => $userId,
                'name' => $template['name'],
                'description' => $template['description'],
                'frequency' => $template['frequency'],
                'goal' => $template['goal'],
                'created_at' => date('Y-m-d H:i:s'),
                'is_template' => 0
            ]);
            
            if (!$newPlanId) {
                throw new Exception('Failed to create new plan');
            }
            
            // Get workouts from template
            $workouts = $this->db->getRows(
                "SELECT workout_id, name, description, day_of_week FROM workouts WHERE plan_id = ?",
                [$templateId]
            );
            
            // Copy workouts
            foreach ($workouts as $workout) {
                // Create new workout
                $newWorkoutId = $this->db->insert('workouts', [
                    'plan_id' => $newPlanId,
                    'name' => $workout['name'],
                    'description' => $workout['description'],
                    'day_of_week' => $workout['day_of_week']
                ]);
                
                if (!$newWorkoutId) {
                    throw new Exception('Failed to create workout');
                }
                
                // Get exercises from template workout
                $exercises = $this->db->getRows(
                    "SELECT exercise_id, sets, reps, rest_period, notes, order_num 
                     FROM workout_exercises 
                     WHERE workout_id = ?
                     ORDER BY order_num ASC",
                    [$workout['workout_id']]
                );
                
                // Copy exercises
                foreach ($exercises as $exercise) {
                    $newExerciseId = $this->db->insert('workout_exercises', [
                        'workout_id' => $newWorkoutId,
                        'exercise_id' => $exercise['exercise_id'],
                        'sets' => $exercise['sets'],
                        'reps' => $exercise['reps'],
                        'rest_period' => $exercise['rest_period'],
                        'notes' => $exercise['notes'],
                        'order_num' => $exercise['order_num']
                    ]);
                    
                    if (!$newExerciseId) {
                        throw new Exception('Failed to add exercise to workout');
                    }
                }
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get the created plan with details
            return $this->getWorkoutPlanDetails($newPlanId, $userId);
            
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
     * Log a completed workout
     * @param int $userId
     * @param array $logData
     * @return array Response
     */
    public function logWorkout($userId, $logData) {
        // Validate required fields
        if (!isset($logData['workout_id'])) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Workout ID is required'
            ];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Prepare workout log data
            $workoutLogData = [
                'user_id' => $userId,
                'workout_id' => $logData['workout_id'],
                'completed_at' => isset($logData['completed_at']) ? $logData['completed_at'] : date('Y-m-d H:i:s')
            ];
            
            // Add optional fields
            if (isset($logData['duration'])) {
                $workoutLogData['duration'] = $logData['duration'];
            }
            
            if (isset($logData['notes'])) {
                $workoutLogData['notes'] = $logData['notes'];
            }
            
            if (isset($logData['rating'])) {
                $workoutLogData['rating'] = $logData['rating'];
            }
            
            // Insert workout log
            $logId = $this->db->insert('workout_logs', $workoutLogData);
            
            if (!$logId) {
                throw new Exception('Failed to log workout');
            }
            
            // Log exercises if provided
            if (isset($logData['exercises']) && is_array($logData['exercises'])) {
                foreach ($logData['exercises'] as $exerciseLog) {
                    // Validate required fields
                    if (!isset($exerciseLog['exercise_id']) || !isset($exerciseLog['sets'])) {
                        throw new Exception('Exercise ID and sets are required');
                    }
                    
                    // Log each set
                    foreach ($exerciseLog['sets'] as $setIndex => $set) {
                        $setNumber = $setIndex + 1;
                        
                        // Prepare exercise log data
                        $exerciseLogData = [
                            'log_id' => $logId,
                            'exercise_id' => $exerciseLog['exercise_id'],
                            'set_number' => $setNumber
                        ];
                        
                        // Add set details
                        if (isset($set['reps'])) {
                            $exerciseLogData['reps'] = $set['reps'];
                        }
                        
                        if (isset($set['weight'])) {
                            $exerciseLogData['weight'] = $set['weight'];
                        }
                        
                        if (isset($set['notes'])) {
                            $exerciseLogData['notes'] = $set['notes'];
                        }
                        
                        // Insert exercise log
                        $exerciseLogId = $this->db->insert('exercise_logs', $exerciseLogData);
                        
                        if (!$exerciseLogId) {
                            throw new Exception('Failed to log exercise set');
                        }
                        
                        // Check if it's a personal record
                        if (isset($set['is_pr']) && $set['is_pr'] && isset($set['weight']) && isset($set['reps'])) {
                            // Get existing PR for this exercise
                            $existingPr = $this->db->getRow(
                                "SELECT pr_id, weight, reps 
                                 FROM personal_records 
                                 WHERE user_id = ? AND exercise_id = ? AND reps = ?
                                 ORDER BY weight DESC
                                 LIMIT 1",
                                [$userId, $exerciseLog['exercise_id'], $set['reps']]
                            );
                            
                            // Check if it's a new PR (heavier weight for same reps)
                            $isPr = !$existingPr || $set['weight'] > $existingPr['weight'];
                            
                            if ($isPr) {
                                // Add personal record
                                $prData = [
                                    'user_id' => $userId,
                                    'exercise_id' => $exerciseLog['exercise_id'],
                                    'weight' => $set['weight'],
                                    'reps' => $set['reps'],
                                    'achieved_at' => $workoutLogData['completed_at']
                                ];
                                
                                if (isset($exerciseLog['notes'])) {
                                    $prData['notes'] = $exerciseLog['notes'];
                                }
                                
                                $prId = $this->db->insert('personal_records', $prData);
                                
                                if (!$prId) {
                                    throw new Exception('Failed to record personal record');
                                }
                            }
                        }
                    }
                }
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get the workout log with details
            return $this->getWorkoutLogDetails($logId, $userId);
            
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
     * Get workout log details
     * @param int $logId
     * @param int $userId
     * @return array Workout log details
     */
    public function getWorkoutLogDetails($logId, $userId) {
        // Get workout log
        $log = $this->db->getRow(
            "SELECT wl.log_id, wl.workout_id, w.name as workout_name, wl.completed_at, 
                    wl.duration, wl.notes, wl.rating,
                    (SELECT SUM(el.weight * el.reps) FROM exercise_logs el WHERE el.log_id = wl.log_id) AS volume
             FROM workout_logs wl
             JOIN workouts w ON wl.workout_id = w.workout_id
             WHERE wl.log_id = ? AND wl.user_id = ?",
            [$logId, $userId]
        );
        
        if (!$log) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Workout log not found or access denied'
            ];
        }
        
        // Get exercise logs
        $exerciseLogs = $this->db->getRows(
            "SELECT el.exercise_id, e.name as exercise_name, el.set_number, el.reps, el.weight, el.notes
             FROM exercise_logs el
             JOIN exercises e ON el.exercise_id = e.exercise_id
             WHERE el.log_id = ?
             ORDER BY e.name, el.set_number",
            [$logId]
        );
        
        // Organize exercise logs by exercise
        $exercises = [];
        
        foreach ($exerciseLogs as $exerciseLog) {
            $exerciseId = $exerciseLog['exercise_id'];
            
            if (!isset($exercises[$exerciseId])) {
                $exercises[$exerciseId] = [
                    'exercise_id' => $exerciseId,
                    'name' => $exerciseLog['exercise_name'],
                    'sets' => []
                ];
            }
            
            $exercises[$exerciseId]['sets'][] = [
                'set_number' => $exerciseLog['set_number'],
                'reps' => $exerciseLog['reps'],
                'weight' => $exerciseLog['weight'],
                'notes' => $exerciseLog['notes']
            ];
        }
        
        // Convert to array
        $exercises = array_values($exercises);
        
        return [
            'error' => false,
            'log' => $log,
            'exercises' => $exercises
        ];
    }
    
    /**
     * Get workout logs for a user
     * @param int $userId
     * @param int $limit
     * @param int $offset
     * @return array Workout logs
     */
    public function getWorkoutLogs($userId, $limit = 30, $offset = 0) {
        // Get workout logs
        $logs = $this->db->getRows(
            "SELECT wl.log_id, wl.workout_id, w.name as workout_name, wl.completed_at, 
                    wl.duration, wl.rating,
                    (SELECT SUM(el.weight * el.reps) FROM exercise_logs el WHERE el.log_id = wl.log_id) AS volume
             FROM workout_logs wl
             JOIN workouts w ON wl.workout_id = w.workout_id
             WHERE wl.user_id = ?
             ORDER BY wl.completed_at DESC
             LIMIT ? OFFSET ?",
            [$userId, $limit, $offset]
        );
        
        // Get total count
        $total = $this->db->getValue(
            "SELECT COUNT(*) FROM workout_logs WHERE user_id = ?",
            [$userId]
        );
        
        return [
            'error' => false,
            'logs' => $logs,
            'total' => (int)$total
        ];
    }
    
    /**
     * Delete a workout log
     * @param int $logId
     * @param int $userId
     * @return array Response
     */
    public function deleteWorkoutLog($logId, $userId) {
        // Check if log exists and belongs to user
        $log = $this->db->getRow(
            "SELECT log_id FROM workout_logs WHERE log_id = ? AND user_id = ?",
            [$logId, $userId]
        );
        
        if (!$log) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Workout log not found or access denied'
            ];
        }
        
        // Begin transaction
        $this->db->beginTransaction();
        
        try {
            // Delete exercise logs
            $this->db->delete(
                'exercise_logs',
                'log_id = ?',
                [$logId]
            );
            
            // Delete workout log
            $this->db->delete(
                'workout_logs',
                'log_id = ?',
                [$logId]
            );
            
            // Commit transaction
            $this->db->commit();
            
            return [
                'error' => false,
                'message' => 'Workout log deleted successfully'
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
     * Get suggested workout for today
     * @param int $userId
     * @return array Today's workout
     */
    public function getTodaysWorkout($userId) {
        // Get the day of the week (1-7, Monday-Sunday)
        $dayOfWeek = date('N');
        
        // Get the most recent active plan for the user
        $activePlan = $this->db->getRow(
            "SELECT wp.plan_id, wp.name as plan_name
             FROM workout_plans wp
             WHERE wp.user_id = ? AND wp.is_template = 0
             ORDER BY wp.created_at DESC
             LIMIT 1",
            [$userId]
        );
        
        if (!$activePlan) {
            return [
                'error' => false,
                'message' => 'No active workout plan found',
                'workout' => null
            ];
        }
        
        // Get workout for today
        $workout = $this->db->getRow(
            "SELECT w.workout_id, w.name, w.description
             FROM workouts w
             WHERE w.plan_id = ? AND w.day_of_week = ?",
            [$activePlan['plan_id'], $dayOfWeek]
        );
        
        if (!$workout) {
            return [
                'error' => false,
                'message' => 'No workout scheduled for today',
                'plan' => $activePlan,
                'workout' => null
            ];
        }
        
        // Get exercises for the workout
        $exercises = $this->db->getRows(
            "SELECT we.workout_exercise_id, e.exercise_id, e.name, e.category_id,
                    e.equipment_needed, e.muscle_group,
                    we.sets, we.reps, we.rest_period, we.notes, we.order_num,
                    (
                        SELECT CONCAT(el.weight, ' × ', el.reps)
                        FROM exercise_logs el
                        JOIN workout_logs wl ON el.log_id = wl.log_id
                        WHERE wl.user_id = ? AND el.exercise_id = e.exercise_id
                        ORDER BY wl.completed_at DESC
                        LIMIT 1
                    ) AS previous_performance
             FROM workout_exercises we
             JOIN exercises e ON we.exercise_id = e.exercise_id
             WHERE we.workout_id = ?
             ORDER BY we.order_num ASC",
            [$userId, $workout['workout_id']]
        );
        
        return [
            'error' => false,
            'plan' => $activePlan,
            'workout' => $workout,
            'exercises' => $exercises
        ];
    }
}

// Process API requests based on method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Handle GET requests for workout data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create workout instance
    $workout = new Workout();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'plans':
            // Get workout plans
            $result = $workout->getWorkoutPlans($userId);
            break;
            
        case 'logs':
            // Get workout logs
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $result = $workout->getWorkoutLogs($userId, $limit, $offset);
            break;
            
        case 'today':
            // Get today's workout
            $result = $workout->getTodaysWorkout($userId);
            break;
            
        default:
            // Check if it's a specific plan or log ID
            if (is_numeric($endpoint)) {
                // Determine if it's a plan or log based on the previous path part
                $resourceType = $pathParts[count($pathParts) - 2] ?? '';
                
                if ($resourceType === 'plans') {
                    // Get plan details
                    $result = $workout->getWorkoutPlanDetails((int)$endpoint, $userId);
                } elseif ($resourceType === 'logs') {
                    // Get log details
                    $result = $workout->getWorkoutLogDetails((int)$endpoint, $userId);
                } else {
                    // Invalid resource type
                    http_response_code(HTTP_NOT_FOUND);
                    $result = [
                        'error' => true,
                        'message' => 'Endpoint not found'
                    ];
                }
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
    // Handle POST requests for workout data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create workout instance
    $workout = new Workout();
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'plans':
            // Create workout plan
            $result = $workout->createWorkoutPlan($userId, $data);
            break;
            
        case 'logs':
            // Log completed workout
            $result = $workout->logWorkout($userId, $data);
            break;
            
        case 'copy':
            // Copy template plan
            if (!isset($data['template_id'])) {
                http_response_code(HTTP_BAD_REQUEST);
                $result = [
                    'error' => true,
                    'message' => 'Template ID is required'
                ];
                break;
            }
            
            $result = $workout->copyTemplatePlan((int)$data['template_id'], $userId);
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
    // Handle PUT requests for workout data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $resourceType = prev($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create workout instance
    $workout = new Workout();
    
    // Process based on resource type
    switch ($resourceType) {
        case 'plans':
            // Update workout plan
            $result = $workout->updateWorkoutPlan((int)$resourceId, $userId, $data);
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
    // Handle DELETE requests for workout data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // The last part should be the ID, and the second-to-last should be the endpoint
    $resourceId = end($pathParts);
    $resourceType = prev($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create workout instance
    $workout = new Workout();
    
    // Process based on resource type
    switch ($resourceType) {
        case 'plans':
            // Delete workout plan
            $result = $workout->deleteWorkoutPlan((int)$resourceId, $userId);
            break;
            
        case 'logs':
            // Delete workout log
            $result = $workout->deleteWorkoutLog((int)$resourceId, $userId);
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