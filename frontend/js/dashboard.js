(async () => {
  const user = await requireLogin('afterlogin.html'); if (!user) return;
  $('#hello').textContent = 'Hello, ' + user.name.split(' ')[0] + '.';
  const C = [
    ['🧭', 'Explore Uttara Kannada', 'Browse beaches, falls, temples and forts.', 'Exploreuk.html', '#14532D,#0284C7'],
    ['🗺️', 'Trip Planner', 'Get a day-wise plan for your days, interests and budget.', 'tripplanner.html', '#0284C7,#064E3B'],
    ['🏨', 'Resorts & Stays', 'Hotels, resorts and homestays by town.', 'stays.html', '#064E3B,#16A34A'],
    ['🍛', 'Food & Restaurants', 'Coastal, seafood and traditional Karnataka food.', 'food.html', '#EA7A12,#14532D'],
    ['🚕', 'Cab & Bike Rentals', 'Local drivers, autos and rental bikes.', 'cab.html', '#14532D,#7C3AED'],
    ['🧑‍🏫', 'Tourist Guides', 'Trekking, wildlife, temple and history guides.', 'guide.html', '#064E3B,#0284C7'],
    ['⭐', 'Popular Attractions', 'See every attraction on one interactive map.', 'Exploreuk.html#map-section', '#DC2626,#14532D'],
    ['🎒', 'My Trips', 'Open your saved trips and rental requests.', 'profile.html#trips', '#0284C7,#14532D']
  ];
  $('#featureGrid').innerHTML = C.map(([i, t, d, u, g]) => `<article class="card feature"><div class="feature-img" style="background:linear-gradient(135deg,${g.split(',')[0]},${g.split(',')[1]})"><span>${i}</span></div><div class="card-body"><h3>${t}</h3><p>${d}</p><a class="btn btn-small" href="${u}">Explore</a></div></article>`).join('');
})();
