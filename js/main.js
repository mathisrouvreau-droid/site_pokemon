/* ═══════════════════════════════════════
   HOLOFOIL — MAIN JS (shared across pages)
   ═══════════════════════════════════════ */

// ─── CART STATE (persisted in localStorage) ───
let cart = JSON.parse(localStorage.getItem('holofoil_cart') || '[]');

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

  container.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      ${item.image
        ? `<img src="${item.image}" alt="" class="cart-item-color" style="object-fit:contain;border-radius:8px;">`
        : `<div class="cart-item-color" style="background:var(--bg-elevated);border-radius:8px;"></div>`
      }
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-set">${item.set || ''}</div>
      </div>
      <div class="cart-item-price">${item.price.toFixed(2)}&nbsp;€</div>
      <button class="cart-item-remove" onclick="removeFromCart(${i})" title="Retirer">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((s, c) => s + c.price, 0);
  if (totalEl) totalEl.textContent = total.toFixed(2) + ' €';
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
