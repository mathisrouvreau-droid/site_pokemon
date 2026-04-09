/* ═══════════════════════════════════════
   HOLOFOIL — STRIPE CHECKOUT (client)
   ═══════════════════════════════════════

   SETUP :
   1. Remplacer STRIPE_PUBLISHABLE_KEY par votre clé publique Stripe
   2. Remplacer CLOUD_FUNCTIONS_URL par l'URL de vos Cloud Functions
   3. Inclure <script src="https://js.stripe.com/v3/"></script> dans les pages HTML

   ═══════════════════════════════════════ */

// ─── CONFIGURATION ───
const STRIPE_CONFIG = {
  // Clé publique Stripe (pk_test_... ou pk_live_...)
  publishableKey: 'PK_KEY_NOT_SET',

  // URL de base des Cloud Functions Firebase
  // Format : https://<region>-<project-id>.cloudfunctions.net
  // Ex: https://europe-west1-holofoil-14beb.cloudfunctions.net
  functionsUrl: 'FUNCTIONS_URL_NOT_SET',

  // true = Stripe activé, false = mode local (sans paiement réel)
  enabled: false,
};

// ─── ÉTAT ───
let _stripeInstance = null;

function getStripe() {
  if (!_stripeInstance && STRIPE_CONFIG.enabled && typeof Stripe !== 'undefined') {
    _stripeInstance = Stripe(STRIPE_CONFIG.publishableKey);
  }
  return _stripeInstance;
}

function isStripeEnabled() {
  return STRIPE_CONFIG.enabled
    && STRIPE_CONFIG.publishableKey !== 'PK_KEY_NOT_SET'
    && STRIPE_CONFIG.functionsUrl !== 'FUNCTIONS_URL_NOT_SET';
}

/* ─────────────────────────────────────
   LANCER LE PAIEMENT STRIPE
   Appelé depuis placeOrder() quand Stripe est activé
   ───────────────────────────────────── */
async function startStripeCheckout() {
  const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
  if (!session) {
    showToast('Connectez-vous pour passer commande');
    setTimeout(() => { window.location.href = 'compte.html'; }, 1200);
    return;
  }

  const cartItems = JSON.parse(localStorage.getItem('holofoil_cart') || '[]');
  if (cartItems.length === 0) {
    showToast('Votre panier est vide');
    return;
  }

  // Vérifier les limites d'achat par compte
  if (typeof window._shopListings !== 'undefined') {
    const listings = Object.values(window._shopListings);
    const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
    const userOrders = orders.filter(o => o.email === session.email);
    for (const listing of listings) {
      if (!listing || !listing.maxPerAccount || listing.maxPerAccount <= 0) continue;
      let pastCount = 0;
      userOrders.forEach(order => {
        (order.details || []).forEach(item => {
          if (item.name === listing.name) pastCount += (item.quantity || 1);
        });
      });
      const inCart = cartItems.filter(item => item.name === listing.name).length;
      if (pastCount + inCart > listing.maxPerAccount) {
        showToast(`Limite dépassée pour ${listing.name} : max ${listing.maxPerAccount} par compte`);
        return;
      }
    }
  }

  // Récupérer les infos utilisateur
  const users = JSON.parse(localStorage.getItem('holofoil_users') || '[]');
  const user = users.find(u => u.email === session.email) || {};
  const promo = (typeof appliedPromo !== 'undefined' && appliedPromo) ? appliedPromo : null;

  // Préparer les items pour Stripe
  const items = cartItems.map(item => ({
    name: item.name,
    set: item.set || '',
    price: item.price || 0,
    image: item.image || '',
    quantity: 1,
  }));

  // Afficher un loader
  const checkoutBtn = document.querySelector('.cart-checkout-btn');
  const originalText = checkoutBtn?.textContent;
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;"></span>
        Redirection vers le paiement...
      </span>`;
  }

  try {
    // Appeler la Cloud Function
    const response = await fetch(`${STRIPE_CONFIG.functionsUrl}/createCheckoutSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        promoCode: promo?.code || null,
        promoPercent: promo?.percent || 0,
        userEmail: session.email,
        userName: (user.firstName || '') + ' ' + (user.lastName || ''),
        userAddress: user.address || '',
        userCity: user.city || '',
        userZip: user.zip || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    // Sauvegarder le panier temporairement (pour restaurer si annulation)
    localStorage.setItem('holofoil_cart_backup', JSON.stringify(cartItems));
    localStorage.setItem('holofoil_pending_session', data.sessionId);

    // Rediriger vers Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      // Fallback avec Stripe.js
      const stripe = getStripe();
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) throw error;
      }
    }

  } catch (error) {
    console.error('[Holofoil] Stripe checkout error:', error);
    showToast('Erreur lors du paiement : ' + error.message);

    // Restaurer le bouton
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = originalText || 'Passer commande';
    }
  }
}

/* ─────────────────────────────────────
   GÉRER LE RETOUR DE STRIPE
   Appelé au chargement de la page après redirect
   ───────────────────────────────────── */
function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const sessionId = params.get('session_id');

  if (payment === 'success' && sessionId) {
    handlePaymentSuccess(sessionId);
  } else if (payment === 'cancelled') {
    handlePaymentCancelled();
  }
}

async function handlePaymentSuccess(sessionId) {
  // Vider le panier
  localStorage.setItem('holofoil_cart', '[]');
  localStorage.removeItem('holofoil_cart_backup');
  localStorage.removeItem('holofoil_pending_session');
  if (typeof cart !== 'undefined') cart.length = 0;
  if (typeof appliedPromo !== 'undefined') appliedPromo = null;
  if (typeof updateCartCount === 'function') updateCartCount();

  showToast('Paiement confirmé ! Merci pour votre commande.');

  // Vérifier le statut auprès du serveur
  if (isStripeEnabled()) {
    try {
      const res = await fetch(`${STRIPE_CONFIG.functionsUrl}/getOrderStatus?session_id=${sessionId}`);
      const data = await res.json();
      if (data.status === 'paid') {
        // Payment confirmed
      }
    } catch (e) {
      console.warn('[Holofoil] Could not verify payment status:', e);
    }
  }

  // Nettoyer l'URL
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);
}

function handlePaymentCancelled() {
  // Restaurer le panier si backup existe
  const backup = localStorage.getItem('holofoil_cart_backup');
  if (backup) {
    localStorage.setItem('holofoil_cart', backup);
    localStorage.removeItem('holofoil_cart_backup');
    if (typeof cart !== 'undefined') {
      cart.length = 0;
      cart.push(...JSON.parse(backup));
    }
    if (typeof updateCartCount === 'function') updateCartCount();
  }
  localStorage.removeItem('holofoil_pending_session');

  showToast('Paiement annulé — votre panier a été conservé.');

  // Nettoyer l'URL
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);
}

/* ─────────────────────────────────────
   INITIALISATION
   ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  handleStripeReturn();
});
