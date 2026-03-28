// ─────────────────────────────────────────────
//  ADMIN PANEL — admin.js
//  Password is stored as SHA-256 hash only.
//  To change password: run sha256('yourpassword')
//  and update PASSWORD_HASH below.
// ─────────────────────────────────────────────

// Default password: "diatom2024"
// To change: generate SHA-256 of your password at https://emn178.github.io/online-tools/sha256.html
// and replace the string below.
const PASSWORD_HASH = '7e77df8c2f88e55035e344cf4b9c953a6d2d8bd8c11fa43af218c01bb7729b4a';
// ↑ THIS IS A PLACEHOLDER — replace with your real SHA-256 hash!

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
  const input = document.getElementById('password-input').value;
  const hash = await sha256(input);

  if (hash === PASSWORD_HASH) {
    sessionStorage.setItem('diatom_admin', 'true');
    showAdmin();
  } else {
    const el = document.getElementById('password-input');
    el.classList.add('error');
    document.getElementById('login-error').textContent = 'Incorrect password.';
    setTimeout(() => el.classList.remove('error'), 400);
  }
}

function showAdmin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display = 'block';
  loadExistingData();
}

function checkSession() {
  if (sessionStorage.getItem('diatom_admin') === 'true') showAdmin();
}

// ─── TABS ────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ─── LOAD EXISTING ───────────────────────────
let existingObs = [], existingSpecies = [], existingPubs = [];

async function loadExistingData() {
  try {
    const [obs, sp, pubs] = await Promise.all([
      fetch('../data/observations.json').then(r => r.json()),
      fetch('../data/species.json').then(r => r.json()),
      fetch('../data/publications.json').then(r => r.json()),
    ]);
    existingObs = obs;
    existingSpecies = sp;
    existingPubs = pubs;
    renderExistingObs();
    renderExistingSp();
  } catch (e) {
    console.warn('Could not load existing data:', e);
  }
}

function renderExistingObs() {
  const list = document.getElementById('existing-obs');
  list.innerHTML = existingObs.map(o => `
    <div class="existing-item">
      <div>
        <div class="existing-name">${o.location.name}</div>
        <div class="existing-id">${o.id}</div>
      </div>
      <div class="existing-date">${o.date}</div>
    </div>
  `).join('');
}

function renderExistingSp() {
  const list = document.getElementById('existing-sp');
  list.innerHTML = existingSpecies.map(s => `
    <div class="existing-item">
      <div>
        <div class="existing-name" style="font-style:italic">${s.name}</div>
        <div class="existing-id">${s.id} · ${s.family}</div>
      </div>
      <div class="existing-date">WFRF: ${s.wfrf ?? '—'}</div>
    </div>
  `).join('');
}

// ─── OBSERVATION FORM ─────────────────────────
let speciesCount = 0;

function addSpeciesRow(name = '', count = 'common', notes = '') {
  speciesCount++;
  const row = document.createElement('div');
  row.className = 'species-row';
  row.innerHTML = `
    <input class="form-input" placeholder="Species name" value="${name}">
    <select class="form-select">
      ${['abundant','common','rare','very rare'].map(o =>
        `<option value="${o}" ${count === o ? 'selected' : ''}>${o}</option>`
      ).join('')}
    </select>
    <input class="form-input" placeholder="Notes (optional)" value="${notes}">
    <button class="remove-sp-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById('species-rows').appendChild(row);
}

function generateObsJSON() {
  const val = id => document.getElementById(id).value.trim();
  const numVal = id => { const v = val(id); return v ? parseFloat(v) : undefined; };

  const speciesRows = Array.from(document.querySelectorAll('.species-row')).map(row => {
    const inputs = row.querySelectorAll('input');
    const select = row.querySelector('select');
    const sp = { name: inputs[0].value.trim(), count: select.value };
    if (inputs[1].value.trim()) sp.notes = inputs[1].value.trim();
    return sp;
  }).filter(s => s.name);

  const newId = `obs-${String(existingObs.length + 1).padStart(3, '0')}`;
  const obsDate = val('obs-date');
  const lat = numVal('obs-lat');
  const lng = numVal('obs-lng');

  const obs = {
    id: newId,
    date: obsDate,
    location: {
      name: val('obs-location'),
      lat: lat,
      lng: lng,
      habitat: val('obs-habitat'),
    },
    species: speciesRows,
    images: val('obs-images') ? val('obs-images').split(',').map(s => s.trim()) : [],
    waterParams: {},
    notes: val('obs-notes'),
    published: true,
  };

  const pH = numVal('obs-ph');
  const cond = numVal('obs-cond');
  const temp = numVal('obs-temp');
  if (pH !== undefined) obs.waterParams.pH = pH;
  if (cond !== undefined) obs.waterParams.conductivity = cond;
  if (temp !== undefined) obs.waterParams.temperature = temp;
  if (!Object.keys(obs.waterParams).length) delete obs.waterParams;
  if (!obs.notes) delete obs.notes;

  const updated = [...existingObs, obs];
  document.getElementById('json-output-obs').value = JSON.stringify(updated, null, 2);
  document.getElementById('obs-output-section').style.display = 'block';
}

// ─── SPECIES FORM ─────────────────────────────
function generateSpJSON() {
  const val = id => document.getElementById(id).value.trim();

  const newId = `sp-${String(existingSpecies.length + 1).padStart(3, '0')}`;
  const sp = {
    id: newId,
    name: val('sp-name'),
    author: val('sp-author'),
    family: val('sp-family'),
    ecology: {
      salinity: val('sp-salinity') || 'freshwater',
      pH: val('sp-ph'),
      saprobity: val('sp-saprobity'),
      trophicState: val('sp-trophic'),
    },
    wfrf: val('sp-wfrf') ? parseFloat(val('sp-wfrf')) : undefined,
    description: val('sp-desc'),
    thumbnail: val('sp-thumb') || undefined,
    observedLocations: [],
  };

  if (sp.wfrf === undefined) delete sp.wfrf;
  if (!sp.thumbnail) delete sp.thumbnail;

  const updated = [...existingSpecies, sp];
  document.getElementById('json-output-sp').value = JSON.stringify(updated, null, 2);
  document.getElementById('sp-output-section').style.display = 'block';
}

// ─── COPY / DOWNLOAD ─────────────────────────
function copyJSON(id) {
  const text = document.getElementById(id).value;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = 'Copied!';
    btn.style.color = 'var(--success)';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 2000);
  });
}

function downloadJSON(id, filename) {
  const text = document.getElementById(id).value;
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

function clearForm(formId) {
  document.getElementById(formId).querySelectorAll('input, textarea, select').forEach(el => {
    el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
  });
  document.getElementById('species-rows').innerHTML = '';
  speciesCount = 0;
}

// ─── LOGIN KEY ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  document.getElementById('password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });

  // Add first species row by default
  addSpeciesRow();
});
