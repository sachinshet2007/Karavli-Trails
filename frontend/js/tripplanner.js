(async () => {
  const user = await requireLogin('tripplanner.html'); if (!user) return;
  const form = $('#planForm'), out = $('#msg'), box = $('#result');
  let plan = null, map = null, layer = null, saved = false;

  async function run(variation) {
    const interests = $$('input[name=interests]:checked').map(i => i.value);
    const body = { days: +form.days.value, interests, budget: form.budget.value, startingLocation: form.startingLocation.value.trim(), travellers: +form.travellers.value, variation };
    if (!body.days) return msg(out, 'Choose the number of days.');
    if (!interests.length) return msg(out, 'Select at least one interest.');
    if (!body.budget) return msg(out, 'Choose a budget.');
    if (!(body.travellers >= 1)) return msg(out, 'Enter the number of travellers.');
    msg(out, ''); const b = $('#planBtn'); b.disabled = true; b.textContent = 'Planning…';
    try { plan = await api('/api/trips/plan', { method: 'POST', body }); saved = false; show(); box.scrollIntoView({ behavior: 'smooth' }); }
    catch (e) { msg(out, e.message); }
    b.disabled = false; b.textContent = 'Plan My Trip';
  }

  function show() {
    const p = plan, x = p.expenses;
    box.hidden = false;
    $('#rTitle').textContent = p.title;
    $('#rMeta').innerHTML = `<span class="chip">${p.days} day(s)</span><span class="chip">${p.travellers} traveller(s)</span><span class="chip">≈ ${p.totalKm} km incl. return</span><span class="chip">${p.interests.map(esc).join(', ')}</span>`;
    $('#rWarn').innerHTML = p.warnings.map(w => `<p class="msg err">${esc(w)}</p>`).join('');
    $('#rDays').innerHTML = p.itinerary.map(d => `<section class="card it-day"><h3>Day ${d.day} <small class="muted">≈ ${d.dayKm} km</small></h3><ol>${d.stops.map(s => `<li><strong>${esc(s.slot)}:</strong> ${esc(s.name)} <span class="chip" style="--c:${colorOf(s.category)}">${esc(s.category)}</span><br><small class="muted">${s.distanceKm} km from previous stop · est. ${inr(s.estimatedCost)} per person${s.coordsApprox ? ' · approx. location' : ''}</small></li>`).join('')}</ol></section>`).join('');
    $('#rCost').innerHTML = `<table class="table"><tr><td>Transport (cab)</td><td>${inr(x.transport)}</td></tr><tr><td>Accommodation</td><td>${inr(x.accommodation)}</td></tr><tr><td>Food</td><td>${inr(x.food)}</td></tr><tr><td>Activities and entry</td><td>${inr(x.activities)}</td></tr><tr class="tot"><td>Total approximate budget</td><td>${inr(x.total)}</td></tr><tr><td>Per person</td><td>${inr(x.perPerson)}</td></tr></table>
      <p class="msg ${p.withinBudget ? 'ok' : 'err'}">${p.budgetLimit ? (p.withinBudget ? 'Within your budget of ' : 'Above your budget of ') + inr(p.budgetLimit) + ' for the group.' : 'No upper budget limit selected.'}</p>
      <p class="muted small">${esc(p.assumptions.note)} Assumed: cab ${inr(p.assumptions.cabPerKm)}/km, room ${inr(p.assumptions.roomPerNight)}/night (2 per room), food ${inr(p.assumptions.foodPerPersonPerDay)} per person per day.</p>`;
    $('#saveBtn').disabled = false; $('#saveBtn').textContent = 'Save Trip';
    if (!map) { map = KMap.create('pmap'); layer = L.layerGroup().addTo(map); }
    setTimeout(() => { map.invalidateSize(); drawRoute(); }, 200);
  }
  function drawRoute() {
    layer.clearLayers();
    const pts = [[plan.start.lat, plan.start.lng]];
    L.marker(pts[0], { icon: KMap.icon('#14532D', 'S'), title: 'Start' }).bindPopup('Start: ' + esc(plan.start.name)).addTo(layer);
    let n = 0;
    plan.itinerary.forEach(d => d.stops.forEach(s => {
      n++; pts.push([s.latitude, s.longitude]);
      L.marker([s.latitude, s.longitude], { icon: KMap.icon(colorOf(s.category), n) }).bindPopup(`<strong>${n}. ${esc(s.name)}</strong><br>Day ${d.day}, ${esc(s.slot)}<br><a target="_blank" rel="noopener" href="${osmDir(s.latitude, s.longitude)}">View Directions</a>`).addTo(layer);
    }));
    pts.push(pts[0]);
    L.polyline(pts, { color: '#14532D', weight: 4, dashArray: '8 6' }).addTo(layer);
    map.fitBounds(L.latLngBounds(pts).pad(0.15));
  }

  form.onsubmit = e => { e.preventDefault(); run(false); };
  $('#regenBtn').onclick = () => run(true);
  $('#routeBtn').onclick = () => $('#pmap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#pdfBtn').onclick = () => window.print();       // choose "Save as PDF" in the print dialog
  $('#saveBtn').onclick = async () => {
    if (!plan || saved) return;
    try {
      await api('/api/trips/save', { method: 'POST', body: { title: plan.title, numberOfDays: plan.days, interests: plan.interests, budget: plan.budget, startingLocation: plan.start.name, travellers: plan.travellers, itinerary: plan.itinerary, estimatedTotal: plan.expenses.total } });
      saved = true; $('#saveBtn').disabled = true; $('#saveBtn').textContent = 'Saved ✔'; msg($('#saveMsg'), 'Trip saved. Find it under My Trips in your profile.', true);
    } catch (e) { msg($('#saveMsg'), e.message); }
  };
})();
