// Stays, Food, Cab + Bikes, Guides pages (page chosen by <body data-page="...">)
const uniq = (a, k) => [...new Set(a.map(x => x[k]).filter(Boolean))].sort().map(v => [v, v]);
const inRange = (v, s) => { if (!s) return true; if (v == null) return false; const [a, b] = s.split('-').map(Number); return v >= a && v <= b; };
const demoTag = d => d.demo ? '<span class="badge demo">DEMO DATA</span>' : '';
const tel = (m, label) => m ? `<a class="btn btn-small" href="tel:${esc(m)}">${label}</a>` : `<button class="btn btn-small" disabled title="No phone number listed yet">${label}</button>`;
const phone = m => '📞 ' + (m ? esc(m) : 'Not provided');
const stars = r => '⭐ ' + (r != null ? r + '/5' : 'Not rated yet');

function bar(box, defs, onChange) {
  box.innerHTML = defs.map(f => `<label>${f.label}<select data-k="${f.k}"><option value="">Any</option>${f.opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></label>`).join('');
  box.onchange = onChange;
  return () => Object.fromEntries($$('select', box).map(s => [s.dataset.k, s.value]));
}
function draw(box, items, fn) { box.innerHTML = items.length ? items.map(fn).join('') : '<p class="muted">Nothing matches these filters.</p>'; }
async function load(path, box) {
  box.innerHTML = '<p class="loading">Loading…</p>';
  try { return await api(path); } catch (e) { box.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; return null; }
}
const RATE = [['3', '3 stars and above'], ['4', '4 stars and above']];

async function stays() {
  const list = $('#list'), data = await load('/api/stays', list); if (!data) return;
  const get = bar($('#filters'), [
    { k: 'location', label: 'Location', opts: uniq(data, 'location') },
    { k: 'price', label: 'Price per night', opts: [['0-2000', 'Under ₹2,000'], ['2001-4000', '₹2,000 – ₹4,000'], ['4001-999999', 'Above ₹4,000']] },
    { k: 'rating', label: 'Rating', opts: RATE }, { k: 'type', label: 'Type', opts: uniq(data, 'type') }], go);
  function go() {
    const f = get();
    draw(list, data.filter(d => (!f.location || d.location === f.location) && inRange(d.price, f.price) && (!f.rating || (d.rating != null && d.rating >= +f.rating)) && (!f.type || d.type === f.type)),
      d => `<article class="card svc">${imgBox(d.image, d.name, '#0284C7')}<div class="card-body">${demoTag(d)}<h3>${esc(d.name)}</h3><p class="muted small">${esc(d.address)}</p><p>${phone(d.mobile)}</p>
      <p>${stars(d.rating)} · ${esc(d.type || '')}</p><p class="price">${inr(d.price)} <small>per night${d.demo ? ' (sample)' : ''}</small></p>
      <p class="muted small">${esc(d.roomType || 'Room type not listed')} · ${esc((d.facilities || []).join(', ') || 'Facilities not listed')}</p>
      <div class="actions"><a class="btn btn-small btn-outline" target="_blank" rel="noopener" href="${osmSearch(d.name + ' ' + d.location)}">View Location</a>${tel(d.mobile, 'Contact Now')}</div></div></article>`);
  }
  go();
}

async function food() {
  const list = $('#list'), data = await load('/api/restaurants', list); if (!data) return;
  const get = bar($('#filters'), [
    { k: 'location', label: 'Location', opts: uniq(data, 'location') }, { k: 'foodCategory', label: 'Food category', opts: uniq(data, 'foodCategory') },
    { k: 'rating', label: 'Rating', opts: RATE }, { k: 'priceRange', label: 'Price range', opts: uniq(data, 'priceRange') }], go);
  function go() {
    const f = get();
    draw(list, data.filter(d => (!f.location || d.location === f.location) && (!f.foodCategory || d.foodCategory === f.foodCategory) && (!f.rating || (d.rating != null && d.rating >= +f.rating)) && (!f.priceRange || d.priceRange === f.priceRange)),
      d => `<article class="card svc">${imgBox(d.image, d.name, '#EA7A12')}<div class="card-body">${demoTag(d)}<h3>${esc(d.name)}</h3><p class="muted small">${esc(d.address)}</p><p>${phone(d.mobile)}</p>
      <p>${stars(d.rating)} · ${esc(d.foodCategory)}</p><p><strong>${esc(d.priceRange || 'Price not listed')}</strong></p>
      <p class="muted small">Popular dishes: ${esc((d.popularDishes || []).join(', ') || 'not listed')}</p>
      <div class="actions"><a class="btn btn-small btn-outline" target="_blank" rel="noopener" href="${osmSearch(d.name + ' ' + d.location)}">View Location</a>${tel(d.mobile, 'Contact Now')}</div></div></article>`);
  }
  go();
}

async function guides() {
  const list = $('#list'), data = await load('/api/guides', list); if (!data) return;
  const get = bar($('#filters'), [{ k: 'location', label: 'Location', opts: uniq(data, 'location') }, { k: 'category', label: 'Guide category', opts: uniq(data, 'category') },
    { k: 'verified', label: 'Verification', opts: [['yes', 'Verified only']] }], go);
  function go() {
    const f = get();
    draw(list, data.filter(d => (!f.location || d.location === f.location) && (!f.category || d.category === f.category) && (!f.verified || d.isVerified)),
      d => `<article class="card svc">${imgBox(d.photo, d.name, '#064E3B')}<div class="card-body">${demoTag(d)}<h3>${esc(d.name)}</h3>
      <p>${d.isVerified ? '<span class="badge ok">✔ Verified by admin</span>' : '<span class="badge">Not verified</span>'}</p>
      <p class="muted small">📍 ${esc(d.location)} · ${esc(d.category || 'Category not listed')}</p><p>${phone(d.mobile)}</p>
      <p class="small"><strong>Languages:</strong> ${esc((d.languages || []).join(', ') || 'not listed')}</p><p class="small"><strong>Expertise:</strong> ${esc((d.expertise || []).join(', ') || 'not listed')}</p>
      <p class="small"><strong>Experience:</strong> ${d.experience != null ? d.experience + ' years' : 'not listed'} · ${stars(d.rating)}</p><div class="actions">${tel(d.mobile, 'Contact Guide')}</div></div></article>`);
  }
  go();
}

async function cab() {
  // ----- Section A: drivers -----
  const dl = $('#driverList'), drivers = await load('/api/drivers', dl);
  if (drivers) {
    const get = bar($('#driverFilters'), [
      { k: 'location', label: 'Location', opts: uniq(drivers, 'location') }, { k: 'vehicleType', label: 'Vehicle type', opts: uniq(drivers, 'vehicleType') },
      { k: 'av', label: 'Availability', opts: [['yes', 'Available'], ['no', 'Not available']] },
      { k: 'fare', label: 'Fare per km', opts: [['0-14', 'Under ₹15'], ['15-25', '₹15 – ₹25'], ['26-999', 'Above ₹25']] }], go);
    function go() {
      const f = get();
      draw(dl, drivers.filter(d => (!f.location || d.location === f.location) && (!f.vehicleType || d.vehicleType === f.vehicleType) && (!f.av || d.availability === (f.av === 'yes')) && inRange(d.fare, f.fare)),
        d => `<article class="card svc"><div class="duo">${imgBox(d.photo, d.name, '#14532D')}${imgBox(d.vehiclePhoto, d.vehicleType, '#0284C7')}</div><div class="card-body">${demoTag(d)}<h3>${esc(d.name)}</h3><p>${phone(d.mobile)}</p>
        <p>🚗 ${esc(d.vehicleType)} · 📍 ${esc(d.location)}</p><p class="price">${d.fare != null ? inr(d.fare) + ' <small>per km' + (d.demo ? ' (sample)' : '') + '</small>' : 'Fare: ask the driver'}</p>
        <p><span class="badge ${d.availability ? 'ok' : ''}">${d.availability ? 'Available' : 'Not available'}</span></p><div class="actions">${tel(d.mobile, 'Contact Driver')}</div></div></article>`);
    }
    go();
  }
  // ----- Section B: bikes -----
  const bl = $('#bikeList'), bikes = await load('/api/bikes', bl); if (!bikes) return;
  const getB = bar($('#bikeFilters'), [
    { k: 'pickupLocation', label: 'Location', opts: uniq(bikes, 'pickupLocation') }, { k: 'category', label: 'Bike category', opts: uniq(bikes, 'category') },
    { k: 'price', label: 'Price per day', opts: [['0-600', 'Up to ₹600'], ['601-1000', '₹601 – ₹1,000'], ['1001-999999', 'Above ₹1,000']] },
    { k: 'av', label: 'Availability', opts: [['yes', 'Available'], ['no', 'Not available']] }], goB);
  function goB() {
    const f = getB();
    draw(bl, bikes.filter(b => (!f.pickupLocation || b.pickupLocation === f.pickupLocation) && (!f.category || b.category === f.category) && inRange(b.pricePerDay, f.price) && (!f.av || b.availability === (f.av === 'yes'))),
      b => `<article class="card svc">${imgBox(b.image, b.bikeName, '#7C3AED')}<div class="card-body">${demoTag(b)}<h3>${esc(b.bikeName)}</h3><p class="muted small">${esc(b.model || 'Model not listed')} · ${esc(b.category)}</p>
      <p class="price">${b.pricePerHour != null ? inr(b.pricePerHour) + '/hour' : 'Hourly price not listed'} · ${b.pricePerDay != null ? inr(b.pricePerDay) + '/day' : 'Daily price not listed'}${b.demo ? ' <small>(sample)</small>' : ''}</p>
      <p>📍 Pickup: ${esc(b.pickupLocation)}</p><p class="small">${esc(b.providerName || 'Provider not listed')} · ${phone(b.providerMobile)}</p>
      <p><span class="badge ${b.availability ? 'ok' : ''}">${b.availability ? 'Available' : 'Not available'}</span></p>
      <div class="actions">${tel(b.providerMobile, 'Contact Provider')}<button class="btn btn-small btn-ocean" data-rent="${b._id}" ${b.availability ? '' : 'disabled'}>Rent Now</button></div></div></article>`);
  }
  goB();

  // ----- rental request dialog -----
  const dlg = $('#rentDlg'), rf = $('#rentForm'), rm = $('#rentMsg'); let bike = null;
  const today = new Date().toISOString().slice(0, 10); rf.start.min = rf.end.min = today;
  const estimate = () => {
    const s = new Date(rf.start.value), e = new Date(rf.end.value);
    $('#rentEst').textContent = (!isNaN(s) && !isNaN(e) && e >= s && bike.pricePerDay != null) ? `Estimated total: ${inr((Math.round((e - s) / 864e5) + 1) * bike.pricePerDay)} (${Math.round((e - s) / 864e5) + 1} day(s))` : 'Choose your dates to see the estimated price.';
  };
  bl.onclick = async e => {
    const b = e.target.closest('[data-rent]'); if (!b) return;
    bike = bikes.find(x => x._id === b.dataset.rent); rf.reset(); msg(rm, '');
    $('#rentName').textContent = bike.bikeName + ' – ' + bike.pickupLocation;
    $('#rentCond').textContent = bike.rentalConditions || 'Not listed. Ask the provider for age, licence and deposit requirements.';
    estimate(); dlg.showModal();
  };
  rf.start.onchange = () => { rf.end.min = rf.start.value || today; estimate(); }; rf.end.onchange = estimate;
  $('#rentCancel').onclick = () => dlg.close();
  rf.onsubmit = async e => {
    e.preventDefault();
    if (!rf.start.value || !rf.end.value) return msg(rm, 'Choose start and end dates.');
    if (!rf.agree.checked) return msg(rm, 'Please confirm that you meet the licence and age requirements.');
    try {
      await api('/api/rental-requests', { method: 'POST', body: { bikeId: bike._id, rentalStartDate: rf.start.value, rentalEndDate: rf.end.value } });
      msg(rm, 'Request sent. It is not a confirmed booking until the provider accepts it. Track it in your profile.', true); $('#rentSubmit').disabled = true;
      setTimeout(() => { dlg.close(); $('#rentSubmit').disabled = false; }, 3500);
    } catch (err) {
      if (err.status === 401) location.href = 'login.html?next=cab.html'; else msg(rm, err.message);
    }
  };
}

(async () => {
  const p = document.body.dataset.page;
  await initNav({ stays: 'stays.html', food: 'food.html', cab: 'cab.html', guides: 'guide.html' }[p]);
  ({ stays, food, cab, guides }[p] || (() => {}))();
})();
