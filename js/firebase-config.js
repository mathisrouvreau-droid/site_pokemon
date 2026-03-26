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
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJET.firebasestorage.app",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
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
