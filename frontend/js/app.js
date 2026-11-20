// Shared helpers used by every page
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The API lives at backend/index.php/api/... next to the frontend folder, wherever the project is hosted.
const API_BASE = new URL('../backend/index.php', location.href).pathname;

async function api(url, opt = {}) {
  const o = { credentials: 'same-origin', headers: {}, ...opt };
  if (o.body && typeof o.body !== 'string') { o.body = JSON.stringify(o.body); o.headers['Content-Type'] = 'application/json'; }
  let r;
  try { r = await fetch(API_BASE + url, o); } catch { throw new Error('Cannot reach the server. Is Apache/PHP running?'); }
  let d = null; try { d = await r.json(); } catch {}
  if (!r.ok) { const e = new Error((d && d.error) || (r.status === 404 ? 'API not found. Open the site through a PHP server (see README).' : 'Something went wrong.')); e.status = r.status; throw e; }
  return d;
}

// Marker groups (colours from the project brief)
const GROUPS = [
  ['Beaches', '#0284C7', ['Beaches']], ['Waterfalls', '#16A34A', ['Waterfalls']], ['Temples', '#EA7A12', ['Temples']],
  ['Forests and Wildlife', '#064E3B', ['Forests and Wildlife']], ['Historical Places', '#DC2626', ['Historical Places']],
  ['Adventure Activities', '#7C3AED', ['Trekking and Adventure', 'Rivers and Islands', 'Hill Stations and Viewpoints']]
];
const CATEGORIES = ['Beaches', 'Waterfalls', 'Temples', 'Forests and Wildlife', 'Trekking and Adventure', 'Historical Places', 'Rivers and Islands', 'Hill Stations and Viewpoints'];
const groupOf = c => (GROUPS.find(g => g[2].includes(c)) || GROUPS[5])[0];
const colorOf = c => (GROUPS.find(g => g[2].includes(c)) || GROUPS[5])[1];
const hasCoords = d => Number.isFinite(d.latitude) && Number.isFinite(d.longitude);

const inr = n => n == null ? 'Not listed' : '₹' + Number(n).toLocaleString('en-IN');
const osmSearch = q => 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(q);
const osmDir = (lat, lng) => 'https://www.openstreetmap.org/directions?route=' + encodeURIComponent(';' + lat + ',' + lng);
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
function imgBox(src, label, color) {
  return `<div class="photo" style="--c:${color || '#14532D'}"><span>${esc((label || '?').slice(0, 2))}</span>${src ? `<img src="${esc(src)}" alt="${esc(label)}" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}
function msg(el, text, ok) { el.textContent = text || ''; el.className = 'msg ' + (ok ? 'ok' : 'err'); el.hidden = !text; }

const LOGO = '<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#14532D"/><path d="M5 27c5-5 8 3 15-2s10 2 15-3v11H5z" fill="#0284C7"/><path d="M12 24l6-12 4 7 3-5 5 10z" fill="#DCFCE7"/></svg>';
const NAV = [['afterlogin.html', 'Dashboard'], ['Exploreuk.html', 'Explore'], ['tripplanner.html', 'Trip Planner'], ['stays.html', 'Stays'], ['food.html', 'Food'], ['cab.html', 'Cab & Bikes'], ['guide.html', 'Guides']];

// Builds the header/footer and returns the logged-in user (or null)
async function initNav(active) {
  let user = null;
  try { user = await api('/api/auth/profile'); } catch {}
  const h = $('#site-header');
  if (h) {
    const right = user
      ? `<a href="${user.role === 'admin' ? 'admin.html' : 'profile.html'}" class="profile-link" title="My profile">👤 ${esc(user.name.split(' ')[0])}</a><button class="btn btn-small btn-ghost" id="logoutBtn">Logout</button>`
      : '<a href="login.html" class="btn btn-small">Login</a>';
    h.innerHTML = `<div class="container nav-wrap"><a class="brand" href="${user ? 'afterlogin.html' : 'home.html'}">${LOGO}<span>Karavali Trails</span></a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu"><span></span></button>
      <nav id="nav-menu" class="nav-menu">${NAV.map(([u, t]) => `<a href="${u}"${u === active ? ' class="active"' : ''}>${t}</a>`).join('')}${right}</nav></div>`;
    const t = $('.nav-toggle', h), m = $('#nav-menu', h);
    t.onclick = () => { const o = m.classList.toggle('open'); t.setAttribute('aria-expanded', o); };
    const lo = $('#logoutBtn');
    if (lo) lo.onclick = async () => { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} location.href = 'login.html'; };
  }
  const f = $('#site-footer');
  if (f) f.innerHTML = '<div class="container foot"><p><strong>Karavali Trails</strong> – Discover Nature. Explore Culture. Travel Responsibly.</p><p>Map data © OpenStreetMap contributors. Listings marked DEMO DATA are samples, not real businesses.</p></div>';
  return user;
}
async function requireLogin(active) {
  const u = await initNav(active);
  if (!u || u.role !== 'user') { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return null; }
  return u;
}
