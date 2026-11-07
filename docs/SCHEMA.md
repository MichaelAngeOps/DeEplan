# Schéma Supabase — référence

> Relevé du schéma réel du projet `deeplan-prod` le **2026-08-28** (Postgres 17.6).
> Schéma complet et rejouable : `supabase/schema/schema-complet.sql` (relevé le
> 2026-11-06), à compléter par les migrations postérieures à `20261106064650`.
> Types générés : `src/types/supabase.ts`. Ce document = vue lisible + points
> d'attention pour l'implémentation.

## Tables (`public`) — RLS activé partout

### `utilisateurs`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid **PK** | = `auth.users.id` (FK). Pas de default → fourni à l'inscription. |
| `email` | text **unique** | |
| `nom`, `prenom` | text | |
| `date_creation` | timestamptz | default `now()` |

Pas de trigger `auth.users` → `public.utilisateurs` : **l'app crée la ligne** après `signUp`.

### `roles_utilisateurs`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `utilisateur_id` | uuid → utilisateurs | |
| `role` | text | CHECK `('responsable','star')` |
| `statut` | text | CHECK `('en_attente','valide','desactive')`, default `en_attente` |
| `date_creation` | timestamptz | |

**Unique** `(utilisateur_id, role)`. Pour le rôle **star**, `statut` est un
**cache dérivé** de `demandes_departement`, synchronisé par le trigger
`trg_sync_statut_role_star` : `valide` si ≥1 demande `valide` · `en_attente` si
≥1 `en_attente` · sinon `desactive`.

### `demandes_departement` (Lot A2-bis — migration `20260828204806`)
PK composite `(star_id, departement_id)`. `star_id` → utilisateurs, `departement_id`
→ departements (les deux `ON DELETE CASCADE`). `statut` CHECK
`('en_attente','valide','refuse')`, default `en_attente`. `date_demande` timestamptz.

Un star peut demander à rejoindre **plusieurs départements** ; chaque responsable
valide/refuse **la sienne** indépendamment.

**Triggers** :
- `trg_sync_statut_role_star` (`demandes_departement` → `roles_utilisateurs.statut`).
- `notifier_stars_sans_departement` (`AFTER INSERT ON departements`) → notif
  `departement_cree` aux stars sans **aucune** demande.

### `departements`
`id` PK · `nom` text · `description` text nullable · `responsable_id` uuid → utilisateurs.
Un responsable « existe » dès qu'il possède un département (voir `is_any_responsable`).

### `sections`
`id` PK · `departement_id` → departements · `nom` text.

### `postes`
`id` PK · `section_id` → sections · `nom` text · `description` text nullable.
⚠️ **Pas de colonnes d'horaire** (voir « Points d'attention » #1).

### `star_sections` (association N-N)
PK composite `(star_id, section_id)`. `star_id` → utilisateurs, `section_id` → sections.
Le **département d'un star** se déduit : `star_sections → sections → departement_id`.

### `disponibilites`
`id` PK · `star_id` → utilisateurs · `date` date · `statut` text CHECK `('disponible','indisponible')`.
**Unique** `(star_id, date)` → une seule valeur par jour. Absence de ligne = « non renseigné ».

### `plannings` (les shifts)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `star_id` | uuid → utilisateurs | |
| `poste_id` | uuid → postes | |
| `date` | date | |
| `heure_debut`, `heure_fin` | time **nullable** (migration `20260828052524`, Lot 4b) | horaires optionnels, saisis à l'assignation |
| `description` | text nullable | |
| `statut` | text | CHECK `('de_service','a_servi','na_pas_servi','a_confirmer')`, default `de_service` |
| `cree_par` | uuid → utilisateurs | |
| `date_creation` | timestamptz | |

Index `(star_id, date)` — non unique. Index **unique `(poste_id, date)`**
(`plannings_poste_id_date_key`, migration `20260828052524`, Lot 4b) : 1 star max
par poste et par jour → #2 résolu.

Déclencheur `trg_plannings_verifier_candidat` (R2, migration `20261107051150`) : à l'attribution (star, poste ou date), le star doit être dans la section du poste, validé et `disponible` ce jour-là. S'exécute après la RLS. Les changements de statut et d'horaires ne sont pas concernés.

Tâche `pg_cron` `deeplan-shifts-a-confirmer` (R3, migration `20261107052231`, minute 5 de chaque heure) : `shifts_marquer_a_confirmer()` passe à `a_confirmer` les shifts `de_service` dont le jour est terminé à Ottawa. Un shift à venir reste `de_service` en base et s'affiche « Planifié ».

### `annonces`
`id` PK · `departement_id` → departements · `responsable_id` → utilisateurs · `titre` · `contenu` · `date_publication` timestamptz.

### `notifications`
`id` PK · `utilisateur_id` → utilisateurs · `type` text (libre) · `contenu` text · `lu` bool default false · `date_creation` · `lien` text nullable (A9a, chemin interne uniquement, CHECK `^/[^/\\]`).
Index `(utilisateur_id, lu)`. **Publiée dans `supabase_realtime`** (Lot A7d) →
mise à jour temps réel de la pastille (RLS appliquée).

### `formulaires` (Lot A9a — migration `20261106041019`)
`id` PK · `departement_id` → departements (CASCADE) · `responsable_id` → utilisateurs (CASCADE) · `titre` (1–120) · `description` nullable (≤ 2000) · `statut` CHECK `('brouillon','publie','ferme')` default `brouillon` · `date_creation` · `date_publication` · `date_fermeture`.
Trigger `formulaires_garde` : cycle `brouillon → publie → ferme` sans retour, ≥ 1 question pour publier, titre et description figés dès la publication, dates posées par le trigger.
RLS : lecture par le responsable du département, les stars du département (hors brouillon) et le star ayant répondu ; suppression limitée aux brouillons et aux formulaires fermés (A10, migration `20261106064650`). Réponses effacées en cascade ; trigger `formulaires_retirer_notifications` : retire les notifications liées.

### `formulaire_questions` (Lot A9a)
`id` PK · `formulaire_id` → formulaires (CASCADE) · `ordre` · `libelle` (1–500) · `type` CHECK `('texte_court','texte_long','choix_unique','choix_multiple','oui_non','date')` · `options` jsonb (tableau de 2 à 50 pour les choix, sinon null) · `obligatoire` bool. **Unique** `(formulaire_id, ordre)`.
RLS : écriture par le responsable uniquement tant que le formulaire est en brouillon.

### `formulaire_reponses` (Lot A9a)
`id` PK · `formulaire_id` → formulaires (CASCADE) · `star_id` → utilisateurs (CASCADE) · `reponses` jsonb `{ question_id: valeur }` · `date_soumission` · `date_modification`. **Unique** `(formulaire_id, star_id)`.
Trigger `formulaire_reponses_valider` : question connue, obligatoires présentes, valeur conforme au type, dates posées par le trigger.
RLS : le star lit toujours sa réponse, et l'écrit seulement si le formulaire est publié et qu'il est dans le département ; le responsable du département lit sans modifier ; aucune suppression directe.

Déclencheur sur `disponibilites` : `trg_disponibilites_notifier_conflit` (R4, migration `20261107054045`) crée une notification `conflit_dispo` pour le responsable au passage à `indisponible` un jour de shift à venir.

### `push_subscriptions` (Lot A7d — migration `20260829233412`)
`id` PK · `user_id` → utilisateurs (CASCADE) · `type` CHECK `('web','fcm','apns')`
default `web` · `endpoint` · `p256dh` / `auth` (web uniquement) · `date_creation`.
**Unique** `(user_id, endpoint)`. RLS : l'utilisateur gère les siens.
Lecture serveur (envoi de push) via la fonction SECURITY DEFINER
`push_subscriptions_pour(user)` (soi-même ou responsable d'un dept du star).
`type` prépare l'ajout de FCM (Android) / APNs (iOS) sans refonte.

## Index (Lot Charge C3 — migration `20261107212557`)

Chaque clé étrangère a un index (contrôlé par `tests/base/schema.test.ts`), et aucun index n'en double un autre.
Ajoutés : `star_sections(section_id)`, `demandes_departement(departement_id)`, `departements(responsable_id)`,
`plannings(cree_par)`, `annonces(responsable_id)`. Retirés : `plannings_poste_id_date_idx` et
`disponibilites_star_id_date_idx`, doublons des index uniques `(poste_id, date)` et `(star_id, date)`.

## Fonctions RLS (SECURITY DEFINER, STABLE)

| Fonction | Rôle |
|---|---|
| `is_any_responsable()` | l'utilisateur courant possède ≥ 1 département |
| `is_responsable_of(dept_id)` | l'utilisateur courant est le responsable de ce département |
| `is_star_in_departement(dept_id)` | l'utilisateur courant est star dans une section de ce département |

## Politiques RLS (résumé)

| Table | Lecture | Écriture |
|---|---|---|
| `utilisateurs` | sa propre ligne ; **responsable** voit les stars de **son** département (rattachés à une section, ou `en_attente` ayant choisi son dept — migration `20260828201350`) | insert/update sa propre ligne |
| `roles_utilisateurs` | ses propres rôles ; responsable voit/valide les rôles `star` de **son** département (via `demandes_departement`) | insert son propre rôle (`statut='en_attente'` forcé) |
| `demandes_departement` | le star les siennes ; le responsable celles de son département | le star crée les siennes (`statut='en_attente'` forcé) ; le responsable valide/refuse les siennes |
| `departements` | responsable ou star membre ; **tout utilisateur connecté** peut lister (sélecteur d'inscription) | responsable crée/modifie le sien (`responsable_id = auth.uid()`) |
| `sections`, `postes` | membre du département | responsable du département (ALL) |
| `star_sections` | le star concerné, ou le responsable du département | responsable du département (ALL) |
| `disponibilites` | le star ; le responsable des sections du star | le star gère les siennes (`star_id = auth.uid()`) |
| `plannings` | le star ses plannings ; responsable ceux de ses postes | responsable des postes concernés (ALL) |
| `annonces` | membre du département | responsable du département (ALL) |
| `notifications` | les siennes | update les siennes (pas d'insert client → créées côté serveur/Edge) |

## Points d'attention pour l'implémentation

1. **Horaires** — décision produit #3 initiale (« portés par le poste ») écartée.
   **Décision retenue (2026-08-28, Lot 4b)** : horaires **optionnels**, saisis à
   l'assignation. `plannings.heure_debut`/`heure_fin` passés **nullable**
   (migration `20260828052524`). ✅ Résolu.
2. **Unicité `plannings(poste_id, date)`** : index unique ajouté (migration
   `20260828052524`, Lot 4b). 1 star max par poste et par jour. ✅ Résolu.
3. **Inscription** : après `auth.signUp`, l'app doit `insert` dans `utilisateurs`,
   puis `roles_utilisateurs` (1 ligne par rôle, `statut='en_attente'` — désormais
   imposé par RLS). Pour un responsable, `insert` dans `departements` → accès
   immédiat via `is_any_responsable()` (le `statut` du rôle responsable n'entre
   pas en jeu).
4. ✅ **CORRIGÉ** (migration `20260828…durcir_rls_roles_et_search_path`) — la
   policy INSERT de `roles_utilisateurs` impose maintenant
   `statut = 'en_attente'`. Un compte ne peut plus s'auto-valider.
5. ✅ **CORRIGÉ** (migrations `20260828201350` puis `20260828204806`, Lot A2 /
   A2-bis) — `roles_utilisateurs` / `utilisateurs` / `demandes_departement` sont
   **scopées au département** : un responsable ne voit/traite que les stars ayant
   une demande pour **son** département. Fin du « v1 » permissif.
   Le star est **multi-département** (table `demandes_departement`).
6. ✅ **CORRIGÉ** (même migration) — `search_path` des 3 fonctions RLS figé à `''`
   + tables schéma-qualifiées.
7. **Restant (WARN, non bloquant, ACCEPTÉ)** : advisor
   `*_security_definer_function_executable` (0028/0029) sur les 3 fonctions RLS.
   Sans risque réel (elles ne renvoient qu'un booléen sur l'utilisateur
   *appelant*, via `auth.uid()`, et ont `search_path=''`).
   **`revoke execute` testé le 2026-08-28 → REJETÉ** : sous PostgreSQL 17,
   l'évaluation d'une policy RLS exige le privilège EXECUTE côté rôle appelant ;
   révoquer casse les SELECT de `departements` / `postes` / `sections` /
   `annonces` (policies qui invoquent `is_star_in_departement` /
   `is_responsable_of`). Migrations `20260828072237` (revoke) + `20260828072334`
   (regrant). L'advisor reste affiché volontairement.

## Régénérer les types

```
# via CLI (si supabase login fait) :
npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts
```
