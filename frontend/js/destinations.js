// Explore page: destination cards + ONE interactive map
(async () => {
  await initNav('Exploreuk.html');
  const grid = $('#cards'); let all = [], cat = 'All';
  grid.innerHTML = '<p class="loading">Loading destinations…</p>';
  try { all = await api('/api/destinations'); } catch (e) { grid.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; return; }

  $('#tabs').innerHTML = ['All', ...CATEGORIES].map(c => `<button class="tab${c === 'All' ? ' on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  const card = d => `<article class="card dest-card">${imgBox(d.image, d.name, colorOf(d.category))}<div class="card-body">
    <span class="chip" style="--c:${colorOf(d.category)}">${esc(d.category)}</span><h3>${esc(d.name)}</h3>
    <p class="muted small">📍 ${esc(d.address)}</p><p>${esc(d.description)}</p>
    <p class="small"><strong>History:</strong> ${esc(d.history)}</p><p class="small"><strong>Best time:</strong> ${esc(d.bestTimeToVisit)}</p>
    <p class="small"><strong>Coordinates:</strong> ${hasCoords(d) ? d.latitude.toFixed(4) + ', ' + d.longitude.toFixed(4) + (d.coordsApprox ? ' (approx.)' : '') : 'Pending verification'}</p>
    <button class="btn btn-small" data-map="${d._id}" ${hasCoords(d) ? '' : 'disabled title="Location not verified yet"'}>View on Map</button></div></article>`;
  function drawCards() {
    const q = $('#q').value.toLowerCase().trim();
    const list = all.filter(d => (cat === 'All' || d.category === cat) && d.name.toLowerCase().includes(q));
    grid.innerHTML = list.length ? list.map(card).join('') : '<p class="muted">No destinations here yet. An administrator can add some from the Admin dashboard.</p>';
  }
  $('#tabs').onclick = e => { const b = e.target.closest('.tab'); if (!b) return; cat = b.dataset.c; $$('.tab').forEach(t => t.classList.toggle('on', t === b)); drawCards(); };
  $('#q').oninput = drawCards; drawCards();

  // ---- the map ----
  const map = KMap.create('map'); map.fitBounds(KMap.bounds);
  const layer = L.layerGroup().addTo(map), markers = [];
  all.filter(hasCoords).forEach(d => { const m = L.marker([d.latitude, d.longitude], { icon: KMap.icon(colorOf(d.category)), title: d.name }).bindPopup(KMap.popup(d)); m._d = d; markers.push(m); });
  $('#legend').innerHTML = GROUPS.map(g => `<label class="lg"><input type="checkbox" value="${esc(g[0])}" checked><span class="dot" style="background:${g[1]}"></span>${esc(g[0])}</label>`).join('');
  function drawMap() {
    const on = new Set($$('#legend input:checked').map(i => i.value)), q = $('#mapq').value.toLowerCase().trim();
    layer.clearLayers();
    const shown = markers.filter(m => on.has(groupOf(m._d.category)) && m._d.name.toLowerCase().includes(q));
    shown.forEach(m => layer.addLayer(m));
    $('#mapcount').textContent = `${shown.length} of ${markers.length} places shown` + (all.length > markers.length ? ` (${all.length - markers.length} more need verified coordinates)` : '');
    if (q && shown.length === 1) { map.flyTo(shown[0].getLatLng(), 12); shown[0].openPopup(); }
    return shown;
  }
  $('#legend').onchange = drawMap; $('#mapq').oninput = drawMap;
  function reset() { $$('#legend input').forEach(i => i.checked = true); $('#mapq').value = ''; drawMap(); map.closePopup(); map.fitBounds(KMap.bounds); }
  $('#resetMap').onclick = reset; drawMap();
  grid.onclick = e => {
    const b = e.target.closest('[data-map]'); if (!b) return;
    const m = markers.find(x => x._d._id === b.dataset.map); if (!m) return;
    reset(); $('#map-section').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { map.flyTo(m.getLatLng(), 13); m.openPopup(); }, 400);
  };
})();
