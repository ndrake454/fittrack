<?php
/**
 * Progress Tracking Functions
 * Path: /exercise-app/api/progress.php
 */

// Include database connection and auth functions
require_once 'db.php';
require_once 'auth.php';

/**
 * Progress Class
 */
class Progress {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get workout progress data
     * @param int $userId
     * @param int $days Number of days to look back
     * @return array Workout progress data
     */
    public function getWorkoutProgress($userId, $days = 30) {
        // Get start date
        $startDate = date('Y-m-d', strtotime("-$days days"));
        
        // Get workout logs
        $logs = $this->db->getRows(
            "SELECT wl.log_id, wl.workout_id, w.name as workout_name, wl.completed_at, 
                    wl.duration, wl.rating,
                    (SELECT SUM(el.weight * el.reps) FROM exercise_logs el WHERE el.log_id = wl.log_id) AS volume
             FROM workout_logs wl
             JOIN workouts w ON wl.workout_id = w.workout_id
             WHERE wl.user_id = ? AND DATE(wl.completed_at) >= ?
             ORDER BY wl.completed_at ASC",
            [$userId, $startDate]
        );
        
        // Get date labels for chart
        $dates = [];
        $currentDate = new DateTime($startDate);
        $endDate = new DateTime();
        
        while ($currentDate <= $endDate) {
            $dates[] = $currentDate->format('Y-m-d');
            $currentDate->modify('+1 day');
        }
        
        // Prepare workout data by date
        $workoutByDate = [];
        
        foreach ($dates as $date) {
            $workoutByDate[$date] = 0;
        }
        
        // Fill workout data
        foreach ($logs as $log) {
            $logDate = date('Y-m-d', strtotime($log['completed_at']));
            $workoutByDate[$logDate] = 1;
        }
        
        // Calculate statistics
        $totalWorkouts = count($logs);
        $completionRate = $days > 0 ? ($totalWorkouts / $days) * 7 : 0; // Workouts per week
        $avgDuration = 0;
        $avgVolume = 0;
        
        if ($totalWorkouts > 0) {
            $totalDuration = array_sum(array_column($logs, 'duration'));
            $totalVolume = array_sum(array_column($logs, 'volume'));
            
            $avgDuration = $totalDuration / $totalWorkouts;
            $avgVolume = $totalVolume / $totalWorkouts;
        }
        
        return [
            'error' => false,
            'dates' => array_values($dates),
            'workouts' => array_values($workoutByDate),
            'logs' => $logs,
            'stats' => [
                'totalWorkouts' => $totalWorkouts,
                'completionRate' => round($completionRate, 2),
                'avgDuration' => round($avgDuration, 2),
                'avgVolume' => round($avgVolume, 2)
            ]
        ];
    }
    
    /**
     * Get BJJ progress data
     * @param int $userId
     * @param int $days Number of days to look back
     * @return array BJJ progress data
     */
    public function getBjjProgress($userId, $days = 30) {
        // Get start date
        $startDate = date('Y-m-d', strtotime("-$days days"));
        
        // Get BJJ sessions
        $sessions = $this->db->getRows(
            "SELECT session_id, session_date, duration, techniques_practiced, notes, rating
             FROM bjj_sessions
             WHERE user_id = ? AND DATE(session_date) >= ?
             ORDER BY session_date ASC",
            [$userId, $startDate]
        );
        
        // Get date labels for chart
        $dates = [];
        $currentDate = new DateTime($startDate);
        $endDate = new DateTime();
        
        while ($currentDate <= $endDate) {
            $dates[] = $currentDate->format('Y-m-d');
            $currentDate->modify('+1 day');
        }
        
        // Prepare BJJ data by date
        $bjjByDate = [];
        
        foreach ($dates as $date) {
            $bjjByDate[$date] = 0;
        }
        
        // Fill BJJ data
        foreach ($sessions as $session) {
            $sessionDate = date('Y-m-d', strtotime($session['session_date']));
            $bjjByDate[$sessionDate] = 1;
        }
        
        // Calculate statistics
        $totalSessions = count($sessions);
        $completionRate = $days > 0 ? ($totalSessions / $days) * 7 : 0; // Sessions per week
        $avgDuration = 0;
        $avgRating = 0;
        
        if ($totalSessions > 0) {
            $totalDuration = array_sum(array_column($sessions, 'duration'));
            $totalRating = array_sum(array_column($sessions, 'rating'));
            
            $avgDuration = $totalDuration / $totalSessions;
            $avgRating = $totalRating / $totalSessions;
        }
        
        return [
            'error' => false,
            'dates' => array_values($dates),
            'sessions' => array_values($bjjByDate),
            'logs' => $sessions,
            'stats' => [
                'totalSessions' => $totalSessions,
                'completionRate' => round($completionRate, 2),
                'avgDuration' => round($avgDuration, 2),
                'avgRating' => round($avgRating, 2)
            ]
        ];
    }
    
    /**
     * Get weight progress data
     * @param int $userId
     * @param int $days Number of days to look back
     * @return array Weight progress data
     */
    public function getWeightProgress($userId, $days = 30) {
        // Get start date
        $startDate = date('Y-m-d', strtotime("-$days days"));
        
        // Get weight logs
        $logs = $this->db->getRows(
            "SELECT weight_id, weight, logged_at, notes
             FROM weight_logs
             WHERE user_id = ? AND DATE(logged_at) >= ?
             ORDER BY logged_at ASC",
            [$userId, $startDate]
        );
        
        // Calculate weight change statistics
        $firstWeight = count($logs) > 0 ? $logs[0]['weight'] : null;
        $lastWeight = count($logs) > 0 ? $logs[count($logs) - 1]['weight'] : null;
        $netChange = ($firstWeight && $lastWeight) ? $lastWeight - $firstWeight : 0;
        
        // Format dates and weights for chart
        $dates = [];
        $weights = [];
        
        foreach ($logs as $log) {
            $dates[] = date('Y-m-d', strtotime($log['logged_at']));
            $weights[] = (float)$log['weight'];
        }
        
        return [
            'error' => false,
            'dates' => $dates,
            'weights' => $weights,
            'logs' => $logs,
            'stats' => [
                'firstWeight' => $firstWeight,
                'lastWeight' => $lastWeight,
                'netChange' => round($netChange, 2),
                'changeRate' => $days > 0 ? round(($netChange / $days) * 7, 2) : 0 // Change per week
            ]
        ];
    }
    
    /**
     * Get lift progress data
     * @param int $userId
     * @param array $exerciseIds Exercise IDs to track
     * @param int $limit Max number of records per exercise
     * @return array Lift progress data
     */
    public function getLiftProgress($userId, $exerciseIds = [], $limit = 10) {
        // Default exercise IDs if not provided (common compound lifts)
        if (empty($exerciseIds)) {
            $exerciseIds = [1, 2, 3, 4, 5, 6]; // Squat, Bench Press, Deadlift, Overhead Press, Pull-up, Barbell Row
        }
        
        // Get exercise names
        $exercises = $this->db->getRows(
            "SELECT exercise_id, name FROM exercises WHERE exercise_id IN (" . implode(',', $exerciseIds) . ")"
        );
        
        $exerciseNames = [];
        foreach ($exercises as $exercise) {
            $exerciseNames[$exercise['exercise_id']] = $exercise['name'];
        }
        
        // Get lift progress for each exercise
        $exerciseData = [];
        
        foreach ($exerciseIds as $exerciseId) {
            // Skip if exercise doesn't exist
            if (!isset($exerciseNames[$exerciseId])) {
                continue;
            }
            
            // Get exercise logs
            $logs = $this->db->getRows(
                "SELECT el.exercise_id, el.weight, el.reps, wl.completed_at
                 FROM exercise_logs el
                 JOIN workout_logs wl ON el.log_id = wl.log_id
                 WHERE wl.user_id = ? AND el.exercise_id = ?
                 ORDER BY wl.completed_at DESC
                 LIMIT ?",
                [$userId, $exerciseId, $limit]
            );
            
            // Reverse to get chronological order
            $logs = array_reverse($logs);
            
            // Format data for chart
            $weights = [];
            $dates = [];
            
            foreach ($logs as $log) {
                $weights[] = (float)$log['weight'];
                $dates[] = date('M j', strtotime($log['completed_at']));
            }
            
            // Calculate max and improvement
            $max = count($weights) > 0 ? max($weights) : 0;
            $improvement = 0;
            
            if (count($weights) >= 2) {
                $first = $weights[0];
                $last = $weights[count($weights) - 1];
                $improvement = $last - $first;
            }
            
            $exerciseData[$exerciseId] = [
                'name' => $exerciseNames[$exerciseId],
                'dates' => $dates,
                'weights' => $weights,
                'max' => $max,
                'improvement' => round($improvement, 2),
                'logs' => $logs
            ];
        }
        
        return [
            'error' => false,
            'exercises' => $exerciseData
        ];
    }
    
    /**
     * Get overall progress statistics
     * @param int $userId
     * @param int $days Number of days to look back
     * @return array Overall progress statistics
     */
    public function getOverallStats($userId, $days = 30) {
        // Get start date
        $startDate = date('Y-m-d', strtotime("-$days days"));
        
        // Get workout stats
        $workoutStats = $this->db->getRow(
            "SELECT COUNT(*) as total_workouts,
                    AVG(duration) as avg_duration,
                    (SELECT SUM(el.weight * el.reps) 
                     FROM exercise_logs el 
                     JOIN workout_logs inner_wl ON el.log_id = inner_wl.log_id 
                     WHERE inner_wl.user_id = wl.user_id AND DATE(inner_wl.completed_at) >= ?) as total_volume
             FROM workout_logs wl
             WHERE wl.user_id = ? AND DATE(wl.completed_at) >= ?",
            [$startDate, $userId, $startDate]
        );
        
        // Get BJJ stats
        $bjjStats = $this->db->getRow(
            "SELECT COUNT(*) as total_sessions,
                    AVG(duration) as avg_duration,
                    AVG(rating) as avg_rating
             FROM bjj_sessions
             WHERE user_id = ? AND DATE(session_date) >= ?",
            [$userId, $startDate]
        );
        
        // Get weight stats
        $weightStats = $this->db->getRow(
            "SELECT 
                (SELECT weight FROM weight_logs 
                 WHERE user_id = ? AND DATE(logged_at) >= ? 
                 ORDER BY logged_at ASC LIMIT 1) as start_weight,
                (SELECT weight FROM weight_logs 
                 WHERE user_id = ? 
                 ORDER BY logged_at DESC LIMIT 1) as current_weight",
            [$userId, $startDate, $userId]
        );
        
        // Calculate weight change
        $weightChange = 0;
        if ($weightStats['start_weight'] && $weightStats['current_weight']) {
            $weightChange = $weightStats['current_weight'] - $weightStats['start_weight'];
        }
        
        // Get PR stats
        $prStats = $this->db->getRow(
            "SELECT COUNT(*) as total_prs
             FROM personal_records
             WHERE user_id = ? AND DATE(achieved_at) >= ?",
            [$userId, $startDate]
        );
        
        // Get consistency data (workouts per week)
        $weeklyWorkouts = $this->db->getRows(
            "SELECT YEAR(completed_at) as year, WEEK(completed_at) as week, COUNT(*) as workout_count
             FROM workout_logs
             WHERE user_id = ? AND DATE(completed_at) >= ?
             GROUP BY YEAR(completed_at), WEEK(completed_at)
             ORDER BY year ASC, week ASC",
            [$userId, $startDate]
        );
        
        $weekLabels = [];
        $workoutCounts = [];
        
        foreach ($weeklyWorkouts as $week) {
            $weekLabels[] = "Week " . $week['week'];
            $workoutCounts[] = (int)$week['workout_count'];
        }
        
        return [
            'error' => false,
            'workouts' => [
                'total' => (int)$workoutStats['total_workouts'],
                'avgDuration' => round((float)$workoutStats['avg_duration'], 2),
                'totalVolume' => round((float)$workoutStats['total_volume'], 2)
            ],
            'bjj' => [
                'total' => (int)$bjjStats['total_sessions'],
                'avgDuration' => round((float)$bjjStats['avg_duration'], 2),
                'avgRating' => round((float)$bjjStats['avg_rating'], 2)
            ],
            'weight' => [
                'start' => (float)$weightStats['start_weight'],
                'current' => (float)$weightStats['current_weight'],
                'change' => round($weightChange, 2)
            ],
            'prs' => [
                'total' => (int)$prStats['total_prs']
            ],
            'consistency' => [
                'weeks' => $weekLabels,
                'counts' => $workoutCounts,
                'avgPerWeek' => count($weeklyWorkouts) > 0 ? round(array_sum($workoutCounts) / count($weeklyWorkouts), 2) : 0
            ],
            'period' => [
                'days' => $days,
                'startDate' => $startDate,
                'endDate' => date('Y-m-d')
            ]
        ];
    }
    
    /**
     * Get exercise volume progress
     * @param int $userId
     * @param int $exerciseId
     * @param int $limit Max number of records
     * @return array Exercise volume progress
     */
    public function getExerciseVolumeProgress($userId, $exerciseId, $limit = 10) {
        // Get exercise details
        $exercise = $this->db->getRow(
            "SELECT exercise_id, name FROM exercises WHERE exercise_id = ?",
            [$exerciseId]
        );
        
        if (!$exercise) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'Exercise not found'
            ];
        }
        
        // Get workout logs with this exercise
        $logs = $this->db->getRows(
            "SELECT wl.log_id, wl.completed_at,
                    (SELECT SUM(el.weight * el.reps) 
                     FROM exercise_logs el 
                     WHERE el.log_id = wl.log_id AND el.exercise_id = ?) as exercise_volume
             FROM workout_logs wl
             WHERE wl.user_id = ? AND wl.log_id IN (
                 SELECT DISTINCT log_id FROM exercise_logs WHERE exercise_id = ?
             )
             ORDER BY wl.completed_at DESC
             LIMIT ?",
            [$exerciseId, $userId, $exerciseId, $limit]
        );
        
        // Reverse to get chronological order
        $logs = array_reverse($logs);
        
        // Format data for chart
        $volumes = [];
        $dates = [];
        
        foreach ($logs as $log) {
            $volumes[] = (float)$log['exercise_volume'];
            $dates[] = date('M j', strtotime($log['completed_at']));
        }
        
        // Calculate stats
        $maxVolume = count($volumes) > 0 ? max($volumes) : 0;
        $improvement = 0;
        
        if (count($volumes) >= 2) {
            $first = $volumes[0];
            $last = $volumes[count($volumes) - 1];
            $improvement = $last - $first;
        }
        
        return [
            'error' => false,
            'exercise' => $exercise,
            'dates' => $dates,
            'volumes' => $volumes,
            'stats' => [
                'maxVolume' => round($maxVolume, 2),
                'improvement' => round($improvement, 2),
                'improvementPercent' => $volumes[0] > 0 ? round(($improvement / $volumes[0]) * 100, 2) : 0
            ]
        ];
    }
    
    /**
     * Generate a progress report
     * @param int $userId
     * @param int $days Number of days to look back
     * @return array Progress report
     */
    public function generateProgressReport($userId, $days = 90) {
        // Get start date
        $startDate = date('Y-m-d', strtotime("-$days days"));
        
        // Get user info
        $user = $this->db->getRow(
            "SELECT username, weight, goal FROM users WHERE user_id = ?",
            [$userId]
        );
        
        if (!$user) {
            http_response_code(HTTP_NOT_FOUND);
            return [
                'error' => true,
                'message' => 'User not found'
            ];
        }
        
        // Get overall stats
        $overallStats = $this->getOverallStats($userId, $days);
        
        // Get key lifts progress
        $keyExercises = [2, 3, 1]; // Bench Press, Deadlift, Squat
        $liftProgress = $this->getLiftProgress($userId, $keyExercises);
        
        // Check if user has made progress in lifts
        $liftImprovements = [];
        
        foreach ($liftProgress['exercises'] as $exerciseId => $data) {
            if ($data['improvement'] > 0) {
                $liftImprovements[] = [
                    'name' => $data['name'],
                    'improvement' => $data['improvement']
                ];
            }
        }
        
        // Generate analysis and recommendations
        $analysis = [];
        $recommendations = [];
        
        // Weight analysis
        if ($overallStats['weight']['change'] < 0) {
            $analysis[] = "You've lost " . abs($overallStats['weight']['change']) . " lbs in the past $days days.";
        } elseif ($overallStats['weight']['change'] > 0) {
            $analysis[] = "You've gained " . $overallStats['weight']['change'] . " lbs in the past $days days.";
        } else {
            $analysis[] = "Your weight has remained stable over the past $days days.";
        }
        
        // Workout consistency analysis
        $avgWorkoutsPerWeek = $overallStats['consistency']['avgPerWeek'];
        
        if ($avgWorkoutsPerWeek < 2) {
            $analysis[] = "Your workout frequency is low at " . $avgWorkoutsPerWeek . " workouts per week.";
            $recommendations[] = "Try to increase your workout frequency to at least 3 times per week.";
        } elseif ($avgWorkoutsPerWeek >= 2 && $avgWorkoutsPerWeek < 4) {
            $analysis[] = "You're maintaining a moderate workout frequency of " . $avgWorkoutsPerWeek . " workouts per week.";
            $recommendations[] = "Your frequency is good, but if possible, aim for 4 workouts per week for optimal results.";
        } else {
            $analysis[] = "You're maintaining an excellent workout frequency of " . $avgWorkoutsPerWeek . " workouts per week.";
            $recommendations[] = "Your workout frequency is great. Focus on recovery and progressive overload.";
        }
        
        // Lift progress analysis
        if (count($liftImprovements) > 0) {
            $analysis[] = "You've made progress in " . count($liftImprovements) . " key lifts:";
            foreach ($liftImprovements as $improvement) {
                $analysis[] = "- " . $improvement['name'] . ": +" . $improvement['improvement'] . " lbs";
            }
        } else {
            $analysis[] = "You haven't recorded improvements in your key lifts yet.";
            $recommendations[] = "Focus on progressive overload to increase your lifts over time.";
        }
        
        // BJJ analysis
        if (isset($overallStats['bjj']['total']) && $overallStats['bjj']['total'] > 0) {
            $analysis[] = "You've attended " . $overallStats['bjj']['total'] . " BJJ sessions in the past $days days.";
            
            // BJJ frequency recommendation
            $bjjPerWeek = $days > 0 ? ($overallStats['bjj']['total'] / $days) * 7 : 0;
            
            if ($bjjPerWeek < 1) {
                $recommendations[] = "Consider increasing your BJJ training frequency for better skill development.";
            } elseif ($bjjPerWeek >= 1 && $bjjPerWeek < 3) {
                $recommendations[] = "Your BJJ training frequency is good. Keep it up!";
            } else {
                $recommendations[] = "Your BJJ training frequency is excellent. Make sure to allow for adequate recovery.";
            }
        }
        
        // Volume analysis
        if (isset($overallStats['workouts']['totalVolume']) && $overallStats['workouts']['totalVolume'] > 0) {
            $totalVolume = $overallStats['workouts']['totalVolume'];
            $volumePerWorkout = $overallStats['workouts']['total'] > 0 ? $totalVolume / $overallStats['workouts']['total'] : 0;
            
            $analysis[] = "Your total training volume is " . number_format($totalVolume) . " lbs, averaging " . number_format($volumePerWorkout) . " lbs per workout.";
        }
        
        // Report date range
        $reportPeriod = "From " . date('M j, Y', strtotime($startDate)) . " to " . date('M j, Y');
        
        return [
            'error' => false,
            'user' => $user,
            'report_period' => $reportPeriod,
            'overall_stats' => $overallStats,
            'lift_progress' => $liftProgress,
            'analysis' => $analysis,
            'recommendations' => $recommendations
        ];
    }
}

// Process API requests based on method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Handle GET requests for progress data
    
    // Get URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    // Get authenticated user ID
    $userId = requireAuth();
    
    // Create progress instance
    $progress = new Progress();
    
    // Get time range parameter
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
    
    // Process based on endpoint
    switch ($endpoint) {
        case 'workouts':
            // Get workout progress
            $result = $progress->getWorkoutProgress($userId, $days);
            break;
            
        case 'bjj':
            // Get BJJ progress
            $result = $progress->getBjjProgress($userId, $days);
            break;
            
        case 'weight':
            // Get weight progress
            $result = $progress->getWeightProgress($userId, $days);
            break;
            
        case 'lifts':
            // Get lift progress
            $exerciseIds = isset($_GET['exercises']) ? explode(',', $_GET['exercises']) : [];
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $result = $progress->getLiftProgress($userId, $exerciseIds, $limit);
            break;
            
        case 'stats':
            // Get overall stats
            $result = $progress->getOverallStats($userId, $days);
            break;
            
        case 'report':
            // Generate progress report
            $result = $progress->generateProgressReport($userId, $days);
            break;
            
        case 'volume':
            // Get exercise volume progress
            if (!isset($_GET['exercise_id'])) {
                http_response_code(HTTP_BAD_REQUEST);
                $result = [
                    'error' => true,
                    'message' => 'Exercise ID is required'
                ];
                break;
            }
            
            $exerciseId = (int)$_GET['exercise_id'];
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $result = $progress->getExerciseVolumeProgress($userId, $exerciseId, $limit);
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