-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- Lot A2 — le star choisit son département cible à l'inscription ; seul le
-- responsable concerné voit sa demande et est notifié. Fin de la RLS « v1 »
-- permissive pour ce cas (docs/SCHEMA.md #5).

-- 1) Colonne : département choisi par le star (avant validation).
alter table public.roles_utilisateurs
  add column departement_id uuid references public.departements(id) on delete set null;

-- 2) Le star peut renseigner / changer son département tant qu'il est en attente.
create policy "star choisit son departement en attente"
  on public.roles_utilisateurs for update to public
  using (
    utilisateur_id = auth.uid() and role = 'star' and statut = 'en_attente'
  )
  with check (
    utilisateur_id = auth.uid() and role = 'star' and statut = 'en_attente'
  );

-- 3) Le responsable ne voit / ne valide que les stars de SON département.
drop policy "responsable voit les roles star (v1)" on public.roles_utilisateurs;
create policy "responsable voit les roles star de son departement"
  on public.roles_utilisateurs for select to public
  using (
    role = 'star' and (
      exists (
        select 1 from public.star_sections ss
          join public.sections s on s.id = ss.section_id
        where ss.star_id = roles_utilisateurs.utilisateur_id
          and public.is_responsable_of(s.departement_id)
      )
      or (departement_id is not null and public.is_responsable_of(departement_id))
    )
  );

drop policy "responsable valide role star (v1)" on public.roles_utilisateurs;
create policy "responsable valide les roles star de son departement"
  on public.roles_utilisateurs for update to public
  using (
    role = 'star' and (
      exists (
        select 1 from public.star_sections ss
          join public.sections s on s.id = ss.section_id
        where ss.star_id = roles_utilisateurs.utilisateur_id
          and public.is_responsable_of(s.departement_id)
      )
      or (departement_id is not null and public.is_responsable_of(departement_id))
    )
  )
  with check (
    role = 'star' and (
      exists (
        select 1 from public.star_sections ss
          join public.sections s on s.id = ss.section_id
        where ss.star_id = roles_utilisateurs.utilisateur_id
          and public.is_responsable_of(s.departement_id)
      )
      or (departement_id is not null and public.is_responsable_of(departement_id))
    )
  );

-- 4) `utilisateurs` : le responsable ne voit que les stars de son département.
drop policy "responsable voit ses stars (v1: tout responsable)" on public.utilisateurs;
create policy "responsable voit les stars de son departement"
  on public.utilisateurs for select to public
  using (
    exists (
      select 1 from public.star_sections ss
        join public.sections s on s.id = ss.section_id
      where ss.star_id = utilisateurs.id
        and public.is_responsable_of(s.departement_id)
    )
    or exists (
      select 1 from public.roles_utilisateurs ru
      where ru.utilisateur_id = utilisateurs.id
        and ru.role = 'star' and ru.statut = 'en_attente'
        and ru.departement_id is not null
        and public.is_responsable_of(ru.departement_id)
    )
  );

-- 5) Tout utilisateur connecté peut lister les départements (sélecteur d'inscription).
create policy "utilisateur connecte liste les departements"
  on public.departements for select to authenticated
  using (true);

-- 6) Trigger : notifier les stars sans département quand un département est créé.
create or replace function public.notifier_stars_sans_departement()
  returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (utilisateur_id, type, contenu)
  select ru.utilisateur_id, 'departement_cree',
         'Un département vient d''être créé. Choisissez le vôtre pour finaliser votre inscription.'
  from public.roles_utilisateurs ru
  where ru.role = 'star' and ru.statut = 'en_attente' and ru.departement_id is null;
  return new;
end $$;

create trigger trg_notifier_stars_sans_departement
  after insert on public.departements
  for each row execute function public.notifier_stars_sans_departement();

-- 7) Données existantes : rattacher les rôles star actuels à « Le Comptoir ».
update public.roles_utilisateurs
set departement_id = (select id from public.departements where nom = 'Le Comptoir')
where role = 'star' and departement_id is null;
