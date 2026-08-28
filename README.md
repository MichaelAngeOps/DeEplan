# DeEplan

Application de gestion du planning d'un département, en remplacement d'un système
basé sur Google Sheets + WhatsApp.

Deux profils d'utilisateur :

- **Responsable** — planifie les shifts, gère la structure du département
  (sections, postes), valide les comptes.
- **Star** — soumet ses disponibilités, consulte son planning.

Hiérarchie : Responsable → Département → Sections → Postes. Un Star peut appartenir
à plusieurs sections. Une même personne peut cumuler les deux rôles sur un compte.

## Stack

| | |
|---|---|
| Langage | TypeScript |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v3 |
| Backend | Supabase (PostgreSQL, Auth, RLS) |

## Prérequis

- Node.js ≥ 18.18 (recommandé : 22 LTS)
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

## Scripts

```bash
npm run dev      # serveur de développement (http://localhost:3000)
npm run build    # build de production
npm run start    # sert le build de production
npm run lint     # ESLint

node --env-file=.env.local scripts/check-supabase.mjs   # test de connexion Supabase
```

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
