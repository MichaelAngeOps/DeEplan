-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP), puis REMPLACÉE par la
-- version « batch » 20260828205352 (fn_stars_planifies_le_batch).
-- Conservée dans l'historique ; ne pas rejouer telle quelle.

create or replace function public.star_planifie_ce_jour(
  p_star uuid, p_date date, p_exclure_poste uuid
) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.plannings
    where star_id = p_star and date = p_date
      and (p_exclure_poste is null or poste_id <> p_exclure_poste)
  );
$$;

revoke execute on function public.star_planifie_ce_jour(uuid, date, uuid) from anon;
grant execute on function public.star_planifie_ce_jour(uuid, date, uuid) to authenticated;
