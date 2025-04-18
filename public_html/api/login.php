<?php
/**
 * Login API Endpoint
 * Path: /public_html/api/login.php
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
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(HTTP_BAD_REQUEST);
    echo json_encode([
        'error' => true,
        'message' => 'Username and password are required'
    ]);
    exit;
}

// Create auth instance
$auth = new Auth();

// Attempt login
$result = $auth->login($data['username'], $data['password']);

// Return result
echo json_encode($result);