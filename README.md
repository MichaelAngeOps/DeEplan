# DeEplan

Application de gestion du planning d'un département, en remplacement d'un système
basé sur Google Sheets + WhatsApp.

Deux profils d'utilisateur :

- **Responsable** — planifie les shifts, gère la structure du département
  (sections, postes), valide les comptes.
- **Star** — soumet ses disponibilités, consulte son planning.

Hiérarchie : Responsable → Département → Sections → Postes. Un Star peut appartenir
à plusieurs sections. Une même personne peut cumuler les deux rôles sur un compte.

Pour reprendre le projet : [guide de reprise](./docs/GUIDE-REPRISE.md).

## Stack

| | |
|---|---|
| Langage | TypeScript |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v3 |
| Backend | Supabase (PostgreSQL, Auth, RLS) |

## Prérequis

- Node.js ≥ 20.9 (recommandé : 22 LTS)
- npm
- Un projet Supabase avec le schéma appliqué

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les valeurs
```

Variables d'environnement (voir `.env.local.example`) :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publishable Supabase (côté client) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique des notifications push |
| `VAPID_PRIVATE_KEY` | Clé privée des notifications push, **secrète** |
| `VAPID_SUBJECT` | Contact des notifications push (`mailto:…`) |

## Scripts

```bash
npm run dev      # serveur de développement (http://localhost:3000)
npm run build    # build de production
npm run start    # sert le build de production
npm run lint     # ESLint
npm run typecheck # vérification des types
npm test         # tests automatiques, dans un Postgres temporaire

node --env-file=.env.local scripts/check-supabase.mjs   # test de connexion Supabase
```

`npm test` ne contacte jamais Supabase. La base de test est recréée en mémoire à partir de
`supabase/schema/schema-complet.sql` et des migrations postérieures. Toute nouvelle règle
d'accès ou règle métier doit y ajouter son test. Les mêmes contrôles tournent sur GitHub à
chaque push sur `main` (`.github/workflows/ci.yml`).

## Déploiement (Vercel)

1. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le
   dépôt GitHub. Next.js est détecté automatiquement (aucune config).
2. Dans **Environment Variables**, ajouter (pour *Production*, *Preview* et
   *Development*) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
3. **Deploy**.
4. Après le premier déploiement, mettre à jour :
   - **Supabase → Authentication → URL Configuration** : *Site URL* =
     l'URL Vercel ; *Redirect URLs* += `https://<domaine-vercel>/auth/callback`
   - **Google Cloud → Credentials → OAuth client → Authorized JavaScript
     origins** += `https://<domaine-vercel>`

## Application de bureau (Electron)

Une coquille Electron dans [`desktop/`](./desktop/) charge l'app déployée →
installateurs Windows / macOS / Linux. Voir [`desktop/README.md`](./desktop/README.md).
Le build 3 plateformes se fait via GitHub Actions
(`.github/workflows/desktop.yml`).

## Structure

```
src/
  app/          routes (App Router)
  components/    composants réutilisables
  lib/          clients Supabase, règles métier, utilitaires
  hooks/        hooks React
  types/        types TypeScript partagés
maquette/       références visuelles (design system, wireframes)
```
