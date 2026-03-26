# Holofoil — Cartes Pokemon Premium

Site e-commerce de vente de cartes Pokemon et produits scelles avec une direction artistique sombre et holographique.

## Pages

- **Accueil** (`index.html`) — Hero banner avec mosaique curatee (cartes ex/V/VMAX/Prime/Niv.X), barre d'annonce animee, marquee, nouveautes scelles, cartes a la une, barre de confiance, newsletter
- **Boutique** (`boutique.html`) — Deux sections nouveautes (items scelles + cartes Pokemon), catalogue avec filtres custom liquid glass (set, rarete, provenance, etat, tri), pagination
- **Rachat** (`rachat.html`) — Formulaire de vente avec upload photos (drag & drop), etat de la carte, description
- **Admin** (`admin.html`) — Interface d'administration protegee par login

## Fonctionnalites

- Integration de l'API [TCGdex](https://tcgdex.dev/) pour les donnees et images des cartes
- Recherche globale accessible depuis la navbar (icone loupe ou Ctrl+K) avec resultats en temps reel
- Panier persistant (localStorage) avec sidebar laterale
- Selecteur de quantite dans les popups produit (limite au stock disponible)
- Gestion du stock pour les produits scelles (quantite configurable depuis l'admin, badge en stock/hors stock)
- Popups differencies : cartes (rarete, etat, condition) vs scelles (type, stock, langue)
- Dropdowns de filtres custom en liquid glass (remplacent les select natifs)
- Panel admin : ajout/modification/suppression de produits, gestion des acces admin, gestion du stock
- Recherche de cartes via API avec details complets (extension, rarete, type, HP, illustrateur)
- Import d'images personnalisees (tous formats)
- Particules flottantes interactives en fond (canvas, reagissent a la souris)
- Design responsive (mobile, tablette, desktop)
- Navbar flottante avec effet liquid glass
- Effets holographiques (bordures, animations, sheen sur les cartes)

## Structure du projet

```
├── index.html          # Page d'accueil
├── boutique.html       # Boutique
├── rachat.html         # Page de rachat
├── admin.html          # Panel d'administration
├── README.md
├── css/
│   ├── style.css       # Styles globaux (navbar, footer, cartes, panier, recherche, particules)
│   ├── home.css        # Styles page d'accueil
│   ├── boutique.css    # Styles boutique (dropdowns custom, filtres)
│   ├── rachat.css      # Styles rachat
│   └── admin.css       # Styles panel admin
├── js/
│   ├── data.js         # Service API TCGdex, listings, popups, panier, quantites
│   ├── main.js         # Logique panier, navbar, toast
│   ├── components.js   # Composants partages (navbar, footer, panier sidebar, recherche globale, particules)
│   └── admin.js        # Logique admin (auth, CRUD produits, gestion users, stock)
├── assets/             # Images et ressources
└── .claude/
    └── commands/       # Agents Claude Code custom
```

## Technologies

- HTML5, CSS3 (variables, animations, backdrop-filter, grid, flexbox)
- JavaScript vanilla (ES6+, async/await, localStorage, Canvas API)
- API REST [TCGdex v2](https://api.tcgdex.net/v2/fr/)
- Google Fonts (Syne, Outfit)

## API

Le site utilise l'API TCGdex pour recuperer les cartes Pokemon :
- **Base URL** : `https://api.tcgdex.net/v2/fr/`
- Endpoints : `/cards`, `/cards/{id}`, `/sets`, `/series`
- Images : `https://assets.tcgdex.net/{lang}/{set}/{id}/high.webp`
