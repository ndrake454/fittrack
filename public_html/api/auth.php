<?php
/**
 * Authentication Functions
 * Path: /exercise-app/api/auth.php
 */

// Include database connection
require_once 'db.php';

/**
 * Authentication Class
 */
class Auth {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Register a new user
     * @param string $username
     * @param string $email
     * @param string $password
     * @param array $userData Additional user data
     * @return array Response with user data or error
     */
    public function register($username, $email, $password, $userData = []) {
        // Check if username or email already exists
        $existingUser = $this->db->getRow(
            "SELECT user_id FROM users WHERE username = ? OR email = ?",
            [$username, $email]
        );
        
        if ($existingUser) {
            http_response_code(HTTP_BAD_REQUEST);
            return [
                'error' => true,
                'message' => 'Username or email already exists'
            ];
        }
        
        // Hash password
        $hashedPassword = $this->hashPassword($password);
        
        // Prepare user data for insertion
        $data = [
            'username' => $username,
            'email' => $email,
            'password' => $hashedPassword,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Add additional user data if provided
        if (isset($userData['weight']) && $userData['weight']) {
            $data['weight'] = $userData['weight'];
        }
        
        if (isset($userData['height']) && $userData['height']) {
            $data['height'] = $userData['height'];
        }
        
        if (isset($userData['goal']) && $userData['goal']) {
            $data['goal'] = $userData['goal'];
        }
        
        // Insert user
        $userId = $this->db->insert('users', $data);
        
        if (!$userId) {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to create user'
            ];
        }
        
        // Create initial weight log if weight is provided
        if (isset($data['weight']) && $data['weight']) {
            $this->db->insert('weight_logs', [
                'user_id' => $userId,
                'weight' => $data['weight'],
                'logged_at' => date('Y-m-d H:i:s'),
                'notes' => 'Initial weight'
            ]);
        }
        
        // Generate JWT token
        $token = $this->generateToken($userId);
        
        // Get user data without password
        $user = $this->getUserById($userId);
        
        // Return user data and token
        return [
            'error' => false,
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token
        ];
    }
    
    /**
     * Login a user
     * @param string $username Username or email
     * @param string $password
     * @return array Response with user data and token or error
     */
    public function login($username, $password) {
        // Check if username/email exists and get password
        $user = $this->db->getRow(
            "SELECT user_id, username, password, is_admin FROM users WHERE username = ? OR email = ?",
            [$username, $username]
        );
        
        if (!$user) {
            http_response_code(HTTP_UNAUTHORIZED);
            return [
                'error' => true,
                'message' => 'Invalid username or password'
            ];
        }
        
        // Verify password
        if (!$this->verifyPassword($password, $user['password'])) {
            http_response_code(HTTP_UNAUTHORIZED);
            return [
                'error' => true,
                'message' => 'Invalid username or password'
            ];
        }
        
        // Generate JWT token
        $token = $this->generateToken($user['user_id']);
        
        // Get user data without password
        $userData = $this->getUserById($user['user_id']);
        
        // Return user data and token
        return [
            'error' => false,
            'message' => 'Login successful',
            'user' => $userData,
            'token' => $token
        ];
    }
    
    /**
     * Get user by ID
     * @param int $userId
     * @return array User data
     */
    public function getUserById($userId) {
        $user = $this->db->getRow(
            "SELECT user_id, username, email, weight, height, goal, is_admin, created_at FROM users WHERE user_id = ?",
            [$userId]
        );
        
        return $user;
    }
    
    /**
     * Update user profile
     * @param int $userId
     * @param array $userData
     * @return array Response
     */
    public function updateProfile($userId, $userData) {
        // Allowed fields to update
        $allowedFields = ['username', 'email', 'weight', 'height', 'goal'];
        
        // Filter data to include only allowed fields
        $data = array_intersect_key($userData, array_flip($allowedFields));
        
        // Update user
        $result = $this->db->update('users', $data, 'user_id = ?', [$userId]);
        
        if ($result) {
            // If weight is updated, add to weight logs
            if (isset($data['weight'])) {
                $this->db->insert('weight_logs', [
                    'user_id' => $userId,
                    'weight' => $data['weight'],
                    'logged_at' => date('Y-m-d H:i:s'),
                    'notes' => isset($userData['notes']) ? $userData['notes'] : 'Weight update'
                ]);
            }
            
            // Get updated user data
            $user = $this->getUserById($userId);
            
            return [
                'error' => false,
                'message' => 'Profile updated successfully',
                'user' => $user
            ];
        } else {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to update profile'
            ];
        }
    }
    
    /**
     * Update user password
     * @param int $userId
     * @param string $currentPassword
     * @param string $newPassword
     * @return array Response
     */
    public function updatePassword($userId, $currentPassword, $newPassword) {
        // Get current password from database
        $storedPassword = $this->db->getValue(
            "SELECT password FROM users WHERE user_id = ?",
            [$userId]
        );
        
        // Verify current password
        if (!$this->verifyPassword($currentPassword, $storedPassword)) {
            http_response_code(HTTP_UNAUTHORIZED);
            return [
                'error' => true,
                'message' => 'Current password is incorrect'
            ];
        }
        
        // Hash new password
        $hashedPassword = $this->hashPassword($newPassword);
        
        // Update password
        $result = $this->db->update(
            'users',
            ['password' => $hashedPassword],
            'user_id = ?',
            [$userId]
        );
        
        if ($result) {
            return [
                'error' => false,
                'message' => 'Password updated successfully'
            ];
        } else {
            http_response_code(HTTP_INTERNAL_SERVER_ERROR);
            return [
                'error' => true,
                'message' => 'Failed to update password'
            ];
        }
    }
    
    /**
     * Validate JWT token and get user ID
     * @param string $token
     * @return int|false User ID or false on failure
     */
    public function validateToken($token) {
        $parts = explode('.', $token);
        
        if (count($parts) != 3) {
            return false;
        }
        
        list($header, $payload, $signature) = $parts;
        
        // Verify signature
        $valid = hash_hmac('sha256', "$header.$payload", JWT_SECRET, true);
        $valid = base64_encode($valid);
        $valid = str_replace(['+', '/', '='], ['-', '_', ''], $valid);
        
        if ($signature !== $valid) {
            return false;
        }
        
        // Decode payload
        $payload = json_decode(base64_decode($payload), true);
        
        // Check if token is expired
        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            return false;
        }
        
        // Return user ID
        return isset($payload['uid']) ? (int)$payload['uid'] : false;
    }
    
    /**
     * Hash password
     * @param string $password
     * @return string Hashed password
     */
    private function hashPassword($password) {
        // Add pepper to password for additional security
        $pepperedPassword = $password . PASSWORD_PEPPER;
        
        // Hash password with bcrypt
        return password_hash($pepperedPassword, PASSWORD_ALGO, ['cost' => PASSWORD_COST]);
    }
    
    /**
     * Verify password
     * @param string $password Input password
     * @param string $hash Stored hash
     * @return bool
     */
    private function verifyPassword($password, $hash) {
        // Add pepper to password
        $pepperedPassword = $password . PASSWORD_PEPPER;
        
        // Verify password
        return password_verify($pepperedPassword, $hash);
    }
    
    /**
     * Generate JWT token
     * @param int $userId
     * @return string JWT token
     */
    private function generateToken($userId) {
        // Create header
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $header = base64_encode($header);
        $header = str_replace(['+', '/', '='], ['-', '_', ''], $header);
        
        // Create payload
        $payload = json_encode([
            'uid' => $userId,
            'iat' => time(),
            'exp' => time() + JWT_EXPIRY
        ]);
        $payload = base64_encode($payload);
        $payload = str_replace(['+', '/', '='], ['-', '_', ''], $payload);
        
        // Create signature
        $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET, true);
        $signature = base64_encode($signature);
        $signature = str_replace(['+', '/', '='], ['-', '_', ''], $signature);
        
        // Return complete token
        return "$header.$payload.$signature";
    }
}

/**
 * Helper function to get authenticated user ID from request headers
 * @return int|false User ID or false if not authenticated
 */
function getAuthUserId() {
    $auth = new Auth();
    
    // Get authentication header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Check if token exists and is in the correct format
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return false;
    }
    
    $token = $matches[1];
    
    // Validate token and get user ID
    return $auth->validateToken($token);
}

/**
 * Middleware function to ensure user is authenticated
 * @return int User ID
 */
function requireAuth() {
    $userId = getAuthUserId();
    
    if (!$userId) {
        http_response_code(HTTP_UNAUTHORIZED);
        echo json_encode([
            'error' => true,
            'message' => 'Authentication required'
        ]);
        exit;
    }
    
    return $userId;
}

/**
 * Middleware function to ensure user is admin
 * @return int User ID
 */
function requireAdmin() {
    $userId = requireAuth();
    
    // Check if user is admin
    $db = Database::getInstance();
    $isAdmin = $db->getValue(
        "SELECT is_admin FROM users WHERE user_id = ?",
        [$userId]
    );
    
    if (!$isAdmin) {
        http_response_code(HTTP_FORBIDDEN);
        echo json_encode([
            'error' => true,
            'message' => 'Admin privileges required'
        ]);
        exit;
    }
    
    return $userId;
}