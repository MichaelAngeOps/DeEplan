-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP), puis ANNULÉE par
-- 20260828072334_regrant_execute_fonctions_rls.
--
-- Tentative (échouée) de fermer l'advisor 0028/0029 : révoquer EXECUTE sur les
-- 3 fonctions RLS. Résultat : casse les policies SELECT de `departements` /
-- `postes` / `sections` / `annonces` qui invoquent ces fonctions — sous PG 17
-- l'évaluation d'une policy exige le privilège EXECUTE côté appelant.
-- Conservée dans l'historique pour la traçabilité ; ne pas rejouer.
revoke execute on function public.is_any_responsable() from anon, authenticated, public;
revoke execute on function public.is_responsable_of(uuid) from anon, authenticated, public;
revoke execute on function public.is_star_in_departement(uuid) from anon, authenticated, public;
