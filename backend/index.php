<?php
// Single entry point for the API. The frontend calls  backend/index.php/api/...
// Works with Apache/XAMPP (PATH_INFO) and with `php -S localhost:8000` run from the project folder.

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/collections.php';
require_once __DIR__ . '/lib/planner.php';
require_once __DIR__ . '/handlers/auth.php';
require_once __DIR__ . '/handlers/user.php';
require_once __DIR__ . '/handlers/admin.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $pos = strpos($uri, 'index.php');
    $path = $pos === false ? '' : substr($uri, $pos + strlen('index.php'));
}
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// State-changing requests must be JSON. A cross-site HTML form cannot send that, which blocks CSRF.
if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    $hasBody = (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0;
    if ($hasBody && stripos($ct, 'application/json') !== 0) { fail('Unsupported content type.', 415); }
    if (!$hasBody && $method !== 'POST' && $method !== 'DELETE') { fail('Empty request body.'); }
}

$seg = explode('/', trim($path, '/'));
if (($seg[0] ?? '') !== 'api') { fail('Not found.', 404); }
array_shift($seg);
$r = $seg[0] ?? '';
$n = count($seg);
$id = isset($seg[1]) && ctype_digit($seg[1]) ? (int)$seg[1] : null;

try {
    switch (true) {
        // auth
        case $r === 'auth' && ($seg[1] ?? '') === 'register' && $method === 'POST': h_register();
        case $r === 'auth' && ($seg[1] ?? '') === 'login' && $method === 'POST': h_login();
        case $r === 'auth' && ($seg[1] ?? '') === 'logout' && $method === 'POST': h_logout();
        case $r === 'auth' && ($seg[1] ?? '') === 'profile' && $method === 'GET': h_profile_get();
        case $r === 'auth' && ($seg[1] ?? '') === 'profile' && $method === 'PUT': h_profile_put();
        case $r === 'auth' && ($seg[1] ?? '') === 'password' && $method === 'PUT': h_password_put();

        // public listings
        case $n === 1 && $method === 'GET' && isset(COLLECTIONS[$r]) && COLLECTIONS[$r]['public']: send(collection_list($r));

        // trips
        case $r === 'trips' && ($seg[1] ?? '') === 'plan' && $method === 'POST': h_trip_plan();
        case $r === 'trips' && ($seg[1] ?? '') === 'save' && $method === 'POST': h_trip_save();
        case $r === 'trips' && ($seg[1] ?? '') === 'my-trips' && $method === 'GET': h_trips_mine();
        case $r === 'trips' && $id !== null && $n === 2 && $method === 'DELETE': h_trip_delete($id);

        // bike rental requests
        case $r === 'rental-requests' && $n === 1 && $method === 'POST': h_rental_create();
        case $r === 'rental-requests' && ($seg[1] ?? '') === 'my-requests' && $method === 'GET': h_rentals_mine();

        // admin
        case $r === 'admin' && ($seg[1] ?? '') === 'login' && $method === 'POST': h_admin_login();
        case $r === 'admin' && ($seg[1] ?? '') === 'schema' && $method === 'GET': h_admin_schema();
        case $r === 'admin' && $n === 2 && $method === 'GET': h_admin_list($seg[1]);
        case $r === 'admin' && $n === 2 && $method === 'POST': h_admin_create($seg[1]);
        case $r === 'admin' && $n === 3 && ctype_digit($seg[2]) && $method === 'PUT': h_admin_update($seg[1], (int)$seg[2]);
        case $r === 'admin' && $n === 3 && ctype_digit($seg[2]) && $method === 'DELETE': h_admin_delete($seg[1], (int)$seg[2]);
    }
    fail('Not found.', 404);
} catch (PDOException $e) {
    error_log('Karavali Trails DB error: ' . $e->getMessage());
    fail('Database error. Has backend/database/karavali_trails.sql been imported?', 500);
}
