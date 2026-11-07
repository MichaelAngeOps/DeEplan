# Guide de reprise de DeEplan

Ce guide permet à un autre développeur de comprendre, faire tourner, modifier, déployer et
reconstruire DeEplan. État décrit : **6 novembre 2026**.

Autres références : [`README.md`](../README.md), [`SCHEMA.md`](./SCHEMA.md) pour la base,
[`supabase/migrations/README.md`](../supabase/migrations/README.md) pour l'historique des
migrations, [`maquette/CARTOGRAPHIE.md`](../maquette/CARTOGRAPHIE.md) pour les écrans.

## 1. Le produit

DeEplan remplace un suivi fait avec Google Sheets et WhatsApp pour planifier les équipes d'une
entreprise.

- **Responsable :** possède un département, gère ses sections et ses postes, valide les stars,
  planifie les shifts, publie des annonces et des formulaires.
- **Star :** rejoint un ou plusieurs départements, déclare ses disponibilités, consulte son
  planning, répond aux formulaires.
- Un même compte peut cumuler les deux rôles.

Usage prévu : la planification se fait sur ordinateur, le responsable suit ensuite au téléphone,
et le star peut tout faire sur tous ses appareils. Objectif de charge : 1 000 utilisateurs.

## 2. Architecture

```
Navigateur, PWA, coquille Electron
        │
        ▼
Next.js sur Vercel
  proxy ou middleware : session et redirections
  pages serveur (lecture) et Server Actions (écriture)
        │  clé publique + session de l'utilisateur
        ▼
Supabase : PostgreSQL, Auth, Realtime
  la sécurité des données est appliquée ici, par la RLS
```

| Dossier | Rôle |
|---|---|
| `src/app/` | Routes et écrans. `error.tsx` et `not-found.tsx` pour les pannes |
| `src/lib/data/` | Lectures, côté serveur |
| `src/lib/actions/` | Écritures (Server Actions), avec contrôle d'accès et validation |
| `src/lib/*-shared.ts` | Code commun au client et au serveur, sans dépendance serveur |
| `src/lib/journal.ts` | Écriture des erreurs dans les journaux |
| `src/components/ui/` | Composants de base du design system |
| `supabase/schema/` | Schéma complet, rejouable |
| `supabase/migrations/` | Migrations versionnées |
| `tests/` | Tests automatiques |
| `desktop/` | Coquille Electron qui charge le site déployé |

**Règles à conserver :**

- La RLS est la vraie barrière de sécurité. Les contrôles des Server Actions servent aux messages
  et aux règles métier, ils ne la remplacent pas.
- La clé `service_role` n'est pas utilisée par l'application et ne doit jamais atteindre le client.
- Toute nouvelle table a la RLS activée et des tests d'accès dans `tests/base/`.
- Le client Supabase renvoie ses erreurs dans le champ `error` sans lever d'exception : il faut
  le contrôler.
- Pas de secret dans le dépôt, qui est public à ce jour.

## 3. Services et secrets

Ces services sont aujourd'hui rattachés aux comptes de l'ingénieur principal. Un repreneur doit
en obtenir l'accès.

| Service | Usage |
|---|---|
| GitHub (`MichaelAngeOps/DeEplan`) | Code, contrôles, publication de l'app de bureau |
| Vercel (`de-eplan.vercel.app`) | Hébergement, déploiement à chaque push sur `main` |
| Supabase (`deeplan-prod`, `ca-central-1`) | Base, authentification, temps réel |
| Google Cloud | Connexion Google (OAuth) |

| Variable | Où | Nature |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel | Publique, protégée par la RLS |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `.env.local`, Vercel | Publique |
| `VAPID_PRIVATE_KEY` | `.env.local`, Vercel | **Secrète** |
| `VAPID_SUBJECT` | `.env.local`, Vercel | Contact des notifications push |

Les secrets vont dans un gestionnaire de mots de passe, jamais dans un fichier versionné.

## 4. Démarrer en local

Prérequis : Node 22 recommandé, et npm.

```bash
npm ci
cp .env.local.example .env.local   # puis renseigner les valeurs
npm run dev
```

> **Attention :** il n'existe qu'une seule base. Avec les valeurs habituelles, l'environnement
> local **écrit dans la production**. Les essais utilisent des comptes jetables, supprimés ensuite.
> `npm test`, lui, ne contacte jamais Supabase.

## 5. Modifier le code

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Un push sur `main` lance ces contrôles sur GitHub (`.github/workflows/ci.yml`) **et** un
déploiement Vercel en parallèle. **Un contrôle en échec ne bloque pas encore le déploiement :** il
faut donc tout lancer en local avant de pousser, puis vérifier le résultat sur GitHub.

Les tests de `tests/base/` rejouent le schéma complet et les migrations dans un Postgres temporaire
(PGlite), avec `auth` et les rôles simulés. Ils ne couvrent ni les écrans ni le vrai service
d'authentification. Toute nouvelle règle d'accès ou règle métier doit y ajouter son test.

## 6. Modifier la base

1. Écrire un fichier `supabase/migrations/<AAAAMMJJHHMMSS>_<nom>.sql`.
2. Lancer `npm test` : la migration y est rejouée. Ajouter les tests de la nouvelle règle.
3. Appliquer la migration sur `deeplan-prod`. **C'est la production :** prévoir comment revenir en
   arrière et préférer les changements compatibles avec le code déjà déployé.
4. Régénérer les types :
   `npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts`
5. Mettre à jour `docs/SCHEMA.md` et `supabase/migrations/README.md`.

Ne pas modifier `supabase/schema/schema-complet.sql` : c'est une photographie, complétée par les
migrations plus récentes que `20261106064650`.

## 7. Revenir en arrière

- **Code :** utiliser la fonction de retour arrière de Vercel (selon le plan), ou
  `git revert <commit>` puis `git push`.
- **Base :** Vercel ne revient pas sur une migration. Il faut écrire une migration inverse.

## 8. Diagnostiquer une panne

1. L'écran d'erreur affiche une **référence**. La chercher dans les journaux Vercel.
2. Les erreurs captées par l'application commencent par `[DeEplan]`, suivi du contexte, par exemple
   `[DeEplan] responsable/planning` ou `[DeEplan] notify/shift_assigne`.
3. Consulter aussi les journaux et les recommandations (Advisors) de Supabase.

**Limites :** aucune alerte automatique. Les erreurs survenues dans le navigateur restent dans sa
console. Certaines lectures ne contrôlent pas encore `error` : une panne peut y ressembler à une
liste vide.

## 9. Reconstruire après un sinistre

> **À ce jour, aucune sauvegarde de la base n'est confirmée : le schéma se reconstruit, pas les
> données.** Cette procédure n'a été rejouée que dans PGlite, pas encore sur un vrai projet Supabase.

1. Créer un projet Supabase et appliquer `supabase/schema/schema-complet.sql`.
2. Appliquer les migrations plus récentes que `20261106064650`, dans l'ordre.
3. Restaurer les données, si une sauvegarde existe.
4. Dans Supabase, sous **Authentication** : renseigner *Site URL* et *Redirect URLs*
   (`https://<domaine>/auth/callback`), réactiver le fournisseur Google.
5. Dans Google Cloud : ajouter le domaine aux origines autorisées du client OAuth.
6. Créer les variables d'environnement sur Vercel et y importer le dépôt.
7. Si la clé VAPID privée est perdue : en générer une nouvelle paire. Les appareils déjà inscrits
   devront réactiver les notifications.
8. Si l'adresse du site change : mettre à jour `APP_URL` dans `desktop/main.js` et republier l'app
   de bureau.

## 10. Décisions à connaître

| Décision | Raison |
|---|---|
| Next.js et Supabase, sans serveur dédié | Peu d'infrastructure à maintenir, PostgreSQL reste portable |
| Un responsable possède un seul département | Simplicité initiale. **À assouplir** si le rôle de co-responsable est confirmé |
| Un star peut rejoindre plusieurs départements | `demandes_departement` : chaque responsable décide pour le sien |
| Un seul star par poste et par jour | Index unique ; réassigner remplace |
| Horaires de shift optionnels | Saisis à l'assignation |
| Règle des 4 dimanches : avertissement contournable | Le responsable garde la décision |
| Seuls les stars de la section, disponibles ce jour-là, sont candidats | Filtrage strict, sans exception |
| Formulaires : brouillon, publié, fermé, sans retour | Garantit l'intégrité des réponses, imposé par la base |
| App de bureau : coquille qui charge le site | L'app dépend de données partagées en ligne, et un seul code à maintenir |
| Pas d'environnement de test pour l'instant | Décision du 2026-11-06, faute de ressources. **Risque accepté :** à revoir quand les moyens le permettent |
| Fuseau de référence : `America/Toronto` | Ottawa-Gatineau |

## 11. État et prochains travaux

**Échéance : Next.js 15 ne reçoit plus de correctifs de sécurité après le 31 janvier 2027.** La
migration vers Next 16 est préparée sur la branche `lot-f4-next16`. Son déploiement reste à faire,
après essais des parcours non encore couverts.

À faire, dans l'ordre envisagé :

1. **Règles métier :** passage automatique des statuts de shift (`de_service`, `a_confirmer`),
   notifications du responsable, usage de `America/Toronto`. `aujourdhuiISO` suit encore le fuseau
   du serveur.
2. **Charge :** pagination de la grille et de l'annuaire, envoi des push par lots, index.
3. **Conformité et mobile :** suppression de compte, politique de confidentialité, suivi du
   responsable sur téléphone.
4. **Publication :** app de bureau (écran hors connexion, mises à jour, signature), puis Android et
   iOS avec Capacitor.

À traiter avant le lancement commercial :

- Sauvegardes de la base (Supabase Pro) et essai de restauration.
- Vercel Pro, requis pour un usage commercial.
- Suivi d'erreurs avec alertes, par exemple Sentry.
- Blocage du déploiement si un contrôle échoue, et protection de `main`.
- Décision sur le passage du dépôt en privé.
- Durcissement des droits de certaines fonctions de la base.
- Protection contre les mots de passe divulgués, dans Supabase.
- Suppression des données de test.
- Sauvegarde des documents internes tenus hors du dépôt : journal de projet et cahier des charges
  initial.
