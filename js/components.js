/* ═══════════════════════════════════════
   HOLOFOIL — SHARED HTML COMPONENTS
   Injected on every page via JS
   ═══════════════════════════════════════ */

// ─── SVG ICONS ───
const ICONS = {
  bag: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/></svg>',
  twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/></svg>',
  discord: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.028-.07 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.005-.085c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/></svg>',
};

// ─── INJECT NAVBAR ───
function injectNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.id = 'navbar';
  nav.innerHTML = `
    <a class="nav-logo" href="index.html" style="color:var(--text-primary);">HOLOFOIL</a>
    <ul class="nav-links" id="navLinks">
      <li><a href="index.html" data-page="index.html">Accueil</a></li>
      <li><a href="boutique.html" data-page="boutique.html">Boutique</a></li>
      <li><a href="rachat.html" data-page="rachat.html">Rachat</a></li>
    </ul>
    <div class="nav-right">
      <button class="cart-btn" id="navSearchBtn" onclick="toggleGlobalSearch()" aria-label="Rechercher">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      </button>
      <button class="cart-btn" onclick="toggleCart()">
        ${ICONS.bag}
        <span class="cart-count" id="cartCount">0</span>
      </button>
      <a href="compte.html" class="cart-btn" id="navAccountBtn" aria-label="Mon compte">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        <span class="logged-dot" id="loggedDot"></span>
      </a>
      <button class="mobile-toggle" id="mobileToggle" onclick="toggleMobileMenu()">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;
  document.body.prepend(nav);
}

// ─── INJECT AMBIENT BG ───
function injectAmbientBg() {
  const bg = document.createElement('div');
  bg.className = 'ambient-bg';
  bg.innerHTML = '<div class="orb"></div><div class="orb"></div><div class="orb"></div>';
  document.body.prepend(bg);

  // Particles canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'particles-canvas';
  canvas.id = 'particlesCanvas';
  document.body.prepend(canvas);

  initParticles(canvas);
}

function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h;
  let mouseX = -1000, mouseY = -1000;
  const PARTICLE_COUNT = 80;
  const MOUSE_RADIUS = 160;
  const MOUSE_STRENGTH = 0.04;

  const colors = [
    'rgba(77,201,246,',   // holo-1 cyan
    'rgba(168,85,247,',   // holo-2 purple
    'rgba(249,115,22,',   // holo-3 orange
    'rgba(34,211,238,',   // holo-4 teal
    'rgba(236,72,153,',   // holo-5 pink
  ];

  let particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticle() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      baseX: 0, baseY: 0, // set after
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.15,
      color,
      pulseSpeed: Math.random() * 0.01 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = createParticle();
      p.baseX = p.x;
      p.baseY = p.y;
      particles.push(p);
    }
  }

  let frame = 0;
  function animate() {
    frame++;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      // Gentle autonomous drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Mouse repulsion
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * MOUSE_STRENGTH;
        p.x += dx / dist * force * MOUSE_RADIUS * 0.15;
        p.y += dy / dist * force * MOUSE_RADIUS * 0.15;
      }

      // Pulsing opacity
      const pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;
      const alpha = p.opacity * pulse;

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  init();
  animate();
}

// ─── INJECT FOOTER ───
function injectFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3 class="holo-text">HOLOFOIL</h3>
          <p>La référence française pour l'achat et la vente de cartes Pokémon premium. Authenticité garantie sur chaque carte.</p>
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="boutique.html">Boutique</a></li>
            <li><a href="rachat.html">Rachat</a></li>
            <li><a href="compte.html">Mon Compte</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Informations</h4>
          <ul>
            <li><a href="#">Conditions générales</a></li>
            <li><a href="confidentialite.html">Politique de confidentialité</a></li>
            <li><a href="#">Livraison & Retours</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="#">contact@holofoil.fr</a></li>
            <li><a href="support.html">Support en ligne</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Holofoil. Tous droits réservés. · <a href="admin.html" style="color:var(--text-muted);font-size:0.75rem;">Admin</a></p>
        <div class="footer-socials">
          <a href="#" aria-label="Instagram">${ICONS.instagram}</a>
          <a href="#" aria-label="Twitter">${ICONS.twitter}</a>
          <a href="#" aria-label="Discord">${ICONS.discord}</a>
        </div>
      </div>
    </div>
  `;
  // Insert before toast
  const toast = document.getElementById('toast');
  if (toast) {
    document.body.insertBefore(footer, toast);
  } else {
    document.body.appendChild(footer);
  }
}

// ─── INJECT CART SIDEBAR ───
function injectCartSidebar() {
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'cartOverlay';
  document.body.appendChild(overlay);

  const sidebar = document.createElement('div');
  sidebar.className = 'cart-sidebar';
  sidebar.id = 'cartSidebar';
  sidebar.innerHTML = `
    <div class="cart-header">
      <h2>Panier</h2>
      <button class="cart-close" onclick="toggleCart()">✕</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer">
      <div id="promoSection" style="margin-bottom:12px;">
        <div style="display:flex;gap:8px;">
          <input type="text" id="promoCodeInput" placeholder="Code promo" style="flex:1;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:var(--text-primary);font-size:0.82rem;font-family:inherit;outline:none;transition:0.3s;" onfocus="this.style.borderColor='rgba(77,201,246,0.3)'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
          <button onclick="applyPromoCode()" style="padding:10px 16px;border-radius:10px;border:1px solid rgba(77,201,246,0.2);background:rgba(77,201,246,0.06);color:var(--holo-1);font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:0.3s;font-family:inherit;" onmouseover="this.style.background='rgba(77,201,246,0.12)'" onmouseout="this.style.background='rgba(77,201,246,0.06)'">Appliquer</button>
        </div>
        <div id="promoStatus" style="margin-top:6px;"></div>
      </div>
      <div id="promoDiscount" style="display:none;margin-bottom:8px;"></div>
      <div class="cart-total">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-price" id="cartTotalPrice">0.00 €</span>
      </div>
      <button class="cart-checkout-btn" onclick="placeOrder()">
        Passer commande
      </button>
    </div>
  `;
  document.body.appendChild(sidebar);
}

// ─── INJECT TOAST ───
function injectToast() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = 'toast';
  document.body.appendChild(toast);
}

// ─── INJECT GLOBAL SEARCH ───
function injectGlobalSearch() {
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.innerHTML = `
    <div class="search-panel" onclick="event.stopPropagation()">
      <div class="search-input-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" id="globalSearchInput" placeholder="Rechercher un produit, une carte..." autocomplete="off">
        <kbd class="search-kbd">ESC</kbd>
      </div>
      <div class="search-results" id="globalSearchResults">
        <div class="search-empty">Tapez pour rechercher parmi tous les produits disponibles</div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeGlobalSearch(); });
  document.body.appendChild(overlay);
}

let _searchDebounce = null;

function toggleGlobalSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  const isOpen = overlay.classList.contains('open');
  if (isOpen) {
    closeGlobalSearch();
  } else {
    overlay.classList.add('open');
    const input = document.getElementById('globalSearchInput');
    input.value = '';
    input.focus();
    document.getElementById('globalSearchResults').innerHTML = '<div class="search-empty">Tapez pour rechercher parmi tous les produits disponibles</div>';
    input.removeEventListener('input', onGlobalSearchInput);
    input.addEventListener('input', onGlobalSearchInput);
  }
}

function closeGlobalSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (overlay) overlay.classList.remove('open');
}

function onGlobalSearchInput(e) {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => performGlobalSearch(e.target.value.trim()), 200);
}

function performGlobalSearch(query) {
  const resultsEl = document.getElementById('globalSearchResults');
  if (!query || query.length < 2) {
    resultsEl.innerHTML = '<div class="search-empty">Tapez au moins 2 caractères pour rechercher</div>';
    return;
  }

  const q = query.toLowerCase();
  const listings = (typeof getAdminListings === 'function') ? getAdminListings() : [];

  // Filter listings matching query
  const matched = listings.filter(l => {
    const name = (l.name || '').toLowerCase();
    const set = (l.set || '').toLowerCase();
    const type = (l.type || '').toLowerCase();
    return name.includes(q) || set.includes(q) || type.includes(q);
  });

  if (matched.length === 0) {
    const safeQuery = query.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    resultsEl.innerHTML = `<div class="search-empty">Aucun résultat pour « ${safeQuery} »</div>`;
    return;
  }

  // Show max 8 results
  const typeColors = { 'Carte':'var(--holo-1)', 'Booster':'#f97316', 'ETB':'#a855f7', 'Coffret':'#22d3ee', 'Display':'#ec4899', 'Bundle':'#4ade80', 'Autre':'var(--text-muted)' };
  const originFlags = {'FR':'🇫🇷','EN':'🇬🇧','JA':'🇯🇵','KO':'🇰🇷','DE':'🇩🇪','ES':'🇪🇸','IT':'🇮🇹','PT':'🇧🇷','CN':'🇨🇳','TW':'🇹🇼'};

  // Store matched results globally for onclick
  window._searchResults = matched.slice(0, 8);

  const html = window._searchResults.map((l, i) => {
    const type = l.type || 'Carte';
    const isCard = type === 'Carte';
    const typeColor = typeColors[type] || 'var(--text-muted)';
    const flag = originFlags[l.origin] || '🇫🇷';
    const stockBadge = !isCard ? ((l.stockQty || 0) > 0
      ? '<span style="font-size:0.65rem;font-weight:600;color:#4ade80;">En stock</span>'
      : '<span style="font-size:0.65rem;font-weight:600;color:#ef4444;">Hors stock</span>') : '';

    return `
      <div class="search-result-item" onclick="openSearchResult(${i})">
        <div class="search-result-img">
          ${l.image ? `<img src="${l.image}" alt="" style="width:100%;height:100%;object-fit:${isCard ? 'contain' : 'cover'};border-radius:6px;">` : `<div style="width:100%;height:100%;background:var(--bg-elevated);border-radius:6px;"></div>`}
        </div>
        <div class="search-result-info">
          <div class="search-result-name">${l.name}</div>
          <div class="search-result-meta">
            <span style="color:${typeColor};font-weight:600;">${type}</span>
            ${l.set ? `<span>·</span><span>${l.set}</span>` : ''}
            <span>${flag}</span>
            ${stockBadge}
          </div>
        </div>
        <div class="search-result-price">${parseFloat(l.price).toFixed(2)} €</div>
      </div>`;
  }).join('');

  const countExtra = matched.length > 8 ? `<div class="search-more"><a href="boutique.html">Voir les ${matched.length} résultats dans la boutique →</a></div>` : '';
  resultsEl.innerHTML = html + countExtra;
}

function openSearchResult(i) {
  const listing = window._searchResults && window._searchResults[i];
  if (!listing) return;
  closeGlobalSearch();
  // Store in global shop listings and open detail
  window._shopListings = [];
  window._shopListingsCounter = 0;
  window._shopListings[0] = listing;
  window._shopListingsCounter = 1;
  openListingDetail(0);
}

// ─── PLACE ORDER ───
function placeOrder() {
  // Si Stripe est activé → paiement en ligne
  if (typeof isStripeEnabled === 'function' && isStripeEnabled()) {
    startStripeCheckout();
    return;
  }

  // Sinon → mode local (dev / sans paiement)
  placeOrderLocal();
}

// Mode local : enregistre la commande sans paiement réel
async function placeOrderLocal() {
  const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
  if (!session) {
    showToast('Connectez-vous pour passer commande');
    setTimeout(() => { window.location.href = 'compte.html'; }, 1200);
    return;
  }

  const cartItems = JSON.parse(localStorage.getItem('holofoil_cart') || '[]');
  if (cartItems.length === 0) { showToast('Votre panier est vide'); return; }

  const subtotal = cartItems.reduce((s, i) => s + (i.price || 0), 0);
  const promo = (typeof appliedPromo !== 'undefined' && appliedPromo) ? appliedPromo : null;
  const discount = promo ? subtotal * (promo.percent / 100) : 0;
  const total = subtotal - discount;

  // Get user info
  let user = {};
  try {
    user = await DB.getUserByEmail(session.email) || {};
  } catch (e) {
    user = (JSON.parse(localStorage.getItem('holofoil_users') || '[]')).find(u => u.email === session.email) || {};
  }

  const order = {
    id: 'HOL-' + Date.now().toString(36).toUpperCase(),
    email: session.email,
    userName: (user.firstName || '') + ' ' + (user.lastName || ''),
    userAddress: user.address || '',
    userCity: user.city || '',
    userZip: user.zip || '',
    date: new Date().toLocaleDateString('fr-FR'),
    items: cartItems.length,
    details: cartItems.map(i => ({ name: i.name, set: i.set, price: i.price })),
    subtotal: subtotal.toFixed(2),
    promoCode: promo ? promo.code : null,
    promoPercent: promo ? promo.percent : 0,
    discount: discount.toFixed(2),
    total: total.toFixed(2),
    status: 'local',
    ts: Date.now(),
  };

  // Toujours sauvegarder en localStorage (lecture synchrone par d'autres pages)
  const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
  orders.push(order);
  localStorage.setItem('holofoil_orders', JSON.stringify(orders));

  // + Firestore si disponible
  try {
    if (typeof FIREBASE_READY !== 'undefined' && FIREBASE_READY) {
      await db.collection('orders').add(order);
    }
  } catch (e) {
    console.warn('[Holofoil] Firestore addOrder failed:', e.message);
  }

  // Clear cart + promo
  localStorage.setItem('holofoil_cart', '[]');
  if (typeof cart !== 'undefined') { cart.length = 0; }
  if (typeof appliedPromo !== 'undefined') appliedPromo = null;
  if (typeof updateCartCount === 'function') updateCartCount();
  if (typeof renderCartItems === 'function') renderCartItems();
  if (typeof toggleCart === 'function') toggleCart();

  showToast('Commande enregistrée avec succès !');
}

// ESC key to close search
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGlobalSearch();
  // Ctrl+K or Cmd+K to open search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleGlobalSearch();
  }
});

// ─── INJECT SUPPORT FLOATING BUTTON ───
function injectSupportButton() {
  // Ne pas afficher sur la page support elle-même ni sur l'admin
  const page = window.location.pathname.split('/').pop() || '';
  if (page === 'support.html' || page === 'admin.html') return;

  const btn = document.createElement('a');
  btn.href = 'support.html';
  btn.id = 'supportFab';
  btn.setAttribute('aria-label', 'Support en ligne');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>
    <span>Support</span>`;
  document.body.appendChild(btn);

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #supportFab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 900;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 50px;
      background: linear-gradient(135deg, rgba(77,201,246,0.15), rgba(168,85,247,0.12));
      border: 1px solid rgba(77,201,246,0.2);
      backdrop-filter: blur(16px);
      color: #4dc9f6;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: var(--font-body, 'Outfit', sans-serif);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 24px rgba(77,201,246,0.1), 0 0 0 0 rgba(77,201,246,0);
    }
    #supportFab:hover {
      transform: translateY(-3px);
      border-color: rgba(77,201,246,0.35);
      box-shadow: 0 8px 32px rgba(77,201,246,0.2), 0 0 16px rgba(77,201,246,0.06);
      background: linear-gradient(135deg, rgba(77,201,246,0.22), rgba(168,85,247,0.18));
    }
    #supportFab svg {
      flex-shrink: 0;
    }
    @media (max-width: 480px) {
      #supportFab span { display: none; }
      #supportFab { padding: 14px; border-radius: 50%; }
    }
  `;
  document.head.appendChild(style);
}

// ─── INIT ALL SHARED COMPONENTS ───
function initComponents() {
  injectAmbientBg();
  injectNavbar();
  injectGlobalSearch();
  injectToast();
  injectCartSidebar();
  injectSupportButton();

  // Show logged-in indicator
  const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
  const dot = document.getElementById('loggedDot');
  if (dot && session) dot.classList.add('visible');
}

// Auto-run
document.addEventListener('DOMContentLoaded', () => {
  initComponents();
});
