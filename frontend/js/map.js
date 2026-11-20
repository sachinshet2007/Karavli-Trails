// Leaflet + OpenStreetMap helpers (free, no API key)
const KMap = {
  bounds: [[13.9, 74.0], [15.5, 75.2]],           // roughly Uttara Kannada district
  create(id) {
    const m = L.map(id).setView([14.6, 74.7], 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(m);
    setTimeout(() => m.invalidateSize(), 300);
    return m;
  },
  icon: (color, text) => L.divIcon({ className: '', html: `<span class="pin" style="background:${color}">${text || ''}</span>`, iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12] }),
  popup: d => `<div class="pop">${d.image ? `<img src="${esc(d.image)}" alt="" onerror="this.remove()">` : ''}<h4>${esc(d.name)}</h4>
    <p class="muted small">${esc(d.category)} · ${esc(d.address || '')}</p><p>${esc(d.description || '')}</p>
    ${d.coordsApprox ? '<p class="muted small">Approximate location</p>' : ''}
    <a class="btn btn-small" target="_blank" rel="noopener" href="${osmDir(d.latitude, d.longitude)}">View Directions</a></div>`
};
