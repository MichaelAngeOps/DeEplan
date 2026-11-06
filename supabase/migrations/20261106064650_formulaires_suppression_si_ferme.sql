-- Appliquée sur deeplan-prod le 2026-11-06 (via MCP, avec l'accord de l'ingénieur principal).
-- Lot A10 : suppression définitive d'un formulaire fermé.
-- Un formulaire publié doit d'abord être fermé ; ses réponses partent en cascade.

drop policy "responsable supprime un brouillon" on public.formulaires;

create policy "responsable supprime un brouillon ou un ferme" on public.formulaires
  for delete to authenticated
  using (public.is_responsable_of(departement_id) and statut in ('brouillon', 'ferme'));

-- Retire les notifications liées : un responsable ne peut pas supprimer celles des
-- stars via la RLS, et elles mèneraient sinon à une page introuvable.
create function public.formulaires_retirer_notifications()
  returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.notifications
  where type = 'formulaire' and lien = '/star/formulaires/' || old.id::text;
  return old;
end $$;

revoke execute on function public.formulaires_retirer_notifications() from public, anon, authenticated;

create trigger trg_formulaires_retirer_notifications
  after delete on public.formulaires
  for each row execute function public.formulaires_retirer_notifications();
