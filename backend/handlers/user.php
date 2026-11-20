<?php
// Trips and bike rental requests (logged-in users)

function trip_out(array $r): array
{
    $it = json_decode($r['itinerary'], true);
    return [
        '_id' => (string)$r['id'], 'title' => $r['title'], 'numberOfDays' => (int)$r['number_of_days'],
        'travellers' => (int)$r['travellers'], 'estimatedTotal' => $r['estimated_total'] + 0,
        'itinerary' => is_array($it) ? $it : [], 'createdAt' => iso($r['created_at']),
    ];
}

function h_trip_plan(): void
{
    require_user();
    send(build_plan(body()));
}

function h_trip_save(): void
{
    $u = require_user();
    $b = body();
    $title = trim((string)($b['title'] ?? ''));
    $days = (int)($b['numberOfDays'] ?? 0);
    $trav = (int)($b['travellers'] ?? 0);
    $it = $b['itinerary'] ?? null;
    if ($title === '' || $days < 1 || $days > 7 || $trav < 1 || !is_array($it) || !$it) { fail('This trip cannot be saved. Plan it again.'); }
    $clean = [];
    foreach ($it as $d) {
        $stops = [];
        foreach ((array)($d['stops'] ?? []) as $s) { $stops[] = ['name' => mb_substr((string)($s['name'] ?? ''), 0, 150)]; }
        $clean[] = ['day' => (int)($d['day'] ?? 0), 'stops' => $stops];
    }
    db()->prepare('INSERT INTO trips (user_id, title, number_of_days, interests, budget, starting_location, travellers, itinerary, estimated_total) VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([
            $u['id'], mb_substr($title, 0, 200), $days,
            json_encode(array_values(array_filter((array)($b['interests'] ?? []), 'is_string'))),
            mb_substr((string)($b['budget'] ?? ''), 0, 30), mb_substr((string)($b['startingLocation'] ?? ''), 0, 100),
            $trav, json_encode($clean, JSON_UNESCAPED_UNICODE), max(0, (float)($b['estimatedTotal'] ?? 0)),
        ]);
    send(['success' => true], 201);
}

function h_trips_mine(): void
{
    $u = require_user();
    $st = db()->prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY id DESC');
    $st->execute([$u['id']]);
    send(array_map('trip_out', $st->fetchAll()));
}

function h_trip_delete(int $id): void
{
    $u = require_user();
    $st = db()->prepare('DELETE FROM trips WHERE id = ? AND user_id = ?');
    $st->execute([$id, $u['id']]);
    if (!$st->rowCount()) { fail('Trip not found.', 404); }
    send(['success' => true]);
}

function h_rental_create(): void
{
    $u = require_user();
    $b = body();
    $s = $b['rentalStartDate'] ?? null; $e = $b['rentalEndDate'] ?? null;
    if (!valid_date($s) || !valid_date($e)) { fail('Choose valid start and end dates.'); }
    if ($e < $s) { fail('End date cannot be before the start date.'); }
    if ($s < gmdate('Y-m-d', time() - 86400)) { fail('Start date cannot be in the past.'); }
    $st = db()->prepare('SELECT * FROM bikes WHERE id = ?');
    $st->execute([(int)($b['bikeId'] ?? 0)]);
    $bike = $st->fetch();
    if (!$bike) { fail('This bike is no longer listed.', 404); }
    if (!$bike['availability']) { fail('This bike is not available right now.', 409); }
    $n = (int)((strtotime($e) - strtotime($s)) / 86400) + 1;
    $est = $bike['price_per_day'] === null ? null : $n * $bike['price_per_day'];
    db()->prepare("INSERT INTO rental_requests (user_id, bike_id, rental_start_date, rental_end_date, total_estimated_price, request_status) VALUES (?,?,?,?,?, 'Pending')")
        ->execute([$u['id'], $bike['id'], $s, $e, $est]);
    send(['success' => true], 201);
}

function rental_out(array $r): array
{
    return [
        '_id' => (string)$r['id'], 'bike' => $r['bike_name'], 'provider' => $r['provider_name'], 'pickup' => $r['pickup_location'],
        'rentalStartDate' => $r['rental_start_date'], 'rentalEndDate' => $r['rental_end_date'],
        'totalEstimatedPrice' => $r['total_estimated_price'] === null ? null : $r['total_estimated_price'] + 0,
        'requestStatus' => $r['request_status'],
    ];
}

function h_rentals_mine(): void
{
    $u = require_user();
    $st = db()->prepare('SELECT r.*, b.bike_name, b.provider_name, b.pickup_location FROM rental_requests r LEFT JOIN bikes b ON b.id = r.bike_id WHERE r.user_id = ? ORDER BY r.id DESC');
    $st->execute([$u['id']]);
    send(array_map('rental_out', $st->fetchAll()));
}
