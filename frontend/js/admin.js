(async () => {
  const user = await initNav('admin.html');
  const wrap = $('#adminApp'), login = $('#adminLogin');
  if (!user || user.role !== 'admin') {
    login.hidden = false;
    $('#adminForm').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      try { await api('/api/admin/login', { method: 'POST', body: { username: f.username.value, password: f.password.value } }); location.reload(); }
      catch (err) { msg($('#aMsg'), err.message); }
    };
    return;
  }
  wrap.hidden = false;
  const S = (await api('/api/admin/schema')).S;
  const TABS = [['destinations', 'Destinations'], ['stays', 'Hotels & Resorts'], ['restaurants', 'Restaurants'], ['drivers', 'Cab Drivers'], ['bikes', 'Bike Rentals'], ['guides', 'Guides'], ['rentalRequests', 'Rental Requests'], ['users', 'Users'], ['trips', 'User Trips']];
  const COLS = { users: ['name', 'mobile', 'role', 'createdAt'], trips: ['title', 'user', 'numberOfDays', 'travellers', 'estimatedTotal', 'createdAt'], rentalRequests: ['user', 'userMobile', 'bike', 'provider', 'rentalStartDate', 'rentalEndDate', 'totalEstimatedPrice', 'requestStatus'] };
  const LONG = ['description', 'history', 'rentalConditions'];
  let cur = 'destinations', rows = [];
  $('#aTabs').innerHTML = TABS.map(([k, t]) => `<button class="tab${k === cur ? ' on' : ''}" data-k="${k}">${t}</button>`).join('');
  $('#aTabs').onclick = e => { const b = e.target.closest('.tab'); if (!b) return; cur = b.dataset.k; $$('#aTabs .tab').forEach(t => t.classList.toggle('on', t === b)); show(); };

  const cell = v => Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? '✔' : '—') : /^\d{4}-\d\d-\d\dT/.test(v) ? fmtDate(v) : String(v ?? '');
  async function show() {
    const box = $('#aTable'); box.innerHTML = '<p class="loading">Loading…</p>'; msg($('#aInfo'), '');
    try { rows = await api('/api/admin/' + cur); } catch (e) { box.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; return; }
    const crud = !!S[cur], cols = COLS[cur] || Object.keys(S[cur]).filter(k => !/image|photo|description|history|rentalConditions/.test(k)).slice(0, 6);
    $('#addBtn').hidden = !crud;
    box.innerHTML = rows.length ? `<div class="scroll"><table class="table"><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}<th></th></tr>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(cell(r[c]).slice(0, 60))}</td>`).join('')}<td class="nowrap">
      ${crud ? `<button class="btn btn-small btn-outline" data-edit="${r._id}">Edit</button> ` : ''}
      ${cur === 'rentalRequests' ? `<select data-status="${r._id}">${['Pending', 'Accepted', 'Rejected'].map(s => `<option${s === r.requestStatus ? ' selected' : ''}>${s}</option>`).join('')}</select> ` : ''}
      ${cur !== 'rentalRequests' ? `<button class="btn btn-small btn-danger" data-del="${r._id}">Delete</button>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="muted">Nothing here yet.</p>';
  }
  $('#aTable').onclick = async e => {
    const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) return openForm(rows.find(r => r._id === ed.dataset.edit));
    if (dl && confirm('Delete this item? This cannot be undone.')) { try { await api(`/api/admin/${cur}/${dl.dataset.del}`, { method: 'DELETE' }); show(); } catch (err) { msg($('#aInfo'), err.message); } }
  };
  $('#aTable').onchange = async e => {
    const s = e.target.closest('[data-status]'); if (!s) return;
    try { await api('/api/admin/rentalRequests/' + s.dataset.status, { method: 'PUT', body: { requestStatus: s.value } }); msg($('#aInfo'), 'Status updated.', true); } catch (err) { msg($('#aInfo'), err.message); }
  };
  $('#addBtn').onclick = () => openForm(null);

  const dlg = $('#aDlg'), form = $('#aForm'); let editing = null;
  function openForm(row) {
    editing = row; $('#aDlgTitle').textContent = (row ? 'Edit ' : 'Add to ') + TABS.find(t => t[0] === cur)[1];
    $('#aFields').innerHTML = Object.entries(S[cur]).map(([k, t]) => {
      const ty = t[0], req = t.endsWith('!'), v = row ? row[k] : (ty === 'b' ? (k === 'availability') : '');
      if (ty === 'b') return `<label class="check"><input type="checkbox" name="${k}" ${v ? 'checked' : ''}> ${k === 'isVerified' ? 'Verified (an administrator has checked this guide)' : k === 'demo' ? 'Demo data (shows a DEMO badge)' : k}</label>`;
      const val = esc(Array.isArray(v) ? v.join(', ') : v ?? '');
      return `<label class="field">${k}${req ? ' *' : ''}${ty === 'a' ? ' (comma separated)' : ''}${LONG.includes(k) ? `<textarea name="${k}" rows="3">${val}</textarea>` : `<input name="${k}" ${ty === 'n' ? 'type="number" step="any"' : ''} value="${val}" ${req ? 'required' : ''}>`}</label>`;
    }).join('') + (cur === 'destinations' ? '<p class="muted small">Latitude/longitude: copy them from openstreetmap.org (right-click the place, "Show address"). Photos: use a path like assets/images/name.jpg or an image URL.</p>' : '');
    msg($('#aFormMsg'), ''); dlg.showModal();
  }
  $('#aCancel').onclick = () => dlg.close();
  form.onsubmit = async e => {
    e.preventDefault(); const body = {};
    Object.entries(S[cur]).forEach(([k, t]) => { const el = form.elements[k]; body[k] = t[0] === 'b' ? el.checked : el.value; });
    try {
      await api(editing ? `/api/admin/${cur}/${editing._id}` : '/api/admin/' + cur, { method: editing ? 'PUT' : 'POST', body });
      dlg.close(); show();
    } catch (err) { msg($('#aFormMsg'), err.message); }
  };
  show();
})();
