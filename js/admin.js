/* ═══════════════════════════════════════
   HOLOFOIL — ADMIN PANEL JS
   ═══════════════════════════════════════ */

// ─── DEFAULT DATA ───
// NOTE: Default admin credentials — in production, use hashed passwords and server-side auth.
// These are stored in localStorage on first init and can be changed from the admin panel.
const DEFAULT_ADMIN = {
  email: 'jojodogm@gmail.com',
  password: atob('Sm9qb2x1bHVAMjAwNDIwMDJNSU1P'),
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

  if (tab === 'analyse') renderAnalyseTab(main);
  else if (tab === 'cards') renderCardsTab(main);
  else if (tab === 'accounting') renderAccountingTab(main);
  else if (tab === 'invoices') renderInvoicesTab(main);
  else if (tab === 'announcements') renderAnnouncementsTab(main);
  else if (tab === 'users') renderUsersTab(main);
}

// ═══════════════════════════════════════
//  ANALYSE TAB — Prix Cardmarket/TCGPlayer + Liens Marketplace
// ═══════════════════════════════════════
let analyseState = { query: '', card: null, results: [], loading: false, subTab: 'prix', condition: 'NM' };

// États / conditions Cardmarket avec multiplicateurs standards du marché
const CARD_CONDITIONS = [
  { id: 'MT', name: 'Mint', multiplier: 1.30, color: '#22c55e', desc: 'Parfait, comme neuf sous blister' },
  { id: 'NM', name: 'Near Mint', multiplier: 1.00, color: '#4dc9f6', desc: 'Excellent état, micro-défauts possibles' },
  { id: 'EX', name: 'Excellent', multiplier: 0.75, color: '#f59e0b', desc: 'Légers défauts visibles (bords, surface)' },
  { id: 'GD', name: 'Good', multiplier: 0.55, color: '#f97316', desc: 'Usure notable, coins et bords marqués' },
  { id: 'LP', name: 'Light Played', multiplier: 0.40, color: '#ef4444', desc: 'Carte jouée, usure visible des deux côtés' },
  { id: 'PL', name: 'Played', multiplier: 0.25, color: '#dc2626', desc: 'Très jouée, plis ou défauts importants' },
  { id: 'PO', name: 'Poor', multiplier: 0.10, color: '#991b1b', desc: 'Très mauvais état, carte endommagée' },
];

function renderAnalyseTab(main) {
  const st = analyseState;
  const card = st.card;

  main.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Analyse de marché</h1>
        <p>Prix Cardmarket & TCGPlayer (via pokemontcg.io) + liens vers eBay, Vinted, Leboncoin, Facebook.</p>
      </div>
    </div>

    <!-- Recherche -->
    <div style="display:flex;gap:10px;margin-bottom:20px;align-items:center;padding:14px 20px;background:rgba(255,255,255,0.02);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;transition:0.3s;" onfocus="this.style.borderColor='rgba(77,201,246,0.2)';this.style.boxShadow='0 0 16px rgba(77,201,246,0.06)'" id="analyseSearchBar">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0;opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      <input type="text" id="analyseSearchInput" placeholder="Rechercher une carte Pokémon..." value="${st.query.replace(/"/g,'&quot;')}" style="flex:1;background:none;border:none;outline:none;color:var(--text-primary);font-family:inherit;font-size:0.9rem;padding:0 12px;" onkeydown="if(event.key==='Enter')analyseSearchCards()" onfocus="document.getElementById('analyseSearchBar').style.borderColor='rgba(77,201,246,0.2)';document.getElementById('analyseSearchBar').style.boxShadow='0 0 16px rgba(77,201,246,0.06)'" onblur="document.getElementById('analyseSearchBar').style.borderColor='rgba(255,255,255,0.06)';document.getElementById('analyseSearchBar').style.boxShadow='none'">
      <button onclick="analyseSearchCards()" style="padding:8px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,rgba(77,201,246,0.15),rgba(168,85,247,0.1));color:var(--text-primary);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:0.3s;font-family:inherit;" onmouseover="this.style.background='linear-gradient(135deg,rgba(77,201,246,0.25),rgba(168,85,247,0.18))'" onmouseout="this.style.background='linear-gradient(135deg,rgba(77,201,246,0.15),rgba(168,85,247,0.1))'" ${st.loading?'disabled':''}>${st.loading?'Recherche...':'Rechercher'}</button>
    </div>

    <!-- Résultats de recherche (grille de cartes cliquables) -->
    ${st.results.length > 0 && !card ? `
    <div style="margin-bottom:24px;">
      <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">${st.results.length} résultat${st.results.length>1?'s':''} — cliquez sur une carte pour voir ses prix</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">
        ${st.results.map(c => {
          const lang = c._lang || '';
          const langBadge = lang === 'ja' ? '<span style="position:absolute;top:2px;right:2px;font-size:0.55rem;background:rgba(0,0,0,0.6);color:#fff;padding:1px 4px;border-radius:3px;">🇯🇵</span>' : lang === 'fr' ? '<span style="position:absolute;top:2px;right:2px;font-size:0.55rem;background:rgba(0,0,0,0.6);color:#fff;padding:1px 4px;border-radius:3px;">🇫🇷</span>' : '';
          const hasImg = c.image;
          return `
          <div onclick="selectAnalyseCard('${c.id}','${lang}')" style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px;cursor:pointer;transition:0.2s;display:flex;align-items:center;gap:10px;" onmouseover="this.style.borderColor='var(--holo-1)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="width:40px;height:56px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--bg-elevated);position:relative;">
              ${hasImg?`<img src="${c.image}/low.webp" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=\\'padding:3px;font-size:0.5rem;color:var(--text-muted);text-align:center;line-height:1.2;\\'>${(c.name||'').substring(0,12)}<br>${c.id||''}</div>'">`:`<div style="padding:3px;font-size:0.5rem;color:var(--text-muted);text-align:center;line-height:1.2;display:flex;align-items:center;justify-content:center;height:100%;">${(c.name||'').substring(0,15)}<br>${c.id||''}</div>`}
              ${langBadge}
            </div>
            <div style="overflow:hidden;">
              <div style="font-size:0.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
              <div style="font-size:0.62rem;color:var(--text-muted);">${c.id}${c._setName?' · '+c._setName:''}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Carte sélectionnée : vue détaillée -->
    ${card ? renderAnalyseDetail(card) : (!st.results.length && !st.loading ? `
      <div style="text-align:center;padding:60px 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" style="color:var(--text-muted);margin-bottom:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Recherchez une carte</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;max-width:420px;margin:0 auto;">Entrez le nom d'une carte Pokémon pour voir ses prix Cardmarket & TCGPlayer en temps réel, et consulter les annonces sur eBay, Vinted, Leboncoin et Facebook.</p>
      </div>` : '')}
  `;
  if (card && st.subTab === 'prix') setTimeout(() => buildAnalyseChart(), 100);
}

function renderAnalyseDetail(card) {
  const cmk = getPricing(card);
  const tcgp = getTCGPlayerPricing(card);
  const st = analyseState;
  // Construire le vrai numéro de carte au format "12/121"
  const localId = card.localId || '';
  const setTotal = card.set?.cardCount?.total || card.set?.cardCount?.official || '';
  const cardNumber = localId && setTotal ? `${localId}/${setTotal}` : localId;
  const setName = card.set?.name || '';
  // Query optimisée : "Nom Numéro/Total" (ex: "Dracaufeu 11/108")
  const searchBase = card.name + (cardNumber ? ' ' + cardNumber : '');
  const links = {
    cardmarket: cmk.url || (cmk.idProduct ? `https://www.cardmarket.com/fr/Pokemon/Products/Singles?idProduct=${cmk.idProduct}` : `https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(searchBase)}`),
    ebay: `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(searchBase + ' pokemon carte')}&_sacat=183454&LH_BIN=1`,
    vinted: `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(searchBase + ' pokemon carte')}`,
    leboncoin: `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(searchBase + ' pokemon carte')}&category=55`,
    facebook: `https://www.facebook.com/marketplace/search?query=${encodeURIComponent(searchBase + ' pokemon carte')}`,
  };
  const subBtn = (id, label, icon) => `<button class="table-btn" onclick="analyseState.subTab='${id}';renderAnalyseTab(document.getElementById('adminMain'))" style="display:flex;align-items:center;gap:6px;${st.subTab===id?'border-color:var(--holo-1);color:var(--holo-1);background:rgba(77,201,246,0.06);':''}">${icon} ${label}</button>`;

  return `
    <div style="margin-bottom:12px;">
      <button class="table-btn" onclick="analyseState.card=null;renderAnalyseTab(document.getElementById('adminMain'))" style="font-size:0.78rem;">← Retour aux résultats</button>
    </div>
    <div style="display:grid;grid-template-columns:260px 1fr;gap:24px;">

      <!-- Gauche : Carte + prix -->
      <div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;text-align:center;">
          <div style="width:180px;aspect-ratio:63/88;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.4);margin:0 auto 14px;">
            ${card.image?`<img src="${card.image}/high.webp" alt="${card.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:var(--bg-elevated);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;text-align:center;\\'><div style=\\'font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;\\'>${(card.name||'').replace(/'/g,"")}</div><div style=\\'font-size:0.72rem;color:var(--text-muted);\\'>${card.localId||card.id||''}</div><div style=\\'font-size:0.68rem;color:var(--text-muted);margin-top:4px;\\'>${(card.set?.name||'').replace(/'/g,"")}</div></div>'">`:`<div style="width:100%;height:100%;background:var(--bg-elevated);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;text-align:center;"><div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">${card.name}</div><div style="font-size:0.72rem;color:var(--text-muted);">${card.localId||card.id||''}</div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px;">${card.set?.name||''}</div></div>`}
          </div>
          <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:4px;">${card.name}</h3>
          <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:2px;">${cardNumber ? `<span style="font-weight:600;color:var(--text-secondary);">${cardNumber}</span> — ` : ''}${card.set?.name||''}</p>
          <p style="font-size:0.68rem;color:var(--text-muted);margin-bottom:6px;">${card.set?.id?card.set.id:card.id||''}</p>
          ${card.rarity?`<span style="padding:3px 10px;border-radius:50px;font-size:0.68rem;font-weight:600;background:rgba(168,85,247,0.1);color:#a855f7;">${card.rarity}</span>`:''}

          <!-- Sélecteur d'état -->
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);text-align:left;">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;">État de la carte</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
              ${CARD_CONDITIONS.map(c => {
                const active = st.condition === c.id;
                return `<button onclick="analyseState.condition='${c.id}';renderAnalyseTab(document.getElementById('adminMain'))" title="${c.desc}" style="padding:3px 8px;border-radius:6px;border:1px solid ${active?c.color+'80':'var(--border)'};background:${active?c.color+'18':'transparent'};color:${active?c.color:'var(--text-muted)'};font-size:0.65rem;font-weight:${active?'700':'500'};cursor:pointer;transition:0.2s;font-family:inherit;">${c.id}</button>`;
              }).join('')}
            </div>
            ${(() => {
              const cond = CARD_CONDITIONS.find(c => c.id === st.condition);
              const m = cond ? cond.multiplier : 1;
              const isNM = st.condition === 'NM';
              const fmtPrice = (v) => v != null ? (v * m).toFixed(2) : null;
              return `
              <div style="font-size:0.65rem;color:${cond?.color || 'var(--text-muted)'};margin-bottom:8px;font-style:italic;">${cond?.name || ''} ${!isNM ? `(x${m.toFixed(2)} du NM)` : '(référence)'}</div>`;
            })()}
          </div>

          <!-- Prix Cardmarket -->
          <div style="text-align:left;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--holo-1);">Cardmarket (EUR)</div>
              ${cmk.updatedAt ? `<span style="font-size:0.6rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:2px 6px;border-radius:4px;" title="Source: ${cmk.source}">MAJ ${cmk.updatedAt}</span>` : `<span style="font-size:0.6rem;color:rgba(239,68,68,0.7);background:rgba(239,68,68,0.06);padding:2px 6px;border-radius:4px;" title="Source: ${cmk.source}">Date inconnue</span>`}
            </div>
            ${cmk.avg!=null ? (() => {
              const cond = CARD_CONDITIONS.find(c => c.id === st.condition);
              const m = cond ? cond.multiplier : 1;
              const fmt = (v) => v != null ? (v * m).toFixed(2) + ' €' : '—';
              return `
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Prix bas</span><strong style="color:#4ade80;font-size:0.85rem;">${fmt(cmk.low)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Moyenne ventes</span><strong style="font-size:0.85rem;">${fmt(cmk.avg)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Tendance</span><strong style="font-size:0.85rem;">${fmt(cmk.trend)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Moy. 7j</span><strong style="font-size:0.85rem;">${fmt(cmk.avg7)}</strong></div>
              <div style="display:flex;justify-content:space-between;"><span style="font-size:0.75rem;color:var(--text-muted);">Moy. 30j</span><strong style="font-size:0.85rem;">${fmt(cmk.avg30)}</strong></div>
              ${cmk.url ? `<a href="${cmk.url}" target="_blank" rel="noopener" style="display:block;margin-top:8px;font-size:0.72rem;color:var(--holo-1);text-decoration:none;">Voir sur Cardmarket →</a>` : ''}`;
            })() : '<p style="font-size:0.78rem;color:var(--text-muted);">Pas de données Cardmarket</p>'}
          </div>

          <!-- Prix TCGPlayer -->
          ${tcgp ? `
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);text-align:left;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#f59e0b;">TCGPlayer (USD)</div>
              ${tcgp.updatedAt ? `<span style="font-size:0.6rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:2px 6px;border-radius:4px;">MAJ ${tcgp.updatedAt}</span>` : ''}
            </div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:8px;font-style:italic;">${tcgp.variant}</div>
            ${tcgp.market!=null ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Market</span><strong style="font-size:0.85rem;color:#f59e0b;">${tcgp.market?.toFixed(2)||'—'} $</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Low</span><strong style="color:#4ade80;font-size:0.85rem;">${tcgp.low?.toFixed(2)||'—'} $</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.75rem;color:var(--text-muted);">Mid</span><strong style="font-size:0.85rem;">${tcgp.mid?.toFixed(2)||'—'} $</strong></div>
            <div style="display:flex;justify-content:space-between;"><span style="font-size:0.75rem;color:var(--text-muted);">High</span><strong style="font-size:0.85rem;color:#f97316;">${tcgp.high?.toFixed(2)||'—'} $</strong></div>
            ${tcgp.url ? `<a href="${tcgp.url}" target="_blank" rel="noopener" style="display:block;margin-top:8px;font-size:0.72rem;color:#f59e0b;text-decoration:none;">Voir sur TCGPlayer →</a>` : ''}
          </div>` : ''}

          <!-- Avertissement -->
          <div style="margin-top:14px;padding:8px 10px;border-radius:8px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.1);text-align:left;">
            <p style="font-size:0.65rem;color:rgba(239,68,68,0.7);line-height:1.4;margin:0;">Les prix affichés sont indicatifs et peuvent différer des annonces réelles. Consultez les plateformes pour les prix à jour.</p>
          </div>

          <!-- Lien eBay -->
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);text-align:left;">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#e53238;margin-bottom:10px;">eBay France</div>
            <a href="${links.ebay}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;background:rgba(229,50,56,0.06);border:1px solid rgba(229,50,56,0.15);text-decoration:none;transition:0.2s;font-size:0.78rem;font-weight:600;color:#e53238;" onmouseover="this.style.background='rgba(229,50,56,0.12)'" onmouseout="this.style.background='rgba(229,50,56,0.06)'">🏷️ Voir les annonces eBay →</a>
          </div>
        </div>
      </div>

      <!-- Droite : Tabs -->
      <div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
          ${subBtn('prix','Évolution des prix','📈')}
          ${subBtn('marketplace','Voir les annonces','🛒')}
        </div>

        ${st.subTab === 'prix' ? renderPrixView(card) : ''}
        ${st.subTab === 'marketplace' ? renderLinksView(card, links) : ''}
      </div>
    </div>`;
}

function renderPrixView(card) {
  const cmk = getPricing(card);
  const tcgp = getTCGPlayerPricing(card);
  const hasCmk = cmk.avg != null;
  const hasHolo = cmk['avg-holo'] != null && cmk['avg-holo'] > 0;
  const hasTcgp = tcgp != null;
  const selectedCond = CARD_CONDITIONS.find(c => c.id === analyseState.condition) || CARD_CONDITIONS[1];
  const m = selectedCond.multiplier;

  // Condition selector buttons
  const conditionSelector = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="font-size:0.95rem;font-weight:700;">État de la carte</h3>
        <span style="font-size:0.68rem;color:var(--text-muted);font-style:italic;">Estimation basée sur le prix NM</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${CARD_CONDITIONS.map(c => {
          const active = analyseState.condition === c.id;
          return `<button onclick="analyseState.condition='${c.id}';renderAnalyseTab(document.getElementById('adminMain'))" title="${c.desc}" style="padding:8px 14px;border-radius:10px;border:1px solid ${active?c.color:'var(--border)'};background:${active?c.color+'15':'transparent'};color:${active?c.color:'var(--text-muted)'};font-size:0.78rem;font-weight:${active?'700':'500'};cursor:pointer;transition:0.2s;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:60px;" onmouseover="if(!${active})this.style.borderColor='${c.color}40'" onmouseout="if(!${active})this.style.borderColor='var(--border)'">
            <span>${c.id}</span>
            <span style="font-size:0.6rem;opacity:0.7;">${c.id==='NM'?'ref.':'x'+c.multiplier.toFixed(2)}</span>
          </button>`;
        }).join('')}
      </div>
      <div style="margin-top:10px;padding:8px 12px;border-radius:8px;background:${selectedCond.color}08;border:1px solid ${selectedCond.color}20;">
        <p style="font-size:0.75rem;color:${selectedCond.color};margin:0;"><strong>${selectedCond.name}</strong> — ${selectedCond.desc}</p>
      </div>
    </div>`;

  // Comparison table: all conditions at a glance
  const condComparisonHtml = hasCmk ? `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
      <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:16px;">Comparatif par état — Tendance Cardmarket</h3>
      <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:10px 12px;text-align:left;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);">État</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Coeff.</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:#4ade80;background:rgba(74,222,128,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Bas (€)</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--holo-1);background:rgba(77,201,246,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Tendance (€)</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:#f59e0b;background:rgba(245,158,11,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Moyenne (€)</th>
            </tr>
          </thead>
          <tbody>
            ${CARD_CONDITIONS.map((c, i) => {
              const active = c.id === analyseState.condition;
              const bg = active ? c.color + '08' : (i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent');
              const border = active ? `border-left:3px solid ${c.color};` : '';
              const fmt = (v) => v != null ? (v * c.multiplier).toFixed(2) : '—';
              return `<tr style="background:${bg};">
                <td style="padding:8px 12px;font-size:0.8rem;font-weight:${active?'700':'500'};color:${active?c.color:'var(--text-secondary)'};border-top:1px solid rgba(255,255,255,0.03);${border}">${c.id} — ${c.name}</td>
                <td style="padding:8px 12px;text-align:center;font-size:0.78rem;color:var(--text-muted);border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);">x${c.multiplier.toFixed(2)}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:0.82rem;color:#4ade80;border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);">${fmt(cmk.low)}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:${active?'700':'600'};font-size:0.82rem;color:${active?c.color:'var(--text-primary)'};border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);">${fmt(cmk.trend)}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:0.82rem;border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);">${fmt(cmk.avg)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:0.65rem;color:var(--text-muted);margin-top:10px;font-style:italic;">Les prix par état sont des estimations basées sur les coefficients standards du marché Cardmarket, appliqués au prix Near Mint de référence.</p>
    </div>` : '';

  // TCGPlayer variants table
  let tcgpVariantsHtml = '';
  if (hasTcgp && tcgp.allVariants) {
    const variantRows = Object.entries(tcgp.allVariants).map(([name, v]) => {
      const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
      return `<tr>
        <td style="padding:8px 12px;font-size:0.8rem;color:var(--text-secondary);border-top:1px solid rgba(255,255,255,0.03);">${label}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:0.82rem;border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);color:#4ade80;">${v.low!=null?v.low.toFixed(2)+' $':'—'}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:0.82rem;border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);">${v.market!=null?v.market.toFixed(2)+' $':(v.mid!=null?v.mid.toFixed(2)+' $':'—')}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:0.82rem;border-left:1px solid var(--border);border-top:1px solid rgba(255,255,255,0.03);color:#f97316;">${v.high!=null?v.high.toFixed(2)+' $':'—'}</td>
      </tr>`;
    }).join('');
    tcgpVariantsHtml = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:0.95rem;font-weight:700;">TCGPlayer (USD)</h3>
        ${tcgp.updatedAt ? `<span style="font-size:0.68rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:6px;">MAJ ${tcgp.updatedAt}</span>` : ''}
      </div>
      <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:10px 12px;text-align:left;font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);">Variante</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#4ade80;background:rgba(74,222,128,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Low</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#f59e0b;background:rgba(245,158,11,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">Market</th>
              <th style="padding:10px 12px;text-align:center;font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#f97316;background:rgba(249,115,22,0.03);border-bottom:1px solid var(--border);border-left:1px solid var(--border);">High</th>
            </tr>
          </thead>
          <tbody>${variantRows}</tbody>
        </table>
      </div>
      ${tcgp.url ? `<a href="${tcgp.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;font-size:0.75rem;color:#f59e0b;text-decoration:none;">Voir sur TCGPlayer →</a>` : ''}
    </div>`;
  }

  // Detail table for selected condition
  const detailHtml = hasCmk ? `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:0.95rem;font-weight:700;">Détail — <span style="color:${selectedCond.color};">${selectedCond.name}</span>${hasHolo ? ' (Normal vs Reverse)' : ''}</h3>
        <span style="font-size:0.65rem;color:var(--text-muted);font-style:italic;">${cmk.source}</span>
      </div>
      <div style="display:grid;grid-template-columns:${hasHolo?'1fr 1fr 1fr':'1fr 1fr'};gap:0;border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <div style="padding:12px;text-align:center;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Métrique</div>
        <div style="padding:12px;text-align:center;background:${selectedCond.color}08;border-bottom:1px solid var(--border);border-left:1px solid var(--border);font-size:0.72rem;font-weight:700;color:${selectedCond.color};">Normal (€)</div>
        ${hasHolo?`<div style="padding:12px;text-align:center;background:rgba(168,85,247,0.04);border-bottom:1px solid var(--border);border-left:1px solid var(--border);font-size:0.72rem;font-weight:700;color:#a855f7;">Reverse Holo (€)</div>`:''}
        ${[
          ['Prix bas', cmk.low, cmk['low-holo']],
          ['Tendance', cmk.trend, cmk['trend-holo']],
          ['Moy. ventes', cmk.avg, cmk['avg-holo']],
          ['Moy. 1 jour', cmk.avg1, cmk['avg1-holo']],
          ['Moy. 7 jours', cmk.avg7, cmk['avg7-holo']],
          ['Moy. 30 jours', cmk.avg30, cmk['avg30-holo']],
        ].map(([label, cv, hv], i) => `
          <div style="padding:10px 12px;font-size:0.82rem;color:var(--text-secondary);${i%2?'background:rgba(255,255,255,0.01);':''}border-top:1px solid rgba(255,255,255,0.03);">${label}</div>
          <div style="padding:10px 12px;text-align:center;font-weight:600;font-size:0.85rem;border-left:1px solid var(--border);${i%2?'background:rgba(255,255,255,0.01);':''}border-top:1px solid rgba(255,255,255,0.03);">${cv!=null?(cv*m).toFixed(2)+' €':'—'}</div>
          ${hasHolo?`<div style="padding:10px 12px;text-align:center;font-weight:600;font-size:0.85rem;border-left:1px solid var(--border);${i%2?'background:rgba(255,255,255,0.01);':''}border-top:1px solid rgba(255,255,255,0.03);">${hv!=null?(hv*m).toFixed(2)+' €':'—'}</div>`:''}
        `).join('')}
      </div>
      ${cmk.avg30 && cmk.avg7 ? `
      <div style="margin-top:14px;padding:12px 16px;border-radius:10px;background:${cmk.avg7>cmk.avg30?'rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15)':'rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15)'};">
        <p style="font-size:0.82rem;color:var(--text-secondary);">${cmk.avg7>cmk.avg30?'📈':'📉'} <strong style="color:var(--text-primary);">Tendance ${cmk.avg7>cmk.avg30?'haussière':'baissière'}</strong> — Moyenne 7j (${(cmk.avg7*m).toFixed(2)}€) ${cmk.avg7>cmk.avg30?'>':'<'} Moyenne 30j (${(cmk.avg30*m).toFixed(2)}€) soit ${((cmk.avg7-cmk.avg30)/cmk.avg30*100).toFixed(1)}%</p>
      </div>` : ''}
      ${cmk.url ? `<a href="${cmk.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;font-size:0.75rem;color:var(--holo-1);text-decoration:none;">Voir sur Cardmarket →</a>` : ''}
    </div>` : '';

  return `
    ${conditionSelector}

    <!-- Graphique comparatif par état -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:0.95rem;font-weight:700;">Courbe par état — Cardmarket</h3>
        ${cmk.updatedAt ? `<span style="font-size:0.68rem;color:var(--text-muted);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:6px;">MAJ ${cmk.updatedAt}</span>` : ''}
      </div>
      ${hasCmk ? `<div style="height:280px;"><canvas id="analyseChart"></canvas></div>` : '<p style="color:var(--text-muted);font-size:0.85rem;">Pas de données de prix disponibles pour cette carte.</p>'}
    </div>

    <!-- Comparatif tous états -->
    ${condComparisonHtml}

    <!-- Détail état sélectionné -->
    ${detailHtml}

    <!-- TCGPlayer -->
    ${tcgpVariantsHtml}`;
}

function renderLinksView(card, links) {
  const platforms = [
    { key:'cardmarket', name:'Cardmarket', color:'#1a5276', icon:'🃏', desc:'Prix de référence européen. Vendeurs professionnels et particuliers.' },
    { key:'ebay', name:'eBay', color:'#e53238', icon:'🏷️', desc:'Enchères et achat immédiat. Consultez les ventes récentes pour estimer le prix réel.' },
    { key:'vinted', name:'Vinted', color:'#09b1ba', icon:'👕', desc:'Annonces de particuliers. Prix souvent négociables, vérifiez l\'authenticité.' },
    { key:'leboncoin', name:'Leboncoin', color:'#f56b2a', icon:'📦', desc:'Annonces locales. Possibilité de remise en main propre.' },
    { key:'facebook', name:'Facebook Marketplace', color:'#1877f2', icon:'📱', desc:'Marketplace communautaire. Vérifiez le profil du vendeur.' },
  ];
  return `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:4px;">Cliquez pour ouvrir la recherche "<strong>${card.name}</strong>" sur chaque plateforme.</p>
      ${platforms.map(p => `
        <a href="${links[p.key]}" target="_blank" rel="noopener" style="text-decoration:none;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;display:flex;align-items:center;gap:16px;transition:0.2s;cursor:pointer;" onmouseover="this.style.borderColor='${p.color}50'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:44px;height:44px;border-radius:12px;background:${p.color}18;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">${p.icon}</div>
          <div style="flex:1;min-width:0;">
            <h4 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:2px;">${p.name}</h4>
            <p style="font-size:0.75rem;color:var(--text-muted);line-height:1.4;">${p.desc}</p>
          </div>
          <span style="padding:6px 14px;border-radius:50px;font-size:0.72rem;font-weight:600;background:${p.color}12;color:${p.color};border:1px solid ${p.color}25;white-space:nowrap;flex-shrink:0;">Voir →</span>
        </a>
      `).join('')}
    </div>`;
}

// ─── Recherche cartes TCGdex (FR + JA + EN, avec métadonnées) ───
async function analyseSearchCards() {
  const q = document.getElementById('analyseSearchInput')?.value.trim();
  if (!q) return;
  analyseState.query = q;
  analyseState.card = null;
  analyseState.results = [];
  analyseState.loading = true;
  renderAnalyseTab(document.getElementById('adminMain'));

  try {
    // Recherche en parallèle sur FR, JA et EN
    const [frRes, jaRes, enRes] = await Promise.all([
      fetch('https://api.tcgdex.net/v2/fr/cards?name=like:'+encodeURIComponent(q)+'&pagination:itemsPerPage=30').then(r=>r.ok?r.json():[]),
      fetch('https://api.tcgdex.net/v2/ja/cards?name=like:'+encodeURIComponent(q)+'&pagination:itemsPerPage=20').then(r=>r.ok?r.json():[]),
      fetch('https://api.tcgdex.net/v2/en/cards?name=like:'+encodeURIComponent(q)+'&pagination:itemsPerPage=20').then(r=>r.ok?r.json():[]),
    ]);
    // Tagger chaque résultat avec sa langue et le nom du set
    const tag = (arr, lang) => (arr||[]).map(c => ({...c, _lang: lang, _setName: c.set?.name || ''}));
    const all = [...tag(frRes,'fr'), ...tag(jaRes,'ja'), ...tag(enRes,'en')];
    // Dédupliquer par ID en gardant FR en priorité, puis JA, puis EN
    const seen = new Set();
    analyseState.results = all.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return !isTCGPocketCard(c);
    }).slice(0, 50);
  } catch(e) { console.error(e); }

  analyseState.loading = false;
  renderAnalyseTab(document.getElementById('adminMain'));
}

// ─── Fetch prix temps réel via pokemontcg.io (Cardmarket + TCGPlayer) ───
async function fetchPTCGPricing(card) {
  try {
    let enName = card.name;
    if (card._lang !== 'en') {
      const enCard = await fetch('https://api.tcgdex.net/v2/en/cards/' + card.id).then(r => r.ok ? r.json() : null);
      if (enCard?.name) enName = enCard.name;
    }
    const localId = card.localId || '';
    const q = `name:"${enName}"` + (localId ? ` number:"${localId}"` : '');
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&select=name,set,number,tcgplayer,cardmarket&pageSize=5`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.length) return null;
    let match = data.data[0];
    if (data.data.length > 1) {
      const setName = (card.set?.name || '').toLowerCase();
      const better = data.data.find(c => (c.set?.name || '').toLowerCase() === setName);
      if (better) match = better;
    }
    return { cardmarket: match.cardmarket || null, tcgplayer: match.tcgplayer || null };
  } catch(e) { return null; }
}

// Normalise les prix : priorise pokemontcg.io (plus à jour), fallback TCGdex
function getPricing(card) {
  const ptcg = card._ptcg;
  if (ptcg?.cardmarket?.prices) {
    const p = ptcg.cardmarket.prices;
    return {
      source: 'Cardmarket via pokemontcg.io',
      updatedAt: ptcg.cardmarket.updatedAt || null,
      url: ptcg.cardmarket.url || null,
      avg: p.averageSellPrice, low: p.lowPrice, trend: p.trendPrice,
      avg1: p.avg1, avg7: p.avg7, avg30: p.avg30,
      'avg-holo': p.reverseHoloSell, 'low-holo': p.reverseHoloLow, 'trend-holo': p.reverseHoloTrend,
    };
  }
  const tcgdex = card.pricing?.cardmarket || {};
  return { source: 'TCGdex (cache)', updatedAt: null, url: null, ...tcgdex };
}

function getTCGPlayerPricing(card) {
  const tcgp = card._ptcg?.tcgplayer;
  if (!tcgp?.prices) return null;
  const p = tcgp.prices;
  const variant = p.holofoil || p.normal || p.reverseHolofoil || p['1stEditionHolofoil'] || p['1stEditionNormal'] || Object.values(p)[0];
  if (!variant) return null;
  const variantName = p.holofoil ? 'Holofoil' : p.normal ? 'Normal' : p.reverseHolofoil ? 'Reverse Holo' : Object.keys(p)[0];
  return {
    updatedAt: tcgp.updatedAt || null,
    url: tcgp.url || null,
    variant: variantName,
    low: variant.low, mid: variant.mid, high: variant.high,
    market: variant.market, directLow: variant.directLow,
    allVariants: p,
  };
}

// ─── Sélection d'une carte (fetch détail + prix) ───
async function selectAnalyseCard(cardId, lang) {
  analyseState.loading = true;
  renderAnalyseTab(document.getElementById('adminMain'));
  try {
    // Essayer la langue d'origine, puis FR, puis EN, puis JA
    const langs = [lang || 'fr', 'fr', 'en', 'ja'].filter((v,i,a) => a.indexOf(v)===i);
    let card = null;
    for (const l of langs) {
      card = await fetch('https://api.tcgdex.net/v2/'+l+'/cards/'+cardId).then(r=>r.ok?r.json():null);
      if (card) break;
    }
    // Si pas de pricing, chercher dans les autres langues
    if (card && !card.pricing) {
      for (const l of ['en','fr']) {
        const alt = await fetch('https://api.tcgdex.net/v2/'+l+'/cards/'+cardId).then(r=>r.ok?r.json():null);
        if (alt?.pricing) { card.pricing = alt.pricing; break; }
      }
    }
    if (card) {
      card._lang = lang || 'fr';
      card._ptcg = await fetchPTCGPricing(card);
    }
    analyseState.card = card;
    analyseState.subTab = 'prix';
  } catch(e) { showToast('Erreur de chargement'); }
  analyseState.loading = false;
  renderAnalyseTab(document.getElementById('adminMain'));
}

// ─── Graphique évolution prix Cardmarket par état ───
function buildAnalyseChart() {
  const canvas = document.getElementById('analyseChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const card = analyseState.card;
  if (!card) return;
  const cmk = getPricing(card);
  if (!cmk || cmk.avg == null) return;

  const labels = ['Moy. 30j', 'Moy. 7j', 'Moy. 1j', 'Tendance'];
  const baseData = [cmk.avg30, cmk.avg7, cmk.avg1, cmk.trend];

  // Une ligne par état de carte
  const selectedId = analyseState.condition || 'NM';
  const datasets = CARD_CONDITIONS.map(cond => {
    const isSelected = cond.id === selectedId;
    return {
      label: `${cond.id} (x${cond.multiplier.toFixed(2)})`,
      data: baseData.map(v => v != null ? +(v * cond.multiplier).toFixed(2) : null),
      borderColor: cond.color,
      backgroundColor: isSelected ? cond.color + '18' : 'transparent',
      fill: isSelected,
      tension: 0.4,
      pointRadius: isSelected ? 6 : 3,
      pointHoverRadius: isSelected ? 8 : 5,
      borderWidth: isSelected ? 3 : 1.5,
      borderDash: isSelected ? [] : [4, 3],
      pointBackgroundColor: cond.color,
      order: isSelected ? 0 : 1,
    };
  });

  new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true, position: 'top',
          labels: {
            color: '#a1a1aa', font: { size: 10 }, boxWidth: 14, padding: 10,
            usePointStyle: true, pointStyle: 'circle',
            generateLabels: (chart) => chart.data.datasets.map((ds, i) => {
              const cond = CARD_CONDITIONS[i];
              const isSelected = cond.id === selectedId;
              return {
                text: cond.id, fillStyle: cond.color, strokeStyle: cond.color,
                lineWidth: isSelected ? 3 : 1, hidden: !chart.isDatasetVisible(i),
                datasetIndex: i, fontColor: isSelected ? cond.color : '#71717a',
              };
            }),
          },
          onClick: (evt, item, legend) => {
            const ci = legend.chart;
            const idx = item.datasetIndex;
            ci.setDatasetVisibility(idx, !ci.isDatasetVisible(idx));
            ci.update();
          },
        },
        tooltip: {
          backgroundColor: 'rgba(10,10,18,0.95)', titleColor: '#fff', bodyColor: '#d4d4d8',
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, padding: 14,
          callbacks: { label: ctx => ctx.parsed.y != null ? ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} €` : '' }
        }
      },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: {
          ticks: { color: '#71717a', font: { size: 10 }, callback: v => v.toFixed(2)+' €' },
          grid: { color: 'rgba(255,255,255,0.04)' },
          beginAtZero: true,
        }
      }
    }
  });
}

if(false){ const PLATFORMS = {
  cardmarket: { name: 'Cardmarket', color: '#1a5276', icon: '🃏' },
  ebay:       { name: 'eBay',       color: '#e53238', icon: '🏷️' },
  vinted:     { name: 'Vinted',     color: '#09b1ba', icon: '👕' },
  leboncoin:  { name: 'Leboncoin',  color: '#f56b2a', icon: '📦' },
  facebook:   { name: 'Facebook',   color: '#1877f2', icon: '📱' },
};

function renderAnalyseTab(main) {
  const st = analyseState;
  const platKeys = Object.keys(PLATFORMS);
  const currentListings = st.listings[st.platform] || [];
  const allListings = Object.values(st.listings).flat();

  // Stats globales
  const prices = allListings.map(l => l.price).filter(p => p > 0);
  const avgPrice = prices.length ? prices.reduce((a,b) => a+b, 0) / prices.length : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  main.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Analyse de marché</h1>
        <p>Recherchez une carte ou un produit pour voir les annonces en temps réel sur toutes les plateformes.</p>
      </div>
    </div>

    <!-- Barre de recherche -->
    <div style="display:flex;gap:10px;margin-bottom:20px;">
      <div style="flex:1;position:relative;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" class="form-input" id="analyseSearchInput" placeholder="Ex : Dracaufeu VMAX Alt Art, Pikachu ex 151..." value="${st.query.replace(/"/g,'&quot;')}" style="padding-left:44px;font-size:0.9rem;" onkeydown="if(event.key==='Enter')launchAnalyse()">
      </div>
      <button class="admin-save-btn" onclick="launchAnalyse()" style="white-space:nowrap;" ${st.loading ? 'disabled' : ''}>${st.loading ? 'Recherche...' : 'Rechercher'}</button>
    </div>

    ${st.query && allListings.length > 0 ? `
    <!-- Stats globales -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div class="stat-card" style="padding:14px;text-align:center;">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Annonces trouvées</div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;">${allListings.length}</div>
      </div>
      <div class="stat-card" style="padding:14px;text-align:center;">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Prix moyen</div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;">${avgPrice.toFixed(2)} €</div>
      </div>
      <div class="stat-card" style="padding:14px;text-align:center;">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Prix le plus bas</div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:#4ade80;">${minPrice.toFixed(2)} €</div>
      </div>
      <div class="stat-card" style="padding:14px;text-align:center;">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Prix le plus haut</div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:#f97316;">${maxPrice.toFixed(2)} €</div>
      </div>
    </div>

    <!-- Graphique comparatif -->
    <div class="stat-card" style="padding:20px;margin-bottom:20px;">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:14px;">Comparatif des prix par plateforme</h3>
      <div style="height:200px;"><canvas id="analysePlatformChart"></canvas></div>
    </div>
    ` : ''}

    <!-- Tabs plateformes -->
    <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
      ${platKeys.map(k => {
        const p = PLATFORMS[k];
        const count = (st.listings[k] || []).length;
        const active = st.platform === k;
        return `<button class="table-btn" onclick="analyseState.platform='${k}';renderAnalyseTab(document.getElementById('adminMain'))" style="display:flex;align-items:center;gap:6px;${active ? 'border-color:' + p.color + ';color:' + p.color + ';background:' + p.color + '10;' : ''}">${p.icon} ${p.name} ${count ? '<span style="font-size:0.7rem;opacity:0.7;">(' + count + ')</span>' : ''}</button>`;
      }).join('')}
    </div>

    <!-- Résultats de la plateforme active -->
    <div id="platformListings">
      ${st.loading ? renderLoadingState() : ''}
      ${!st.loading && st.query && currentListings.length > 0 ? renderListingsGrid(currentListings, st.platform) : ''}
      ${!st.loading && st.query && currentListings.length === 0 ? renderNoResults(st.platform, st.query) : ''}
      ${!st.query ? renderEmptySearch() : ''}
    </div>
  `;

  // Build chart si résultats
  if (st.query && allListings.length > 0) {
    setTimeout(() => buildPlatformChart(), 100);
  }
}

function renderEmptySearch() {
  return `
    <div style="text-align:center;padding:60px 20px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" style="color:var(--text-muted);margin-bottom:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Recherchez un produit</h3>
      <p style="color:var(--text-muted);font-size:0.85rem;max-width:420px;margin:0 auto;">Entrez le nom d'une carte ou d'un produit Pokémon pour récupérer les annonces en temps réel sur Cardmarket, eBay, Vinted, Leboncoin et Facebook Marketplace.</p>
    </div>`;
}

function renderLoadingState() {
  return `
    <div style="text-align:center;padding:60px 20px;">
      <div style="width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--holo-1);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
      <p style="color:var(--text-muted);font-size:0.85rem;">Récupération des annonces en cours...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>`;
}

function renderNoResults(platform, query) {
  const p = PLATFORMS[platform];
  const urls = getSearchUrls(query);
  return `
    <div style="text-align:center;padding:50px 20px;">
      <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:16px;">Aucune annonce récupérée sur <strong>${p.name}</strong>.</p>
      <a href="${urls[platform]}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:50px;font-size:0.82rem;font-weight:600;background:${p.color}15;color:${p.color};border:1px solid ${p.color}30;text-decoration:none;transition:0.3s;" onmouseover="this.style.background='${p.color}25'" onmouseout="this.style.background='${p.color}15'">${p.icon} Ouvrir la recherche sur ${p.name} →</a>
    </div>`;
}

function renderListingsGrid(listings, platform) {
  const p = PLATFORMS[platform];
  const urls = getSearchUrls(analyseState.query);
  return `
    <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:0.82rem;color:var(--text-muted);">${listings.length} annonce${listings.length > 1 ? 's' : ''} trouvée${listings.length > 1 ? 's' : ''}</span>
      <a href="${urls[platform]}" target="_blank" rel="noopener" style="font-size:0.78rem;color:${p.color};text-decoration:none;display:flex;align-items:center;gap:4px;">Voir tout sur ${p.name} →</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">
      ${listings.map(l => `
        <div onclick="window.open('${l.url}','_blank')" style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:0.2s;" onmouseover="this.style.borderColor='${p.color}40';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform='none'">
          <div style="width:100%;aspect-ratio:1;background:var(--bg-elevated);overflow:hidden;position:relative;">
            ${l.image ? `<img src="${l.image}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">Pas d\'image</div>'}
            <span style="position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:6px;font-size:0.65rem;font-weight:700;background:${p.color};color:#fff;">${p.name}</span>
          </div>
          <div style="padding:12px;">
            <div style="font-size:0.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;" title="${l.title.replace(/"/g,'&quot;')}">${l.title}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-family:var(--font-display);font-size:1rem;color:${l.price > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">${l.price > 0 ? l.price.toFixed(2) + ' €' : 'Prix N/C'}</strong>
              <span style="font-size:0.65rem;color:var(--text-muted);">${l.seller || ''}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function getSearchUrls(query) {
  const q = encodeURIComponent(query + ' pokemon');
  return {
    cardmarket: `https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(query)}`,
    ebay: `https://www.ebay.fr/sch/i.html?_nkw=${q}&_sacat=0`,
    vinted: `https://www.vinted.fr/catalog?search_text=${q}`,
    leboncoin: `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query + ' pokemon carte')}`,
    facebook: `https://www.facebook.com/marketplace/search?query=${encodeURIComponent(query + ' pokemon carte')}`,
  };
}

// ─── LANCEMENT DE LA RECHERCHE MULTI-PLATEFORMES ───
async function launchAnalyse() {
  const q = document.getElementById('analyseSearchInput')?.value.trim();
  if (!q) return;
  analyseState.query = q;
  analyseState.listings = {};
  analyseState.loading = true;
  renderAnalyseTab(document.getElementById('adminMain'));

  // Lancer les scrapes en parallèle
  const fetchers = [
    scrapeEbay(q).then(r => { analyseState.listings.ebay = r; }),
    scrapeCardmarket(q).then(r => { analyseState.listings.cardmarket = r; }),
    scrapeVinted(q).then(r => { analyseState.listings.vinted = r; }),
    scrapeLeboncoin(q).then(r => { analyseState.listings.leboncoin = r; }),
  ];
  // Facebook n'a pas de page scrapable facilement, on met un array vide
  analyseState.listings.facebook = [];

  await Promise.allSettled(fetchers);
  analyseState.loading = false;

  // Sélectionner le premier onglet avec des résultats
  const first = Object.keys(PLATFORMS).find(k => (analyseState.listings[k] || []).length > 0);
  if (first) analyseState.platform = first;

  renderAnalyseTab(document.getElementById('adminMain'));
}

// ─── PROXY FETCH ───
async function proxyFetch(url) {
  const proxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
  ];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url), { signal: AbortSignal.timeout(12000) });
      if (res.ok) return await res.text();
    } catch(e) { continue; }
  }
  return null;
}

// ─── SCRAPE EBAY ───
async function scrapeEbay(query) {
  try {
    const url = `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(query + ' pokemon')}&_sacat=0&LH_BIN=1&_sop=15`;
    const html = await proxyFetch(url);
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = doc.querySelectorAll('.s-item');
    const results = [];
    items.forEach(item => {
      const titleEl = item.querySelector('.s-item__title span, .s-item__title');
      const priceEl = item.querySelector('.s-item__price');
      const imgEl = item.querySelector('.s-item__image img');
      const linkEl = item.querySelector('.s-item__link');
      if (!titleEl || !priceEl) return;
      const title = titleEl.textContent.trim();
      if (title === 'Shop on eBay' || title.includes('Résultats')) return;
      const priceText = priceEl.textContent.replace(/[^\d,.]/g, '').replace(',', '.');
      const price = parseFloat(priceText) || 0;
      const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';
      const link = linkEl?.href || '';
      if (title && price > 0) results.push({ title, price, image, url: link, seller: '' });
    });
    return results.slice(0, 20);
  } catch(e) { return []; }
}

// ─── SCRAPE CARDMARKET ───
async function scrapeCardmarket(query) {
  try {
    const url = `https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(query)}`;
    const html = await proxyFetch(url);
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('.table-body .row, table.table tbody tr, .product-row, [class*="product"]');
    const results = [];
    // Essayer le format table
    const tableRows = doc.querySelectorAll('table tbody tr, .table-body .row');
    tableRows.forEach(row => {
      const linkEl = row.querySelector('a[href*="/Products/"]');
      const imgEl = row.querySelector('img');
      const priceEls = row.querySelectorAll('[class*="price"], .price-container, td:last-child');
      if (!linkEl) return;
      const title = linkEl.textContent.trim();
      let price = 0;
      priceEls.forEach(pe => {
        const m = pe.textContent.match(/([\d,.]+)\s*€/);
        if (m && !price) price = parseFloat(m[1].replace(',', '.'));
      });
      const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';
      const link = 'https://www.cardmarket.com' + (linkEl.getAttribute('href') || '');
      if (title) results.push({ title, price, image, url: link, seller: '' });
    });
    // Fallback : chercher les liens produit
    if (results.length === 0) {
      doc.querySelectorAll('a[href*="/Pokemon/Products/Singles/"]').forEach(a => {
        const title = a.textContent.trim();
        const link = 'https://www.cardmarket.com' + a.getAttribute('href');
        if (title && title.length > 3) results.push({ title, price: 0, image: '', url: link, seller: '' });
      });
    }
    return results.slice(0, 20);
  } catch(e) { return []; }
}

// ─── SCRAPE VINTED ───
async function scrapeVinted(query) {
  try {
    const url = `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(query + ' pokemon')}`;
    const html = await proxyFetch(url);
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const results = [];
    // Vinted utilise du JS hydration, chercher les données JSON dans le HTML
    const scripts = doc.querySelectorAll('script');
    for (const sc of scripts) {
      const text = sc.textContent;
      if (text.includes('"catalog_items"') || text.includes('"items"')) {
        try {
          // Chercher un bloc JSON avec les items
          const match = text.match(/"items"\s*:\s*(\[[\s\S]*?\])/);
          if (match) {
            const items = JSON.parse(match[1]);
            items.forEach(item => {
              results.push({
                title: item.title || '',
                price: parseFloat(item.price || item.total_item_price || 0),
                image: item.photo?.url || item.photos?.[0]?.url || '',
                url: `https://www.vinted.fr/items/${item.id}`,
                seller: item.user?.login || '',
              });
            });
          }
        } catch(e) {}
      }
    }
    // Fallback : parser le HTML directement
    if (results.length === 0) {
      doc.querySelectorAll('[data-testid*="item"], .feed-grid__item, [class*="ItemBox"]').forEach(el => {
        const titleEl = el.querySelector('[data-testid*="title"], [class*="title"]');
        const priceEl = el.querySelector('[data-testid*="price"], [class*="price"]');
        const imgEl = el.querySelector('img');
        const linkEl = el.querySelector('a[href*="/items/"]');
        if (titleEl || priceEl) {
          const priceText = (priceEl?.textContent || '').replace(/[^\d,.]/g, '').replace(',', '.');
          results.push({
            title: titleEl?.textContent?.trim() || 'Article Vinted',
            price: parseFloat(priceText) || 0,
            image: imgEl?.src || imgEl?.getAttribute('data-src') || '',
            url: linkEl ? 'https://www.vinted.fr' + linkEl.getAttribute('href') : url,
            seller: '',
          });
        }
      });
    }
    return results.slice(0, 20);
  } catch(e) { return []; }
}

// ─── SCRAPE LEBONCOIN ───
async function scrapeLeboncoin(query) {
  try {
    const url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query + ' pokemon carte')}&category=55`;
    const html = await proxyFetch(url);
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const results = [];
    // LBC utilise Next.js, les données sont dans __NEXT_DATA__
    const nextScript = doc.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        const data = JSON.parse(nextScript.textContent);
        const ads = data?.props?.pageProps?.searchData?.ads || data?.props?.pageProps?.ads || [];
        ads.forEach(ad => {
          results.push({
            title: ad.subject || ad.title || '',
            price: ad.price?.[0] || parseFloat(ad.price_cents) / 100 || 0,
            image: ad.images?.urls_large?.[0] || ad.images?.small_url || ad.images?.urls?.[0] || '',
            url: ad.url ? `https://www.leboncoin.fr${ad.url}` : url,
            seller: ad.owner?.name || '',
          });
        });
      } catch(e) {}
    }
    // Fallback HTML
    if (results.length === 0) {
      doc.querySelectorAll('[data-qa-id="aditem_container"], a[href*="/ad/"]').forEach(el => {
        const titleEl = el.querySelector('[data-qa-id="aditem_title"], [class*="title"]');
        const priceEl = el.querySelector('[data-qa-id="aditem_price"], [class*="price"]');
        const imgEl = el.querySelector('img');
        if (titleEl) {
          const priceText = (priceEl?.textContent || '').replace(/[^\d,.]/g, '').replace(',', '.');
          results.push({
            title: titleEl.textContent.trim(),
            price: parseFloat(priceText) || 0,
            image: imgEl?.src || '',
            url: el.href || url,
            seller: '',
          });
        }
      });
    }
    return results.slice(0, 20);
  } catch(e) { return []; }
}

// ─── GRAPHIQUE COMPARATIF PAR PLATEFORME ───
function buildPlatformChart() {
  const canvas = document.getElementById('analysePlatformChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = [];
  const avgData = [];
  const minData = [];
  const colors = [];

  Object.keys(PLATFORMS).forEach(k => {
    const list = analyseState.listings[k] || [];
    const prices = list.map(l => l.price).filter(p => p > 0);
    if (prices.length === 0) return;
    labels.push(PLATFORMS[k].name);
    avgData.push(prices.reduce((a,b) => a+b, 0) / prices.length);
    minData.push(Math.min(...prices));
    colors.push(PLATFORMS[k].color);
  });

  if (labels.length === 0) return;

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Prix moyen', data: avgData, backgroundColor: colors.map(c => c + 'aa'), borderColor: colors, borderWidth: 1, borderRadius: 6 },
        { label: 'Prix min', data: minData, backgroundColor: colors.map(c => c + '44'), borderColor: colors.map(c => c + '88'), borderWidth: 1, borderRadius: 6 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: '#a1a1aa', font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: 'rgba(10,10,18,0.9)', titleColor: '#fff', bodyColor: '#d4d4d8',
          callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} €` }
        }
      },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#71717a', font: { size: 10 }, callback: v => v.toFixed(0) + ' €' }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}} /* fin ancien scraping + if(false) */


// ═══════════════════════════════════════
//  ACCOUNTING TAB
// ═══════════════════════════════════════
let accountingView = 'dashboard'; // 'dashboard' | 'orders' | 'stock' | 'expenses'

function getExpenses() { return JSON.parse(localStorage.getItem('holofoil_expenses') || '[]'); }
function saveExpenses(e) { localStorage.setItem('holofoil_expenses', JSON.stringify(e)); }

function renderAccountingTab(container) {
  const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
  const listings = getListings();
  const expenses = getExpenses();

  // Calculs
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalOrders = orders.length;
  const totalCostStock = listings.reduce((s, l) => s + ((l.costPrice || 0) * (l.type === 'Carte' ? 1 : (l.stockQty || 1))), 0);
  const totalSellValue = listings.reduce((s, l) => s + (l.price * (l.type === 'Carte' ? 1 : (l.stockQty || 1))), 0);
  const totalPotentialMargin = totalSellValue - totalCostStock;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const itemsWithCost = listings.filter(l => (l.costPrice || 0) > 0).length;
  const itemsNoCost = listings.length - itemsWithCost;

  const tabBtn = (id, label, icon) => `<button class="table-btn" onclick="accountingView='${id}';renderAccountingTab(document.getElementById('adminMain'))" style="${accountingView === id ? 'border-color:var(--holo-1);color:var(--holo-1);background:rgba(77,201,246,0.06);' : ''}">${icon} ${label}</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <h1>Comptabilité</h1>
      <div class="admin-header-actions" style="gap:8px;">
        ${tabBtn('dashboard','Tableau de bord','📊')}
        ${tabBtn('orders','Commandes','🧾')}
        ${tabBtn('stock','Stocks & Marges','📦')}
        ${tabBtn('expenses','Dépenses','💸')}
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:32px;">
      <div class="stat-card">
        <div class="stat-label">CA réalisé</div>
        <div class="stat-value" style="color:#4ade80;">${totalRevenue.toFixed(2)} €</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Dépenses</div>
        <div class="stat-value" style="color:#ef4444;">${totalExpenses.toFixed(2)} €</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bénéfice net</div>
        <div class="stat-value" style="color:${netProfit >= 0 ? '#4ade80' : '#ef4444'};">${netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} €</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Investissement stock</div>
        <div class="stat-value">${totalCostStock.toFixed(2)} €</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">+Value potentielle</div>
        <div class="stat-value" style="color:${totalPotentialMargin >= 0 ? '#4ade80' : '#ef4444'};">${totalPotentialMargin >= 0 ? '+' : ''}${totalPotentialMargin.toFixed(2)} €</div>
      </div>
    </div>

    <div id="accountingContent"></div>
  `;

  if (accountingView === 'dashboard') renderDashboardView(orders, listings, expenses);
  else if (accountingView === 'orders') renderOrdersView();
  else if (accountingView === 'stock') renderStockView();
  else if (accountingView === 'expenses') renderExpensesView();
}

// ─── DASHBOARD ───
function renderDashboardView(orders, listings, expenses) {
  const el = document.getElementById('accountingContent');
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const itemsWithCost = listings.filter(l => (l.costPrice || 0) > 0);
  const itemsNoCost = listings.filter(l => !(l.costPrice || 0));

  // Top 5 most profitable items
  const profitItems = [...listings].filter(l => l.costPrice > 0).map(l => {
    const qty = (l.type === 'Carte') ? 1 : (l.stockQty || 1);
    return { name: l.name, margin: l.price - l.costPrice, total: (l.price - l.costPrice) * qty, type: l.type || 'Carte' };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  // Recent orders
  const recentOrders = [...orders].reverse().slice(0, 5);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <!-- Left: P&L summary -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;">
        <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:20px;">Compte de résultat</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
            <span style="color:var(--text-secondary);">Ventes (${orders.length} commandes)</span>
            <strong style="color:#4ade80;">+${totalRevenue.toFixed(2)} €</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
            <span style="color:var(--text-secondary);">Dépenses (${expenses.length} entrées)</span>
            <strong style="color:#ef4444;">-${totalExpenses.toFixed(2)} €</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:1.1rem;">
            <strong>Résultat net</strong>
            <strong style="font-family:var(--font-display);font-size:1.2rem;color:${(totalRevenue - totalExpenses) >= 0 ? '#4ade80' : '#ef4444'};">${(totalRevenue - totalExpenses) >= 0 ? '+' : ''}${(totalRevenue - totalExpenses).toFixed(2)} €</strong>
          </div>
        </div>
        ${itemsNoCost.length > 0 ? `<p style="margin-top:16px;padding:10px 14px;border-radius:8px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.15);font-size:0.78rem;color:#f97316;">⚠ ${itemsNoCost.length} produit(s) sans prix d'achat renseigné — <a href="#" onclick="event.preventDefault();accountingView='stock';renderAccountingTab(document.getElementById('adminMain'))" style="color:#f97316;text-decoration:underline;">compléter</a></p>` : ''}
      </div>

      <!-- Right: Top margins -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;">
        <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:20px;">Top 5 — Meilleures marges</h3>
        ${profitItems.length === 0 ? '<p style="color:var(--text-muted);font-size:0.85rem;">Renseignez les prix d\'achat pour voir les marges.</p>' : `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${profitItems.map((p, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;${i < profitItems.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">
              <span style="width:20px;font-size:0.75rem;color:var(--text-muted);font-weight:700;">#${i + 1}</span>
              <span style="flex:1;font-size:0.85rem;font-weight:600;">${p.name}</span>
              <span style="font-size:0.75rem;color:var(--text-muted);">+${p.margin.toFixed(2)} €/u</span>
              <strong style="font-family:var(--font-display);color:#4ade80;">+${p.total.toFixed(2)} €</strong>
            </div>
          `).join('')}
        </div>`}
      </div>
    </div>

    <!-- Recent orders -->
    ${recentOrders.length > 0 ? `
    <div style="margin-top:24px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;">
      <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:16px;">Dernières commandes</h3>
      ${recentOrders.map(o => `
        <div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:0.8rem;font-family:var(--font-display);font-weight:600;min-width:110px;">${o.id || '—'}</span>
          <span style="flex:1;font-size:0.85rem;color:var(--text-secondary);">${o.userName || o.email}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);">${o.date}</span>
          <strong style="font-family:var(--font-display);">${parseFloat(o.total).toFixed(2)} €</strong>
        </div>
      `).join('')}
    </div>` : ''}
  `;
}

// ─── ORDERS VIEW ───
function renderOrdersView() {
  const el = document.getElementById('accountingContent');
  const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]').reverse();

  if (orders.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>Aucune commande enregistrée.</p></div>';
    return;
  }

  el.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>N° commande</th>
            <th>Client</th>
            <th>Date</th>
            <th>Articles</th>
            <th>Total</th>
            <th>Facture</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((o, i) => `
            <tr>
              <td><strong style="font-family:var(--font-display);font-size:0.8rem;">${o.id || 'HOL-' + (o.ts || i)}</strong></td>
              <td>
                <div style="font-size:0.85rem;">${o.userName || o.email}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">${o.email}</div>
              </td>
              <td style="font-size:0.85rem;">${o.date}</td>
              <td>${o.items} article${o.items > 1 ? 's' : ''}</td>
              <td><strong>${parseFloat(o.total).toFixed(2)} €</strong></td>
              <td>
                <button class="table-btn" onclick="downloadInvoice(${i})" style="display:flex;align-items:center;gap:6px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                  PDF
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ─── STOCK VIEW (with inline cost editing) ───
function renderStockView() {
  const el = document.getElementById('accountingContent');
  const listings = getListings();

  if (listings.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>Aucun produit en stock.</p></div>';
    return;
  }

  const totalCost = listings.reduce((s, l) => s + ((l.costPrice || 0) * (l.type === 'Carte' ? 1 : (l.stockQty || 1))), 0);
  const totalSell = listings.reduce((s, l) => s + (l.price * (l.type === 'Carte' ? 1 : (l.stockQty || 1))), 0);

  el.innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:20px;">
      <div style="padding:12px 20px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);font-size:0.85rem;">
        Total investi : <strong>${totalCost.toFixed(2)} €</strong>
      </div>
      <div style="padding:12px 20px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);font-size:0.85rem;">
        Valeur revente : <strong>${totalSell.toFixed(2)} €</strong>
      </div>
      <div style="padding:12px 20px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);font-size:0.85rem;">
        +Value globale : <strong style="color:${(totalSell - totalCost) >= 0 ? '#4ade80' : '#ef4444'};">${(totalSell - totalCost) >= 0 ? '+' : ''}${(totalSell - totalCost).toFixed(2)} €</strong>
      </div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Type</th>
            <th>Qté</th>
            <th>Prix d'achat (modifiable)</th>
            <th>Prix de vente</th>
            <th>Marge / unité</th>
            <th>+Value totale</th>
          </tr>
        </thead>
        <tbody>
          ${listings.map((l, i) => {
            const type = l.type || 'Carte';
            const qty = type === 'Carte' ? 1 : (l.stockQty || 0);
            const cost = l.costPrice || 0;
            const sell = l.price || 0;
            const marginUnit = sell - cost;
            const marginTotal = marginUnit * qty;
            const typeColors = { 'Carte':'var(--holo-1)', 'Booster':'#f97316', 'ETB':'#a855f7', 'Coffret':'#22d3ee', 'Display':'#ec4899', 'Bundle':'#4ade80' };
            const tc = typeColors[type] || 'var(--text-muted)';
            const mc = cost > 0 ? (marginUnit > 0 ? '#4ade80' : marginUnit < 0 ? '#ef4444' : 'var(--text-muted)') : 'var(--text-muted)';

            return `
              <tr>
                <td>
                  <div class="card-info">
                    ${l.image ? `<img src="${l.image}" class="card-thumb" alt="">` : `<div class="card-thumb" style="background:var(--bg-elevated);"></div>`}
                    <div class="card-info-text">
                      <h4>${l.name}</h4>
                      <p>${l.set || '—'}</p>
                    </div>
                  </div>
                </td>
                <td><span style="font-size:0.75rem;font-weight:600;color:${tc};">${type}</span></td>
                <td><span style="font-weight:600;color:${qty > 0 ? '#4ade80' : '#ef4444'};">${qty}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <input type="number" value="${cost || ''}" placeholder="0.00" step="0.01" min="0"
                      style="width:90px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-input);color:var(--text-primary);font-size:0.85rem;font-family:inherit;outline:none;"
                      onfocus="this.style.borderColor='var(--holo-1)'"
                      onblur="this.style.borderColor='var(--border)';updateCostPrice(${i},this.value)">
                    <span style="font-size:0.8rem;color:var(--text-muted);">€</span>
                  </div>
                </td>
                <td><strong>${sell.toFixed(2)} €</strong></td>
                <td><span style="font-weight:600;color:${mc};">${cost > 0 ? (marginUnit >= 0 ? '+' : '') + marginUnit.toFixed(2) + ' €' : '—'}</span></td>
                <td><span style="font-weight:700;font-family:var(--font-display);color:${mc};">${cost > 0 ? (marginTotal >= 0 ? '+' : '') + marginTotal.toFixed(2) + ' €' : '—'}</span></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function updateCostPrice(listingIndex, value) {
  const listings = getListings();
  if (!listings[listingIndex]) return;
  listings[listingIndex].costPrice = parseFloat(value) || 0;
  saveListings(listings);
}

// ─── EXPENSES VIEW ───
function renderExpensesView() {
  const el = document.getElementById('accountingContent');
  const expenses = getExpenses();
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  el.innerHTML = `
    <!-- Add expense form -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;">
      <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:16px;">Ajouter une dépense</h3>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div style="flex:2;min-width:200px;">
          <label style="display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Description *</label>
          <input type="text" id="expDesc" placeholder="Ex: Achat lot 50 boosters, Frais d'envoi..." class="form-input" style="padding:10px 14px;font-size:0.85rem;">
        </div>
        <div style="flex:1;min-width:120px;">
          <label style="display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Montant (€) *</label>
          <input type="number" id="expAmount" placeholder="0.00" step="0.01" min="0" class="form-input" style="padding:10px 14px;font-size:0.85rem;">
        </div>
        <div style="flex:1;min-width:140px;">
          <label style="display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Catégorie</label>
          <select id="expCategory" class="form-select" style="padding:10px 14px;font-size:0.85rem;width:100%;">
            <option value="stock">Achat stock</option>
            <option value="shipping">Frais d'envoi</option>
            <option value="packaging">Emballage</option>
            <option value="platform">Frais plateforme</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div style="flex:1;min-width:130px;">
          <label style="display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Date</label>
          <input type="date" id="expDate" class="form-input" style="padding:10px 14px;font-size:0.85rem;" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="holo-btn-filled" onclick="addExpense()" style="padding:10px 24px;font-size:0.85rem;white-space:nowrap;">+ Ajouter</button>
      </div>
    </div>

    <!-- Total -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <span style="font-size:0.9rem;color:var(--text-secondary);">${expenses.length} dépense(s) enregistrée(s)</span>
      <strong style="font-family:var(--font-display);font-size:1.1rem;color:#ef4444;">Total : ${total.toFixed(2)} €</strong>
    </div>

    <!-- Expenses table -->
    ${expenses.length === 0 ? '<div class="empty-state"><p>Aucune dépense enregistrée.</p></div>' : `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Catégorie</th>
            <th>Montant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${[...expenses].reverse().map((e, ri) => {
            const i = expenses.length - 1 - ri;
            const catLabels = { stock:'Achat stock', shipping:'Frais d\'envoi', packaging:'Emballage', platform:'Frais plateforme', other:'Autre' };
            const catColors = { stock:'#a855f7', shipping:'#f97316', packaging:'#22d3ee', platform:'#ec4899', other:'var(--text-muted)' };
            return `
              <tr>
                <td style="font-size:0.85rem;">${e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td style="font-size:0.85rem;">${e.description}</td>
                <td><span style="padding:3px 10px;border-radius:50px;font-size:0.7rem;font-weight:600;background:${catColors[e.category] || 'var(--text-muted)'}20;color:${catColors[e.category] || 'var(--text-muted)'};">${catLabels[e.category] || e.category}</span></td>
                <td><strong style="color:#ef4444;">${e.amount.toFixed(2)} €</strong></td>
                <td><button class="table-btn danger" onclick="deleteExpense(${i})">Supprimer</button></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

function addExpense() {
  const desc = document.getElementById('expDesc').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  const date = document.getElementById('expDate').value;

  if (!desc) { alert('Veuillez entrer une description.'); return; }
  if (!amount || amount <= 0) { alert('Veuillez entrer un montant valide.'); return; }

  const expenses = getExpenses();
  expenses.push({ description: desc, amount, category, date, ts: Date.now() });
  saveExpenses(expenses);
  renderAccountingTab(document.getElementById('adminMain'));
}

function deleteExpense(index) {
  if (!confirm('Supprimer cette dépense ?')) return;
  const expenses = getExpenses();
  expenses.splice(index, 1);
  saveExpenses(expenses);
  renderAccountingTab(document.getElementById('adminMain'));
}

// ─── INVOICE PDF GENERATION ───
function downloadInvoice(orderIndex) {
  const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]').reverse();
  const o = orders[orderIndex];
  if (!o) return;

  const items = o.details || [{ name: 'Article', price: o.total }];
  const invoiceId = o.id || 'HOL-' + (o.ts || orderIndex);

  // Build invoice HTML
  const invoiceHTML = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Facture ${invoiceId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #e8e8f0; }
  .logo { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; }
  .logo span { color: #4dc9f6; }
  .invoice-info { text-align: right; font-size: 0.85rem; color: #666; }
  .invoice-info strong { color: #1a1a2e; font-size: 1rem; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .party { font-size: 0.85rem; line-height: 1.7; }
  .party h4 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; border-bottom: 2px solid #e8e8f0; }
  td { padding: 14px 16px; font-size: 0.9rem; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .total-row { background: #f8f9fa; font-weight: 700; }
  .total-row td { font-size: 1.05rem; border-top: 2px solid #e8e8f0; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e8e8f0; font-size: 0.75rem; color: #999; text-align: center; line-height: 1.6; }
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">HOLO<span>FOIL</span></div>
      <p style="font-size:0.8rem;color:#666;margin-top:4px;">Cartes Pokemon Premium</p>
    </div>
    <div class="invoice-info">
      <strong>Facture ${invoiceId}</strong><br>
      Date : ${o.date}<br>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h4>Vendeur</h4>
      <strong>Holofoil</strong><br>
      contact@holofoil.fr
    </div>
    <div class="party" style="text-align:right;">
      <h4>Client</h4>
      <strong>${o.userName || '—'}</strong><br>
      ${o.email}<br>
      ${o.userAddress ? o.userAddress + '<br>' : ''}
      ${o.userCity ? o.userCity + (o.userZip ? ' ' + o.userZip : '') : ''}
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Produit</th><th>Set</th><th style="text-align:right;">Prix</th></tr></thead>
    <tbody>
      ${items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.name}</td><td>${it.set || '—'}</td><td style="text-align:right;">${parseFloat(it.price).toFixed(2)} &euro;</td></tr>`).join('')}
      <tr class="total-row"><td colspan="3" style="text-align:right;">Total</td><td style="text-align:right;">${parseFloat(o.total).toFixed(2)} &euro;</td></tr>
    </tbody>
  </table>
  <div class="footer">
    Holofoil &mdash; Cartes Pokemon Premium<br>
    Merci pour votre achat !
  </div>
</body></html>`;

  // Open in new window for print/save as PDF
  const win = window.open('', '_blank');
  win.document.write(invoiceHTML);
  win.document.close();
  setTimeout(() => win.print(), 500);
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
              <th>Origine</th>
              <th>État</th>
              <th>Stock</th>
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
                <td><span style="font-size:0.8rem;">${{'FR':'🇫🇷','EN':'🇬🇧','JA':'🇯🇵','KO':'🇰🇷','DE':'🇩🇪','ES':'🇪🇸','IT':'🇮🇹','PT':'🇧🇷','CN':'🇨🇳','TW':'🇹🇼'}[l.origin] || '🇫🇷'}</span></td>
                <td><span class="condition-badge condition-${l.conditionClass || 'nm'}">${l.condition}</span></td>
                <td>${(l.type || 'Carte') !== 'Carte' ? `<span style="font-size:0.75rem;font-weight:600;color:${(l.stockQty || 0) > 0 ? '#4ade80' : '#ef4444'};">${(l.stockQty || 0) > 0 ? (l.stockQty + ' en stock') : 'Hors stock'}</span>` : '<span style="font-size:0.75rem;color:var(--text-muted);">1</span>'}</td>
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
            <label class="form-label">Prix de vente (€) *</label>
            <input type="number" class="form-input" id="modalCardPrice" placeholder="29.99" step="0.01" min="0" value="${listing?.price || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Prix d'achat (€)</label>
            <input type="number" class="form-input" id="modalCostPrice" placeholder="15.00" step="0.01" min="0" value="${listing?.costPrice || ''}">
            <p style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">Usage interne — non visible par les clients</p>
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
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Set / Extension</label>
            <input type="text" class="form-input" id="modalCardSet" placeholder="Ex: Écarlate & Violet" value="${listing?.set || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Provenance</label>
            <select class="form-select" id="modalCardOrigin">
              <option value="FR" ${(!listing || listing.origin === 'FR') ? 'selected' : ''}>🇫🇷 Française</option>
              <option value="EN" ${listing?.origin === 'EN' ? 'selected' : ''}>🇬🇧 Anglaise</option>
              <option value="JA" ${listing?.origin === 'JA' ? 'selected' : ''}>🇯🇵 Japonaise</option>
              <option value="KO" ${listing?.origin === 'KO' ? 'selected' : ''}>🇰🇷 Coréenne</option>
              <option value="DE" ${listing?.origin === 'DE' ? 'selected' : ''}>🇩🇪 Allemande</option>
              <option value="ES" ${listing?.origin === 'ES' ? 'selected' : ''}>🇪🇸 Espagnole</option>
              <option value="IT" ${listing?.origin === 'IT' ? 'selected' : ''}>🇮🇹 Italienne</option>
              <option value="PT" ${listing?.origin === 'PT' ? 'selected' : ''}>🇧🇷 Portugaise</option>
              <option value="CN" ${listing?.origin === 'CN' ? 'selected' : ''}>🇨🇳 Chinoise</option>
              <option value="TW" ${listing?.origin === 'TW' ? 'selected' : ''}>🇹🇼 Taïwanaise</option>
            </select>
          </div>
        </div>
        <div class="form-group" id="rarityGroup">
          <label class="form-label">Rareté</label>
          <input type="text" class="form-input" id="modalCardRarity" placeholder="Ex: Ultra Rare" value="${listing?.rarity || ''}">
        </div>
        <div class="form-group" id="stockGroup" style="display:none;">
          <label class="form-label">Quantité en stock</label>
          <input type="number" class="form-input" id="modalStockQty" placeholder="Ex: 5" min="0" step="1" value="${listing?.stockQty != null ? listing.stockQty : 1}" style="max-width:160px;">
          <p style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">0 = Hors stock</p>
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
  const stockGroup = document.getElementById('stockGroup');
  const apiSection = document.getElementById('modalApiSection');
  const customSection = document.getElementById('modalCustomSection');
  const customLabel = document.getElementById('customUploadLabel');

  if (isCard) {
    // Cards: show API search + photo upload both visible
    imageTabs.style.display = 'none'; // hide tabs, both sections always visible
    apiSection.style.display = '';
    customSection.style.display = '';
    rarityGroup.style.display = '';
    stockGroup.style.display = 'none';
    if (customLabel) customLabel.textContent = 'Photos de la carte (état réel)';
  } else {
    // Sealed products: only custom upload + stock toggle
    imageTabs.style.display = 'none';
    apiSection.style.display = 'none';
    customSection.style.display = '';
    rarityGroup.style.display = 'none';
    stockGroup.style.display = '';
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

// ─── API SEARCH — FR + JA focus ───
const API_LANGS = ['fr', 'en', 'ja'];

// TCG Pocket set IDs to exclude (mobile game, not physical cards)
const TCGP_SET_IDS = ['P-A', 'A1', 'A1a', 'A2', 'A2a', 'A2b', 'A3', 'A3a', 'B1', 'B1a', 'B2'];

// FR → JA name translation for common Pokémon
// Keys must be lowercase, both with and without accents
const _FR_JA_BASE = {
  'dracaufeu':'リザードン','pikachu':'ピカチュウ','mewtwo':'ミュウツー','mew':'ミュウ',
  'ronflex':'カビゴン','tortank':'カメックス','florizarre':'フシギバナ','evoli':'イーブイ',
  'leviator':'ギャラドス','léviator':'ギャラドス',
  'ectoplasma':'ゲンガー','dracolosse':'カイリュー','lucario':'ルカリオ',
  'rayquaza':'レックウザ','lugia':'ルギア',
  'sulfura':'ファイヤー','artikodin':'フリーザー','electhor':'サンダー',
  'arceus':'アルセウス','dialga':'ディアルガ','palkia':'パルキア',
  'giratina':'ギラティナ','gardevoir':'サーナイト','gallame':'エルレイド',
  'tyranocif':'バンギラス',
  'mentali':'エーフィ','noctali':'ブラッキー','aquali':'シャワーズ','voltali':'サンダース',
  'pyroli':'ブースター','phyllali':'リーフィア','givrali':'グレイシア','nymphali':'ニンフィア',
  'salamèche':'ヒトカゲ','salameche':'ヒトカゲ',
  'reptincel':'リザード',
  'carapuce':'ゼニガメ','carabaffe':'カメール',
  'bulbizarre':'フシギダネ','herbizarre':'フシギソウ',
  'raichu':'ライチュウ','magicarpe':'コイキング',
  'métamorph':'メタモン','metamorph':'メタモン',
  'lokhlass':'ラプラス','minidraco':'ミニリュウ',
  'draco':'ハクリュー',
  'abra':'ケーシィ','kadabra':'ユンゲラー','alakazam':'フーディン',
  'machoc':'ワンリキー','machopeur':'ゴーリキー','mackogneur':'カイリキー',
  'feunard':'キュウコン','goupix':'ロコン',
  'caninos':'ガーディ','arcanin':'ウインディ',
  'osselait':'カラカラ','ossatueur':'ガラガラ',
  'élektek':'エレブー','elektek':'エレブー',
  'magmar':'ブーバー','scarabrute':'カイロス','tauros':'ケンタロス',
  'latios':'ラティオス','latias':'ラティアス',
  'groudon':'グラードン','kyogre':'カイオーガ',
  'deoxys':'デオキシス','darkrai':'ダークライ','cresselia':'クレセリア',
  'reshiram':'レシラム','zekrom':'ゼクロム','kyurem':'キュレム',
  'xerneas':'ゼルネアス','yveltal':'イベルタル','zygarde':'ジガルデ',
  'solgaleo':'ソルガレオ','lunala':'ルナアーラ','necrozma':'ネクロズマ',
  'celebi':'セレビィ','jirachi':'ジラーチ',
  'suicune':'スイクン','entei':'エンテイ','raikou':'ライコウ','hooh':'ホウオウ','ho-oh':'ホウオウ',
  'zoroark':'ゾロアーク','zorua':'ゾロア','absol':'アブソル',
  'amphinobi':'ゲッコウガ','braségali':'バシャーモ','brasegali':'バシャーモ',
  'jungko':'ジュカイン','laggron':'ラグラージ',
  'regice':'レジアイス','regirock':'レジロック','registeel':'レジスチル','regigigas':'レジギガス',
  'heatran':'ヒードラン',
};
// Build lookup with accent-stripped duplicates
const FR_TO_JA = {};
for (const [k, v] of Object.entries(_FR_JA_BASE)) {
  FR_TO_JA[k] = v;
  const stripped = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (stripped !== k) FR_TO_JA[stripped] = v;
}

// EN → JA translation
const EN_TO_JA = {
  'charizard':'リザードン','pikachu':'ピカチュウ','mewtwo':'ミュウツー','mew':'ミュウ',
  'snorlax':'カビゴン','blastoise':'カメックス','venusaur':'フシギバナ','eevee':'イーブイ',
  'gyarados':'ギャラドス','gengar':'ゲンガー','dragonite':'カイリュー','lucario':'ルカリオ',
  'rayquaza':'レックウザ','lugia':'ルギア','moltres':'ファイヤー','articuno':'フリーザー',
  'zapdos':'サンダー','arceus':'アルセウス','dialga':'ディアルガ','palkia':'パルキア',
  'giratina':'ギラティナ','gardevoir':'サーナイト','tyranitar':'バンギラス',
  'espeon':'エーフィ','umbreon':'ブラッキー','vaporeon':'シャワーズ','jolteon':'サンダース',
  'flareon':'ブースター','leafeon':'リーフィア','glaceon':'グレイシア','sylveon':'ニンフィア',
  'charmander':'ヒトカゲ','charmeleon':'リザード','squirtle':'ゼニガメ','wartortle':'カメール',
  'bulbasaur':'フシギダネ','ivysaur':'フシギソウ','raichu':'ライチュウ','magikarp':'コイキング',
  'ditto':'メタモン','lapras':'ラプラス','dratini':'ミニリュウ','dragonair':'ハクリュー',
  'alakazam':'フーディン','machamp':'カイリキー','ninetales':'キュウコン','vulpix':'ロコン',
  'growlithe':'ガーディ','arcanine':'ウインディ','latios':'ラティオス','latias':'ラティアス',
  'groudon':'グラードン','kyogre':'カイオーガ','reshiram':'レシラム','zekrom':'ゼクロム',
  'greninja':'ゲッコウガ','blaziken':'バシャーモ','sceptile':'ジュカイン','swampert':'ラグラージ',
  'ho-oh':'ホウオウ','hooh':'ホウオウ','suicune':'スイクン','entei':'エンテイ','raikou':'ライコウ',
  'celebi':'セレビィ','jirachi':'ジラーチ','deoxys':'デオキシス','darkrai':'ダークライ',
  'absol':'アブソル','zoroark':'ゾロアーク','zorua':'ゾロア',
};

function isTCGPocketCard(card) {
  const id = card.id || '';
  // TCG Pocket card IDs start with the set ID (e.g. "A1-001", "A2a-045")
  return TCGP_SET_IDS.some(setId => id.startsWith(setId + '-'));
}

async function fetchCardsFromLang(lang, query) {
  try {
    const url = `https://api.tcgdex.net/v2/${lang}/cards?name=like:${encodeURIComponent(query)}&pagination:itemsPerPage=50`;
    // console.log(`[Holofoil] Fetching ${lang}:`, url);
    const res = await fetch(url);
    if (!res.ok) { return []; }
    const data = await res.json();
    const filtered = data.filter(c => !isTCGPocketCard(c)).map(c => ({ ...c, _lang: lang }));
    // console.log(`[Holofoil] ${lang} results: ${filtered.length} (raw: ${data.length})`);
    return filtered;
  } catch (err) { /* console.error(`[Holofoil] ${lang} error:`, err); */ return []; }
}

async function searchApi() {
  const query = document.getElementById('apiSearchInput').value.trim();
  if (!query) return;

  const results = document.getElementById('apiResults');
  results.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;padding:12px;">Recherche en cours (FR + JA)...</p>';

  // Build JA search term from translation tables
  const queryLow = query.toLowerCase().trim();
  const queryNoAccent = queryLow.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Exact match first, then partial match (query is prefix of a key)
  let jaName = FR_TO_JA[queryLow] || EN_TO_JA[queryLow] || FR_TO_JA[queryNoAccent] || EN_TO_JA[queryNoAccent] || null;

  if (!jaName) {
    // Partial match: find keys that START with the query
    const allEntries = [...Object.entries(FR_TO_JA), ...Object.entries(EN_TO_JA)];
    for (const [key, val] of allEntries) {
      if (key.startsWith(queryLow) || key.startsWith(queryNoAccent)) {
        jaName = val;
        break;
      }
    }
  }

  // console.log('[Holofoil] Search:', query, '→ JA:', jaName || '(no translation)');

  // Search FR + EN + JA (by translated name) all in parallel
  const searches = [
    fetchCardsFromLang('fr', query),
    fetchCardsFromLang('en', query),
  ];
  // JA: search with Japanese name if we have a translation
  if (jaName) {
    searches.push(fetchCardsFromLang('ja', jaName));
  }
  // JA: also try direct query (works for English names in JA db)
  searches.push(fetchCardsFromLang('ja', query));

  const [cardsFR, cardsEN, ...jaSearches] = await Promise.all(searches);

  // Merge all JA results
  const cardsJA = [];
  for (const batch of jaSearches) {
    for (const c of (batch || [])) cardsJA.push(c);
  }
  // console.log(`[Holofoil] Merged: FR=${cardsFR.length} EN=${cardsEN.length} JA=${cardsJA.length}`);

  // Deduplicate: FR cards, then JA cards (as separate entries!), then EN
  const cardMap = new Map();

  // FR first
  for (const c of cardsFR) {
    if (c.id && !cardMap.has(c.id)) cardMap.set(c.id, c);
  }

  // EN for missing
  const enMap = new Map();
  for (const c of cardsEN) {
    if (c.id) enMap.set(c.id, c);
    if (c.id && !cardMap.has(c.id)) cardMap.set(c.id, c);
  }

  // JA cards get added as SEPARATE entries with a unique key
  const jaMap = new Map();
  for (const c of cardsJA) {
    if (c.id) {
      jaMap.set(c.id, c);
      const jaKey = c.id + '-ja';
      if (!cardMap.has(jaKey)) {
        cardMap.set(jaKey, { ...c, _isJaCopy: true });
      }
    }
  }

  const allCards = Array.from(cardMap.values());

  // Fill missing images: FR cards without image get EN or JA image
  for (const c of allCards) {
    if (!c._isJaCopy) {
      if (jaMap.has(c.id)) c._hasJa = true;
      if (!c.image && jaMap.has(c.id) && jaMap.get(c.id).image) c.image = jaMap.get(c.id).image;
      if (!c.image && enMap.has(c.id) && enMap.get(c.id).image) c.image = enMap.get(c.id).image;
    }
  }

  if (allCards.length === 0) {
    const safeQuery = query.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    results.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem;padding:12px;">Aucun résultat pour "${safeQuery}". Essayez en français, anglais ou japonais.</p>`;
    return;
  }

  // Separate FR/EN and JA for display
  const frEnCards = allCards.filter(c => !c._isJaCopy);
  const jaOnlyCards = allCards.filter(c => c._isJaCopy);

  let html = '';

  if (frEnCards.length > 0) {
    html += `<p style="font-size:0.7rem;font-weight:600;color:var(--holo-1);padding:4px;grid-column:1/-1;margin-bottom:4px;">🇫🇷 Cartes FR / EN (${frEnCards.length})</p>`;
    html += frEnCards.map(c => {
      const img = c.image ? `${c.image}/low.webp` : '';
      const setName = c.set?.name || '';
      const rarity = c.rarity || '';
      const safeId = (c.id || '').replace(/'/g, "\\'");
      const langFlag = c._lang === 'en' ? '🇬🇧' : '🇫🇷';

      return `
        <div class="api-result-card" data-id="${c.id}" onclick="selectApiCard(this, '${safeId}', '${c._lang || 'fr'}')">
          ${img ? `<img src="${img}" alt="${c.name}" loading="lazy">` : `<div style="aspect-ratio:63/88;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted);padding:4px;text-align:center;">${c.name || '?'}</div>`}
          <div class="name">${c.name || '?'} <span style="font-size:0.6rem;">${langFlag}</span></div>
          <div class="api-card-meta">${setName}${rarity ? ' · ' + rarity : ''}</div>
          <div class="check">✓</div>
        </div>`;
    }).join('');
  }

  if (jaOnlyCards.length > 0) {
    html += `<p style="font-size:0.7rem;font-weight:600;color:#ef4444;padding:4px;grid-column:1/-1;margin-top:12px;margin-bottom:4px;">🇯🇵 Cartes Japonaises (${jaOnlyCards.length})</p>`;
    html += jaOnlyCards.map(c => {
      const img = c.image ? `${c.image}/low.webp` : '';
      const setName = c.set?.name || '';
      const rarity = c.rarity || '';
      const realId = (c.id || '').replace(/-ja$/, '');
      const safeId = realId.replace(/'/g, "\\'");

      return `
        <div class="api-result-card" data-id="${realId}" onclick="selectApiCard(this, '${safeId}', 'ja')" style="border-color:rgba(239,68,68,0.15);">
          ${img ? `<img src="${img}" alt="${c.name}" loading="lazy">` : `<div style="aspect-ratio:63/88;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted);padding:4px;text-align:center;">${c.name || '?'}</div>`}
          <div class="name">${c.name || '?'} <span style="font-size:0.6rem;">🇯🇵</span></div>
          <div class="api-card-meta">${setName}${rarity ? ' · ' + rarity : ''}</div>
          <div class="check">✓</div>
        </div>`;
    }).join('');
  }

  if (!html) {
    html = `<p style="color:var(--text-muted);font-size:0.8rem;padding:12px;grid-column:1/-1;">Aucun résultat.</p>`;
  }

  results.innerHTML = html;
  results.insertAdjacentHTML('beforeend', `<p style="font-size:0.7rem;color:var(--text-muted);padding:8px 4px;grid-column:1/-1;">${frEnCards.length} FR/EN · ${jaOnlyCards.length} JA${jaName ? ' (traduit: ' + jaName + ')' : ''}</p>`);
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
  // Auto-set origin based on source language
  const originMap = { 'fr':'FR', 'en':'EN', 'ja':'JA', 'de':'DE', 'es':'ES', 'it':'IT', 'pt':'PT' };
  const originSelect = document.getElementById('modalCardOrigin');
  if (originSelect && sourceLang && originMap[sourceLang]) {
    originSelect.value = originMap[sourceLang];
  }

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
  const origin = document.getElementById('modalCardOrigin')?.value || 'FR';
  const rarity = document.getElementById('modalCardRarity')?.value.trim() || '';
  const description = document.getElementById('modalCardDesc')?.value.trim() || '';
  const costPrice = parseFloat(document.getElementById('modalCostPrice')?.value) || 0;

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

  const stockQty = type === 'Carte' ? 1 : Math.max(0, parseInt(document.getElementById('modalStockQty')?.value) || 0);
  const inStock = stockQty > 0;

  const listing = {
    type, name, price: parseFloat(price), costPrice, condition,
    conditionClass: conditionClassMap[condition] || 'nm',
    set, origin, rarity, description, image, apiId, inStock, stockQty,
    date: new Date().toLocaleDateString('fr-FR'),
  };

  const listings = getListings();

  // Check if product was out of stock and is now back in stock (for wishlist notifications)
  let restockedProduct = null;
  if (editingId !== null) {
    const old = listings[editingId];
    if (old && (old.stockQty || 0) <= 0 && listing.stockQty > 0) {
      restockedProduct = listing.name;
    }
    listings[editingId] = listing;
  } else {
    listings.unshift(listing);
  }

  saveListings(listings);

  // Notify wishlist users if product is back in stock
  if (restockedProduct) {
    notifyWishlistUsers(restockedProduct);
  }

  closeCardModal();
  renderCardsTab(document.getElementById('adminMain'));
}

function notifyWishlistUsers(productName) {
  const wishlist = JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]');
  const interested = wishlist.filter(w => w.product === productName);

  if (interested.length === 0) return;

  // Store notifications for users to see
  const notifs = JSON.parse(localStorage.getItem('holofoil_notifications') || '[]');
  interested.forEach(w => {
    notifs.push({
      email: w.email,
      message: `"${productName}" est de retour en stock !`,
      product: productName,
      date: new Date().toISOString(),
      read: false,
    });
  });
  localStorage.setItem('holofoil_notifications', JSON.stringify(notifs));

  // Show admin feedback
  const emails = interested.map(w => w.email);
  alert(`Retour en stock : ${productName}\n\n${interested.length} client(s) seront notifié(s) :\n${emails.join('\n')}`);
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
//  INVOICES TAB
// ═══════════════════════════════════════
let invoiceSearch = '';

function renderInvoicesTab(main) {
  const allOrders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]').reverse();
  const q = invoiceSearch.toLowerCase();
  const orders = q
    ? allOrders.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.userName || '').toLowerCase().includes(q) ||
        (o.date || '').includes(q)
      )
    : allOrders;

  const totalRevenue = allOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);

  main.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Factures</h1>
        <p>${allOrders.length} facture${allOrders.length > 1 ? 's' : ''} · Total : ${totalRevenue.toFixed(2)} €</p>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;align-items:center;flex-wrap:wrap;">
      <div style="flex:1;min-width:200px;position:relative;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" class="form-input" placeholder="Rechercher par n°, client, email, date..." value="${invoiceSearch.replace(/"/g, '&quot;')}" oninput="invoiceSearch=this.value;renderInvoicesTab(document.getElementById('adminMain'))" style="padding-left:40px;font-size:0.85rem;">
      </div>
      <span style="font-size:0.8rem;color:var(--text-muted);">${orders.length} résultat${orders.length > 1 ? 's' : ''}</span>
    </div>

    ${orders.length === 0 ? `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <p style="font-size:0.9rem;">${q ? 'Aucune facture trouvée pour cette recherche.' : 'Aucune facture enregistrée.'}</p>
      </div>
    ` : `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Client</th>
              <th>Date</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Détails</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o, i) => {
              const details = o.details || [];
              const addr = [o.userAddress, o.userZip, o.userCity].filter(Boolean).join(', ');
              return `
                <tr>
                  <td><strong style="font-family:var(--font-display);font-size:0.8rem;color:var(--holo-1);">${o.id || 'HOL-' + (o.ts || i)}</strong></td>
                  <td>
                    <div style="font-size:0.85rem;font-weight:600;">${o.userName && o.userName.trim() ? o.userName.trim() : '—'}</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">${o.email}</div>
                    ${addr ? `<div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">${addr}</div>` : ''}
                  </td>
                  <td style="font-size:0.85rem;white-space:nowrap;">${o.date}</td>
                  <td style="font-size:0.85rem;">${o.items} article${o.items > 1 ? 's' : ''}</td>
                  <td><strong style="font-family:var(--font-display);">${parseFloat(o.total).toFixed(2)} €</strong></td>
                  <td>
                    <button class="table-btn" onclick="toggleInvoiceDetail('inv-detail-${i}')" style="font-size:0.72rem;padding:5px 10px;">
                      Voir
                    </button>
                  </td>
                  <td>
                    <button class="table-btn" onclick="downloadInvoice(${allOrders.indexOf(o)})" style="display:flex;align-items:center;gap:5px;font-size:0.72rem;padding:5px 10px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                      PDF
                    </button>
                  </td>
                </tr>
                <tr id="inv-detail-${i}" style="display:none;">
                  <td colspan="7" style="padding:16px 20px;background:rgba(77,201,246,0.02);border-left:3px solid var(--holo-1);">
                    <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px;">Détail de la commande</div>
                    ${details.length > 0 ? `
                      <table style="width:100%;font-size:0.82rem;">
                        <thead><tr>
                          <th style="text-align:left;padding:6px 8px;font-size:0.7rem;color:var(--text-muted);border-bottom:1px solid var(--border);">Article</th>
                          <th style="text-align:left;padding:6px 8px;font-size:0.7rem;color:var(--text-muted);border-bottom:1px solid var(--border);">Extension</th>
                          <th style="text-align:right;padding:6px 8px;font-size:0.7rem;color:var(--text-muted);border-bottom:1px solid var(--border);">Prix</th>
                        </tr></thead>
                        <tbody>
                          ${details.map(d => `
                            <tr>
                              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);">${d.name}</td>
                              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);color:var(--text-muted);">${d.set || '—'}</td>
                              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right;font-weight:600;">${parseFloat(d.price).toFixed(2)} €</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    ` : `<p style="font-size:0.82rem;color:var(--text-muted);">${o.items} article${o.items > 1 ? 's' : ''} — détails non disponibles</p>`}
                    <div style="margin-top:12px;text-align:right;font-family:var(--font-display);font-size:1rem;font-weight:800;">Total : ${parseFloat(o.total).toFixed(2)} €</div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function toggleInvoiceDetail(id) {
  const row = document.getElementById(id);
  if (!row) return;
  row.style.display = row.style.display === 'none' ? '' : 'none';
}

// ═══════════════════════════════════════
//  ANNOUNCEMENTS TAB
// ═══════════════════════════════════════

function getAnnouncementsData() {
  try {
    const data = JSON.parse(localStorage.getItem('holofoil_announcements'));
    if (data && data.length > 0) return data;
  } catch(e) {}
  return [
    '2 Boosters offerts à partir de 200€ d\'achat',
    'Livraison offerte à partir de 100€ d\'achats · France métropolitaine',
    'Nouvelle collection Écarlate & Violet disponible',
  ];
}

function saveAnnouncementsData(arr) {
  localStorage.setItem('holofoil_announcements', JSON.stringify(arr));
}

function getMarqueeData() {
  try {
    const data = JSON.parse(localStorage.getItem('holofoil_marquee'));
    if (data && data.length > 0) return data;
  } catch(e) {}
  return ['Authenticité Garantie', 'Livraison Sécurisée', 'Rachat au Meilleur Prix', 'Paiement Sécurisé', 'Expert Pokémon'];
}

function saveMarqueeData(arr) {
  localStorage.setItem('holofoil_marquee', JSON.stringify(arr));
}

function renderAnnouncementsTab(main) {
  const announcements = getAnnouncementsData();
  const marquee = getMarqueeData();
  const codes = getPromoCodes();

  const renderItemRow = (text, i, total, cls, moveFunc, deleteFunc) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:8px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);transition:var(--transition);" onmouseover="this.style.borderColor='rgba(77,201,246,0.15)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="font-size:0.7rem;color:var(--text-muted);font-weight:700;min-width:22px;text-align:center;padding:4px 0;background:rgba(255,255,255,0.03);border-radius:6px;">${i + 1}</span>
      <input type="text" class="form-input ${cls}" value="${text.replace(/"/g, '&quot;')}" placeholder="Saisir le texte..." style="flex:1;">
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button onclick="${moveFunc}(${i}, -1)" class="table-btn" style="padding:6px 8px;font-size:0.7rem;" title="Monter" ${i === 0 ? 'disabled style="opacity:0.3;padding:6px 8px;font-size:0.7rem;"' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
        </button>
        <button onclick="${moveFunc}(${i}, 1)" class="table-btn" style="padding:6px 8px;font-size:0.7rem;" title="Descendre" ${i === total - 1 ? 'disabled style="opacity:0.3;padding:6px 8px;font-size:0.7rem;"' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
        </button>
        <button onclick="${deleteFunc}(${i})" class="table-btn danger" style="padding:6px 8px;font-size:0.7rem;" title="Supprimer">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;

  main.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Annonces</h1>
        <p>Gérez les bandeaux d'annonce, le texte défilant et les codes promo.</p>
      </div>
    </div>

    <div class="admin-form">

      <!-- ═══ BANDEAU D'ANNONCE ═══ -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">Bandeau d'annonce</h3>
            <p style="font-size:0.75rem;color:var(--text-muted);">Messages en haut de page avec défilement automatique toutes les 5 secondes.</p>
          </div>
          <button class="admin-save-btn" onclick="addAnnouncement()" style="width:auto;padding:8px 16px;font-size:0.78rem;margin-top:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Ajouter
          </button>
        </div>

        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);">Messages (${announcements.length})</label>
          <div id="announcementsList">
            ${announcements.map((text, i) => renderItemRow(text, i, announcements.length, 'announcement-input', 'moveAnnouncement', 'deleteAnnouncement')).join('')}
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <button class="admin-save-btn" onclick="saveAnnouncements()" style="width:auto;padding:10px 24px;font-size:0.82rem;margin-top:0;">Enregistrer</button>
          <button class="table-btn" onclick="resetAnnouncements()" style="padding:10px 16px;font-size:0.78rem;">Par défaut</button>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);">Aperçu en direct</label>
          <div style="background:linear-gradient(90deg, #4dc9f6, #a855f7, #f97316, #22d3ee, #ec4899, #4dc9f6);background-size:200% 100%;animation:holoShift 6s linear infinite;padding:12px 20px;text-align:center;font-size:0.82rem;font-weight:600;color:#fff;letter-spacing:0.03em;border-radius:var(--radius);">
            ${announcements[0] || 'Aucune annonce'}
          </div>
        </div>
      </div>

      <!-- ═══ BANDEAU DÉFILANT (MARQUEE) ═══ -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">Bandeau défilant</h3>
            <p style="font-size:0.75rem;color:var(--text-muted);">Textes en boucle sous la mosaïque d'accueil (Authenticité, Livraison, etc.).</p>
          </div>
          <button class="admin-save-btn" onclick="addMarqueeItem()" style="width:auto;padding:8px 16px;font-size:0.78rem;margin-top:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Ajouter
          </button>
        </div>

        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);">Éléments (${marquee.length})</label>
          <div id="marqueeList">
            ${marquee.map((text, i) => renderItemRow(text, i, marquee.length, 'marquee-input', 'moveMarqueeItem', 'deleteMarqueeItem')).join('')}
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <button class="admin-save-btn" onclick="saveMarquee()" style="width:auto;padding:10px 24px;font-size:0.82rem;margin-top:0;">Enregistrer</button>
          <button class="table-btn" onclick="resetMarquee()" style="padding:10px 16px;font-size:0.78rem;">Par défaut</button>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);">Aperçu en direct</label>
          <div style="overflow:hidden;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg-base);">
            <div style="display:flex;gap:32px;padding:12px 20px;white-space:nowrap;animation:marqueePreview 12s linear infinite;">
              ${marquee.map(t => `
                <span style="font-family:var(--font-display);font-size:0.8rem;font-weight:600;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;gap:12px;">
                  <span style="width:5px;height:5px;border-radius:50%;background:var(--holo-1);opacity:0.5;flex-shrink:0;"></span>${t}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ CODES PROMO ═══ -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">Codes promo</h3>
            <p style="font-size:0.75rem;color:var(--text-muted);">Codes de réduction applicables dans le panier.</p>
          </div>
        </div>

        <!-- Formulaire de création inline -->
        <div style="padding:16px;margin-bottom:20px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);">
          <label class="form-label" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px;">Nouveau code</label>
          <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
            <div style="flex:1;min-width:160px;">
              <label class="form-label" style="font-size:0.7rem;">Code</label>
              <input type="text" class="form-input" id="newPromoCode" placeholder="Ex : HOLOFOIL10" style="text-transform:uppercase;">
            </div>
            <div style="width:120px;">
              <label class="form-label" style="font-size:0.7rem;">Réduction (%)</label>
              <input type="number" class="form-input" id="newPromoPercent" placeholder="10" min="1" max="100">
            </div>
            <button class="admin-save-btn" onclick="addPromoCode()" style="width:auto;padding:10px 20px;font-size:0.82rem;margin-top:0;flex-shrink:0;">Créer</button>
          </div>
        </div>

        <!-- Liste des codes -->
        ${codes.length === 0 ? `
          <div style="text-align:center;padding:30px 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted);margin-bottom:10px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
            <p style="color:var(--text-muted);font-size:0.82rem;">Aucun code promo actif.</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${codes.map((c, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);transition:var(--transition);" onmouseover="this.style.borderColor='rgba(77,201,246,0.15)'" onmouseout="this.style.borderColor='var(--border)'">
                <div style="flex:1;display:flex;align-items:center;gap:14px;min-width:0;">
                  <strong style="font-family:var(--font-display);font-size:0.88rem;letter-spacing:0.06em;color:var(--text-primary);">${c.code}</strong>
                  <span style="padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:700;background:rgba(77,201,246,0.08);color:var(--holo-1);flex-shrink:0;">-${c.percent}%</span>
                  <span style="padding:4px 10px;border-radius:50px;font-size:0.68rem;font-weight:600;flex-shrink:0;${c.active !== false ? 'background:rgba(74,222,128,0.1);color:#4ade80;' : 'background:rgba(239,68,68,0.1);color:#ef4444;'}">${c.active !== false ? 'Actif' : 'Inactif'}</span>
                </div>
                <span style="font-size:0.72rem;color:var(--text-muted);flex-shrink:0;">${c.created || '—'}</span>
                <div style="display:flex;gap:4px;flex-shrink:0;">
                  <button onclick="togglePromoCode(${i})" class="table-btn" style="padding:6px 12px;font-size:0.72rem;">${c.active !== false ? 'Désactiver' : 'Activer'}</button>
                  <button onclick="deletePromoCode(${i})" class="table-btn danger" style="padding:6px 10px;font-size:0.72rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>

    <style>
      @keyframes marqueePreview {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    </style>
  `;
}

function addAnnouncement() {
  const data = getAnnouncementsData();
  data.push('Nouvelle annonce');
  saveAnnouncementsData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function deleteAnnouncement(idx) {
  const data = getAnnouncementsData();
  if (data.length <= 1) { alert('Il faut au moins une annonce.'); return; }
  data.splice(idx, 1);
  saveAnnouncementsData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function moveAnnouncement(idx, dir) {
  const data = getAnnouncementsData();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= data.length) return;
  [data[idx], data[newIdx]] = [data[newIdx], data[idx]];
  saveAnnouncementsData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function saveAnnouncements() {
  const inputs = document.querySelectorAll('.announcement-input');
  const data = Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
  if (data.length === 0) { alert('Il faut au moins une annonce.'); return; }
  saveAnnouncementsData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Annonces enregistrées !');
}

function resetAnnouncements() {
  if (!confirm('Réinitialiser les annonces par défaut ?')) return;
  localStorage.removeItem('holofoil_announcements');
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Annonces réinitialisées');
}

// ─── MARQUEE CRUD ───
function addMarqueeItem() {
  const data = getMarqueeData();
  data.push('Nouveau texte');
  saveMarqueeData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function deleteMarqueeItem(idx) {
  const data = getMarqueeData();
  if (data.length <= 1) { alert('Il faut au moins un élément.'); return; }
  data.splice(idx, 1);
  saveMarqueeData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function moveMarqueeItem(idx, dir) {
  const data = getMarqueeData();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= data.length) return;
  [data[idx], data[newIdx]] = [data[newIdx], data[idx]];
  saveMarqueeData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function saveMarquee() {
  const inputs = document.querySelectorAll('.marquee-input');
  const data = Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
  if (data.length === 0) { alert('Il faut au moins un élément.'); return; }
  saveMarqueeData(data);
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Bandeau défilant enregistré !');
}

function resetMarquee() {
  if (!confirm('Réinitialiser le bandeau défilant par défaut ?')) return;
  localStorage.removeItem('holofoil_marquee');
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Bandeau défilant réinitialisé');
}

// ─── PROMO CODES CRUD ───
function getPromoCodes() { try { return JSON.parse(localStorage.getItem('holofoil_promo_codes')||'[]'); } catch(e) { return []; } }
function savePromoCodes(arr) { localStorage.setItem('holofoil_promo_codes', JSON.stringify(arr)); }

function addPromoCode() {
  const codeInput = document.getElementById('newPromoCode');
  const percentInput = document.getElementById('newPromoPercent');
  const code = (codeInput?.value || '').trim().toUpperCase();
  const percent = parseInt(percentInput?.value);
  if (!code) { codeInput?.focus(); showToast && showToast('Saisissez un code promo', 'error'); return; }
  if (isNaN(percent) || percent < 1 || percent > 100) { percentInput?.focus(); showToast && showToast('Pourcentage invalide (1-100)', 'error'); return; }
  const codes = getPromoCodes();
  if (codes.find(c => c.code === code)) { showToast && showToast('Ce code existe déjà', 'error'); return; }
  codes.push({ code, percent, active: true, created: new Date().toLocaleDateString('fr-FR') });
  savePromoCodes(codes);
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Code promo "' + code + '" créé');
}

function togglePromoCode(idx) {
  const codes = getPromoCodes();
  codes[idx].active = !codes[idx].active;
  savePromoCodes(codes);
  renderAnnouncementsTab(document.getElementById('adminMain'));
}

function deletePromoCode(idx) {
  const codes = getPromoCodes();
  codes.splice(idx, 1);
  savePromoCodes(codes);
  renderAnnouncementsTab(document.getElementById('adminMain'));
  showToast && showToast('Code supprimé');
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
