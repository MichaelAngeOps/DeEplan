# Migrations Supabase

Le **schéma initial** (`20260827221806_initial_schema`) a été appliqué **hors de
ce dépôt** (fourni via le prompt, prompt §7 : « ne le recrée pas »). Il n'est pas
reproduit ici.

Ce dossier ne suit que les migrations **postérieures**, appliquées sur le projet
`deeplan-prod`. Elles sont posées via l'outil MCP Supabase (`apply_migration`) et
le fichier `.sql` est déposé ici pour l'historique et le rollback.

| Version | Nom | Objet |
|---|---|---|
| 20260827221806 | initial_schema | (hors dépôt) 10 tables + RLS |
| 20260828013214 | durcir_rls_roles_et_search_path | ferme l'auto-validation de compte + `search_path` des fonctions RLS (voir `docs/SCHEMA.md`) |
| 20260828052524 | plannings_horaires_nullable_et_unicite_poste_date | `plannings.heure_debut`/`heure_fin` → nullable ; index unique `(poste_id, date)` (Lot 4b) |
| 20260828063732 | notifications_insert_par_responsable | policy INSERT sur `notifications` : un responsable notifie les stars de son département (Lot 5d) |
| 20260828072237 | revoke_execute_fonctions_rls | ⚠️ **annulée** — tentative de fermer l'advisor 0028/0029, cassait les policies SELECT (PG 17 exige EXECUTE pour l'évaluation des policies) |
| 20260828072334 | regrant_execute_fonctions_rls | rétablit EXECUTE ; advisor 0028/0029 **accepté** (voir `docs/SCHEMA.md` #7) |

Régénérer les types après toute migration :
`npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts`
