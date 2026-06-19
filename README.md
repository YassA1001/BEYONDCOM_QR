# BeyondCom QR Event Platform

Plateforme web événementielle permettant de créer des **pages publiques dynamiques accessibles par QR code**. Chaque événement possède un QR code unique qui pointe vers une page publique `/e/:slug`. L'administrateur peut modifier les liens / boutons **même après impression du QR code**, sans devoir le régénérer ni le réimprimer.

Projet complet, moderne, animé avec micro-interactions, responsive, et prêt pour une soutenance.

---

## 1. Présentation

BeyondCom QR Event Platform est un produit interne pour une agence événementielle. Il permet :

- de créer des pages publiques élégantes (mobile-first) par événement,
- de générer un QR code **stable** pointant vers `/e/:slug`,
- d'éditer les boutons affichés sans toucher au QR (les boutons passent par `/go/:linkId`),
- de tracker les scans (appareil / navigateur / OS) et les clics,
- de visualiser des statistiques claires dans un dashboard,
- de gérer plusieurs comptes administrateurs (rôles SUPER_ADMIN / ADMIN).

---

## 2. Stack technique

| Couche | technologies |
|--------|--------------|
| Backend | Node.js, Express.js |
| Frontend | EJS, Bootstrap 5, Bootstrap Icons, Chart.js, vanilla JS |
| Base de données | MySQL |
| ORM | Prisma |
| Authentification | express-session + bcrypt (saltRounds 12) |
| Upload images | Multer |
| QR code | qrcode |
| Graphiques | Chart.js |
| Sécurité | helmet, express-rate-limit, joi, slugify |
| Cache | node-cache (TTL 60 s) |
| Device/browser/os | express-useragent |
| Animations | CSS transitions / keyframes + Bootstrap + vanille JS |

Interdictions respectées : pas de React, ni Next.js, ni SQLite, ni version en mémoire, ni simplification de l'authentification.

---

## 3. Installation

Pré-requis :

- Node.js 18+
- MySQL 8 (une base `beyondcom` doit exister)

```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Copier et remplir le .env
cp .env.example .env
#   -> éditez DATABASE_URL, SESSION_SECRET, ADMIN_*

# 3. Générer le client Prisma
npx prisma generate

# 4. Créer les tables en base
npx prisma migrate dev --name init

# 5. Créer le super admin + événement de démo
npm run seed

# 6. Démarrer en développement
npm run dev
```

L'application démarre sur `http://localhost:3000`.

---

## 4. Configuration `.env`

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | URL de connexion MySQL (`mysql://user:pass@host:port/db`) |
| `SESSION_SECRET` | Secret de signature de session (long et aléatoire) |
| `APP_URL` | URL publique de l'application (utilisée pour générer les QR codes) |
| `NODE_ENV` | `development` ou `production` |
| `PORT` | Port d'écoute (défaut `3000`) |
| `ADMIN_NAME` | Nom du super admin créé par le seed |
| `ADMIN_EMAIL` | Email du super admin créé par le seed |
| `ADMIN_PASSWORD` | Mot de passe du super admin (hashé en base) |

Si une variable obligatoire manque, **l'application s'arrête au démarrage** avec un message clair (voir `config/env.js`).

---

## 5. Commandes Prisma

```bash
npx prisma generate          # régénère le client après modif du schema.prisma
npx prisma migrate dev       # applique les migrations en dev
npx prisma studio            # explore la base via une UI
npx prisma migrate reset    # réinitialise la base (DEV ONLY !)
```

---

## 6. Seed admin

```bash
npm run seed
```

Crée, si elle n'existe pas déjà, un compte `SUPER_ADMIN` depuis les variables `ADMIN_*` du `.env` (mot de passe hashé avec bcrypt rounds 12). Crée également un événement de démonstration **« AMECHO 2026 »** (`/e/amecho-2026`) avec 6 liens (site, programme PDF, Maps, WhatsApp, Instagram, feedback).

---

## 7. Lancement

```bash
npm run dev      # avec nodemon (hot reload)
npm start        # sans nodemon (production)
```

---

## 8. Routes principales

### Auth
| Méthode | URL | Description |
|--------|-----|-------------|
| GET | `/login` | Formulaire de connexion |
| POST | `/login` | Connexion (rate limit 10/15 min) |
| GET | `/register` | Formulaire d'inscription |
| POST | `/register` | Inscription |
| POST | `/logout` | Déconnexion |

### Admin (protégé par `requireAuth`)
| Méthode | URL | Description |
|--------|-----|-------------|
| GET | `/admin/dashboard` | Tableau de bord |
| GET | `/admin/events` | Liste des événements |
| GET/POST | `/admin/events/create` | Créer |
| GET | `/admin/events/:id` | Détails |
| GET | `/admin/events/:id/edit` | Éditer |
| POST | `/admin/events/:id` | Modifier |
| POST | `/admin/events/:id/delete` | Supprimer |
| POST | `/admin/events/:id/toggle` | Activer/désactiver |
| GET | `/admin/events/:id/qr` | QR code |
| POST | `/admin/events/:id/qr/generate` | Régénérer |
| GET | `/admin/events/:id/qr/download` | Télécharger PNG |
| GET | `/admin/events/:id/stats` | Statistiques |
| GET | `/admin/events/:eventId/links` | Liste des liens |
| POST | `/admin/events/:eventId/links` | Ajouter un lien |
| GET | `/admin/events/:eventId/links/:linkId/edit` | Modifier |
| POST | `/admin/events/:eventId/links/:linkId` | Enregistrer |
| POST | `/admin/events/:eventId/links/:linkId/delete` | Supprimer |
| POST | `/admin/events/:eventId/links/:linkId/toggle` | Activer/désactiver |
| POST | `/admin/events/:eventId/links/reorder` | Réordonner (JSON) |
| GET | `/admin/users` | Liste admins (SUPER_ADMIN) |
| GET/POST | `/admin/users/create` | Créer admin |
| POST | `/admin/users/:id/toggle` | Activer/désactiver |
| POST | `/admin/users/:id/delete` | Supprimer |

### Public
| Méthode | URL | Description |
|--------|-----|-------------|
| GET | `/e/:slug` | Page publique événement (scan enregistré) |
| GET | `/go/:linkId` | Tracker + redirection vers l'URL réelle |
| GET | `/` | Redirige vers `/login` ou `/admin/dashboard` |

---

## 9. Scénario de démonstration (test complet)

1. Launched — l'application vérifie le `.env` au démarrage.
2. Prisma se connecte à MySQL.
3. `npm run seed` crée le super admin + l'événement démo.
4. Ouvrez `/login`, connectez-vous.
5. Le dashboard s'affiche avec compteurs, graphiques, listes.
6. Créez un événement « AMECHO 2026 » → slug auto `amecho-2026`.
7. Ajoutez logo, bannière, ville, lieu, description, couleur.
8. Ajoutez 6 liens : Site, Programme PDF, Maps, WhatsApp, Instagram, Feedback.
9. Générez le QR code depuis `/admin/events/:id/qr`.
10. Téléchargez le PNG, copiez le lien public.
11. Ouvrez `/e/amecho-2026` : la page publique s'affiche, le scan est enregistré.
12. Cliquez un bouton : passage par `/go/:linkId` → clic enregistré → redirection.
13. Ouvrez `/admin/events/:id/stats` : tous les compteurs augmentent, graphiques mis à jour.
14. Modifiez un lien : le même QR affiche la version mise à jour.
15. Désactivez un bouton : il disparaît de la page publique.
16. Désactivez l'événement : la page publique affiche une **404 propre**.
17. Testez `/go/999999` : aucune erreur visible, redirection discrète vers `/`.

---

## 10. Identifiants de test (par défaut du `.env.example`)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@beyondcom.local` | `Admin123456!` | SUPER_ADMIN |

---

## 11. Problèmes fréquents

| Problème | Solution |
|----------|----------|
| `[FATAL] Missing required environment variables` | Une variable obligatoire manque dans `.env`. |
| `Can't reach database server` | Vérifiez que MySQL tourne et que `DATABASE_URL` est correcte. |
| QR code non affiché | Cliquez sur « Générer / Régénérer » dans `/admin/events/:id/qr`. Le fichier est créé dans `public/qrcodes/<slug>-qr.png`. |
| Upload refusé | Format JPG/PNG uniquement, taille max 2 Mo. |
| « Identifiants incorrects » | Message générique volontaire : on ne révèle jamais si l'email existe. Vérifiez l'email + mot de passe. |
| Page publique 404 | L'événement est inactif ou le slug est faux. |
| Login bloqué | Rate limit : 10 tentatives / 15 min. Patientez. |
| Le cache empêche les mises à jour | Durée 60 s. Toute modification d'événement/lien invalide le cache concerné. Le scan et le clic sont **toujours** enregistrés (fire-and-forget). |

---

## 12. Architecture

```
routes → controllers → services → prisma
```

- Les **routes** branchent middlewares + validators.
- Les **controllers** ne gèrent que `req` / `res`.
- Les **services** portent la logique métier (QR, statistiques, slug, cache).
- **Prisma** est le seul point de contact avec la base.

Arborescence détaillée dans le projet (voir `views/`, `controllers/`, `services/`, `middleware/`, `validators/`, `utils/`, `config/`).

---

## 13. Sécurité

- bcrypt saltRounds 12
- express-session (`httpOnly`, `secure` en prod, `sameSite=lax`)
- helmet (en-têtes de sécurité)
- express-rate-limit sur `/login`
- validation Joi côté serveur
- protection routes admin via `requireAuth` + `requireSuperAdmin`
- upload : whitelist MIME + extension + taille max + renommage UUID
- slug unique vérifié en base
- messages d'erreur génériques (jamais « email inconnu »)
- pas de stack trace visible en production (pages 404 / 500 dédiées)
- `.env` obligatoire, validation au démarrage

---

## 14. Gestion des erreurs

`middleware/errorHandler.js` :

- 404 pour routes non trouvées / slug inconnu / événement inactif
- Prisma `P2025` (record not found) → 404 propre
- Autres erreurs Prisma → 500 générique
- Erreurs d'upload → message flash clair + retour au formulaire
- En production : aucune stack trace ne fuit vers l'utilisateur final

---

## 15. Scripts `package.json`

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed": "node prisma/seed.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

---

## 16. Bonus inclus / extensions possibles

Inclus :

- Drag & drop des liens (SortableJS via CDN)
- Toggle switches animés
- Compteurs animés (count-up)
- Toast notifications
- Empty states soignés
- Modale de confirmation de suppression partagée

Extensions possibles (non implémentées) :

- QR code avec logo centré (errorCorrectionLevel H déjà configuré)
- Export CSV des scans / clics
- Affiche PDF avec QR code
- Duplication d'événement

---

© BeyondCom — QR Event Platform.
