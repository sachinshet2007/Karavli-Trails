<?php
// Rule-based trip planner: filters destinations by interest, chains nearby places into days, estimates costs.
// No AI is involved (the trip planner page says so).

const TOWNS = [
    'karwar' => ['Karwar', 14.8137, 74.1290], 'gokarna' => ['Gokarna', 14.5479, 74.3188],
    'kumta' => ['Kumta', 14.4290, 74.4147], 'honnavar' => ['Honnavar', 14.2798, 74.4439],
    'murudeshwar' => ['Murudeshwar', 14.0942, 74.4850], 'bhatkal' => ['Bhatkal', 13.9853, 74.5551],
    'ankola' => ['Ankola', 14.6600, 74.3000], 'sirsi' => ['Sirsi', 14.6197, 74.8354],
    'yellapur' => ['Yellapur', 14.9627, 74.7081], 'dandeli' => ['Dandeli', 15.2693, 74.6177],
];

const INTEREST_CATEGORIES = [
    'Temples' => ['Temples'],
    'Beaches' => ['Beaches'],
    'Trekking' => ['Trekking and Adventure'],
    'Forests and Wildlife' => ['Forests and Wildlife'],
    'Waterfalls' => ['Waterfalls'],
    'Adventure Activities' => ['Trekking and Adventure', 'Rivers and Islands', 'Hill Stations and Viewpoints'],
    'Historical Places' => ['Historical Places'],
];

const CAB_PER_KM = 16;
const ROOM_PER_NIGHT = 2000;
const FOOD_PER_PERSON_DAY = 400;
const ROAD_FACTOR = 1.3;   // straight-line distance -> rough road distance
const SLOTS = ['Morning', 'Afternoon', 'Evening'];

function km_between(float $la1, float $lo1, float $la2, float $lo2): float
{
    $r = 6371;
    $dLa = deg2rad($la2 - $la1);
    $dLo = deg2rad($lo2 - $lo1);
    $a = sin($dLa / 2) ** 2 + cos(deg2rad($la1)) * cos(deg2rad($la2)) * sin($dLo / 2) ** 2;
    return 2 * $r * asin(sqrt($a)) * ROAD_FACTOR;
}

function build_plan(array $in): array
{
    $days = (int)($in['days'] ?? 0);
    $travellers = (int)($in['travellers'] ?? 0);
    $interests = array_values(array_unique(array_filter((array)($in['interests'] ?? []), 'is_string')));
    $budget = (string)($in['budget'] ?? '');
    $variation = !empty($in['variation']);
    $startName = trim((string)($in['startingLocation'] ?? ''));

    if ($days < 1 || $days > 7) { fail('Choose between 1 and 7 days.'); }
    if ($travellers < 1 || $travellers > 40) { fail('Travellers must be between 1 and 40.'); }
    if (!$interests) { fail('Select at least one interest.'); }
    foreach ($interests as $i) {
        if (!isset(INTEREST_CATEGORIES[$i])) { fail('Unknown interest: ' . $i); }
    }
    if (!preg_match('/^(\d+)-(\d+)$|^(\d+)\+$/', $budget, $bm)) { fail('Choose a budget.'); }
    $budgetLimit = isset($bm[2]) && $bm[2] !== '' ? (int)$bm[2] * $travellers : null;   // per-person upper bound x group
    $town = TOWNS[strtolower($startName)] ?? null;
    if (!$town) { fail('Choose a starting town from the list: ' . implode(', ', array_column(TOWNS, 0)) . '.'); }
    [$startLabel, $sLat, $sLng] = $town;

    $cats = [];
    foreach ($interests as $i) { $cats = array_merge($cats, INTEREST_CATEGORIES[$i]); }
    $cats = array_unique($cats);

    $rows = db()->query('SELECT * FROM destinations WHERE latitude IS NOT NULL AND longitude IS NOT NULL')->fetchAll();
    $dests = [];
    foreach ($rows as $r) {
        if (in_array($r['category'], $cats, true)) { $dests[] = row_out(COLLECTIONS['destinations'], $r); }
    }

    $warnings = [];
    $want = $days * 3;
    if (!$dests) { fail('No destinations with verified coordinates match these interests yet.', 404); }

    // Take the places closest to the start first (or a random nearby subset when regenerating).
    usort($dests, fn($a, $b) => km_between($sLat, $sLng, $a['latitude'], $a['longitude']) <=> km_between($sLat, $sLng, $b['latitude'], $b['longitude']));
    if ($variation) {
        $pool = array_slice($dests, 0, max($want * 2, 6));
        shuffle($pool);
        $dests = $pool;
    }
    $picked = array_slice($dests, 0, $want);
    if (count($picked) < $want) {
        $warnings[] = 'Only ' . count($picked) . ' matching place(s) with verified coordinates were found, so some days have fewer stops.';
    }

    // Chain by nearest neighbour from the start, then cut into days of up to 3 stops.
    $ordered = [];
    $curLat = $sLat; $curLng = $sLng;
    while ($picked) {
        $bi = 0; $bd = INF;
        foreach ($picked as $i => $d) {
            $km = km_between($curLat, $curLng, $d['latitude'], $d['longitude']);
            if ($km < $bd) { $bd = $km; $bi = $i; }
        }
        $d = $picked[$bi];
        array_splice($picked, $bi, 1);
        $ordered[] = $d;
        $curLat = $d['latitude']; $curLng = $d['longitude'];
    }
    $perDay = max(1, (int)ceil(count($ordered) / $days));
    $perDay = min($perDay, 3);

    $itinerary = [];
    $totalKm = 0.0; $entry = 0.0;
    $pLat = $sLat; $pLng = $sLng;
    foreach (array_chunk($ordered, $perDay) as $di => $chunk) {
        if ($di >= $days) { break; }
        $stops = []; $dayKm = 0.0;
        foreach ($chunk as $si => $d) {
            $km = km_between($pLat, $pLng, $d['latitude'], $d['longitude']);
            $dayKm += $km;
            $cost = (float)($d['entryFee'] ?? 0);
            $entry += $cost;
            $stops[] = [
                'slot' => SLOTS[$si] ?? 'Evening', 'name' => $d['name'], 'category' => $d['category'],
                'distanceKm' => round($km), 'estimatedCost' => $cost,
                'latitude' => $d['latitude'], 'longitude' => $d['longitude'], 'coordsApprox' => $d['coordsApprox'],
            ];
            $pLat = $d['latitude']; $pLng = $d['longitude'];
        }
        $totalKm += $dayKm;
        $itinerary[] = ['day' => $di + 1, 'dayKm' => round($dayKm), 'stops' => $stops];
    }
    $totalKm += km_between($pLat, $pLng, $sLat, $sLng);   // return to start
    if (count($itinerary) < $days) {
        $warnings[] = 'Your trip is ' . $days . ' day(s) but places fit into ' . count($itinerary) . ' day(s). Try adding interests.';
    }

    $transport = $totalKm * CAB_PER_KM;
    $rooms = (int)ceil($travellers / 2);
    $accommodation = max(0, $days - 1) * $rooms * ROOM_PER_NIGHT;
    $food = FOOD_PER_PERSON_DAY * $travellers * $days;
    $activities = $entry * $travellers;
    $total = $transport + $accommodation + $food + $activities;
    $withinBudget = $budgetLimit === null || $total <= $budgetLimit;
    if (!$withinBudget) { $warnings[] = 'This plan is above your budget. Try fewer days, fewer interests or more travellers sharing the cab.'; }

    return [
        'title' => "$days-day " . implode(' & ', $interests) . " trip from $startLabel",
        'days' => $days, 'travellers' => $travellers, 'interests' => $interests, 'budget' => $budget,
        'totalKm' => (int)round($totalKm), 'warnings' => $warnings, 'itinerary' => $itinerary,
        'expenses' => [
            'transport' => (int)round($transport), 'accommodation' => (int)$accommodation, 'food' => (int)$food,
            'activities' => (int)round($activities), 'total' => (int)round($total), 'perPerson' => (int)round($total / $travellers),
        ],
        'withinBudget' => $withinBudget, 'budgetLimit' => $budgetLimit,
        'assumptions' => [
            'note' => 'Distances are straight-line estimates plus 30% for roads. Prices are rough guides, not quotes.',
            'cabPerKm' => CAB_PER_KM, 'roomPerNight' => ROOM_PER_NIGHT, 'foodPerPersonPerDay' => FOOD_PER_PERSON_DAY,
        ],
        'start' => ['name' => $startLabel, 'lat' => $sLat, 'lng' => $sLng],
    ];
}
