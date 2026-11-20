<?php
// Database connection. Override with environment variables if needed:
// KT_DB_HOST, KT_DB_NAME, KT_DB_USER, KT_DB_PASS (or KT_DB_DSN for a full PDO DSN).

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }

    $host = getenv('KT_DB_HOST') ?: 'localhost';
    $name = getenv('KT_DB_NAME') ?: 'karavali_trails';
    $user = getenv('KT_DB_USER') ?: 'root';
    $pass = getenv('KT_DB_PASS') !== false ? getenv('KT_DB_PASS') : '';
    $dsn  = getenv('KT_DB_DSN') ?: "mysql:host=$host;dbname=$name;charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    if (strncmp($dsn, 'mysql:', 6) === 0) {
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET time_zone = '+00:00'";
    }

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database connection failed. Check backend/config/database.php and that the database is imported.']);
        exit;
    }
    return $pdo;
}
