# Schéma Supabase — référence

> Relevé du schéma réel du projet `deeplan-prod` le **2026-08-28** (Postgres 17.6).
> Le schéma est **géré hors de ce dépôt** (prompt §7 : « ne le recrée pas »).
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

**Unique** `(utilisateur_id, role)`. Le rôle `desactive` sert de **soft-delete** (décision produit #6).

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
| `heure_debut`, `heure_fin` | time **NOT NULL** | portées par le shift |
| `description` | text nullable | |
| `statut` | text | CHECK `('de_service','a_servi','na_pas_servi','a_confirmer')`, default `de_service` |
| `cree_par` | uuid → utilisateurs | |
| `date_creation` | timestamptz | |

Index `(poste_id, date)` et `(star_id, date)` — **non uniques** (voir #2).

### `annonces`
`id` PK · `departement_id` → departements · `responsable_id` → utilisateurs · `titre` · `contenu` · `date_publication` timestamptz.

### `notifications`
`id` PK · `utilisateur_id` → utilisateurs · `type` text (libre) · `contenu` text · `lu` bool default false · `date_creation`.
Index `(utilisateur_id, lu)`.

## Fonctions RLS (SECURITY DEFINER, STABLE)

| Fonction | Rôle |
|---|---|
| `is_any_responsable()` | l'utilisateur courant possède ≥ 1 département |
| `is_responsable_of(dept_id)` | l'utilisateur courant est le responsable de ce département |
| `is_star_in_departement(dept_id)` | l'utilisateur courant est star dans une section de ce département |

## Politiques RLS (résumé)

| Table | Lecture | Écriture |
|---|---|---|
| `utilisateurs` | sa propre ligne ; **responsable** voit ses stars + les stars `en_attente` (v1 : *tout* responsable) | insert/update sa propre ligne |
| `roles_utilisateurs` | ses propres rôles ; responsable voit les rôles `star` (v1) | insert son propre rôle ; responsable met à jour un rôle `star` (v1) |
| `departements` | responsable ou star membre | responsable crée/modifie le sien (`responsable_id = auth.uid()`) |
| `sections`, `postes` | membre du département | responsable du département (ALL) |
| `star_sections` | le star concerné, ou le responsable du département | responsable du département (ALL) |
| `disponibilites` | le star ; le responsable des sections du star | le star gère les siennes (`star_id = auth.uid()`) |
| `plannings` | le star ses plannings ; responsable ceux de ses postes | responsable des postes concernés (ALL) |
| `annonces` | membre du département | responsable du département (ALL) |
| `notifications` | les siennes | update les siennes (pas d'insert client → créées côté serveur/Edge) |

## Points d'attention pour l'implémentation

1. **Horaires** — décision produit #3 initiale (« portés par le poste ») écartée :
   `postes` n'a pas de colonnes d'horaire, `plannings.heure_debut`/`heure_fin`
   sont NOT NULL. **Décision retenue (2026-08-28) : les horaires sont saisis à
   l'assignation** (dans la modale d'assignation du planning).
2. **Pas d'unicité `plannings(poste_id, date)`** : rien n'empêche 2 stars sur le
   même poste le même jour. L'app doit l'empêcher (ou l'autoriser sciemment).
   *(À gérer côté app au Lot 4 — planification.)*
3. **Inscription** : après `auth.signUp`, l'app doit `insert` dans `utilisateurs`,
   puis `roles_utilisateurs` (1 ligne par rôle, `statut='en_attente'` — désormais
   imposé par RLS). Pour un responsable, `insert` dans `departements` → accès
   immédiat via `is_any_responsable()` (le `statut` du rôle responsable n'entre
   pas en jeu).
4. ✅ **CORRIGÉ** (migration `20260828…durcir_rls_roles_et_search_path`) — la
   policy INSERT de `roles_utilisateurs` impose maintenant
   `statut = 'en_attente'`. Un compte ne peut plus s'auto-valider.
5. **Policies « v1 »** : `roles_utilisateurs` / `utilisateurs` laissent *tout*
   responsable voir/valider *tout* star (pas de restriction au département).
   Simplification connue, à resserrer plus tard.
6. ✅ **CORRIGÉ** (même migration) — `search_path` des 3 fonctions RLS figé à `''`
   + tables schéma-qualifiées.
7. **Restant (WARN, non bloquant)** : advisor `*_security_definer_function_executable`
   sur les 3 fonctions RLS (appelables via `/rest/v1/rpc/…`). Sans risque réel
   (elles ne renvoient qu'un booléen sur l'utilisateur *appelant*). Durcissement
   optionnel : `revoke execute on function … from anon, authenticated;`.

## Régénérer les types

```
# via CLI (si supabase login fait) :
npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts
```
