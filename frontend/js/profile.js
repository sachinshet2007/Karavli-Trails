(async () => {
  const user = await requireLogin('profile.html'); if (!user) return;
  const pf = $('#profileForm'), pw = $('#pwForm');
  pf.name.value = user.name; pf.mobile.value = user.mobile;
  pf.onsubmit = async e => {
    e.preventDefault();
    try { await api('/api/auth/profile', { method: 'PUT', body: { name: pf.name.value, mobile: pf.mobile.value } }); msg($('#pMsg'), 'Profile updated.', true); }
    catch (err) { msg($('#pMsg'), err.message); }
  };
  pw.onsubmit = async e => {
    e.preventDefault();
    if (pw.newPassword.value !== pw.confirm.value) return msg($('#wMsg'), 'New passwords do not match.');
    try { await api('/api/auth/password', { method: 'PUT', body: { current: pw.current.value, newPassword: pw.newPassword.value } }); pw.reset(); msg($('#wMsg'), 'Password changed.', true); }
    catch (err) { msg($('#wMsg'), err.message); }
  };
  async function trips() {
    const box = $('#trips');
    try {
      const t = await api('/api/trips/my-trips');
      box.innerHTML = t.length ? t.map(x => `<article class="card trip"><div class="card-body"><h3>${esc(x.title)}</h3><p class="muted small">Saved ${fmtDate(x.createdAt)} · ${x.numberOfDays} day(s) · ${x.travellers} traveller(s) · about ${inr(x.estimatedTotal)}</p>
        <ul class="small">${x.itinerary.map(d => `<li><strong>Day ${d.day}:</strong> ${d.stops.map(s => esc(s.name)).join(', ')}</li>`).join('')}</ul><button class="btn btn-small btn-danger" data-del="${x._id}">Delete trip</button></div></article>`).join('') : '<p class="muted">No saved trips yet. <a href="tripplanner.html">Plan one</a>.</p>';
    } catch (e) { box.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; }
  }
  $('#trips').onclick = async e => {
    const b = e.target.closest('[data-del]'); if (!b || !confirm('Delete this saved trip?')) return;
    try { await api('/api/trips/' + b.dataset.del, { method: 'DELETE' }); trips(); } catch (err) { alert(err.message); }
  };
  async function requests() {
    const box = $('#requests');
    try {
      const r = await api('/api/rental-requests/my-requests');
      box.innerHTML = r.length ? `<div class="scroll"><table class="table"><tr><th>Bike</th><th>Pickup</th><th>Dates</th><th>Estimate</th><th>Status</th></tr>${r.map(x => `<tr><td>${esc(x.bike || 'Removed bike')}<br><small class="muted">${esc(x.provider || '')}</small></td><td>${esc(x.pickup || '')}</td><td>${fmtDate(x.rentalStartDate)} – ${fmtDate(x.rentalEndDate)}</td><td>${inr(x.totalEstimatedPrice)}</td><td><span class="badge ${x.requestStatus === 'Accepted' ? 'ok' : ''}">${esc(x.requestStatus)}</span></td></tr>`).join('')}</table></div><p class="muted small">A request is not a confirmed booking until the provider accepts it.</p>` : '<p class="muted">No rental requests yet.</p>';
    } catch (e) { box.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; }
  }
  trips(); requests();
})();
if (location.hash === "#trips") setTimeout(() => $("#trips-section").scrollIntoView(), 600);
