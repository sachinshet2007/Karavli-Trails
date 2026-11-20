<?php
// Shared helpers: JSON I/O, sessions, auth guards.

require_once __DIR__ . '/../config/database.php';

function send($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400): void
{
    send(['error' => $message], $code);
}

function body(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $data = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($data)) {
            fail('Invalid request body.');
        }
    }
    return $data;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => !empty($_SERVER['HTTPS']),
        ]);
        session_start();
    }
}

function current_user(): ?array
{
    start_session();
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $st = db()->prepare('SELECT id, name, mobile, role FROM users WHERE id = ?');
    $st->execute([$_SESSION['user_id']]);
    $u = $st->fetch();
    return $u ?: null;
}

function public_user(array $u): array
{
    return ['_id' => (string)$u['id'], 'name' => $u['name'], 'mobile' => $u['mobile'], 'role' => $u['role']];
}

function require_user(): array
{
    $u = current_user();
    if (!$u) {
        fail('Please log in first.', 401);
    }
    return $u;
}

function require_admin(): array
{
    $u = current_user();
    if (!$u || $u['role'] !== 'admin') {
        fail('Admin access only.', 403);
    }
    return $u;
}

function iso(?string $ts): ?string
{
    return $ts ? str_replace(' ', 'T', $ts) . 'Z' : null;
}

function valid_date(?string $d): bool
{
    if (!is_string($d) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
        return false;
    }
    [$y, $m, $day] = array_map('intval', explode('-', $d));
    return checkdate($m, $day, $y);
}
