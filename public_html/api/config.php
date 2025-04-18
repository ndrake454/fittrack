<?php
/**
 * Database Configuration
 * Path: /exercise-app/api/config.php
 */

// Database configuration
define('DB_SERVER', 'localhost');
define('DB_USERNAME', '`');
define('DB_PASSWORD', '`'); // Change this to a secure password
define('DB_NAME', '`');

// Set timezone
date_default_timezone_set('UTC');

// Error reporting (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS settings for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Auth-Token');
header('Content-Type: application/json');

// For preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

// API Response codes
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_NO_CONTENT', 204);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_METHOD_NOT_ALLOWED', 405);
define('HTTP_INTERNAL_SERVER_ERROR', 500);

// Secret key for JWT
define('JWT_SECRET', 'your_jwt_secret_key'); // Change this to a secure key
define('JWT_EXPIRY', 86400); // 24 hours

// App settings
define('PASSWORD_PEPPER', 'your_password_pepper'); // Additional security for password hashing
define('PASSWORD_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_COST', 12);