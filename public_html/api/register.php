<?php
/**
 * Registration API Endpoint
 * Path: /public_html/api/register.php
 */

// Include auth functionality
require_once 'auth.php';

// Check if method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(HTTP_METHOD_NOT_ALLOWED);
    echo json_encode([
        'error' => true,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(HTTP_BAD_REQUEST);
    echo json_encode([
        'error' => true,
        'message' => 'Username, email, and password are required'
    ]);
    exit;
}

// Create auth instance
$auth = new Auth();

// Prepare additional user data
$userData = [];
if (isset($data['weight'])) $userData['weight'] = $data['weight'];
if (isset($data['height'])) $userData['height'] = $data['height'];
if (isset($data['goal'])) $userData['goal'] = $data['goal'];

// Attempt registration
$result = $auth->register($data['username'], $data['email'], $data['password'], $userData);

// Return result
echo json_encode($result);