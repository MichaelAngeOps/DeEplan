-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- Lot A2-bis — un star peut appartenir à plusieurs départements.
-- Remplace `roles_utilisateurs.departement_id` (mono) par une table de demandes
-- validées indépendamment par chaque responsable.

create table public.demandes_departement (
  star_id uuid not null references public.utilisateurs(id) on delete cascade,
  departement_id uuid not null references public.departements(id) on delete cascade,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'valide', 'refuse')),
  date_demande timestamptz not null default now(),
  primary key (star_id, departement_id)
);

alter table public.demandes_departement enable row level security;

create policy "star gere ses demandes"
  on public.demandes_departement for all to public
  using (star_id = auth.uid())
  with check (star_id = auth.uid() and statut = 'en_attente');

create policy "responsable traite les demandes de son departement"
  on public.demandes_departement for all to public
  using (public.is_responsable_of(departement_id))
  with check (public.is_responsable_of(departement_id));

-- `roles_utilisateurs.statut` (rôle star) = cache dérivé, synchronisé par trigger :
--   valide si ≥1 demande valide · en_attente si ≥1 en attente · sinon desactive.
create or replace function public.sync_statut_role_star()
  returns trigger language plpgsql security definer set search_path = '' as $$
declare v_star uuid := coalesce(new.star_id, old.star_id);
begin
  update public.roles_utilisateurs
  set statut = case
    when exists (select 1 from public.demandes_departement d
                 where d.star_id = v_star and d.statut = 'valide') then 'valide'
    when exists (select 1 from public.demandes_departement d
                 where d.star_id = v_star and d.statut = 'en_attente') then 'en_attente'
    else 'desactive'
  end
  where utilisateur_id = v_star and role = 'star';
  return coalesce(new, old);
end $$;

create trigger trg_sync_statut_role_star
  after insert or update or delete on public.demandes_departement
  for each row execute function public.sync_statut_role_star();

-- Trigger « département créé » : notifie les stars sans AUCUNE demande.
create or replace function public.notifier_stars_sans_departement()
  returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (utilisateur_id, type, contenu)
  select ru.utilisateur_id, 'departement_cree',
         'Un département vient d''être créé. Rejoignez-le depuis « Mes départements » si vous le souhaitez.'
  from public.roles_utilisateurs ru
  where ru.role = 'star'
    and not exists (select 1 from public.demandes_departement d
                    where d.star_id = ru.utilisateur_id);
  return new;
end $$;

-- ── Migration de données ────────────────────────────────────────────────────
insert into public.demandes_departement (star_id, departement_id, statut)
select ru.utilisateur_id, ru.departement_id,
  case when ru.statut = 'valide' then 'valide'
       when ru.statut = 'desactive' then 'refuse'
       else 'en_attente' end
from public.roles_utilisateurs ru
where ru.role = 'star' and ru.departement_id is not null
on conflict (star_id, departement_id) do nothing;

insert into public.demandes_departement (star_id, departement_id, statut)
select distinct ss.star_id, s.departement_id, 'valide'
from public.star_sections ss
  join public.sections s on s.id = ss.section_id
on conflict (star_id, departement_id) do update set statut = 'valide';

-- ── RLS scopées sur demandes_departement (remplacent la migration A2) ───────
drop policy "responsable voit les roles star de son departement" on public.roles_utilisateurs;
create policy "responsable voit les roles star de son departement"
  on public.roles_utilisateurs for select to public
  using (
    role = 'star' and exists (
      select 1 from public.demandes_departement dd
      where dd.star_id = roles_utilisateurs.utilisateur_id
        and public.is_responsable_of(dd.departement_id)
    )
  );

drop policy "responsable valide les roles star de son departement" on public.roles_utilisateurs;
create policy "responsable valide les roles star de son departement"
  on public.roles_utilisateurs for update to public
  using (
    role = 'star' and exists (
      select 1 from public.demandes_departement dd
      where dd.star_id = roles_utilisateurs.utilisateur_id
        and public.is_responsable_of(dd.departement_id)
    )
  )
  with check (
    role = 'star' and exists (
      select 1 from public.demandes_departement dd
      where dd.star_id = roles_utilisateurs.utilisateur_id
        and public.is_responsable_of(dd.departement_id)
    )
  );

drop policy "responsable voit les stars de son departement" on public.utilisateurs;
create policy "responsable voit les stars de son departement"
  on public.utilisateurs for select to public
  using (
    exists (
      select 1 from public.demandes_departement dd
      where dd.star_id = utilisateurs.id
        and public.is_responsable_of(dd.departement_id)
    )
  );

alter table public.roles_utilisateurs drop column departement_id;
