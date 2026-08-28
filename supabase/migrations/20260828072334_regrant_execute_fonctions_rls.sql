-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- ANNULE 20260828072237_revoke_execute_fonctions_rls : rétablit EXECUTE sur les
-- 3 fonctions RLS, requis par l'évaluation des policies (PG 17).
--
-- Décision : l'advisor 0028/0029 (WARN « Public/Signed-in can execute SECURITY
-- DEFINER function ») est **accepté**. Ces fonctions ne renvoient qu'un booléen
-- portant sur l'utilisateur courant (elles n'utilisent que `auth.uid()`), et
-- ont déjà `search_path = ''` (migration 20260828013214). Cf. docs/SCHEMA.md #7.
grant execute on function public.is_any_responsable() to anon, authenticated;
grant execute on function public.is_responsable_of(uuid) to anon, authenticated;
grant execute on function public.is_star_in_departement(uuid) to anon, authenticated;
