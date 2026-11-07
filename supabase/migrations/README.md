# Migrations Supabase

Le **schéma initial** (`20260827221806_initial_schema`) a été appliqué **hors de
ce dépôt** et n'est pas reproduit ici.

Ce dossier ne suit que les migrations **postérieures**, appliquées sur le projet
`deeplan-prod`. Elles sont posées via l'outil MCP Supabase (`apply_migration`) et
le fichier `.sql` est déposé ici pour l'historique et le rollback.

## Recréer la base

Ces migrations seules ne suffisent pas. Sur un projet Supabase **neuf** :

1. Appliquer `supabase/schema/schema-complet.sql`, qui inclut tout jusqu'à `20261106064650`.
2. Appliquer ensuite, dans l'ordre, les migrations dont la version est postérieure à `20261106064650`.

Ne jamais appliquer `schema-complet.sql` sur une base existante.

## Historique

| Version | Nom | Objet |
|---|---|---|
| 20260827221806 | initial_schema | (hors dépôt) 10 tables + RLS |
| 20260828013214 | durcir_rls_roles_et_search_path | ferme l'auto-validation de compte + `search_path` des fonctions RLS (voir `docs/SCHEMA.md`) |
| 20260828052524 | plannings_horaires_nullable_et_unicite_poste_date | `plannings.heure_debut`/`heure_fin` → nullable ; index unique `(poste_id, date)` (Lot 4b) |
| 20260828063732 | notifications_insert_par_responsable | policy INSERT sur `notifications` : un responsable notifie les stars de son département (Lot 5d) |
| 20260828072237 | revoke_execute_fonctions_rls | ⚠️ **annulée** — tentative de fermer l'advisor 0028/0029, cassait les policies SELECT (PG 17 exige EXECUTE pour l'évaluation des policies) |
| 20260828072334 | regrant_execute_fonctions_rls | rétablit EXECUTE ; advisor 0028/0029 **accepté** (voir `docs/SCHEMA.md` #7) |
| 20260828201350 | star_choisit_departement_a_inscription | `roles_utilisateurs.departement_id` (Lot A2, **mono-département**) — remplacé par A2-bis |
| 20260828204806 | star_multi_departements_demandes | **A2-bis** — table `demandes_departement` (multi-département), trigger de sync du statut du rôle star, RLS scopées, `roles_utilisateurs.departement_id` supprimé |
| 20260828205006 | fn_star_planifie_ce_jour | fonction (mono) — remplacée par la version batch |
| 20260828205352 | fn_stars_planifies_le_batch | `stars_planifies_le(stars[], date, exclure_poste)` — avertissement inter-départements à l'assignation |
| 20260829233412 | push_subscriptions_et_realtime_notifications | table `push_subscriptions` (type web/fcm/apns) + RPC de lecture (SECURITY DEFINER) + `notifications` ajoutée à la publication Realtime (Lot A7d) |
| 20261106041019 | formulaires_et_lien_notifications | **A9a** — tables `formulaires`, `formulaire_questions`, `formulaire_reponses`, triggers de garde et de validation, RLS, colonne `notifications.lien` |
| 20261106064650 | formulaires_suppression_si_ferme | **A10** — suppression d'un formulaire brouillon ou fermé (réponses en cascade), trigger retirant les notifications liées |
| 20261107051150 | plannings_filtrage_strict | **R2** — déclencheur : un shift n'est attribué qu'à un star de la section, validé et disponible ce jour-là |

Régénérer les types après toute migration :
`npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts`
