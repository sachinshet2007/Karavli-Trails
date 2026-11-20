<?php
// /api/admin/*  (admin session required)

const REQUEST_STATUSES = ['Pending', 'Accepted', 'Rejected'];

function h_admin_schema(): void
{
    require_admin();
    send(['S' => admin_schema()]);
}

function h_admin_list(string $name): void
{
    require_admin();
    if (isset(COLLECTIONS[$name])) { send(collection_list($name)); }

    if ($name === 'users') {
        $rows = db()->query('SELECT id, name, mobile, role, created_at FROM users ORDER BY id DESC')->fetchAll();
        send(array_map(fn($r) => ['_id' => (string)$r['id'], 'name' => $r['name'], 'mobile' => $r['mobile'], 'role' => $r['role'], 'createdAt' => iso($r['created_at'])], $rows));
    }
    if ($name === 'trips') {
        $rows = db()->query('SELECT t.*, u.name AS user_name FROM trips t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.id DESC')->fetchAll();
        send(array_map(fn($r) => trip_out($r) + ['user' => $r['user_name'] ?? 'Deleted user'], $rows));
    }
    if ($name === 'rentalRequests') {
        $rows = db()->query('SELECT r.*, u.name AS user_name, u.mobile AS user_mobile, b.bike_name, b.provider_name, b.pickup_location FROM rental_requests r LEFT JOIN users u ON u.id = r.user_id LEFT JOIN bikes b ON b.id = r.bike_id ORDER BY r.id DESC')->fetchAll();
        send(array_map(fn($r) => rental_out($r) + ['user' => $r['user_name'], 'userMobile' => $r['user_mobile'], 'rentalRequestId' => (string)$r['id']], $rows));
    }
    fail('Unknown section.', 404);
}

function h_admin_create(string $name): void
{
    require_admin();
    if (!isset(COLLECTIONS[$name])) { fail('Unknown section.', 404); }
    send(collection_save($name, null, body()), 201);
}

function h_admin_update(string $name, int $id): void
{
    require_admin();
    if (isset(COLLECTIONS[$name])) { send(collection_save($name, $id, body())); }
    if ($name === 'rentalRequests') {
        $s = body()['requestStatus'] ?? '';
        if (!in_array($s, REQUEST_STATUSES, true)) { fail('Invalid status.'); }
        $st = db()->prepare('UPDATE rental_requests SET request_status = ? WHERE id = ?');
        $st->execute([$s, $id]);
        send(['success' => true]);
    }
    fail('Unknown section.', 404);
}

function h_admin_delete(string $name, int $id): void
{
    $me = require_admin();
    if (isset(COLLECTIONS[$name])) { collection_delete($name, $id); send(['success' => true]); }
    if ($name === 'users') {
        if ($id === (int)$me['id']) { fail('You cannot delete your own account.', 409); }
        $st = db()->prepare("DELETE FROM users WHERE id = ? AND role = 'user'");
        $st->execute([$id]);
        if (!$st->rowCount()) { fail('User not found (admin accounts cannot be deleted here).', 404); }
        send(['success' => true]);
    }
    if ($name === 'trips') {
        $st = db()->prepare('DELETE FROM trips WHERE id = ?');
        $st->execute([$id]);
        send(['success' => true]);
    }
    fail('This item cannot be deleted.', 405);
}
