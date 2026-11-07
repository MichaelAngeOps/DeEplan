-- Règles métier R4 : le responsable est notifié lorsqu'un star se déclare indisponible un jour où il
-- a un shift à venir. Un déclencheur est nécessaire : la RLS empêche, à juste titre, un star d'écrire
-- une notification.
--
-- Une seule notification par passage à « indisponible » : réenregistrer le même statut n'en crée
-- pas d'autre. Un star présent dans plusieurs départements ne prévient que les responsables concernés.
-- Les conflits déjà présents ne sont pas notifiés : ils restent affichés sur le tableau de bord.

create function public.disponibilites_notifier_conflit()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.statut <> 'indisponible' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.statut = 'indisponible' then
    return null;
  end if;

  insert into public.notifications (utilisateur_id, type, contenu, lien)
  select
    d.responsable_id,
    'conflit_dispo',
    format(
      'Conflit le %s au poste %s : %s %s n''est plus disponible.',
      to_char(p.date, 'DD/MM'), po.nom, u.prenom, u.nom
    ),
    '/responsable/dashboard'
  from public.plannings p
  join public.postes po on po.id = p.poste_id
  join public.sections s on s.id = po.section_id
  join public.departements d on d.id = s.departement_id
  join public.utilisateurs u on u.id = p.star_id
  where p.star_id = new.star_id
    and p.date = new.date
    and p.date >= (now() at time zone 'America/Toronto')::date;

  return null;
end $function$;

revoke all on function public.disponibilites_notifier_conflit() from public, anon, authenticated;
grant execute on function public.disponibilites_notifier_conflit() to service_role;

create trigger trg_disponibilites_notifier_conflit
after insert or update of statut on public.disponibilites
for each row execute function public.disponibilites_notifier_conflit();
