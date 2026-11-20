<?php
// Creates or resets an admin account.  Usage:  php backend/database/create_admin.php <username> <password>
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/../config/database.php';
[$self, $username, $password] = $argv + [null, null, null];
if (!$username || !$password || strlen($password) < 10) {
    fwrite(STDERR, "Usage: php create_admin.php <username> <password (10+ characters)>\n");
    exit(1);
}
$hash = password_hash($password, PASSWORD_DEFAULT);
$st = db()->prepare("SELECT id FROM users WHERE username = ? AND role = 'admin'");
$st->execute([$username]);
if ($id = $st->fetchColumn()) {
    db()->prepare('UPDATE users SET password = ? WHERE id = ?')->execute([$hash, $id]);
    echo "Admin password updated for $username\n";
} else {
    // Admins log in by username, so the mobile column just needs a unique placeholder.
    db()->prepare("INSERT INTO users (name, mobile, username, password, role) VALUES (?, ?, ?, ?, 'admin')")
        ->execute(['Administrator', 'admin-' . bin2hex(random_bytes(4)), $username, $hash]);
    echo "Admin created: $username\n";
}
