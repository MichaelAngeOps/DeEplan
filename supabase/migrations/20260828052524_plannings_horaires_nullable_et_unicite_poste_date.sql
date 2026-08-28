-- Appliquée sur deeplan-prod le 2026-08-28 (via MCP).
-- Lot 4b — voir cahier-de-charges.md (Lot 4, arbitrages du 2026-08-28) et docs/SCHEMA.md.

-- Décision produit : les horaires d'un shift sont OPTIONNELS (saisis à
-- l'assignation, mais le responsable peut ne pas les préciser).
alter table public.plannings
  alter column heure_debut drop not null,
  alter column heure_fin  drop not null;

-- Invariant : 1 star au maximum par poste et par jour. Ré-assigner une case
-- occupée = remplacer (upsert onConflict poste_id,date côté app).
create unique index plannings_poste_id_date_key
  on public.plannings (poste_id, date);
