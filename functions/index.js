/* ═══════════════════════════════════════
   HOLOFOIL — CLOUD FUNCTIONS
   Stripe Checkout + Webhooks
   ═══════════════════════════════════════

   SETUP :
   1. cd functions && npm install
   2. firebase functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."
      OU pour le mode test :
      firebase functions:config:set stripe.secret_key="sk_test_..." stripe.webhook_secret="whsec_..."
   3. firebase deploy --only functions
   4. Dans le dashboard Stripe → Webhooks → ajouter l'endpoint :
      https://<region>-<project>.cloudfunctions.net/stripeWebhook
      Events: checkout.session.completed, checkout.session.expired

   ═══════════════════════════════════════ */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Stripe init (clé depuis firebase functions:config)
const stripe = require("stripe")(
  functions.config().stripe?.secret_key || "SK_KEY_NOT_SET"
);

// URL du site (à adapter en prod)
const SITE_URL =
  functions.config().site?.url || "https://holofoil-14beb.web.app";

/* ─────────────────────────────────────
   CREATE CHECKOUT SESSION
   Appelé depuis le client quand l'utilisateur clique "Passer commande"
   ───────────────────────────────────── */
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { items, promoCode, promoPercent, userEmail, userName, userAddress, userCity, userZip } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Panier vide" });
      }
      if (!userEmail) {
        return res.status(400).json({ error: "Email requis" });
      }

      // Construire les line_items Stripe
      const lineItems = items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            description: item.set || undefined,
            images: item.image ? [item.image] : undefined,
          },
          unit_amount: Math.round((item.price || 0) * 100), // Stripe attend des centimes
        },
        quantity: item.quantity || 1,
      }));

      // Options de la session Checkout
      const sessionParams = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        customer_email: userEmail,
        success_url: `${SITE_URL}/compte.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/boutique.html?payment=cancelled`,
        locale: "fr",
        metadata: {
          userEmail,
          userName: userName || "",
          userAddress: userAddress || "",
          userCity: userCity || "",
          userZip: userZip || "",
          promoCode: promoCode || "",
          promoPercent: promoPercent ? String(promoPercent) : "0",
          itemCount: String(items.length),
        },
        // Collecter l'adresse de livraison si besoin
        shipping_address_collection: {
          allowed_countries: ["FR", "BE", "CH", "LU", "MC"],
        },
      };

      // Appliquer le code promo via Stripe Coupon
      if (promoCode && promoPercent > 0) {
        // Créer un coupon temporaire pour cette session
        const coupon = await stripe.coupons.create({
          percent_off: promoPercent,
          duration: "once",
          name: `Promo ${promoCode}`,
          max_redemptions: 1,
        });
        sessionParams.discounts = [{ coupon: coupon.id }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("[Holofoil] Stripe createCheckoutSession error:", error);
      return res.status(500).json({
        error: "Erreur lors de la création du paiement",
        details: error.message,
      });
    }
  });
});

/* ─────────────────────────────────────
   STRIPE WEBHOOK
   Reçoit les événements Stripe (paiement réussi, expiré, etc.)
   ───────────────────────────────────── */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = functions.config().stripe?.webhook_secret;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[Holofoil] Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ─── PAIEMENT RÉUSSI ───
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Récupérer les détails complets de la session
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "customer_details"],
      });

      const meta = session.metadata || {};
      const lineItems = fullSession.line_items?.data || [];

      // Construire la commande Firestore
      const order = {
        id: "HOL-" + Date.now().toString(36).toUpperCase(),
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent,
        email: meta.userEmail || session.customer_email || "",
        userName: meta.userName || "",
        userAddress: meta.userAddress || "",
        userCity: meta.userCity || "",
        userZip: meta.userZip || "",
        // Adresse de livraison Stripe (si collectée)
        shippingAddress: session.shipping_details || null,
        date: new Date().toLocaleDateString("fr-FR"),
        items: parseInt(meta.itemCount) || lineItems.length,
        details: lineItems.map((li) => ({
          name: li.description || li.price?.product?.name || "Article",
          price: (li.amount_total || 0) / 100,
          quantity: li.quantity || 1,
        })),
        subtotal: ((session.amount_subtotal || 0) / 100).toFixed(2),
        promoCode: meta.promoCode || null,
        promoPercent: parseInt(meta.promoPercent) || 0,
        discount: (
          ((session.amount_subtotal || 0) - (session.amount_total || 0)) /
          100
        ).toFixed(2),
        total: ((session.amount_total || 0) / 100).toFixed(2),
        status: "paid",
        paymentMethod: session.payment_method_types?.[0] || "card",
        ts: Date.now(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Sauvegarder dans Firestore
      await db.collection("orders").add(order);
      console.log(`[Holofoil] Order ${order.id} saved — ${order.total}€`);

      // Déduire le stock des articles
      await deductStock(lineItems);

    } catch (err) {
      console.error("[Holofoil] Error processing checkout.session.completed:", err);
    }
  }

  // ─── SESSION EXPIRÉE ───
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    console.log(`[Holofoil] Checkout session expired: ${session.id}`);
  }

  res.status(200).json({ received: true });
});

/* ─────────────────────────────────────
   DÉDUCTION DE STOCK
   Réduit stockQty dans la collection listings
   ───────────────────────────────────── */
async function deductStock(lineItems) {
  for (const item of lineItems) {
    const productName = item.description || "";
    if (!productName) continue;

    // Chercher le listing par nom
    const snap = await db
      .collection("listings")
      .where("name", "==", productName)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const listing = doc.data();
      const qty = item.quantity || 1;

      if (listing.type === "Carte") {
        // Les cartes sont uniques → supprimer le listing
        await doc.ref.delete();
        console.log(`[Holofoil] Stock: carte "${productName}" retirée`);
      } else if (listing.stockQty != null) {
        // Produits scellés → décrémenter
        const newQty = Math.max(0, (listing.stockQty || 0) - qty);
        await doc.ref.update({ stockQty: newQty });
        console.log(
          `[Holofoil] Stock: "${productName}" ${listing.stockQty} → ${newQty}`
        );
      }
    }
  }
}

/* ─────────────────────────────────────
   GET ORDER STATUS
   Permet au client de vérifier le statut d'une commande
   ───────────────────────────────────── */
exports.getOrderStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: "session_id requis" });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return res.status(200).json({
        status: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: (session.amount_total || 0) / 100,
      });
    } catch (error) {
      return res.status(404).json({ error: "Session non trouvée" });
    }
  });
});
