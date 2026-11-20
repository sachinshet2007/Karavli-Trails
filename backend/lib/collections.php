<?php
// Describes the listing collections that the public pages read and the admin dashboard edits.
// Field type codes (shared with frontend/js/admin.js): s = text, n = number, b = yes/no, a = list; "!" = required.

const COLLECTIONS = [
    'destinations' => ['table' => 'destinations', 'public' => true, 'fields' => [
        'name' => 's!', 'category' => 's!', 'address' => 's', 'description' => 's', 'history' => 's',
        'bestTimeToVisit' => 's', 'latitude' => 'n', 'longitude' => 'n', 'coordsApprox' => 'b',
        'entryFee' => 'n', 'image' => 's',
    ]],
    'stays' => ['table' => 'stays', 'public' => true, 'fields' => [
        'name' => 's!', 'location' => 's!', 'address' => 's', 'mobile' => 's', 'type' => 's', 'price' => 'n',
        'rating' => 'n', 'roomType' => 's', 'facilities' => 'a', 'image' => 's', 'demo' => 'b',
    ]],
    'restaurants' => ['table' => 'restaurants', 'public' => true, 'fields' => [
        'name' => 's!', 'location' => 's!', 'address' => 's', 'mobile' => 's', 'foodCategory' => 's',
        'priceRange' => 's', 'rating' => 'n', 'popularDishes' => 'a', 'image' => 's', 'demo' => 'b',
    ]],
    'drivers' => ['table' => 'drivers', 'public' => true, 'fields' => [
        'name' => 's!', 'mobile' => 's', 'location' => 's!', 'vehicleType' => 's!', 'fare' => 'n',
        'availability' => 'b', 'photo' => 's', 'vehiclePhoto' => 's', 'demo' => 'b',
    ]],
    'bikes' => ['table' => 'bikes', 'public' => true, 'fields' => [
        'bikeName' => 's!', 'model' => 's', 'category' => 's!', 'pricePerHour' => 'n', 'pricePerDay' => 'n',
        'pickupLocation' => 's!', 'providerName' => 's', 'providerMobile' => 's', 'rentalConditions' => 's',
        'availability' => 'b', 'image' => 's', 'demo' => 'b',
    ]],
    'guides' => ['table' => 'guides', 'public' => true, 'fields' => [
        'name' => 's!', 'mobile' => 's', 'location' => 's!', 'category' => 's', 'languages' => 'a',
        'expertise' => 'a', 'experience' => 'n', 'rating' => 'n', 'isVerified' => 'b', 'photo' => 's', 'demo' => 'b',
    ]],
];

function snake(string $s): string
{
    return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $s));
}

function admin_schema(): array
{
    $S = [];
    foreach (COLLECTIONS as $name => $c) {
        $S[$name] = $c['fields'];
    }
    return $S;
}

function row_out(array $c, array $r): array
{
    $o = ['_id' => (string)$r['id']];
    foreach ($c['fields'] as $k => $t) {
        $v = $r[snake($k)] ?? null;
        switch ($t[0]) {
            case 'n': $o[$k] = ($v === null || $v === '') ? null : $v + 0; break;
            case 'b': $o[$k] = (bool)$v; break;
            case 'a': $d = is_string($v) ? json_decode($v, true) : null; $o[$k] = is_array($d) ? $d : []; break;
            default:  $o[$k] = $v === null ? '' : (string)$v;
        }
    }
    return $o;
}

// Validates and converts admin input into column => value. Fails the request on bad input.
function row_in(array $c, array $in): array
{
    $out = [];
    foreach ($c['fields'] as $k => $t) {
        $v = $in[$k] ?? null;
        $req = substr($t, -1) === '!';
        switch ($t[0]) {
            case 'n':
                if ($v === null || $v === '') { $v = null; }
                elseif (!is_numeric($v)) { fail("$k must be a number."); }
                else { $v = $v + 0; if ($v < 0) { fail("$k cannot be negative."); } }
                if ($k === 'latitude' && $v !== null && ($v < -90 || $v > 90)) { fail('Latitude must be between -90 and 90.'); }
                if ($k === 'longitude' && $v !== null && ($v < -180 || $v > 180)) { fail('Longitude must be between -180 and 180.'); }
                if ($k === 'rating' && $v !== null && $v > 5) { fail('Rating must be between 0 and 5.'); }
                break;
            case 'b':
                $v = !empty($v) ? 1 : 0;
                break;
            case 'a':
                if (is_string($v)) { $v = explode(',', $v); }
                $v = array_values(array_filter(array_map(fn($x) => trim((string)$x), is_array($v) ? $v : []), 'strlen'));
                $v = json_encode($v, JSON_UNESCAPED_UNICODE);
                break;
            default:
                $v = trim((string)($v ?? ''));
        }
        if ($req && ($v === '' || $v === null)) {
            fail("$k is required.");
        }
        $out[snake($k)] = $v;
    }
    if (isset($out['latitude']) !== isset($out['longitude'])) {
        fail('Enter both latitude and longitude, or leave both empty.');
    }
    return $out;
}

function collection_list(string $name): array
{
    $c = COLLECTIONS[$name];
    $rows = db()->query("SELECT * FROM {$c['table']} ORDER BY id DESC")->fetchAll();
    return array_map(fn($r) => row_out($c, $r), $rows);
}

function collection_save(string $name, ?int $id, array $input): array
{
    $c = COLLECTIONS[$name];
    $v = row_in($c, $input);
    $cols = array_keys($v);
    if ($id === null) {
        $sql = "INSERT INTO {$c['table']} (" . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')';
        db()->prepare($sql)->execute(array_values($v));
        $id = (int)db()->lastInsertId();
    } else {
        $sql = "UPDATE {$c['table']} SET " . implode(',', array_map(fn($x) => "$x = ?", $cols)) . ' WHERE id = ?';
        $st = db()->prepare($sql);
        $st->execute([...array_values($v), $id]);
        $chk = db()->prepare("SELECT id FROM {$c['table']} WHERE id = ?");
        $chk->execute([$id]);
        if (!$chk->fetch()) { fail('Item not found.', 404); }
    }
    $st = db()->prepare("SELECT * FROM {$c['table']} WHERE id = ?");
    $st->execute([$id]);
    return row_out($c, $st->fetch());
}

function collection_delete(string $name, int $id): void
{
    $st = db()->prepare('DELETE FROM ' . COLLECTIONS[$name]['table'] . ' WHERE id = ?');
    $st->execute([$id]);
    if (!$st->rowCount()) { fail('Item not found.', 404); }
}
