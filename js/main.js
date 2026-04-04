/* ═══════════════════════════════════════
   HOLOFOIL — MAIN JS (shared across pages)
   ═══════════════════════════════════════ */

// ─── CART STATE (persisted in localStorage) ───
let cart = JSON.parse(localStorage.getItem('holofoil_cart') || '[]');
let appliedPromo = null; // { code, percent }

// ─── DOM READY ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initNavbar();
  initCartSidebar();
});

// ─── NAVBAR ───
function initNavbar() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

// ─── MOBILE MENU ───
function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ─── CART ───
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCartItems();
}

function removeCartGroup(name) {
  for (let i = cart.length - 1; i >= 0; i--) {
    if (cart[i].name === name) cart.splice(i, 1);
  }
  saveCart();
  updateCartCount();
  renderCartItems();
}

function updateCartQty(name, newQty) {
  if (newQty <= 0) {
    removeCartGroup(name);
    return;
  }
  const currentCount = cart.filter(c => c.name === name).length;
  if (newQty > currentCount) {
    // Add copies
    const ref = cart.find(c => c.name === name);
    if (!ref) return;
    for (let i = 0; i < newQty - currentCount; i++) {
      cart.push({ id: ref.name + '-' + Date.now() + '-' + i, name: ref.name, set: ref.set, price: ref.price, image: ref.image });
    }
  } else if (newQty < currentCount) {
    // Remove from the end
    let toRemove = currentCount - newQty;
    for (let i = cart.length - 1; i >= 0 && toRemove > 0; i--) {
      if (cart[i].name === name) { cart.splice(i, 1); toRemove--; }
    }
  }
  saveCart();
  updateCartCount();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('holofoil_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  el.textContent = cart.length;
  el.classList.toggle('visible', cart.length > 0);
}

function toggleCart() {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  if (!overlay || !sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    overlay.classList.remove('open');
    sidebar.classList.remove('open');
  } else {
    renderCartItems();
    overlay.classList.add('open');
    sidebar.classList.add('open');
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotalPrice');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p>Votre panier est vide</p>
      </div>`;
    if (totalEl) totalEl.textContent = '0.00 €';
    return;
  }

  // Group identical items by name
  const grouped = [];
  const seen = {};
  cart.forEach((item, i) => {
    const key = item.name;
    if (seen[key] !== undefined) {
      grouped[seen[key]].qty++;
      grouped[seen[key]].indices.push(i);
    } else {
      seen[key] = grouped.length;
      grouped.push({ ...item, qty: 1, indices: [i] });
    }
  });

  const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  container.innerHTML = grouped.map((item, gi) => `
    <div class="cart-item">
      ${item.image
        ? `<img src="${item.image}" alt="" class="cart-item-color" style="object-fit:contain;border-radius:8px;">`
        : `<div class="cart-item-color" style="background:var(--bg-elevated);border-radius:8px;"></div>`
      }
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-set">${esc(item.set)}</div>
        ${item.qty > 1 ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${(item.price || 0).toFixed(2)} € / unité</div>` : ''}
      </div>
      ${item.qty > 1 ? `
      <div style="display:flex;align-items:center;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.03);margin-right:12px;flex-shrink:0;">
        <button onclick="updateCartQty('${item.name.replace(/'/g,"\\'")}',${item.qty - 1})" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--text-primary);cursor:pointer;font-size:0.9rem;">−</button>
        <span style="min-width:24px;text-align:center;font-family:var(--font-display);font-weight:700;font-size:0.8rem;">${item.qty}</span>
        <button onclick="updateCartQty('${item.name.replace(/'/g,"\\'")}',${item.qty + 1})" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--text-primary);cursor:pointer;font-size:0.9rem;">+</button>
      </div>` : ''}
      <div class="cart-item-price">${((item.price || 0) * item.qty).toFixed(2)}&nbsp;€</div>
      <button class="cart-item-remove" onclick="removeCartGroup('${item.name.replace(/'/g,"\\'")}')" title="Retirer">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((s, c) => s + (c.price || 0), 0);
  const discountEl = document.getElementById('promoDiscount');
  const statusEl = document.getElementById('promoStatus');

  if (appliedPromo && discountEl) {
    const discount = total * (appliedPromo.percent / 100);
    const finalTotal = total - discount;
    discountEl.style.display = 'block';
    discountEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:0.78rem;color:var(--text-muted);">Sous-total</span>
        <span style="font-size:0.82rem;color:var(--text-muted);text-decoration:line-through;">${total.toFixed(2)} €</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.78rem;color:#4ade80;font-weight:600;">Réduction (${appliedPromo.percent}%)</span>
        <span style="font-size:0.82rem;color:#4ade80;font-weight:600;">-${discount.toFixed(2)} €</span>
      </div>`;
    if (totalEl) totalEl.textContent = finalTotal.toFixed(2) + ' €';
  } else {
    if (discountEl) discountEl.style.display = 'none';
    if (totalEl) totalEl.textContent = total.toFixed(2) + ' €';
  }
}

function getPromoCodes() {
  try { return JSON.parse(localStorage.getItem('holofoil_promo_codes') || '[]'); } catch(e) { return []; }
}

function applyPromoCode() {
  const input = document.getElementById('promoCodeInput');
  const status = document.getElementById('promoStatus');
  if (!input || !status) return;
  const code = input.value.trim().toUpperCase();
  if (!code) { status.innerHTML = ''; return; }

  const codes = getPromoCodes();
  const match = codes.find(c => c.code?.toUpperCase() === code && c.active !== false);

  if (match) {
    appliedPromo = { code: match.code, percent: match.percent };
    status.innerHTML = `<span style="font-size:0.75rem;color:#4ade80;font-weight:600;">✓ Code "${match.code}" appliqué — ${match.percent}% de réduction</span>`;
    input.style.borderColor = 'rgba(74,222,128,0.4)';
  } else {
    appliedPromo = null;
    status.innerHTML = `<span style="font-size:0.75rem;color:#ef4444;">✕ Code invalide ou expiré</span>`;
    input.style.borderColor = 'rgba(239,68,68,0.4)';
  }
  renderCartItems();
}

function removePromoCode() {
  appliedPromo = null;
  const input = document.getElementById('promoCodeInput');
  const status = document.getElementById('promoStatus');
  if (input) { input.value = ''; input.style.borderColor = 'rgba(255,255,255,0.08)'; }
  if (status) status.innerHTML = '';
  renderCartItems();
}

function initCartSidebar() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.addEventListener('click', toggleCart);
  }
}

// ─── TOAST ───
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ─── LOADING SKELETON ───
function showLoading(container, count = 8) {
  container.innerHTML = Array(count).fill(`
    <div class="poke-card" style="pointer-events:none;">
      <div class="poke-card-img" style="background:var(--bg-elevated);animation:loadPulse 1.5s ease infinite;">
      </div>
      <div class="poke-card-info">
        <div style="width:60%;height:10px;background:var(--bg-elevated);border-radius:4px;margin-bottom:8px;animation:loadPulse 1.5s ease infinite;"></div>
        <div style="width:80%;height:14px;background:var(--bg-elevated);border-radius:4px;margin-bottom:8px;animation:loadPulse 1.5s ease 0.1s infinite;"></div>
        <div style="width:40%;height:10px;background:var(--bg-elevated);border-radius:4px;animation:loadPulse 1.5s ease 0.2s infinite;"></div>
      </div>
    </div>
  `).join('');
}

// Add loading animation
const loadStyle = document.createElement('style');
loadStyle.textContent = `
  @keyframes loadPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  #cardModal > div { scrollbar-width: thin; scrollbar-color: rgba(77,201,246,0.3) transparent; }
`;
document.head.appendChild(loadStyle);
