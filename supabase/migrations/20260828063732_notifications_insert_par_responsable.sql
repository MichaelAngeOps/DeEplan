-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- Lot 5d — notifications créées par le responsable pour ses stars.

-- Un responsable peut insérer une notification destinée à un star affecté à
-- une section de son département (compte validé, shift assigné / modifié /
-- retiré). Les alertes du responsable (conflits de disponibilité) sont
-- calculées en direct → aucune policy star → responsable nécessaire.
create policy "responsable notifie ses stars"
  on public.notifications
  for insert
  to public
  with check (
    exists (
      select 1
      from public.star_sections ss
        join public.sections s on s.id = ss.section_id
      where ss.star_id = notifications.utilisateur_id
        and public.is_responsable_of(s.departement_id)
    )
  );
