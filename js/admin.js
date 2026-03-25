/* ═══════════════════════════════════════
   HOLOFOIL — ADMIN PANEL JS
   ═══════════════════════════════════════ */

// ─── DEFAULT DATA ───
const DEFAULT_ADMIN = {
  email: 'jojodogm@gmail.com',
  password: 'Jojo@26092004MIMOSA',
  role: 'owner'
};

// ─── STORAGE KEYS ───
const KEYS = {
  admins: 'holofoil_admins',
  session: 'holofoil_admin_session',
  listings: 'holofoil_listings',
};

// ─── INIT ADMINS ───
function getAdmins() {
  let admins = JSON.parse(localStorage.getItem(KEYS.admins) || 'null');
  if (!admins) {
    admins = [DEFAULT_ADMIN];
    localStorage.setItem(KEYS.admins, JSON.stringify(admins));
  }
  // Always ensure default admin exists
  if (!admins.find(a => a.email === DEFAULT_ADMIN.email)) {
    admins.push(DEFAULT_ADMIN);
    localStorage.setItem(KEYS.admins, JSON.stringify(admins));
  }
  return admins;
}

function saveAdmins(admins) {
  localStorage.setItem(KEYS.admins, JSON.stringify(admins));
}

// ─── SESSION ───
function getSession() {
  return JSON.parse(localStorage.getItem(KEYS.session) || 'null');
}

function setSession(email) {
  localStorage.setItem(KEYS.session, JSON.stringify({ email, ts: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// ─── LISTINGS (cards for sale) ───
function getListings() {
  return JSON.parse(localStorage.getItem(KEYS.listings) || '[]');
}

function saveListings(listings) {
  localStorage.setItem(KEYS.listings, JSON.stringify(listings));
}

// ═══════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════
function attemptLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (!email || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs.';
    errorEl.classList.add('visible');
    return;
  }

  const admins = getAdmins();
  const user = admins.find(a => a.email.toLowerCase() === email && a.password === password);

  if (!user) {
    errorEl.textContent = 'Email ou mot de passe incorrect.';
    errorEl.classList.add('visible');
    return;
  }

  errorEl.classList.remove('visible');
  setSession(user.email);
  showDashboard();
}

function logout() {
  clearSession();
  location.reload();
}

// ═══════════════════════════════════════
//  DASHBOARD INIT
// ═══════════════════════════════════════
let currentTab = 'cards';
let editingId = null;

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminLayout').classList.add('visible');

  const session = getSession();
  document.getElementById('adminEmail').textContent = session.email;

  switchTab('cards');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.tab === tab);
  });

  const main = document.getElementById('adminMain');

  if (tab === 'cards') renderCardsTab(main);
  else if (tab === 'users') renderUsersTab(main);
}

// ═══════════════════════════════════════
//  CARDS TAB
// ═══════════════════════════════════════
function renderCardsTab(container) {
  const listings = getListings();
  const totalValue = listings.reduce((s, l) => s + (parseFloat(l.price) || 0), 0);

  container.innerHTML = `
    <div class="admin-header">
      <h1>Produits en vente</h1>
      <div class="admin-header-actions">
        <button class="holo-btn-filled" onclick="openCardModal()" style="padding:10px 24px;font-size:0.85rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Ajouter un produit
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Produits en vente</div>
        <div class="stat-value">${listings.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Valeur totale</div>
        <div class="stat-value">${totalValue.toFixed(2)} €</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Prix moyen</div>
        <div class="stat-value">${listings.length ? (totalValue / listings.length).toFixed(2) : '0.00'} €</div>
      </div>
    </div>

    ${listings.length === 0 ? `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
        <p>Aucun produit en vente pour le moment.</p>
        <button class="holo-btn-filled" onclick="openCardModal()" style="padding:10px 24px;font-size:0.85rem;">Ajouter mon premier produit</button>
      </div>
    ` : `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Type</th>
              <th>État</th>
              <th>Prix</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${listings.map((l, i) => {
              const typeLabel = l.type || 'Carte';
              const typeColors = { 'Carte':'var(--holo-1)', 'Booster':'#f97316', 'ETB':'#a855f7', 'Coffret':'#22d3ee', 'Display':'#ec4899', 'Bundle':'#4ade80', 'Autre':'var(--text-muted)' };
              const typeColor = typeColors[typeLabel] || 'var(--text-muted)';
              return `
              <tr>
                <td>
                  <div class="card-info">
                    ${l.image ? `<img src="${l.image}" class="card-thumb" alt="">` : `<div class="card-thumb" style="background:var(--bg-elevated);"></div>`}
                    <div class="card-info-text">
                      <h4>${l.name}</h4>
                      <p>${l.set || ''} ${l.apiId ? '· API' : '· Custom'}</p>
                    </div>
                  </div>
                </td>
                <td><span style="font-size:0.75rem;font-weight:600;color:${typeColor};">${typeLabel}</span></td>
                <td><span class="condition-badge condition-${l.conditionClass || 'nm'}">${l.condition}</span></td>
                <td><strong>${parseFloat(l.price).toFixed(2)} €</strong></td>
                <td style="font-size:0.8rem;color:var(--text-muted);">${l.date || '—'}</td>
                <td>
                  <div class="table-actions">
                    <button class="table-btn" onclick="editCard(${i})">Modifier</button>
                    <button class="table-btn danger" onclick="deleteCard(${i})">Supprimer</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

// ═══════════════════════════════════════
//  CARD MODAL
// ═══════════════════════════════════════
let selectedApiCard = null;
let customImageData = null;

function openCardModal(index = null) {
  editingId = index;
  selectedApiCard = null;
  customImageData = null;

  const listing = index !== null ? getListings()[index] : null;

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'cardModalOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeCardModal(); };

  overlay.innerHTML = `
    <div class="admin-modal">
      <h2>
        ${listing ? 'Modifier le produit' : 'Ajouter un produit'}
        <button onclick="closeCardModal()">✕</button>
      </h2>

      <!-- Product type selector -->
      <form class="admin-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Type de produit *</label>
          <select class="form-select" id="modalProductType" onchange="onProductTypeChange()">
            <option value="Carte" ${(!listing || listing.type === 'Carte') ? 'selected' : ''}>Carte à l'unité</option>
            <option value="Booster" ${listing?.type === 'Booster' ? 'selected' : ''}>Booster</option>
            <option value="ETB" ${listing?.type === 'ETB' ? 'selected' : ''}>ETB (Elite Trainer Box)</option>
            <option value="Coffret" ${listing?.type === 'Coffret' ? 'selected' : ''}>Coffret</option>
            <option value="Display" ${listing?.type === 'Display' ? 'selected' : ''}>Display</option>
            <option value="Bundle" ${listing?.type === 'Bundle' ? 'selected' : ''}>Bundle / Lot</option>
            <option value="Autre" ${listing?.type === 'Autre' ? 'selected' : ''}>Autre</option>
          </select>
        </div>

        <!-- Hidden tabs (not shown, logic in onProductTypeChange) -->
        <div id="imageTabs" style="display:none;"></div>
        <div id="tabApi" style="display:none;"></div>
        <div id="tabCustom" style="display:none;"></div>

        <!-- API search (cards: identify the card) -->
        <div id="modalApiSection">
          <label class="form-label" style="margin-bottom:12px;">Identifier la carte via l'API</label>
          <div class="api-search-row">
            <input type="text" class="form-input" id="apiSearchInput" placeholder="Rechercher une carte (ex: Dracaufeu)..." value="${listing?.apiId ? listing.name : ''}" onkeydown="if(event.key==='Enter'){event.preventDefault();searchApi();}">
            <button class="holo-btn-filled" style="padding:10px 20px;font-size:0.85rem;white-space:nowrap;" onclick="searchApi()">Chercher</button>
          </div>
          <div class="api-search-results" id="apiResults"></div>
          <div id="selectedCardPreview" style="display:none;margin-bottom:20px;"></div>
        </div>

        <!-- Photo upload (cards: photos état réel / produits: photo produit) -->
        <div id="modalCustomSection">
          <label class="form-label" id="customUploadLabel" style="margin-bottom:12px;">Photos du produit</label>
          <div id="customUploadZone" class="image-upload-area">
            <div id="customUploadContent">
              ${listing && listing.image && !listing.apiId ? `<img src="${listing.image}" alt="" style="max-height:180px;margin:0 auto;border-radius:8px;"><p style="margin-top:8px;font-size:0.8rem;color:var(--text-muted);">Cliquer pour changer l'image</p>` : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 8px;display:block;color:var(--holo-1);"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg><p>Cliquer pour importer une image</p><p style="font-size:0.7rem;color:var(--text-muted);">JPG, PNG, WEBP, GIF — tous formats acceptés</p>`}
            </div>
          </div>
        </div>

        <!-- Product details -->
        <div class="form-group">
          <label class="form-label">Nom du produit *</label>
          <input type="text" class="form-input" id="modalCardName" placeholder="Ex: Dracaufeu VMAX Alt Art" value="${listing?.name || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Prix (€) *</label>
            <input type="number" class="form-input" id="modalCardPrice" placeholder="29.99" step="0.01" min="0" value="${listing?.price || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">État *</label>
            <select class="form-select" id="modalCardCondition">
              <option value="" disabled ${!listing ? 'selected' : ''}>Choisir</option>
              <option value="Neuf" ${listing?.condition === 'Neuf' ? 'selected' : ''}>Neuf / Scellé</option>
              <option value="Mint" ${listing?.condition === 'Mint' ? 'selected' : ''}>Mint</option>
              <option value="Near Mint" ${listing?.condition === 'Near Mint' ? 'selected' : ''}>Near Mint</option>
              <option value="Excellent" ${listing?.condition === 'Excellent' ? 'selected' : ''}>Excellent</option>
              <option value="Good" ${listing?.condition === 'Good' ? 'selected' : ''}>Good</option>
              <option value="Played" ${listing?.condition === 'Played' ? 'selected' : ''}>Played</option>
              <option value="Poor" ${listing?.condition === 'Poor' ? 'selected' : ''}>Poor</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Set / Extension</label>
          <input type="text" class="form-input" id="modalCardSet" placeholder="Ex: Écarlate & Violet" value="${listing?.set || ''}">
        </div>
        <div class="form-group" id="rarityGroup">
          <label class="form-label">Rareté</label>
          <input type="text" class="form-input" id="modalCardRarity" placeholder="Ex: Ultra Rare" value="${listing?.rarity || ''}">
        </div>
        <div class="form-group" id="descriptionGroup">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="modalCardDesc" placeholder="Détails supplémentaires..." style="min-height:80px;resize:vertical;">${listing?.description || ''}</textarea>
        </div>
        <button class="admin-save-btn" onclick="saveCard()">
          ${listing ? 'Enregistrer les modifications' : 'Mettre en vente'}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  // Init custom image upload listener
  initCustomUpload();

  // Configure form based on product type
  onProductTypeChange();

  // If editing, restore state
  if (listing?.apiId) {
    selectedApiCard = { id: listing.apiId, name: listing.name, image: listing.image, set: { name: listing.set }, rarity: listing.rarity };
  }
  // If listing has a custom image (base64 data URL), restore it
  if (listing && listing.image && listing.image.startsWith('data:')) {
    customImageData = listing.image;
  }
}

function closeCardModal() {
  const overlay = document.getElementById('cardModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 300);
  editingId = null;
  selectedApiCard = null;
  customImageData = null;
}

function switchModalTab(tab) {
  document.getElementById('modalApiSection').style.display = tab === 'api' ? '' : 'none';
  document.getElementById('modalCustomSection').style.display = tab === 'custom' ? '' : 'none';
  document.getElementById('tabApi')?.classList.toggle('active', tab === 'api');
  document.getElementById('tabCustom')?.classList.toggle('active', tab === 'custom');
}

// ─── Product type change: adapt form fields ───
function onProductTypeChange() {
  const type = document.getElementById('modalProductType').value;
  const isCard = (type === 'Carte');
  const imageTabs = document.getElementById('imageTabs');
  const rarityGroup = document.getElementById('rarityGroup');
  const apiSection = document.getElementById('modalApiSection');
  const customSection = document.getElementById('modalCustomSection');
  const customLabel = document.getElementById('customUploadLabel');

  if (isCard) {
    // Cards: show API search + photo upload both visible
    imageTabs.style.display = 'none'; // hide tabs, both sections always visible
    apiSection.style.display = '';
    customSection.style.display = '';
    rarityGroup.style.display = '';
    if (customLabel) customLabel.textContent = 'Photos de la carte (état réel)';
  } else {
    // Sealed products: only custom upload
    imageTabs.style.display = 'none';
    apiSection.style.display = 'none';
    customSection.style.display = '';
    rarityGroup.style.display = 'none';
    if (customLabel) customLabel.textContent = 'Photo du produit';
  }

  // Update placeholders
  const nameInput = document.getElementById('modalCardName');
  const placeholders = {
    'Carte': 'Ex: Dracaufeu VMAX Alt Art',
    'Booster': 'Ex: Booster Écarlate & Violet - Flammes Obsidiennes',
    'ETB': 'Ex: ETB Écarlate & Violet - 151',
    'Coffret': 'Ex: Coffret Collection Premium Rayquaza',
    'Display': 'Ex: Display 36 Boosters Évolutions à Paldea',
    'Bundle': 'Ex: Lot 10 boosters + promos',
    'Autre': 'Nom du produit',
  };
  nameInput.placeholder = placeholders[type] || 'Nom du produit';

  // For sealed products, default condition to "Neuf"
  if (!isCard) {
    const condSelect = document.getElementById('modalCardCondition');
    if (!condSelect.value) condSelect.value = 'Neuf';
  }
}

// ─── API SEARCH — all languages ───
const API_LANGS = ['fr', 'en', 'ja', 'es', 'it', 'pt', 'de'];

async function fetchCardsFromLang(lang, query) {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards?name=like:${encodeURIComponent(query)}&pagination:itemsPerPage=50`);
    if (!res.ok) return [];
    const data = await res.json();
    // Tag each card with the language it was found in
    return data.map(c => ({ ...c, _lang: lang }));
  } catch { return []; }
}

async function searchApi() {
  const query = document.getElementById('apiSearchInput').value.trim();
  if (!query) return;

  const results = document.getElementById('apiResults');
  results.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;padding:12px;">Recherche en cours dans toutes les langues...</p>';

  // Search all languages in parallel
  const allResults = await Promise.all(
    API_LANGS.map(lang => fetchCardsFromLang(lang, query))
  );

  // Merge & deduplicate by card ID, prefer FR > EN > others
  const cardMap = new Map();
  // Process FR first, then EN, then others so FR data takes priority
  const langOrder = ['fr', 'en', 'ja', 'es', 'it', 'pt', 'de'];
  for (const lang of langOrder) {
    const idx = API_LANGS.indexOf(lang);
    if (idx === -1) continue;
    for (const c of allResults[idx]) {
      if (c.id && !cardMap.has(c.id)) {
        cardMap.set(c.id, c);
      }
    }
  }

  const allCards = Array.from(cardMap.values());

  if (allCards.length === 0) {
    results.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem;padding:12px;">Aucun résultat pour "${query}". Essayez en français, anglais ou japonais.</p>`;
    return;
  }

  results.innerHTML = allCards.map(c => {
    const img = c.image ? `${c.image}/low.webp` : '';
    const setName = c.set?.name || '';
    const rarity = c.rarity || '';
    const safeId = (c.id || '').replace(/'/g, "\\'");
    const langFlag = { fr:'🇫🇷', en:'🇬🇧', ja:'🇯🇵', es:'🇪🇸', it:'🇮🇹', pt:'🇧🇷', de:'🇩🇪' }[c._lang] || '';

    return `
      <div class="api-result-card" data-id="${c.id}" onclick="selectApiCard(this, '${safeId}', '${c._lang}')">
        ${img ? `<img src="${img}" alt="${c.name}" loading="lazy">` : `<div style="aspect-ratio:63/88;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted);padding:4px;text-align:center;">${c.name || '?'}</div>`}
        <div class="name">${c.name || '?'} <span style="font-size:0.6rem;">${langFlag}</span></div>
        <div class="api-card-meta">${setName}${rarity ? ' · ' + rarity : ''}</div>
        <div class="check">✓</div>
      </div>`;
  }).join('');

  results.insertAdjacentHTML('beforeend', `<p style="font-size:0.7rem;color:var(--text-muted);padding:8px 4px;grid-column:1/-1;">${allCards.length} résultat(s) trouvé(s) dans ${API_LANGS.length} langues</p>`);
}

async function selectApiCard(el, id, sourceLang = 'fr') {
  // Deselect others
  document.querySelectorAll('.api-result-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  // Fetch full card detail — try source language first, then FR, then EN
  el.style.opacity = '0.6';
  let detail = null;
  const tryLangs = [sourceLang, 'fr', 'en', ...API_LANGS].filter((v, i, a) => a.indexOf(v) === i);
  for (const lang of tryLangs) {
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${id}`);
      if (res.ok) { detail = await res.json(); break; }
    } catch {}
  }
  el.style.opacity = '1';

  if (!detail) return;

  const imgUrl = detail.image ? `${detail.image}/high.webp` : '';
  const setName = detail.set?.name || '';
  const rarity = detail.rarity || '';
  const types = detail.types?.join(', ') || '';
  const hp = detail.hp || '';
  const stage = detail.stage || '';
  const illustrator = detail.illustrator || '';
  const localId = detail.localId || '';

  selectedApiCard = {
    id: detail.id,
    name: detail.name,
    image: imgUrl,
    set: { name: setName, id: detail.set?.id },
    rarity,
    types,
    hp,
    stage,
    illustrator,
    localId,
  };

  // Auto-fill form fields
  document.getElementById('modalCardName').value = detail.name || '';
  document.getElementById('modalCardSet').value = setName;
  document.getElementById('modalCardRarity').value = rarity;

  // Show selected card detail preview
  const previewEl = document.getElementById('selectedCardPreview');
  if (previewEl) {
    previewEl.innerHTML = `
      <div style="display:flex;gap:16px;padding:16px;background:rgba(77,201,246,0.04);border:1px solid var(--border-holo);border-radius:12px;">
        ${imgUrl ? `<img src="${imgUrl}" style="width:80px;border-radius:8px;object-fit:contain;" alt="">` : ''}
        <div style="flex:1;font-size:0.8rem;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:6px;">${detail.name}</div>
          <div style="color:var(--text-secondary);line-height:1.7;">
            <div><strong>Extension :</strong> ${setName}</div>
            <div><strong>N° :</strong> ${localId}</div>
            <div><strong>Rareté :</strong> ${rarity}</div>
            ${types ? `<div><strong>Type :</strong> ${types}</div>` : ''}
            ${hp ? `<div><strong>HP :</strong> ${hp}</div>` : ''}
            ${stage ? `<div><strong>Stade :</strong> ${stage}</div>` : ''}
            ${illustrator ? `<div><strong>Illustrateur :</strong> ${illustrator}</div>` : ''}
          </div>
        </div>
      </div>
    `;
    previewEl.style.display = 'block';
  }
}

// ─── CUSTOM IMAGE ───
function initCustomUpload() {
  const zone = document.getElementById('customUploadZone');
  if (!zone) return;

  // Create a hidden file input and keep a reference
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  zone.appendChild(fileInput);

  // Click zone → open file picker
  zone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--holo-1)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '';
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    if (e.dataTransfer.files.length) {
      processFile(e.dataTransfer.files[0]);
    }
  });

  // File selected
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      processFile(fileInput.files[0]);
    }
  });

  function processFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      customImageData = e.target.result;
      const content = document.getElementById('customUploadContent');
      if (content) {
        content.innerHTML = `
          <img src="${customImageData}" alt="Preview" style="max-height:200px;margin:0 auto;border-radius:8px;pointer-events:none;">
          <p style="margin-top:10px;font-size:0.8rem;color:var(--text-muted);pointer-events:none;">Cliquer pour changer l'image</p>
        `;
      }
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    fileInput.value = '';
  }
}

// ─── SAVE CARD ───
function saveCard() {
  const type = document.getElementById('modalProductType').value;
  const name = document.getElementById('modalCardName').value.trim();
  const price = document.getElementById('modalCardPrice').value;
  const condition = document.getElementById('modalCardCondition').value;
  const set = document.getElementById('modalCardSet').value.trim();
  const rarity = document.getElementById('modalCardRarity')?.value.trim() || '';
  const description = document.getElementById('modalCardDesc')?.value.trim() || '';

  if (!name) { alert('Veuillez entrer le nom du produit.'); return; }
  if (!price || parseFloat(price) <= 0) { alert('Veuillez entrer un prix valide.'); return; }
  if (!condition) { alert('Veuillez sélectionner l\'état.'); return; }

  // Determine image source
  // Custom photo takes priority (shows real card condition)
  // API image is fallback if no custom photo uploaded
  let image = '';
  let apiId = '';
  if (customImageData) {
    image = customImageData;
  } else if (selectedApiCard) {
    image = selectedApiCard.image;
  }
  if (selectedApiCard) {
    apiId = selectedApiCard.id;
  }

  const conditionClassMap = {
    'Neuf': 'mint', 'Mint': 'mint', 'Near Mint': 'nm', 'Excellent': 'ex',
    'Good': 'good', 'Played': 'played', 'Poor': 'played'
  };

  const listing = {
    type, name, price: parseFloat(price), condition,
    conditionClass: conditionClassMap[condition] || 'nm',
    set, rarity, description, image, apiId,
    date: new Date().toLocaleDateString('fr-FR'),
  };

  const listings = getListings();

  if (editingId !== null) {
    listings[editingId] = listing;
  } else {
    listings.unshift(listing);
  }

  saveListings(listings);
  closeCardModal();
  renderCardsTab(document.getElementById('adminMain'));
}

function editCard(index) {
  openCardModal(index);
}

function deleteCard(index) {
  if (!confirm('Supprimer cette carte de la vente ?')) return;
  const listings = getListings();
  listings.splice(index, 1);
  saveListings(listings);
  renderCardsTab(document.getElementById('adminMain'));
}

// ═══════════════════════════════════════
//  USERS TAB
// ═══════════════════════════════════════
function renderUsersTab(container) {
  const admins = getAdmins();
  const session = getSession();

  container.innerHTML = `
    <div class="admin-header">
      <h1>Gestion des accès</h1>
    </div>

    <div class="users-list">
      ${admins.map((a, i) => `
        <div class="user-row">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="user-email">${a.email}</span>
            <span class="user-badge ${a.role === 'owner' ? 'owner' : ''}">${a.role === 'owner' ? 'Propriétaire' : 'Admin'}</span>
          </div>
          ${a.role !== 'owner' ? `
            <button class="table-btn danger" onclick="removeAdmin(${i})">Retirer</button>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-top:40px;margin-bottom:12px;">Ajouter un administrateur</h3>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;">Le nouvel admin pourra accéder au panel avec le mot de passe que vous définissez.</p>
    <div class="add-user-row">
      <input type="email" class="form-input" id="newAdminEmail" placeholder="Email du nouvel admin">
      <input type="password" class="form-input" id="newAdminPassword" placeholder="Mot de passe" style="max-width:200px;">
      <button class="holo-btn-filled" style="padding:10px 24px;font-size:0.85rem;white-space:nowrap;" onclick="addAdmin()">Ajouter</button>
    </div>
  `;
}

function addAdmin() {
  const email = document.getElementById('newAdminEmail').value.trim().toLowerCase();
  const password = document.getElementById('newAdminPassword').value;

  if (!email || !password) { alert('Email et mot de passe requis.'); return; }
  if (password.length < 6) { alert('Le mot de passe doit faire au moins 6 caractères.'); return; }

  const admins = getAdmins();
  if (admins.find(a => a.email.toLowerCase() === email)) {
    alert('Cet email a déjà accès.');
    return;
  }

  admins.push({ email, password, role: 'admin' });
  saveAdmins(admins);
  renderUsersTab(document.getElementById('adminMain'));
}

function removeAdmin(index) {
  const admins = getAdmins();
  if (admins[index].role === 'owner') return;
  if (!confirm(`Retirer l'accès à ${admins[index].email} ?`)) return;
  admins.splice(index, 1);
  saveAdmins(admins);
  renderUsersTab(document.getElementById('adminMain'));
}

// ═══════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  getAdmins(); // Ensure default admin
  const session = getSession();
  if (session) {
    // Verify session is still valid
    const admins = getAdmins();
    if (admins.find(a => a.email === session.email)) {
      showDashboard();
      return;
    }
    clearSession();
  }
  // Show login
  document.getElementById('loginPage').style.display = '';
});
