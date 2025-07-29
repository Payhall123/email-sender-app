<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request method and handle accordingly
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode([
            'message' => 'PHP API is working!',
            'timestamp' => date('c'),
            'method' => 'GET'
        ]);
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        echo json_encode([
            'message' => 'POST request received',
            'data' => $input,
            'timestamp' => date('c'),
            'method' => 'POST'
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'error' => 'Method not allowed',
            'method' => $method
        ]);
        break;
}
?>
