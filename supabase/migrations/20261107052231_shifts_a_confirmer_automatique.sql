-- Règles métier R3 : un shift encore `de_service` passe à `a_confirmer` à minuit à la fin de son
-- jour, heure d'Ottawa-Gatineau. La base étant en UTC, la conversion est explicite.
--
-- La tâche tourne toutes les heures : elle suit le changement d'heure sans réglage et rattrape
-- son retard si le projet a été en pause. Elle ne touche qu'aux shifts passés encore `de_service` ;
-- la relancer ne change rien de plus.

create function public.shifts_marquer_a_confirmer(
  p_aujourdhui date default (now() at time zone 'America/Toronto')::date
)
returns integer
language plpgsql
set search_path to ''
as $function$
declare
  nb integer;
begin
  update public.plannings
  set statut = 'a_confirmer'
  where statut = 'de_service' and date < p_aujourdhui;
  get diagnostics nb = row_count;
  return nb;
end $function$;

revoke all on function public.shifts_marquer_a_confirmer(date) from public, anon, authenticated;
grant execute on function public.shifts_marquer_a_confirmer(date) to service_role;

create index plannings_de_service_date_idx on public.plannings (date)
where statut = 'de_service';

-- pg_cron existe sur Supabase, pas dans le Postgres temporaire des tests.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    grant usage on schema cron to postgres;
    grant all privileges on all tables in schema cron to postgres;
    perform cron.schedule(
      'deeplan-shifts-a-confirmer',
      '5 * * * *',
      'select public.shifts_marquer_a_confirmer()'
    );
  end if;
end $$;
