-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- Voir docs/SCHEMA.md §Points d'attention #4 et #6.

-- Finding #4 : l'INSERT de son propre rôle est forcé à statut 'en_attente'.
-- Empêche un compte de s'auto-valider (contournement de la validation
-- par un responsable).
drop policy "insert own role" on public.roles_utilisateurs;
create policy "insert own role"
  on public.roles_utilisateurs
  for insert to public
  with check (utilisateur_id = auth.uid() and statut = 'en_attente');

-- Finding #6 : search_path figé + tables schéma-qualifiées (3 fonctions RLS).
create or replace function public.is_any_responsable()
  returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.departements d
                     where d.responsable_id = auth.uid()); $$;

create or replace function public.is_responsable_of(dept_id uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.departements d
                     where d.id = dept_id and d.responsable_id = auth.uid()); $$;

create or replace function public.is_star_in_departement(dept_id uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.star_sections ss
                     join public.sections s on s.id = ss.section_id
                     where s.departement_id = dept_id and ss.star_id = auth.uid()); $$;

-- Rollback :
--   drop policy "insert own role" on public.roles_utilisateurs;
--   create policy "insert own role" on public.roles_utilisateurs
--     for insert to public with check (utilisateur_id = auth.uid());
