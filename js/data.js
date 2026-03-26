/* ═══════════════════════════════════════
   HOLOFOIL — TCGdex API Service
   ═══════════════════════════════════════ */

const API_BASE = 'https://api.tcgdex.net/v2/fr';

const TCGdex = {

  // ─── Fetch helper ───
  async fetch(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('TCGdex API error:', err);
      return null;
    }
  },

  // ─── Get cards list (with filters) ───
  async getCards(params = {}) {
    const query = new URLSearchParams();
    if (params.name) query.set('name', `like:${params.name}`);
    if (params.set) query.set('set.id', params.set);
    if (params.rarity) query.set('rarity', `like:${params.rarity}`);
    if (params.category) query.set('category', params.category);
    if (params.page) query.set('pagination:page', params.page);
    if (params.itemsPerPage) query.set('pagination:itemsPerPage', params.itemsPerPage);
    if (params.sort) query.set('sort:field', params.sort);
    if (params.order) query.set('sort:order', params.order);
    const qs = query.toString();
    return await this.fetch(`/cards${qs ? '?' + qs : ''}`);
  },

  // ─── Get single card ───
  async getCard(id) {
    return await this.fetch(`/cards/${id}`);
  },

  // ─── Get sets list ───
  async getSets() {
    return await this.fetch('/sets');
  },

  // ─── Get single set ───
  async getSet(id) {
    return await this.fetch(`/sets/${id}`);
  },

  // ─── Get series list ───
  async getSeries() {
    return await this.fetch('/series');
  },

  // ─── Get image URL ───
  getImageUrl(image, quality = 'high') {
    if (!image) return null;
    return `${image}/${quality}.webp`;
  },

  // ─── Build card HTML from API data ───
  buildCardHTML(card) {
    const imgUrl = card.image ? `${card.image}/high.webp` : null;
    const name = card.name || 'Carte inconnue';
    const setName = card.set?.name || '';
    const rarity = card.rarity || '';
    const id = card.id || '';

    // Generate a faux price based on rarity for demo purposes
    const rarityPriceMap = {
      'Rare': 8.99, 'Holo Rare': 14.99, 'Ultra Rare': 34.99,
      'Illustration Rare': 29.99, 'Special Art Rare': 49.99,
      'Secret Rare': 79.99, 'Hyper Rare': 99.99, 'Double Rare': 19.99,
      'Art Rare': 39.99, 'Shiny Rare': 24.99, 'ACE SPEC Rare': 12.99,
      'Amazing Rare': 19.99, 'Rare BREAK': 9.99, 'Rare Holo': 14.99,
      'Rare Holo EX': 24.99, 'Rare Holo GX': 24.99, 'Rare Holo V': 19.99,
      'Rare Holo VMAX': 34.99, 'Rare Holo VSTAR': 29.99, 'Rare Ultra': 44.99,
      'Rare Rainbow': 59.99, 'Rare Secret': 69.99,
    };
    const price = rarityPriceMap[rarity] || 5.99;

    // Rarity badge color
    let condClass = 'condition-nm';
    if (rarity?.includes('Secret') || rarity?.includes('Hyper') || rarity?.includes('Rainbow')) condClass = 'condition-mint';
    else if (rarity?.includes('Ultra') || rarity?.includes('Special') || rarity?.includes('Art')) condClass = 'condition-ex';

    return `
      <div class="poke-card" data-id="${id}" data-set="${card.set?.id || ''}" data-rarity="${rarity}" data-price="${price}" onclick="openCardDetail('${id}')">
        <div class="poke-card-img">
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;">` : `
          <div class="card-visual">
            <div class="card-bg" style="background:linear-gradient(135deg,#2a2a3e,#1a1a2e)"></div>
            <div class="card-name-overlay">${name}</div>
          </div>`}
          <div class="holo-sheen"></div>
        </div>
        <div class="poke-card-info">
          <div class="poke-card-set">${setName}</div>
          <div class="poke-card-name">${name}</div>
          <div class="poke-card-rarity">
            ${rarity} <span class="condition-badge ${condClass}">NM</span>
          </div>
          <div class="poke-card-footer">
            <div class="poke-card-price">${price.toFixed(2)}&nbsp;€</div>
            <button class="add-cart-btn" onclick="event.stopPropagation();addToCartAPI('${id}','${name.replace(/'/g,"\\'")}','${setName.replace(/'/g,"\\'")}',${price},'${imgUrl || ''}')" title="Ajouter au panier">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  },

  // ─── Build set card HTML ───
  buildSetHTML(set) {
    const logo = set.logo ? `${set.logo}/high.webp` : null;
    const symbol = set.symbol ? `${set.symbol}/high.webp` : null;
    const count = set.cardCount?.total || '?';
    return `
      <a href="boutique.html?set=${set.id}" class="category-card">
        <div class="category-card-bg" style="background:linear-gradient(135deg, var(--bg-elevated), var(--bg-card))">
          ${logo ? `<img src="${logo}" alt="${set.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:32px;opacity:0.7;">` : ''}
        </div>
        <div class="category-card-overlay"></div>
        <div class="category-card-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </div>
        <div class="category-card-content">
          <h3>${set.name}</h3>
          <p>${count} cartes</p>
        </div>
      </a>`;
  }
};

// ─── Build HTML for admin listings ───
// Store listings globally for cart reference
window._shopListings = [];
window._shopListingsCounter = 0;

function buildListingHTML(listing) {
  const index = window._shopListingsCounter++;
  const condClassMap = { 'Neuf':'mint', 'Mint':'mint','Near Mint':'nm','Excellent':'ex','Good':'good','Played':'played','Poor':'played' };
  const cc = condClassMap[listing.condition] || 'nm';
  const type = listing.type || 'Carte';
  const isCard = (type === 'Carte');

  // Type badge colors
  const typeColors = { 'Carte':'var(--holo-1)', 'Booster':'#f97316', 'ETB':'#a855f7', 'Coffret':'#22d3ee', 'Display':'#ec4899', 'Bundle':'#4ade80', 'Autre':'var(--text-muted)' };
  const typeColor = typeColors[type] || 'var(--text-muted)';

  // For non-card products, use cover instead of contain for better display
  const objectFit = isCard ? 'contain' : 'cover';

  const origin = listing.origin || 'FR';
  const originFlags = {'FR':'🇫🇷','EN':'🇬🇧','JA':'🇯🇵','KO':'🇰🇷','DE':'🇩🇪','ES':'🇪🇸','IT':'🇮🇹','PT':'🇧🇷','CN':'🇨🇳','TW':'🇹🇼'};
  const flag = originFlags[origin] || '🇫🇷';

  // Store listing in global array with unique index
  window._shopListings[index] = listing;

  return `
    <div class="poke-card" data-set="${listing.set || ''}" data-rarity="${listing.rarity || ''}" data-price="${listing.price}" data-type="${type}" data-origin="${origin}" onclick="openListingDetail(${index})" style="cursor:pointer;">
      <div class="poke-card-img">
        ${type !== 'Carte' ? `<span class="card-badge hot" style="background:${typeColor};">${type}</span>` : ''}
        ${!isCard ? `<span style="position:absolute;bottom:10px;left:10px;padding:4px 10px;border-radius:50px;font-size:0.65rem;font-weight:700;letter-spacing:0.05em;z-index:2;${(listing.stockQty || 0) > 0 ? 'background:rgba(74,222,128,0.15);color:#4ade80;border:1px solid rgba(74,222,128,0.25);' : 'background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.25);'}">${(listing.stockQty || 0) > 0 ? 'En stock' : 'Hors stock'}</span>` : ''}
        <span style="position:absolute;top:10px;right:10px;font-size:1.1rem;z-index:2;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));">${flag}</span>
        ${listing.image ? `<img src="${listing.image}" alt="${listing.name}" loading="lazy" style="width:100%;height:100%;object-fit:${objectFit};position:absolute;inset:0;">` : `
        <div class="card-visual">
          <div class="card-bg" style="background:linear-gradient(135deg,#2a2a3e,#1a1a2e)"></div>
          <div class="card-name-overlay">${listing.name}</div>
        </div>`}
        <div class="holo-sheen"></div>
      </div>
      <div class="poke-card-info">
        <div class="poke-card-set">${listing.set || ''}</div>
        <div class="poke-card-name">${listing.name}</div>
        <div class="poke-card-rarity">
          ${isCard ? `${listing.rarity || ''} <span class="condition-badge condition-${cc}">${listing.condition}</span>` : `<span style="color:${typeColor};font-weight:600;">${type}</span>`}
        </div>
        <div class="poke-card-footer">
          <div class="poke-card-price">${parseFloat(listing.price).toFixed(2)}&nbsp;€</div>
          ${!isCard && (listing.stockQty || 0) <= 0 ? `
          <button class="add-cart-btn" onclick="event.stopPropagation();toggleWishlist('${listing.name.replace(/'/g,"\\'")}');this.querySelector('svg').setAttribute('fill',isInWishlist('${listing.name.replace(/'/g,"\\'")}') ? '#ec4899' : 'none');this.style.borderColor=isInWishlist('${listing.name.replace(/'/g,"\\'")}') ? 'rgba(236,72,153,0.4)' : '';" title="Ajouter à la liste de souhaits" style="border-color:${isInWishlist(listing.name) ? 'rgba(236,72,153,0.4)' : ''};">
            <svg xmlns="http://www.w3.org/2000/svg" fill="${isInWishlist(listing.name) ? '#ec4899' : 'none'}" viewBox="0 0 24 24" stroke="#ec4899" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
          </button>` : `
          <button class="add-cart-btn" onclick="event.stopPropagation();addListingToCart(${index})" title="Ajouter au panier">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          </button>`}
        </div>
      </div>
    </div>`;
}

// Modal quantity state
window._modalQty = 1;

function changeModalQty(delta, index) {
  const listing = window._shopListings[index];
  if (!listing) return;
  const type = listing.type || 'Carte';
  const maxQty = type === 'Carte' ? 1 : (listing.stockQty || 1);
  window._modalQty = Math.max(1, Math.min(maxQty, window._modalQty + delta));

  const qtyEl = document.getElementById('modalQtyValue');
  if (qtyEl) qtyEl.textContent = window._modalQty;

  // Update displayed price
  const priceEl = document.getElementById('modalPriceDisplay');
  if (priceEl) {
    const total = (parseFloat(listing.price) * window._modalQty).toFixed(2);
    priceEl.innerHTML = window._modalQty > 1
      ? `${total}&nbsp;€ <span style="font-size:0.85rem;font-weight:500;color:var(--text-muted);">(${parseFloat(listing.price).toFixed(2)} € / unité)</span>`
      : `${total}&nbsp;€`;
  }
}

function addListingToCartQty(index) {
  const listing = window._shopListings[index];
  if (!listing) return;
  const qty = window._modalQty || 1;
  for (let i = 0; i < qty; i++) {
    cart.push({
      id: 'listing-' + index + '-' + Date.now() + '-' + i,
      name: listing.name,
      set: listing.set || '',
      price: parseFloat(listing.price),
      image: listing.image || '',
    });
  }
  saveCart();
  updateCartCount();
  renderCartItems();
  showToast(`${listing.name}${qty > 1 ? ' x' + qty : ''} ajouté au panier`);
  window._modalQty = 1;
}

function addListingToCart(index) {
  const listing = window._shopListings[index];
  if (!listing) return;
  cart.push({
    id: 'listing-' + index + '-' + Date.now(),
    name: listing.name,
    set: listing.set || '',
    price: parseFloat(listing.price),
    image: listing.image || '',
  });
  saveCart();
  updateCartCount();
  renderCartItems();
  showToast(`${listing.name} ajouté au panier`);
}

// ─── Get admin listings from localStorage ───
function getAdminListings() {
  return JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
}

// ─── WISHLIST ───
function getWishlist() {
  return JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('holofoil_wishlist', JSON.stringify(list));
}

function isInWishlist(productName) {
  const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
  if (!session) return false;
  return getWishlist().some(w => w.email === session.email && w.product === productName);
}

function toggleWishlist(productName) {
  const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
  if (!session) {
    showToast('Connectez-vous pour ajouter à votre liste de souhaits');
    return;
  }

  let list = getWishlist();
  const idx = list.findIndex(w => w.email === session.email && w.product === productName);

  if (idx !== -1) {
    list.splice(idx, 1);
    saveWishlist(list);
    showToast('Retiré de votre liste de souhaits');
  } else {
    list.push({ email: session.email, product: productName, date: new Date().toISOString() });
    saveWishlist(list);
    showToast('Ajouté à votre liste de souhaits — vous serez notifié par email');
  }

  // Update modal button if open
  const btn = document.getElementById('modalWishBtn');
  if (btn) {
    const inList = isInWishlist(productName);
    btn.querySelector('svg').setAttribute('fill', inList ? '#ec4899' : 'none');
    btn.style.background = inList ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.04)';
    btn.style.color = inList ? '#ec4899' : 'var(--text-secondary)';
    btn.childNodes[btn.childNodes.length - 1].textContent = inList ? 'Dans votre liste de souhaits' : 'Ajouter à ma liste de souhaits';
  }
}

// ─── Cart helper for API cards ───
function addToCartAPI(id, name, setName, price, imgUrl) {
  cart.push({ id, name, set: setName, price, image: imgUrl });
  saveCart();
  updateCartCount();
  renderCartItems();
  showToast(`${name} ajouté au panier`);
}

// ─── Listing detail popup ───
function openListingDetail(index) {
  const listing = window._shopListings[index];
  if (!listing) return;

  // Remove existing
  const existing = document.getElementById('listingModal');
  if (existing) existing.remove();

  const type = listing.type || 'Carte';
  const condClassMap = { 'Neuf':'mint','Mint':'mint','Near Mint':'nm','Excellent':'ex','Good':'good','Played':'played','Poor':'played' };
  const cc = condClassMap[listing.condition] || 'nm';
  const typeColors = { 'Carte':'var(--holo-1)','Booster':'#f97316','ETB':'#a855f7','Coffret':'#22d3ee','Display':'#ec4899','Bundle':'#4ade80','Autre':'var(--text-muted)' };
  const typeColor = typeColors[type] || 'var(--text-muted)';

  window._modalQty = 1;

  const modal = document.createElement('div');
  modal.id = 'listingModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(16px) saturate(1.3);padding:20px;';
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const objectFit = (type === 'Carte') ? 'contain' : 'cover';

  modal.innerHTML = `
    <div style="background:rgba(10,10,18,0.65);backdrop-filter:blur(32px) saturate(1.5);-webkit-backdrop-filter:blur(32px) saturate(1.5);border:1px solid rgba(255,255,255,0.08);border-radius:20px;max-width:860px;width:100%;max-height:90vh;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:0;animation:fadeInUp 0.3s ease;box-shadow:0 24px 80px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.05) inset;" onclick="event.stopPropagation()">
      <!-- Image -->
      <div style="padding:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:20px 0 0 20px;border-right:1px solid rgba(255,255,255,0.04);min-height:300px;">
        ${listing.image
          ? `<img src="${listing.image}" alt="${listing.name}" style="max-width:100%;max-height:70vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.4);object-fit:${objectFit};">`
          : `<div style="width:200px;height:280px;border-radius:12px;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.9rem;">Pas d'image</div>`
        }
      </div>
      <!-- Info -->
      <div style="padding:32px;overflow-y:auto;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;">
          <div style="flex:1;">
            ${listing.set ? `<div style="font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--holo-1);margin-bottom:8px;">${listing.set}</div>` : ''}
            <h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:700;line-height:1.3;">${listing.name}</h2>
          </div>
          <button onclick="document.getElementById('listingModal').remove()" style="width:36px;height:36px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:none;color:var(--text-primary);cursor:pointer;font-size:1.1rem;flex-shrink:0;margin-left:12px;">✕</button>
        </div>

        <!-- Badges -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">
          <span style="padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;background:rgba(255,255,255,0.04);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);color:${typeColor};">${type}</span>
          <span style="padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);">${{'FR':'🇫🇷 Française','EN':'🇬🇧 Anglaise','JA':'🇯🇵 Japonaise','KO':'🇰🇷 Coréenne','DE':'🇩🇪 Allemande','ES':'🇪🇸 Espagnole','IT':'🇮🇹 Italienne','PT':'🇧🇷 Portugaise','CN':'🇨🇳 Chinoise','TW':'🇹🇼 Taïwanaise'}[listing.origin] || '🇫🇷 Française'}</span>
          ${type === 'Carte' ? `<span class="condition-badge condition-${cc}" style="font-size:0.7rem;">${listing.condition}</span>` : ''}
          ${type === 'Carte' && listing.rarity ? `<span style="padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:600;background:rgba(168,85,247,0.1);color:#a855f7;">${listing.rarity}</span>` : ''}
          ${type !== 'Carte' ? `<span style="padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:700;letter-spacing:0.05em;${(listing.stockQty || 0) > 0 ? 'background:rgba(74,222,128,0.12);color:#4ade80;border:1px solid rgba(74,222,128,0.2);' : 'background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.2);'}">${(listing.stockQty || 0) > 0 ? (listing.stockQty + ' en stock') : 'Hors stock'}</span>` : ''}
        </div>

        <!-- Price -->
        <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin-bottom:8px;" id="modalPriceDisplay">
          ${parseFloat(listing.price).toFixed(2)}&nbsp;€
        </div>

        <!-- Description -->
        ${listing.description ? `
          <div style="margin-bottom:24px;">
            <h4 style="font-size:0.8rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">Description</h4>
            <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;">${(listing.description || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
          </div>
        ` : ''}

        <!-- Details -->
        <div style="margin-bottom:28px;">
          <h4 style="font-size:0.8rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">Détails</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="padding:12px 16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">Type</div>
              <div style="font-size:0.85rem;font-weight:600;">${type}</div>
            </div>
            <div style="padding:12px 16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">Langue</div>
              <div style="font-size:0.85rem;font-weight:600;">${{'FR':'Française','EN':'Anglaise','JA':'Japonaise','KO':'Coréenne','DE':'Allemande','ES':'Espagnole','IT':'Italienne','PT':'Portugaise','CN':'Chinoise','TW':'Taïwanaise'}[listing.origin] || 'Française'}</div>
            </div>
            ${type === 'Carte' ? `
            <div style="padding:12px 16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">État</div>
              <div style="font-size:0.85rem;font-weight:600;">${listing.condition}</div>
            </div>` : ''}
            ${listing.set ? `
            <div style="padding:12px 16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">Extension</div>
              <div style="font-size:0.85rem;font-weight:600;">${listing.set}</div>
            </div>` : ''}
            ${type === 'Carte' && listing.rarity ? `
            <div style="padding:12px 16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">Rareté</div>
              <div style="font-size:0.85rem;font-weight:600;">${listing.rarity}</div>
            </div>` : ''}
          </div>
        </div>

        <!-- Quantity + Add to cart -->
        ${(type !== 'Carte' && (listing.stockQty || 0) <= 0) ? `
        <div style="margin-bottom:12px;">
          <button onclick="event.stopPropagation();toggleWishlist('${listing.name.replace(/'/g,"\\'")}')" id="modalWishBtn" style="width:100%;padding:16px;border-radius:12px;font-size:0.95rem;font-weight:600;border:1px solid rgba(236,72,153,0.2);cursor:pointer;transition:0.3s ease;display:flex;align-items:center;justify-content:center;gap:10px;${isInWishlist(listing.name) ? 'background:rgba(236,72,153,0.12);color:#ec4899;' : 'background:rgba(255,255,255,0.04);color:var(--text-secondary);'}" onmouseover="this.style.borderColor='rgba(236,72,153,0.35)'" onmouseout="this.style.borderColor='rgba(236,72,153,0.2)'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="${isInWishlist(listing.name) ? '#ec4899' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
            ${isInWishlist(listing.name) ? 'Dans votre liste de souhaits' : 'Ajouter à ma liste de souhaits'}
          </button>
        </div>
        <p style="font-size:0.78rem;color:var(--text-muted);text-align:center;">Vous serez notifié par email dès que ce produit sera de retour en stock.</p>
        ` : `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);">Quantité</span>
          <div style="display:flex;align-items:center;border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.03);">
            <button onclick="changeModalQty(-1,${index})" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--text-primary);cursor:pointer;font-size:1.1rem;transition:0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">−</button>
            <span id="modalQtyValue" style="min-width:36px;text-align:center;font-family:var(--font-display);font-weight:700;font-size:0.95rem;">1</span>
            <button onclick="changeModalQty(1,${index})" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--text-primary);cursor:pointer;font-size:1.1rem;transition:0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">+</button>
          </div>
          ${type !== 'Carte' ? `<span style="font-size:0.75rem;color:var(--text-muted);" id="modalStockHint">${listing.stockQty || 1} disponible(s)</span>` : ''}
        </div>
        <button id="modalAddCartBtn" onclick="event.stopPropagation();addListingToCartQty(${index});document.getElementById('listingModal').remove();" style="width:100%;padding:16px;border-radius:12px;font-size:1rem;font-weight:600;background:linear-gradient(135deg,#4dc9f6,#7c3aed);color:#fff;border:none;cursor:pointer;transition:0.3s ease;display:flex;align-items:center;justify-content:center;gap:10px;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 30px rgba(77,201,246,0.25)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          Ajouter au panier
        </button>`}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// ─── Card detail modal ───
async function openCardDetail(cardId) {
  if (!cardId) return;
  const card = await TCGdex.getCard(cardId);
  if (!card) return;

  // Remove existing modal
  const existing = document.getElementById('cardModal');
  if (existing) existing.remove();

  const imgUrl = card.image ? `${card.image}/high.webp` : '';
  const modal = document.createElement('div');
  modal.id = 'cardModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.5);backdrop-filter:blur(16px) saturate(1.3);padding:20px;animation:fadeInUp 0.3s ease;
  `;

  const types = card.types?.join(', ') || '';
  const hp = card.hp || '';
  const attacks = card.attacks?.map(a => `
    <div style="margin-bottom:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
      <div style="font-weight:600;margin-bottom:4px;">${a.name} ${a.damage ? `<span style="color:var(--holo-1);margin-left:8px;">${a.damage}</span>` : ''}</div>
      ${a.effect ? `<div style="font-size:0.8rem;color:var(--text-secondary);">${a.effect}</div>` : ''}
    </div>
  `).join('') || '';

  modal.innerHTML = `
    <div style="background:rgba(10,10,18,0.65);backdrop-filter:blur(32px) saturate(1.5);-webkit-backdrop-filter:blur(32px) saturate(1.5);border:1px solid rgba(255,255,255,0.08);border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:0;box-shadow:0 24px 80px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.05) inset;" onclick="event.stopPropagation()">
      <div style="padding:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:20px 0 0 20px;border-right:1px solid rgba(255,255,255,0.04);">
        ${imgUrl ? `<img src="${imgUrl}" alt="${card.name}" style="max-width:100%;max-height:70vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.4);">` : ''}
      </div>
      <div style="padding:32px;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">
          <div>
            <div style="font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--holo-1);margin-bottom:6px;">${card.set?.name || ''}</div>
            <h2 style="font-family:var(--font-display);font-size:1.6rem;font-weight:700;">${card.name}</h2>
          </div>
          <button onclick="document.getElementById('cardModal').remove()" style="width:36px;height:36px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:none;color:var(--text-primary);cursor:pointer;font-size:1.1rem;">✕</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
          ${card.rarity ? `<span class="condition-badge condition-nm">${card.rarity}</span>` : ''}
          ${types ? `<span class="condition-badge condition-ex">${types}</span>` : ''}
          ${hp ? `<span class="condition-badge condition-mint">${hp} HP</span>` : ''}
          ${card.stage ? `<span class="condition-badge condition-good">${card.stage}</span>` : ''}
        </div>
        ${card.description ? `<p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:20px;">${card.description}</p>` : ''}
        ${attacks ? `<h4 style="font-family:var(--font-display);font-size:0.95rem;font-weight:600;margin-bottom:12px;">Attaques</h4>${attacks}` : ''}
        ${card.weaknesses?.length ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:12px;">Faiblesse : ${card.weaknesses.map(w=>w.type+' '+w.value).join(', ')}</div>` : ''}
        ${card.retreat ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Retraite : ${card.retreat}</div>` : ''}
        ${card.illustrator ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:12px;">Illustrateur : ${card.illustrator}</div>` : ''}
      </div>
    </div>
  `;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
}
