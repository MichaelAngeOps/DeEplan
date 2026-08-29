-- Appliquée sur deeplan-prod le 2026-08-29 (via MCP).
-- Lot A7d — notifications push (web) + mise à jour temps réel de la pastille.

-- Abonnements push. `type` discrimine le canal : 'web' (VAPID), et plus tard
-- 'fcm' (Android) / 'apns' (iOS) pour les apps natives — même table, même flux.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utilisateurs(id) on delete cascade,
  type text not null default 'web' check (type in ('web', 'fcm', 'apns')),
  endpoint text not null,
  p256dh text,
  auth text,
  date_creation timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "utilisateur gere ses abonnements push"
  on public.push_subscriptions for all to public
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lecture des abonnements d'un utilisateur par le serveur (envoi de push) :
-- soi-même, ou un responsable d'un département où le star est validé.
create or replace function public.push_subscriptions_pour(p_user uuid)
  returns setof public.push_subscriptions
  language sql stable security definer set search_path = ''
as $$
  select ps.* from public.push_subscriptions ps
  where ps.user_id = p_user
    and (
      p_user = auth.uid()
      or exists (
        select 1 from public.demandes_departement dd
        where dd.star_id = p_user and dd.statut = 'valide'
          and public.is_responsable_of(dd.departement_id)
      )
    );
$$;

revoke execute on function public.push_subscriptions_pour(uuid) from anon;
grant execute on function public.push_subscriptions_pour(uuid) to authenticated;

create or replace function public.supprimer_abonnement_push(p_endpoint text)
  returns void language sql security definer set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;
revoke execute on function public.supprimer_abonnement_push(text) from anon;
grant execute on function public.supprimer_abonnement_push(text) to authenticated;

-- Temps réel : la pastille « non lu » se met à jour dès l'INSERT d'une
-- notification (RLS s'applique → chacun ne reçoit que les siennes).
alter publication supabase_realtime add table public.notifications;
