/* ═══════════════════════════════════════
   HOLOFOIL — FIREBASE CONFIGURATION
   ═══════════════════════════════════════

   INSTRUCTIONS :
   1. Créer un projet sur https://console.firebase.google.com
   2. Ajouter une application Web
   3. Remplacer les valeurs ci-dessous par celles de votre projet
   4. Activer Firestore Database (mode test)
   5. Activer Authentication > Email/Mot de passe
   ═══════════════════════════════════════ */

// ─── FIREBASE CONFIG (à remplacer avec vos valeurs) ───
const firebaseConfig = {
  apiKey: "AIzaSyBXP7SMHBfvewIs5fINM8_9xnmbGmkReQ0",
  authDomain: "holofoil-14beb.firebaseapp.com",
  projectId: "holofoil-14beb",
  storageBucket: "holofoil-14beb.firebasestorage.app",
  messagingSenderId: "658411672131",
  appId: "1:658411672131:web:b1668cb09036be4e833af6",
  measurementId: "G-DHRNKV1HPY"
};

// ─── INIT ───
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Check if Firebase is properly configured
const FIREBASE_READY = firebaseConfig.apiKey !== "VOTRE_API_KEY";

if (!FIREBASE_READY) {
  console.warn('[Holofoil] Firebase non configuré — mode localStorage (dev)');
}
