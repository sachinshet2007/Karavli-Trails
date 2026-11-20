<?php
// /api/auth/* and /api/admin/login

function normalise_mobile($m): string { return preg_replace('/\s+/', '', (string)$m); }

function login_session(array $u): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$u['id'];
}

function h_register(): void
{
    $b = body();
    $name = trim((string)($b['name'] ?? ''));
    $mobile = normalise_mobile($b['mobile'] ?? '');
    $pw = (string)($b['password'] ?? '');
    if (mb_strlen($name) < 2 || mb_strlen($name) > 100) { fail('Enter your full name.'); }
    if (!preg_match('/^[6-9]\d{9}$/', $mobile)) { fail('Enter a valid 10-digit mobile number.'); }
    if (strlen($pw) < 8) { fail('Password must be at least 8 characters.'); }
    if ($pw !== (string)($b['confirmPassword'] ?? '')) { fail('Passwords do not match.'); }

    $st = db()->prepare('SELECT id FROM users WHERE mobile = ?');
    $st->execute([$mobile]);
    if ($st->fetch()) { fail('This mobile number is already registered.', 409); }

    db()->prepare("INSERT INTO users (name, mobile, password, role) VALUES (?, ?, ?, 'user')")
        ->execute([$name, $mobile, password_hash($pw, PASSWORD_DEFAULT)]);
    send(['success' => true], 201);
}

function h_login(): void
{
    $b = body();
    $st = db()->prepare("SELECT * FROM users WHERE mobile = ? AND role = 'user'");
    $st->execute([normalise_mobile($b['mobile'] ?? '')]);
    $u = $st->fetch();
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['password'])) {
        fail('Incorrect mobile number or password.', 401);
    }
    login_session($u);
    send(public_user($u));
}

function h_admin_login(): void
{
    $b = body();
    $st = db()->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'");
    $st->execute([trim((string)($b['username'] ?? ''))]);
    $u = $st->fetch();
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['password'])) {
        fail('Incorrect username or password.', 401);
    }
    login_session($u);
    send(public_user($u));
}

function h_logout(): void
{
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    send(['success' => true]);
}

function h_profile_get(): void
{
    send(public_user(require_user()));
}

function h_profile_put(): void
{
    $u = require_user();
    $b = body();
    $name = trim((string)($b['name'] ?? ''));
    $mobile = normalise_mobile($b['mobile'] ?? '');
    if (mb_strlen($name) < 2 || mb_strlen($name) > 100) { fail('Enter your full name.'); }
    if ($u['role'] === 'user' && !preg_match('/^[6-9]\d{9}$/', $mobile)) { fail('Enter a valid 10-digit mobile number.'); }
    $st = db()->prepare('SELECT id FROM users WHERE mobile = ? AND id <> ?');
    $st->execute([$mobile, $u['id']]);
    if ($st->fetch()) { fail('This mobile number is already registered.', 409); }
    db()->prepare('UPDATE users SET name = ?, mobile = ? WHERE id = ?')->execute([$name, $mobile, $u['id']]);
    send(['success' => true]);
}

function h_password_put(): void
{
    $u = require_user();
    $b = body();
    $new = (string)($b['newPassword'] ?? '');
    $st = db()->prepare('SELECT password FROM users WHERE id = ?');
    $st->execute([$u['id']]);
    if (!password_verify((string)($b['current'] ?? ''), $st->fetchColumn())) { fail('Current password is incorrect.', 403); }
    if (strlen($new) < 8) { fail('New password must be at least 8 characters.'); }
    db()->prepare('UPDATE users SET password = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
    send(['success' => true]);
}
