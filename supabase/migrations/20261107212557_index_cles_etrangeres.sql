-- Lot Charge C3 : index des clés étrangères signalées par le diagnostic Supabase. Ils accélèrent aussi
-- les règles d'accès, qui passent par `star_sections`, `demandes_departement` et `departements`, ainsi
-- que les suppressions en cascade. Aucune règle d'accès ni aucune donnée n'est modifiée.

create index star_sections_section_id_idx on public.star_sections (section_id);
create index demandes_departement_departement_id_idx on public.demandes_departement (departement_id);
create index departements_responsable_id_idx on public.departements (responsable_id);
create index plannings_cree_par_idx on public.plannings (cree_par);
create index annonces_responsable_id_idx on public.annonces (responsable_id);

-- Doublons exacts des index uniques `plannings_poste_id_date_key` et `disponibilites_star_id_date_key`.
drop index public.plannings_poste_id_date_idx;
drop index public.disponibilites_star_id_date_idx;
