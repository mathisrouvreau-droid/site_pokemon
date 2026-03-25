# Holofoil — Cartes Pokémon Premium

Site e-commerce de vente de cartes Pokémon avec une direction artistique sombre et holographique/chromatique.

## Pages

- **Accueil** (`index.html`) — Hero banner avec mosaïque de cartes, barre d'annonce animée, marquee, catégories par sets, cartes à la une, barre de confiance, newsletter
- **Boutique** (`boutique.html`) — Nouveautés, best-sellers, catalogue complet avec filtres (set, rareté, recherche), pagination
- **Rachat** (`rachat.html`) — Formulaire de vente avec upload photos (drag & drop), état de la carte, description
- **Admin** (`admin.html`) — Interface d'administration protégée par login

## Fonctionnalités

- Intégration de l'API [TCGdex](https://tcgdex.dev/) pour les données et images des cartes
- Panier persistant (localStorage) avec sidebar latérale
- Système de filtres et pagination sur la boutique
- Panel admin : ajout/modification/suppression de cartes en vente, gestion des accès admin
- Recherche de cartes via API avec détails complets (extension, rareté, type, HP, illustrateur)
- Import d'images personnalisées (tous formats)
- Design responsive (mobile, tablette, desktop)
- Navbar flottante avec effet liquid glass
- Effets holographiques/chromatiques (texte, bordures, animations)

## Structure du projet

```
├── index.html          # Page d'accueil
├── boutique.html       # Boutique
├── rachat.html         # Page de rachat
├── admin.html          # Panel d'administration
├── README.md
├── css/
│   ├── style.css       # Styles globaux (navbar, footer, cartes, panier, effets)
│   ├── home.css        # Styles page d'accueil
│   ├── boutique.css    # Styles boutique
│   ├── rachat.css      # Styles rachat
│   └── admin.css       # Styles panel admin
├── js/
│   ├── data.js         # Service API TCGdex + helpers
│   ├── main.js         # Logique panier, navbar, toast, skeletons
│   ├── components.js   # Composants partagés (navbar, footer, panier sidebar)
│   └── admin.js        # Logique admin (auth, CRUD cartes, gestion users)
└── assets/             # Images et ressources
```

## Technologies

- HTML5, CSS3 (variables, animations, backdrop-filter, grid, flexbox)
- JavaScript vanilla (ES6+, async/await, localStorage)
- API REST [TCGdex v2](https://api.tcgdex.net/v2/fr/)
- Google Fonts (Syne, Outfit)

## API

Le site utilise l'API TCGdex pour récupérer les cartes Pokémon :
- **Base URL** : `https://api.tcgdex.net/v2/fr/`
- Endpoints : `/cards`, `/cards/{id}`, `/sets`, `/series`
- Images : `https://assets.tcgdex.net/fr/{set}/{id}/high.webp`
