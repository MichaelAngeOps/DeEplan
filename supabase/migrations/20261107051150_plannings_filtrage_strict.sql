-- Règles métier R2 : seul un star de la section du poste, validé et disponible ce jour-là,
-- peut recevoir un shift. Aucune exception, y compris par un appel direct à la base.
--
-- Déclencheur AFTER : il s'exécute après la RLS. Un responsable ne peut donc pas déduire, à partir
-- des messages d'erreur, les disponibilités des stars d'un autre département.
--
-- Il ne s'applique qu'à l'attribution (star, poste ou date). Les shifts existants ne sont pas
-- revérifiés : changer le statut ou les horaires reste possible, et un star devenu indisponible
-- après coup reste géré comme un conflit.

create function public.plannings_verifier_candidat()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'UPDATE'
     and new.star_id = old.star_id
     and new.poste_id = old.poste_id
     and new.date = old.date then
    return null;
  end if;

  if not exists (
    select 1
    from public.postes p
    join public.star_sections ss on ss.section_id = p.section_id
    where p.id = new.poste_id and ss.star_id = new.star_id
  ) then
    raise exception 'Ce star n''appartient pas a la section de ce poste.' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.roles_utilisateurs ru
    where ru.utilisateur_id = new.star_id and ru.role = 'star' and ru.statut = 'valide'
  ) then
    raise exception 'Ce star n''est pas valide.' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.disponibilites d
    where d.star_id = new.star_id and d.date = new.date and d.statut = 'disponible'
  ) then
    raise exception 'Ce star n''est pas disponible a cette date.' using errcode = '23514';
  end if;

  return null;
end $function$;

revoke all on function public.plannings_verifier_candidat() from public, anon, authenticated;
grant execute on function public.plannings_verifier_candidat() to service_role;

create trigger trg_plannings_verifier_candidat
after insert or update of star_id, poste_id, date on public.plannings
for each row execute function public.plannings_verifier_candidat();
