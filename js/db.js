/* ═══════════════════════════════════════
   HOLOFOIL — DATABASE SERVICE
   Abstraction Firestore / localStorage

   Si Firebase est configuré → Firestore
   Sinon → fallback localStorage (dev)
   ═══════════════════════════════════════ */

const DB = {

  // ═══ LISTINGS (produits en vente) ═══
  async getListings() {
    if (!FIREBASE_READY) return JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
    const snap = await db.collection('listings').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async saveListing(listing) {
    if (!FIREBASE_READY) {
      const listings = JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
      listing.createdAt = listing.createdAt || Date.now();
      listings.unshift(listing);
      localStorage.setItem('holofoil_listings', JSON.stringify(listings));
      return;
    }
    listing.createdAt = listing.createdAt || firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('listings').add(listing);
  },

  async updateListing(index, listing) {
    if (!FIREBASE_READY) {
      const listings = JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
      listings[index] = listing;
      localStorage.setItem('holofoil_listings', JSON.stringify(listings));
      return;
    }
    // In Firestore mode, index is the doc ID (_id)
    const id = listing._id;
    if (!id) return;
    const data = { ...listing };
    delete data._id;
    await db.collection('listings').doc(id).update(data);
  },

  async deleteListing(index) {
    if (!FIREBASE_READY) {
      const listings = JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
      listings.splice(index, 1);
      localStorage.setItem('holofoil_listings', JSON.stringify(listings));
      return;
    }
    // In Firestore mode, index is doc ID
    await db.collection('listings').doc(index).delete();
  },

  async updateListingField(index, field, value) {
    if (!FIREBASE_READY) {
      const listings = JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
      if (listings[index]) {
        listings[index][field] = value;
        localStorage.setItem('holofoil_listings', JSON.stringify(listings));
      }
      return;
    }
    await db.collection('listings').doc(index).update({ [field]: value });
  },

  // ═══ ORDERS (commandes) ═══
  async getOrders() {
    if (!FIREBASE_READY) return JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
    try {
      const snap = await db.collection('orders').get();
      return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch(e) {
      console.warn('[Holofoil] Firestore orders query failed, falling back to localStorage:', e.message);
      return JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
    }
  },

  async getOrdersByEmail(email) {
    if (!FIREBASE_READY) {
      return JSON.parse(localStorage.getItem('holofoil_orders') || '[]').filter(o => o.email === email);
    }
    try {
      const snap = await db.collection('orders').where('email', '==', email).get();
      return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch(e) {
      console.warn('[Holofoil] Firestore orders query failed, falling back to localStorage:', e.message);
      return JSON.parse(localStorage.getItem('holofoil_orders') || '[]').filter(o => o.email === email);
    }
  },

  async addOrder(order) {
    if (!FIREBASE_READY) {
      const orders = JSON.parse(localStorage.getItem('holofoil_orders') || '[]');
      orders.push(order);
      localStorage.setItem('holofoil_orders', JSON.stringify(orders));
      return;
    }
    await db.collection('orders').add(order);
  },

  // ═══ USERS (comptes clients) ═══
  async getUsers() {
    if (!FIREBASE_READY) return JSON.parse(localStorage.getItem('holofoil_users') || '[]');
    const snap = await db.collection('users').get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async getUserByEmail(email) {
    if (!FIREBASE_READY) {
      const users = JSON.parse(localStorage.getItem('holofoil_users') || '[]');
      return users.find(u => u.email === email) || null;
    }
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return { _id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async createUser(userData) {
    if (!FIREBASE_READY) {
      const users = JSON.parse(localStorage.getItem('holofoil_users') || '[]');
      users.push(userData);
      localStorage.setItem('holofoil_users', JSON.stringify(users));
      return;
    }
    // Create Firebase Auth account
    const cred = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
    // Store profile in Firestore (without password)
    const profile = { ...userData };
    delete profile.password;
    profile.uid = cred.user.uid;
    await db.collection('users').doc(cred.user.uid).set(profile);
  },

  async updateUser(email, updates) {
    if (!FIREBASE_READY) {
      const users = JSON.parse(localStorage.getItem('holofoil_users') || '[]');
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) { Object.assign(users[idx], updates); localStorage.setItem('holofoil_users', JSON.stringify(users)); }
      return;
    }
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) await snap.docs[0].ref.update(updates);
  },

  // ─── Auth helpers ───
  async loginUser(email, password) {
    if (!FIREBASE_READY) {
      const users = JSON.parse(localStorage.getItem('holofoil_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Email ou mot de passe incorrect.');
      localStorage.setItem('holofoil_user_session', JSON.stringify({ email, ts: Date.now() }));
      return user;
    }
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async logoutUser() {
    if (!FIREBASE_READY) {
      localStorage.removeItem('holofoil_user_session');
      return;
    }
    await auth.signOut();
  },

  getCurrentUserEmail() {
    if (!FIREBASE_READY) {
      const session = JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
      return session?.email || null;
    }
    return auth.currentUser?.email || null;
  },

  isLoggedIn() {
    if (!FIREBASE_READY) {
      return !!JSON.parse(localStorage.getItem('holofoil_user_session') || 'null');
    }
    return !!auth.currentUser;
  },

  // ═══ ADMINS ═══
  async getAdmins() {
    if (!FIREBASE_READY) {
      let admins = JSON.parse(localStorage.getItem('holofoil_admins') || 'null');
      if (!admins) {
        admins = [{ email: 'admin@holofoil.fr', password: 'ChangezCeMotDePasse!', role: 'owner' }];
        localStorage.setItem('holofoil_admins', JSON.stringify(admins));
      }
      return admins;
    }
    const snap = await db.collection('admins').get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async saveAdmins(admins) {
    if (!FIREBASE_READY) {
      localStorage.setItem('holofoil_admins', JSON.stringify(admins));
      return;
    }
    // Batch write
    const batch = db.batch();
    // Delete existing
    const existing = await db.collection('admins').get();
    existing.docs.forEach(d => batch.delete(d.ref));
    // Write new
    admins.forEach(a => batch.set(db.collection('admins').doc(), a));
    await batch.commit();
  },

  getAdminSession() {
    return JSON.parse(localStorage.getItem('holofoil_admin_session') || 'null');
  },

  setAdminSession(email) {
    localStorage.setItem('holofoil_admin_session', JSON.stringify({ email, ts: Date.now() }));
  },

  clearAdminSession() {
    localStorage.removeItem('holofoil_admin_session');
  },

  // ═══ WISHLIST ═══
  async getWishlist() {
    if (!FIREBASE_READY) return JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]');
    const snap = await db.collection('wishlist').get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async getWishlistByEmail(email) {
    if (!FIREBASE_READY) {
      return JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]').filter(w => w.email === email);
    }
    const snap = await db.collection('wishlist').where('email', '==', email).get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async addToWishlist(entry) {
    if (!FIREBASE_READY) {
      const list = JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]');
      list.push(entry);
      localStorage.setItem('holofoil_wishlist', JSON.stringify(list));
      return;
    }
    await db.collection('wishlist').add(entry);
  },

  async removeFromWishlist(email, product) {
    if (!FIREBASE_READY) {
      let list = JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]');
      list = list.filter(w => !(w.email === email && w.product === product));
      localStorage.setItem('holofoil_wishlist', JSON.stringify(list));
      return;
    }
    const snap = await db.collection('wishlist').where('email', '==', email).where('product', '==', product).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  async isInWishlist(email, product) {
    if (!FIREBASE_READY) {
      return JSON.parse(localStorage.getItem('holofoil_wishlist') || '[]').some(w => w.email === email && w.product === product);
    }
    const snap = await db.collection('wishlist').where('email', '==', email).where('product', '==', product).limit(1).get();
    return !snap.empty;
  },

  // ═══ EXPENSES (comptabilité) ═══
  async getExpenses() {
    if (!FIREBASE_READY) return JSON.parse(localStorage.getItem('holofoil_expenses') || '[]');
    const snap = await db.collection('expenses').orderBy('ts', 'desc').get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async addExpense(expense) {
    if (!FIREBASE_READY) {
      const expenses = JSON.parse(localStorage.getItem('holofoil_expenses') || '[]');
      expenses.push(expense);
      localStorage.setItem('holofoil_expenses', JSON.stringify(expenses));
      return;
    }
    await db.collection('expenses').add(expense);
  },

  async deleteExpense(index) {
    if (!FIREBASE_READY) {
      const expenses = JSON.parse(localStorage.getItem('holofoil_expenses') || '[]');
      expenses.splice(index, 1);
      localStorage.setItem('holofoil_expenses', JSON.stringify(expenses));
      return;
    }
    await db.collection('expenses').doc(index).delete();
  },

  // ═══ NOTIFICATIONS ═══
  async addNotifications(notifs) {
    if (!FIREBASE_READY) {
      const existing = JSON.parse(localStorage.getItem('holofoil_notifications') || '[]');
      existing.push(...notifs);
      localStorage.setItem('holofoil_notifications', JSON.stringify(existing));
      return;
    }
    const batch = db.batch();
    notifs.forEach(n => batch.set(db.collection('notifications').doc(), n));
    await batch.commit();
  },

  // ═══ CART (reste en localStorage — spécifique au navigateur) ═══
  getCart() {
    return JSON.parse(localStorage.getItem('holofoil_cart') || '[]');
  },

  saveCart(cart) {
    localStorage.setItem('holofoil_cart', JSON.stringify(cart));
  },

  clearCart() {
    localStorage.setItem('holofoil_cart', '[]');
  },

  // ═══ SYNC Firestore → localStorage ═══
  // Permet au code synchrone existant (getAdminListings, getListings) de fonctionner
  // même quand les données viennent de Firestore
  async syncToLocal() {
    if (!FIREBASE_READY) return;
    try {
      // Listings
      const snap = await db.collection('listings').orderBy('createdAt', 'desc').get();
      const listings = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      localStorage.setItem('holofoil_listings', JSON.stringify(listings));

      // Promo codes
      const promoSnap = await db.collection('promo_codes').get();
      if (!promoSnap.empty) {
        const codes = promoSnap.docs.map(d => d.data());
        localStorage.setItem('holofoil_promo_codes', JSON.stringify(codes));
      }

      // Custom sets
      const setsSnap = await db.collection('custom_sets').get();
      if (!setsSnap.empty) {
        const sets = setsSnap.docs.map(d => d.data().name).filter(Boolean);
        localStorage.setItem('holofoil_custom_sets', JSON.stringify(sets));
      }

      // Announcements
      const annSnap = await db.collection('settings').doc('announcements').get();
      if (annSnap.exists) {
        const data = annSnap.data();
        if (data.announcements) localStorage.setItem('holofoil_announcements', JSON.stringify(data.announcements));
        if (data.marquee) localStorage.setItem('holofoil_marquee', JSON.stringify(data.marquee));
      }
    } catch (e) {
      console.warn('[Holofoil] Sync Firestore → localStorage failed:', e.message);
    }
  },

  // ═══ PUSH localStorage → Firestore ═══
  // Appelé après chaque modification admin pour propager les changements
  async pushListings() {
    if (!FIREBASE_READY) return;
    try {
      const listings = JSON.parse(localStorage.getItem('holofoil_listings') || '[]');
      // Get existing docs
      const existing = await db.collection('listings').get();
      const batch = db.batch();
      existing.docs.forEach(d => batch.delete(d.ref));
      listings.forEach(l => {
        const data = { ...l };
        delete data._id;
        if (!data.createdAt) data.createdAt = Date.now();
        batch.set(db.collection('listings').doc(), data);
      });
      await batch.commit();
    } catch (e) {
      console.warn('[Holofoil] Push listings to Firestore failed:', e.message);
    }
  },

  async pushPromoCodes() {
    if (!FIREBASE_READY) return;
    try {
      const codes = JSON.parse(localStorage.getItem('holofoil_promo_codes') || '[]');
      const existing = await db.collection('promo_codes').get();
      const batch = db.batch();
      existing.docs.forEach(d => batch.delete(d.ref));
      codes.forEach(c => batch.set(db.collection('promo_codes').doc(), c));
      await batch.commit();
    } catch (e) {
      console.warn('[Holofoil] Push promo codes failed:', e.message);
    }
  },

  async pushCustomSets() {
    if (!FIREBASE_READY) return;
    try {
      const sets = JSON.parse(localStorage.getItem('holofoil_custom_sets') || '[]');
      const existing = await db.collection('custom_sets').get();
      const batch = db.batch();
      existing.docs.forEach(d => batch.delete(d.ref));
      sets.forEach(s => batch.set(db.collection('custom_sets').doc(), { name: s }));
      await batch.commit();
    } catch (e) {
      console.warn('[Holofoil] Push custom sets failed:', e.message);
    }
  },

  async pushAnnouncements() {
    if (!FIREBASE_READY) return;
    try {
      const announcements = JSON.parse(localStorage.getItem('holofoil_announcements') || '[]');
      const marquee = JSON.parse(localStorage.getItem('holofoil_marquee') || '[]');
      await db.collection('settings').doc('announcements').set({ announcements, marquee }, { merge: true });
    } catch (e) {
      console.warn('[Holofoil] Push announcements failed:', e.message);
    }
  }
};

// ═══ AUTO-SYNC on page load ═══
if (typeof FIREBASE_READY !== 'undefined' && FIREBASE_READY) {
  DB.syncToLocal().then(() => {
    // Dispatch event so pages can react when sync is complete
    window.dispatchEvent(new Event('holofoil-synced'));
  });
}
