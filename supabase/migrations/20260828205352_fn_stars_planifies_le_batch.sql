-- Appliquées sur deeplan-prod le 2026-08-28 (via MCP).
-- Lot A2-bis — avertissement inter-départements à l'assignation.
-- Le responsable ne voit (RLS) que les plannings de son département. Cette
-- fonction SECURITY DEFINER renvoie, parmi une liste de stars, ceux déjà
-- planifiés un jour donné, TOUS départements confondus (hors un poste à exclure).
--
-- (Remplace la version mono `star_planifie_ce_jour` créée juste avant —
--  migrations 20260828205006 puis 20260828205352.)

drop function if exists public.star_planifie_ce_jour(uuid, date, uuid);

create or replace function public.stars_planifies_le(
  p_stars uuid[], p_date date, p_exclure_poste uuid
) returns setof uuid
  language sql stable security definer set search_path = ''
as $$
  select distinct star_id
  from public.plannings
  where date = p_date
    and star_id = any(p_stars)
    and (p_exclure_poste is null or poste_id <> p_exclure_poste);
$$;

revoke execute on function public.stars_planifies_le(uuid[], date, uuid) from anon;
grant execute on function public.stars_planifies_le(uuid[], date, uuid) to authenticated;
