// ─────────────────────────────────────────────
//  DIATOM RESEARCH SITE — main.js
// ─────────────────────────────────────────────

let observations = [], species = [], publications = [], config = {};
let map, markers = [];

async function loadData() {
  const [obs, sp, pubs, cfg] = await Promise.all([
    fetch('data/observations.json').then(r => r.json()),
    fetch('data/species.json').then(r => r.json()),
    fetch('data/publications.json').then(r => r.json()),
    fetch('data/config.json').then(r => r.json()),
  ]);
  observations = obs.filter(o => o.published);
  species = sp;
  publications = pubs;
  config = cfg;
}

// ─── STATS ───────────────────────────────────
function updateStats() {
  const totalSpecies = new Set(observations.flatMap(o => o.species.map(s => s.name))).size;
  document.getElementById('stat-obs').textContent = observations.length;
  document.getElementById('stat-species').textContent = totalSpecies;
  document.getElementById('stat-pubs').textContent = publications.length;
}

// ─── MAP ─────────────────────────────────────
function initMap() {
  map = L.map('map', {
    center: [47.2, 18.5],
    zoom: 7,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    maxZoom: 19,
  }).addTo(map);

  const customIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;
      background:#4ecdc4;
      border:2px solid #0d1117;
      border-radius:50%;
      box-shadow:0 0 10px rgba(78,205,196,0.6);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  observations.forEach(obs => {
    const { lat, lng, name, habitat } = obs.location;
    const speciesNames = obs.species.slice(0, 2).map(s => s.name).join(', ');
    const m = L.marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div class="popup-inner">
          <div class="popup-date">${formatDate(obs.date)}</div>
          <div class="popup-title">${name}</div>
          <div class="popup-species">${speciesNames}${obs.species.length > 2 ? ` +${obs.species.length - 2} more` : ''}</div>
          <a class="popup-link" href="#observations" onclick="openObsModal('${obs.id}')">View details →</a>
        </div>
      `, { className: 'map-popup' });
    markers.push(m);
  });
}

// ─── OBSERVATIONS ────────────────────────────
function renderObservations() {
  const grid = document.getElementById('obs-grid');
  grid.innerHTML = '';
  document.getElementById('obs-count').textContent = `${observations.length} entries`;

  observations.forEach(obs => {
    const card = document.createElement('div');
    card.className = 'obs-card';
    card.onclick = () => openObsModal(obs.id);

    const imgHtml = obs.images && obs.images.length
      ? `<img class="obs-card-img" src="${obs.images[0]}" alt="${obs.location.name}" loading="lazy">`
      : `<div class="obs-card-img">🔬</div>`;

    const speciesTags = obs.species.slice(0, 3)
      .map(s => `<span class="species-tag">${s.name}</span>`).join('');

    const params = obs.waterParams || {};
    const paramsHtml = Object.keys(params).length ? `
      <div class="obs-card-params">
        ${params.pH !== undefined ? `<div class="param"><span class="param-val">${params.pH}</span><span class="param-key">pH</span></div>` : ''}
        ${params.conductivity !== undefined ? `<div class="param"><span class="param-val">${params.conductivity}</span><span class="param-key">µS/cm</span></div>` : ''}
        ${params.temperature !== undefined ? `<div class="param"><span class="param-val">${params.temperature}°</span><span class="param-key">Temp °C</span></div>` : ''}
      </div>` : '';

    card.innerHTML = `
      ${imgHtml}
      <div class="obs-card-body">
        <div class="obs-card-date">${formatDate(obs.date)}</div>
        <div class="obs-card-location">${obs.location.name}</div>
        <div class="obs-card-habitat">${obs.location.habitat}</div>
        <div class="obs-card-species">${speciesTags}${obs.species.length > 3 ? `<span class="species-tag">+${obs.species.length - 3}</span>` : ''}</div>
        ${paramsHtml}
      </div>
    `;
    grid.appendChild(card);
  });
}

function openObsModal(id) {
  const obs = observations.find(o => o.id === id);
  if (!obs) return;

  const params = obs.waterParams || {};

  const speciesRows = obs.species.map(s => `
    <tr>
      <td>${s.name}</td>
      <td class="abundance-${s.count}">${s.count}</td>
      <td>${s.notes || '—'}</td>
    </tr>
  `).join('');

  const paramGrid = `
    <div class="param-grid">
      ${params.pH !== undefined ? `<div class="param-box"><span class="val">${params.pH}</span><div class="key">pH</div></div>` : ''}
      ${params.conductivity !== undefined ? `<div class="param-box"><span class="val">${params.conductivity}</span><div class="key">Conductivity (µS/cm)</div></div>` : ''}
      ${params.temperature !== undefined ? `<div class="param-box"><span class="val">${params.temperature}°C</span><div class="key">Temperature</div></div>` : ''}
    </div>
  `;

  const imagesHtml = obs.images && obs.images.length
    ? obs.images.map(img => `<img src="${img}" style="width:100%;border-radius:4px;margin-bottom:8px" loading="lazy">`).join('')
    : '';

  showModal(`
    <div class="modal-header">
      <div>
        <div class="pub-type">${formatDate(obs.date)} · ${obs.location.habitat}</div>
        <div class="section-title" style="font-size:24px">${obs.location.name}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      ${imagesHtml}
      ${Object.keys(params).length ? `<div class="modal-section"><div class="modal-section-title">Water Parameters</div>${paramGrid}</div>` : ''}
      <div class="modal-section">
        <div class="modal-section-title">Species Observed</div>
        <table class="species-table">
          <thead><tr><th>Species</th><th>Abundance</th><th>Notes</th></tr></thead>
          <tbody>${speciesRows}</tbody>
        </table>
      </div>
      ${obs.notes ? `<div class="modal-section"><div class="modal-section-title">Field Notes</div><p style="color:var(--text2);font-size:14px;line-height:1.65">${obs.notes}</p></div>` : ''}
    </div>
  `);
}

// ─── SPECIES ATLAS ───────────────────────────
let filteredSpecies = [];

function renderSpecies(list) {
  const grid = document.getElementById('species-grid');
  grid.innerHTML = '';
  document.getElementById('sp-count').textContent = `${list.length} species`;

  list.forEach(sp => {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.onclick = () => openSpeciesModal(sp.id);

    const imgHtml = sp.thumbnail
      ? `<img class="species-img" src="${sp.thumbnail}" alt="${sp.name}" loading="lazy">`
      : `<div class="species-img">🦠</div>`;

    card.innerHTML = `
      ${imgHtml}
      <div class="species-body">
        <div class="species-name">${sp.name}</div>
        <div class="species-author">${sp.author}</div>
        <div class="species-meta">
          <div class="species-meta-row"><span class="meta-key">pH</span><span class="meta-val">${sp.ecology.pH}</span></div>
          <div class="species-meta-row"><span class="meta-key">Saprobity</span><span class="meta-val">${sp.ecology.saprobity}</span></div>
          <div class="species-meta-row"><span class="meta-key">Trophic</span><span class="meta-val">${sp.ecology.trophicState}</span></div>
        </div>
        ${sp.wfrf !== undefined ? `<div class="wfrf-badge">WFRF: ${sp.wfrf}</div>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function openSpeciesModal(id) {
  const sp = species.find(s => s.id === id);
  if (!sp) return;

  const obsLinks = (sp.observedLocations || []).map(obsId => {
    const obs = observations.find(o => o.id === obsId);
    return obs ? `<a class="popup-link" href="#" onclick="closeModal();openObsModal('${obsId}')">${obs.location.name} (${obs.date})</a>` : '';
  }).join('<br>');

  showModal(`
    <div class="modal-header">
      <div>
        <div class="pub-type">${sp.family}</div>
        <div class="section-title" style="font-size:22px;font-style:italic">${sp.name}</div>
        <div style="color:var(--text3);font-size:12px;margin-top:4px">${sp.author}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      ${sp.thumbnail ? `<img src="${sp.thumbnail}" style="width:100%;max-height:240px;object-fit:cover;border-radius:4px;margin-bottom:24px" loading="lazy">` : ''}
      <div class="modal-section">
        <div class="modal-section-title">Ecology</div>
        <div class="param-grid">
          <div class="param-box"><span class="val" style="font-size:16px">${sp.ecology.pH}</span><div class="key">pH Preference</div></div>
          <div class="param-box"><span class="val" style="font-size:16px">${sp.ecology.saprobity}</span><div class="key">Saprobity</div></div>
          <div class="param-box"><span class="val" style="font-size:16px">${sp.ecology.trophicState}</span><div class="key">Trophic State</div></div>
        </div>
        ${sp.wfrf !== undefined ? `<div style="margin-top:12px"><span class="wfrf-badge" style="font-size:14px;padding:6px 14px">WFRF Index: ${sp.wfrf}</span></div>` : ''}
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Description</div>
        <p style="color:var(--text2);font-size:14px;line-height:1.65">${sp.description}</p>
      </div>
      ${obsLinks ? `<div class="modal-section"><div class="modal-section-title">Observed At</div>${obsLinks}</div>` : ''}
    </div>
  `);
}

function filterSpecies() {
  const query = document.getElementById('sp-search').value.toLowerCase();
  const trophic = document.getElementById('sp-filter').value;
  filteredSpecies = species.filter(sp => {
    const matchName = sp.name.toLowerCase().includes(query) || sp.family.toLowerCase().includes(query);
    const matchTrophic = !trophic || sp.ecology.trophicState === trophic;
    return matchName && matchTrophic;
  });
  renderSpecies(filteredSpecies);
}

// ─── PUBLICATIONS ────────────────────────────
function renderPublications() {
  const list = document.getElementById('pub-list');
  list.innerHTML = '';
  document.getElementById('pub-count').textContent = `${publications.length} items`;

  publications.forEach(pub => {
    const el = document.createElement('div');
    el.className = 'pub-card';

    const tagsHtml = (pub.tags || []).map(t => `<span class="pub-tag">${t}</span>`).join('');
    const doiHtml = pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" class="popup-link" style="margin-right:12px">DOI →</a>` : '';

    el.innerHTML = `
      <div class="pub-type">${pub.type} · ${pub.year}</div>
      <div class="pub-title">${pub.title}</div>
      <div class="pub-authors">${pub.authors}</div>
      <div class="pub-journal">${pub.journal}</div>
      <div class="pub-abstract">${pub.abstract}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${doiHtml}
        <div class="pub-tags">${tagsHtml}</div>
      </div>
    `;
    list.appendChild(el);
  });
}

// ─── MODAL ───────────────────────────────────
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── UTILS ───────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── NAVIGATION HIGHLIGHTING ─────────────────
function updateNav() {
  const sections = ['observations', 'atlas', 'publications'];
  const links = document.querySelectorAll('.nav-links a[data-section]');
  let active = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top < window.innerHeight / 2) active = id;
  });
  links.forEach(l => {
    l.classList.toggle('active', l.dataset.section === active);
  });
}

// ─── INIT ────────────────────────────────────
async function init() {
  await loadData();
  updateStats();
  initMap();
  renderObservations();
  filteredSpecies = [...species];
  renderSpecies(filteredSpecies);
  renderPublications();

  document.getElementById('sp-search').addEventListener('input', filterSpecies);
  document.getElementById('sp-filter').addEventListener('change', filterSpecies);

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  window.addEventListener('scroll', updateNav, { passive: true });
}

document.addEventListener('DOMContentLoaded', init);
