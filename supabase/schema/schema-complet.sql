-- ==========================================================================
-- DeEplan : schéma complet du schéma `public`
--
-- Photographie de deeplan-prod, relevée dans le catalogue le 2026-11-06.
-- Elle inclut toutes les migrations jusqu'à 20261106064650.
--
-- Usage : sur un projet Supabase NEUF, appliquer ce fichier, puis seulement
-- les migrations dont la version est postérieure à 20261106064650.
-- Ne jamais l'appliquer sur une base existante.
--
-- Fidèle à la production, y compris les droits à durcir plus tard : les
-- corrections passent par de nouvelles migrations, pas par ce fichier.
-- Les extensions, les rôles et la publication `supabase_realtime` sont fournis
-- par Supabase. Le contenu du schéma `auth` n'est pas concerné.
-- ==========================================================================

set search_path = public;

-- --------------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------------

create table public.utilisateurs (
  id uuid not null,
  email text not null,
  nom text not null,
  prenom text not null,
  date_creation timestamp with time zone not null default now()
);

create table public.roles_utilisateurs (
  id uuid not null default gen_random_uuid(),
  utilisateur_id uuid not null,
  role text not null,
  statut text not null default 'en_attente'::text,
  date_creation timestamp with time zone not null default now()
);

create table public.departements (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  description text,
  responsable_id uuid not null
);

create table public.demandes_departement (
  star_id uuid not null,
  departement_id uuid not null,
  statut text not null default 'en_attente'::text,
  date_demande timestamp with time zone not null default now()
);

create table public.sections (
  id uuid not null default gen_random_uuid(),
  departement_id uuid not null,
  nom text not null
);

create table public.postes (
  id uuid not null default gen_random_uuid(),
  section_id uuid not null,
  nom text not null,
  description text
);

create table public.star_sections (
  star_id uuid not null,
  section_id uuid not null
);

create table public.disponibilites (
  id uuid not null default gen_random_uuid(),
  star_id uuid not null,
  date date not null,
  statut text not null
);

create table public.plannings (
  id uuid not null default gen_random_uuid(),
  star_id uuid not null,
  poste_id uuid not null,
  date date not null,
  heure_debut time without time zone,
  heure_fin time without time zone,
  description text,
  statut text not null default 'de_service'::text,
  cree_par uuid not null,
  date_creation timestamp with time zone not null default now()
);

create table public.annonces (
  id uuid not null default gen_random_uuid(),
  departement_id uuid not null,
  responsable_id uuid not null,
  titre text not null,
  contenu text not null,
  date_publication timestamp with time zone not null default now()
);

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  utilisateur_id uuid not null,
  type text not null,
  contenu text not null,
  lu boolean not null default false,
  date_creation timestamp with time zone not null default now(),
  lien text
);

create table public.push_subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'web'::text,
  endpoint text not null,
  p256dh text,
  auth text,
  date_creation timestamp with time zone not null default now()
);

create table public.formulaires (
  id uuid not null default gen_random_uuid(),
  departement_id uuid not null,
  responsable_id uuid not null,
  titre text not null,
  description text,
  statut text not null default 'brouillon'::text,
  date_creation timestamp with time zone not null default now(),
  date_publication timestamp with time zone,
  date_fermeture timestamp with time zone
);

create table public.formulaire_questions (
  id uuid not null default gen_random_uuid(),
  formulaire_id uuid not null,
  ordre integer not null,
  libelle text not null,
  type text not null,
  options jsonb,
  obligatoire boolean not null default false
);

create table public.formulaire_reponses (
  id uuid not null default gen_random_uuid(),
  formulaire_id uuid not null,
  star_id uuid not null,
  reponses jsonb not null default '{}'::jsonb,
  date_soumission timestamp with time zone not null default now(),
  date_modification timestamp with time zone not null default now()
);

-- --------------------------------------------------------------------------
-- Clés primaires et contraintes d'unicité
-- --------------------------------------------------------------------------

alter table public.annonces add constraint annonces_pkey PRIMARY KEY (id);
alter table public.demandes_departement add constraint demandes_departement_pkey PRIMARY KEY (star_id, departement_id);
alter table public.departements add constraint departements_pkey PRIMARY KEY (id);
alter table public.disponibilites add constraint disponibilites_pkey PRIMARY KEY (id);
alter table public.formulaire_questions add constraint formulaire_questions_pkey PRIMARY KEY (id);
alter table public.formulaire_reponses add constraint formulaire_reponses_pkey PRIMARY KEY (id);
alter table public.formulaires add constraint formulaires_pkey PRIMARY KEY (id);
alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table public.plannings add constraint plannings_pkey PRIMARY KEY (id);
alter table public.postes add constraint postes_pkey PRIMARY KEY (id);
alter table public.push_subscriptions add constraint push_subscriptions_pkey PRIMARY KEY (id);
alter table public.roles_utilisateurs add constraint roles_utilisateurs_pkey PRIMARY KEY (id);
alter table public.sections add constraint sections_pkey PRIMARY KEY (id);
alter table public.star_sections add constraint star_sections_pkey PRIMARY KEY (star_id, section_id);
alter table public.utilisateurs add constraint utilisateurs_pkey PRIMARY KEY (id);

alter table public.disponibilites add constraint disponibilites_star_id_date_key UNIQUE (star_id, date);
alter table public.formulaire_questions add constraint formulaire_questions_formulaire_id_ordre_key UNIQUE (formulaire_id, ordre);
alter table public.formulaire_reponses add constraint formulaire_reponses_formulaire_id_star_id_key UNIQUE (formulaire_id, star_id);
alter table public.push_subscriptions add constraint push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
alter table public.roles_utilisateurs add constraint roles_utilisateurs_utilisateur_id_role_key UNIQUE (utilisateur_id, role);
alter table public.utilisateurs add constraint utilisateurs_email_key UNIQUE (email);

-- --------------------------------------------------------------------------
-- Contraintes de validation
-- --------------------------------------------------------------------------

alter table public.demandes_departement add constraint demandes_departement_statut_check CHECK ((statut = ANY (ARRAY['en_attente'::text, 'valide'::text, 'refuse'::text])));
alter table public.disponibilites add constraint disponibilites_statut_check CHECK ((statut = ANY (ARRAY['disponible'::text, 'indisponible'::text])));
alter table public.formulaire_questions add constraint formulaire_questions_libelle_check CHECK (((char_length(btrim(libelle)) >= 1) AND (char_length(btrim(libelle)) <= 500)));
alter table public.formulaire_questions add constraint formulaire_questions_options_selon_type CHECK (
CASE
    WHEN (type = ANY (ARRAY['choix_unique'::text, 'choix_multiple'::text])) THEN
    CASE
        WHEN (jsonb_typeof(options) = 'array'::text) THEN ((jsonb_array_length(options) >= 2) AND (jsonb_array_length(options) <= 50))
        ELSE false
    END
    ELSE (options IS NULL)
END);
alter table public.formulaire_questions add constraint formulaire_questions_ordre_check CHECK ((ordre >= 0));
alter table public.formulaire_questions add constraint formulaire_questions_type_check CHECK ((type = ANY (ARRAY['texte_court'::text, 'texte_long'::text, 'choix_unique'::text, 'choix_multiple'::text, 'oui_non'::text, 'date'::text])));
alter table public.formulaires add constraint formulaires_description_check CHECK (((description IS NULL) OR (char_length(description) <= 2000)));
alter table public.formulaires add constraint formulaires_statut_check CHECK ((statut = ANY (ARRAY['brouillon'::text, 'publie'::text, 'ferme'::text])));
alter table public.formulaires add constraint formulaires_titre_check CHECK (((char_length(btrim(titre)) >= 1) AND (char_length(btrim(titre)) <= 120)));
alter table public.notifications add constraint notifications_lien_chemin_interne CHECK (((lien IS NULL) OR (lien ~ '^/[^/\\]'::text)));
alter table public.plannings add constraint plannings_statut_check CHECK ((statut = ANY (ARRAY['de_service'::text, 'a_servi'::text, 'na_pas_servi'::text, 'a_confirmer'::text])));
alter table public.push_subscriptions add constraint push_subscriptions_type_check CHECK ((type = ANY (ARRAY['web'::text, 'fcm'::text, 'apns'::text])));
alter table public.roles_utilisateurs add constraint roles_utilisateurs_role_check CHECK ((role = ANY (ARRAY['responsable'::text, 'star'::text])));
alter table public.roles_utilisateurs add constraint roles_utilisateurs_statut_check CHECK ((statut = ANY (ARRAY['en_attente'::text, 'valide'::text, 'desactive'::text])));

-- --------------------------------------------------------------------------
-- Clés étrangères
-- --------------------------------------------------------------------------

alter table public.annonces add constraint annonces_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE;
alter table public.annonces add constraint annonces_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id);
alter table public.demandes_departement add constraint demandes_departement_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE;
alter table public.demandes_departement add constraint demandes_departement_star_id_fkey FOREIGN KEY (star_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.departements add constraint departements_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.disponibilites add constraint disponibilites_star_id_fkey FOREIGN KEY (star_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.formulaire_questions add constraint formulaire_questions_formulaire_id_fkey FOREIGN KEY (formulaire_id) REFERENCES formulaires(id) ON DELETE CASCADE;
alter table public.formulaire_reponses add constraint formulaire_reponses_formulaire_id_fkey FOREIGN KEY (formulaire_id) REFERENCES formulaires(id) ON DELETE CASCADE;
alter table public.formulaire_reponses add constraint formulaire_reponses_star_id_fkey FOREIGN KEY (star_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.formulaires add constraint formulaires_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE;
alter table public.formulaires add constraint formulaires_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.plannings add constraint plannings_cree_par_fkey FOREIGN KEY (cree_par) REFERENCES utilisateurs(id);
alter table public.plannings add constraint plannings_poste_id_fkey FOREIGN KEY (poste_id) REFERENCES postes(id) ON DELETE CASCADE;
alter table public.plannings add constraint plannings_star_id_fkey FOREIGN KEY (star_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.postes add constraint postes_section_id_fkey FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE;
alter table public.push_subscriptions add constraint push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.roles_utilisateurs add constraint roles_utilisateurs_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.sections add constraint sections_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE;
alter table public.star_sections add constraint star_sections_section_id_fkey FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE;
alter table public.star_sections add constraint star_sections_star_id_fkey FOREIGN KEY (star_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
alter table public.utilisateurs add constraint utilisateurs_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- --------------------------------------------------------------------------
-- Index
-- --------------------------------------------------------------------------

CREATE INDEX annonces_departement_id_idx ON public.annonces USING btree (departement_id);
CREATE INDEX disponibilites_star_id_date_idx ON public.disponibilites USING btree (star_id, date);
CREATE INDEX formulaire_reponses_star_id_idx ON public.formulaire_reponses USING btree (star_id);
CREATE INDEX formulaires_departement_id_date_idx ON public.formulaires USING btree (departement_id, date_creation DESC);
CREATE INDEX formulaires_responsable_id_idx ON public.formulaires USING btree (responsable_id);
CREATE INDEX notifications_utilisateur_id_lu_idx ON public.notifications USING btree (utilisateur_id, lu);
CREATE INDEX plannings_poste_id_date_idx ON public.plannings USING btree (poste_id, date);
CREATE UNIQUE INDEX plannings_poste_id_date_key ON public.plannings USING btree (poste_id, date);
CREATE INDEX plannings_star_id_date_idx ON public.plannings USING btree (star_id, date);
CREATE INDEX postes_section_id_idx ON public.postes USING btree (section_id);
CREATE INDEX roles_utilisateurs_utilisateur_id_idx ON public.roles_utilisateurs USING btree (utilisateur_id);
CREATE INDEX sections_departement_id_idx ON public.sections USING btree (departement_id);

-- --------------------------------------------------------------------------
-- Fonctions
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.formulaire_reponses_valider()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  q record;
  v jsonb;
  vide boolean;
  d date;
begin
  if tg_op = 'UPDATE' then
    if new.formulaire_id is distinct from old.formulaire_id
       or new.star_id is distinct from old.star_id then
      raise exception 'Cette reponse ne peut pas changer de formulaire ou de star.' using errcode = '23514';
    end if;
    new.date_soumission := old.date_soumission;
  else
    new.date_soumission := now();
  end if;
  new.date_modification := now();

  if jsonb_typeof(new.reponses) <> 'object' then
    raise exception 'Format de reponses invalide.' using errcode = '23514';
  end if;

  if exists (
    select 1 from jsonb_object_keys(new.reponses) k
    where not exists (select 1 from public.formulaire_questions fq
                      where fq.formulaire_id = new.formulaire_id and fq.id::text = k)
  ) then
    raise exception 'Reponse a une question inconnue.' using errcode = '23514';
  end if;

  for q in
    select fq.id, fq.libelle, fq.type, fq.options, fq.obligatoire
    from public.formulaire_questions fq
    where fq.formulaire_id = new.formulaire_id
    order by fq.ordre
  loop
    v := new.reponses -> q.id::text;
    vide := v is null
      or jsonb_typeof(v) = 'null'
      or (jsonb_typeof(v) = 'string' and btrim(v #>> '{}') = '')
      or (jsonb_typeof(v) = 'array' and jsonb_array_length(v) = 0);

    if vide then
      if q.obligatoire then
        raise exception 'Question obligatoire sans reponse : %', q.libelle using errcode = '23514';
      end if;
      new.reponses := new.reponses - q.id::text;
      continue;
    end if;

    if q.type = 'texte_court' then
      if jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 500 then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
    elsif q.type = 'texte_long' then
      if jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 5000 then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
    elsif q.type = 'choix_unique' then
      if jsonb_typeof(v) <> 'string' or not (q.options @> jsonb_build_array(v)) then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
    elsif q.type = 'choix_multiple' then
      if jsonb_typeof(v) <> 'array'
         or exists (select 1 from jsonb_array_elements(v) e
                    where jsonb_typeof(e) <> 'string'
                       or not (q.options @> jsonb_build_array(e)))
         or (select count(*) <> count(distinct e) from jsonb_array_elements(v) e) then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
    elsif q.type = 'oui_non' then
      if jsonb_typeof(v) <> 'boolean' then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
    elsif q.type = 'date' then
      if jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end if;
      begin
        d := (v #>> '{}')::date;
      exception when others then
        raise exception 'Reponse invalide : %', q.libelle using errcode = '23514';
      end;
    end if;
  end loop;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.formulaires_garde()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.statut <> 'brouillon' then
      raise exception 'Un formulaire est cree en brouillon.' using errcode = '23514';
    end if;
    new.date_publication := null;
    new.date_fermeture := null;
    return new;
  end if;

  if new.departement_id is distinct from old.departement_id
     or new.responsable_id is distinct from old.responsable_id
     or new.date_creation is distinct from old.date_creation then
    raise exception 'Ces champs du formulaire ne sont pas modifiables.' using errcode = '23514';
  end if;

  if old.statut <> 'brouillon'
     and (new.titre is distinct from old.titre
          or new.description is distinct from old.description) then
    raise exception 'Un formulaire publie n''est plus modifiable.' using errcode = '23514';
  end if;

  if new.statut is distinct from old.statut then
    if old.statut = 'brouillon' and new.statut = 'publie' then
      if not exists (select 1 from public.formulaire_questions q
                     where q.formulaire_id = new.id) then
        raise exception 'Ajoutez au moins une question avant de publier.' using errcode = '23514';
      end if;
      new.date_publication := now();
      new.date_fermeture := null;
    elsif old.statut = 'publie' and new.statut = 'ferme' then
      new.date_publication := old.date_publication;
      new.date_fermeture := now();
    else
      raise exception 'Changement de statut non autorise.' using errcode = '23514';
    end if;
  else
    new.date_publication := old.date_publication;
    new.date_fermeture := old.date_fermeture;
  end if;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.formulaires_retirer_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from public.notifications
  where type = 'formulaire' and lien = '/star/formulaires/' || old.id::text;
  return old;
end $function$;

CREATE OR REPLACE FUNCTION public.is_any_responsable()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (select 1 from public.departements d
                     where d.responsable_id = auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.is_responsable_of(dept_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (select 1 from public.departements d
                     where d.id = dept_id and d.responsable_id = auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.is_star_in_departement(dept_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (select 1 from public.star_sections ss
                     join public.sections s on s.id = ss.section_id
                     where s.departement_id = dept_id and ss.star_id = auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.notifier_stars_sans_departement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.notifications (utilisateur_id, type, contenu)
  select ru.utilisateur_id, 'departement_cree',
         'Un département vient d''être créé. Rejoignez-le depuis « Mes départements » si vous le souhaitez.'
  from public.roles_utilisateurs ru
  where ru.role = 'star'
    and not exists (select 1 from public.demandes_departement d
                    where d.star_id = ru.utilisateur_id);
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.push_subscriptions_pour(p_user uuid)
 RETURNS SETOF public.push_subscriptions
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.star_a_repondu(p_formulaire uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.formulaire_reponses r
    where r.formulaire_id = p_formulaire and r.star_id = (select auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.star_peut_repondre(p_formulaire uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.formulaires f
    where f.id = p_formulaire
      and f.statut = 'publie'
      and public.is_star_in_departement(f.departement_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.stars_planifies_le(p_stars uuid[], p_date date, p_exclure_poste uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select distinct star_id
  from public.plannings
  where date = p_date
    and star_id = any(p_stars)
    and (p_exclure_poste is null or poste_id <> p_exclure_poste);
$function$;

CREATE OR REPLACE FUNCTION public.supprimer_abonnement_push(p_endpoint text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$function$;

CREATE OR REPLACE FUNCTION public.sync_statut_role_star()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;

-- --------------------------------------------------------------------------
-- Déclencheurs
-- --------------------------------------------------------------------------

CREATE TRIGGER trg_sync_statut_role_star AFTER INSERT OR DELETE OR UPDATE ON public.demandes_departement FOR EACH ROW EXECUTE FUNCTION public.sync_statut_role_star();
CREATE TRIGGER trg_notifier_stars_sans_departement AFTER INSERT ON public.departements FOR EACH ROW EXECUTE FUNCTION public.notifier_stars_sans_departement();
CREATE TRIGGER trg_formulaire_reponses_valider BEFORE INSERT OR UPDATE ON public.formulaire_reponses FOR EACH ROW EXECUTE FUNCTION public.formulaire_reponses_valider();
CREATE TRIGGER trg_formulaires_garde BEFORE INSERT OR UPDATE ON public.formulaires FOR EACH ROW EXECUTE FUNCTION public.formulaires_garde();
CREATE TRIGGER trg_formulaires_retirer_notifications AFTER DELETE ON public.formulaires FOR EACH ROW EXECUTE FUNCTION public.formulaires_retirer_notifications();

-- --------------------------------------------------------------------------
-- Sécurité au niveau des lignes
-- --------------------------------------------------------------------------

alter table public.annonces enable row level security;
alter table public.demandes_departement enable row level security;
alter table public.departements enable row level security;
alter table public.disponibilites enable row level security;
alter table public.formulaire_questions enable row level security;
alter table public.formulaire_reponses enable row level security;
alter table public.formulaires enable row level security;
alter table public.notifications enable row level security;
alter table public.plannings enable row level security;
alter table public.postes enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.roles_utilisateurs enable row level security;
alter table public.sections enable row level security;
alter table public.star_sections enable row level security;
alter table public.utilisateurs enable row level security;

create policy "membre lit les annonces" on public.annonces for select using ((is_responsable_of(departement_id) OR is_star_in_departement(departement_id)));
create policy "responsable gere les annonces" on public.annonces for all using (is_responsable_of(departement_id)) with check (is_responsable_of(departement_id));

create policy "responsable traite les demandes de son departement" on public.demandes_departement for all using (is_responsable_of(departement_id)) with check (is_responsable_of(departement_id));
create policy "star gere ses demandes" on public.demandes_departement for all using ((star_id = auth.uid())) with check (((star_id = auth.uid()) AND (statut = 'en_attente'::text)));

create policy "membre lit son departement" on public.departements for select using (((responsable_id = auth.uid()) OR is_star_in_departement(id)));
create policy "responsable cree son departement" on public.departements for insert with check ((responsable_id = auth.uid()));
create policy "responsable modifie son departement" on public.departements for update using ((responsable_id = auth.uid()));
create policy "utilisateur connecte liste les departements" on public.departements for select to authenticated using (true);

create policy "responsable lit les dispos de ses stars" on public.disponibilites for select using ((EXISTS ( SELECT 1
   FROM (star_sections ss
     JOIN sections s ON ((s.id = ss.section_id)))
  WHERE ((ss.star_id = disponibilites.star_id) AND is_responsable_of(s.departement_id)))));
create policy "star gere ses dispos" on public.disponibilites for all using ((star_id = auth.uid())) with check ((star_id = auth.uid()));

create policy "lecture questions" on public.formulaire_questions for select to authenticated using ((EXISTS ( SELECT 1
   FROM formulaires f
  WHERE (f.id = formulaire_questions.formulaire_id))));
create policy "responsable ajoute une question" on public.formulaire_questions for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM formulaires f
  WHERE ((f.id = formulaire_questions.formulaire_id) AND (f.statut = 'brouillon'::text) AND is_responsable_of(f.departement_id)))));
create policy "responsable modifie une question" on public.formulaire_questions for update to authenticated using ((EXISTS ( SELECT 1
   FROM formulaires f
  WHERE ((f.id = formulaire_questions.formulaire_id) AND (f.statut = 'brouillon'::text) AND is_responsable_of(f.departement_id))))) with check ((EXISTS ( SELECT 1
   FROM formulaires f
  WHERE ((f.id = formulaire_questions.formulaire_id) AND (f.statut = 'brouillon'::text) AND is_responsable_of(f.departement_id)))));
create policy "responsable supprime une question" on public.formulaire_questions for delete to authenticated using ((EXISTS ( SELECT 1
   FROM formulaires f
  WHERE ((f.id = formulaire_questions.formulaire_id) AND (f.statut = 'brouillon'::text) AND is_responsable_of(f.departement_id)))));

create policy "lecture reponses" on public.formulaire_reponses for select to authenticated using (((star_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM formulaires f
  WHERE ((f.id = formulaire_reponses.formulaire_id) AND is_responsable_of(f.departement_id))))));
create policy "star enregistre sa reponse" on public.formulaire_reponses for insert to authenticated with check (((star_id = ( SELECT auth.uid() AS uid)) AND star_peut_repondre(formulaire_id)));
create policy "star modifie sa reponse" on public.formulaire_reponses for update to authenticated using (((star_id = ( SELECT auth.uid() AS uid)) AND star_peut_repondre(formulaire_id))) with check (((star_id = ( SELECT auth.uid() AS uid)) AND star_peut_repondre(formulaire_id)));

create policy "lecture formulaires" on public.formulaires for select to authenticated using ((is_responsable_of(departement_id) OR ((statut <> 'brouillon'::text) AND is_star_in_departement(departement_id)) OR star_a_repondu(id)));
create policy "responsable cree un formulaire" on public.formulaires for insert to authenticated with check ((is_responsable_of(departement_id) AND (responsable_id = ( SELECT auth.uid() AS uid))));
create policy "responsable modifie un formulaire" on public.formulaires for update to authenticated using (is_responsable_of(departement_id)) with check (is_responsable_of(departement_id));
create policy "responsable supprime un brouillon ou un ferme" on public.formulaires for delete to authenticated using ((is_responsable_of(departement_id) AND (statut = ANY (ARRAY['brouillon'::text, 'ferme'::text]))));

create policy "own notifications" on public.notifications for select using ((utilisateur_id = auth.uid()));
create policy "own notifications update" on public.notifications for update using ((utilisateur_id = auth.uid()));
create policy "responsable notifie ses stars" on public.notifications for insert with check ((EXISTS ( SELECT 1
   FROM (star_sections ss
     JOIN sections s ON ((s.id = ss.section_id)))
  WHERE ((ss.star_id = notifications.utilisateur_id) AND is_responsable_of(s.departement_id)))));

create policy "responsable gere les plannings" on public.plannings for all using ((EXISTS ( SELECT 1
   FROM (postes p
     JOIN sections s ON ((s.id = p.section_id)))
  WHERE ((p.id = plannings.poste_id) AND is_responsable_of(s.departement_id))))) with check ((EXISTS ( SELECT 1
   FROM (postes p
     JOIN sections s ON ((s.id = p.section_id)))
  WHERE ((p.id = plannings.poste_id) AND is_responsable_of(s.departement_id)))));
create policy "star lit ses plannings" on public.plannings for select using ((star_id = auth.uid()));

create policy "membre lit les postes" on public.postes for select using ((EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = postes.section_id) AND (is_responsable_of(s.departement_id) OR is_star_in_departement(s.departement_id))))));
create policy "responsable gere les postes" on public.postes for all using ((EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = postes.section_id) AND is_responsable_of(s.departement_id))))) with check ((EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = postes.section_id) AND is_responsable_of(s.departement_id)))));

create policy "utilisateur gere ses abonnements push" on public.push_subscriptions for all using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

create policy "insert own role" on public.roles_utilisateurs for insert with check (((utilisateur_id = auth.uid()) AND (statut = 'en_attente'::text)));
create policy "own roles" on public.roles_utilisateurs for select using ((utilisateur_id = auth.uid()));
create policy "responsable valide les roles star de son departement" on public.roles_utilisateurs for update using (((role = 'star'::text) AND (EXISTS ( SELECT 1
   FROM demandes_departement dd
  WHERE ((dd.star_id = roles_utilisateurs.utilisateur_id) AND is_responsable_of(dd.departement_id)))))) with check (((role = 'star'::text) AND (EXISTS ( SELECT 1
   FROM demandes_departement dd
  WHERE ((dd.star_id = roles_utilisateurs.utilisateur_id) AND is_responsable_of(dd.departement_id))))));
create policy "responsable voit les roles star de son departement" on public.roles_utilisateurs for select using (((role = 'star'::text) AND (EXISTS ( SELECT 1
   FROM demandes_departement dd
  WHERE ((dd.star_id = roles_utilisateurs.utilisateur_id) AND is_responsable_of(dd.departement_id))))));
create policy "star choisit son departement en attente" on public.roles_utilisateurs for update using (((utilisateur_id = auth.uid()) AND (role = 'star'::text) AND (statut = 'en_attente'::text))) with check (((utilisateur_id = auth.uid()) AND (role = 'star'::text) AND (statut = 'en_attente'::text)));

create policy "membre lit les sections" on public.sections for select using ((is_responsable_of(departement_id) OR is_star_in_departement(departement_id)));
create policy "responsable gere les sections" on public.sections for all using (is_responsable_of(departement_id)) with check (is_responsable_of(departement_id));

create policy "lecture star_sections" on public.star_sections for select using (((star_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = star_sections.section_id) AND is_responsable_of(s.departement_id))))));
create policy "responsable gere star_sections" on public.star_sections for all using ((EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = star_sections.section_id) AND is_responsable_of(s.departement_id))))) with check ((EXISTS ( SELECT 1
   FROM sections s
  WHERE ((s.id = star_sections.section_id) AND is_responsable_of(s.departement_id)))));

create policy "insert own row" on public.utilisateurs for insert with check ((id = auth.uid()));
create policy "own row" on public.utilisateurs for select using ((id = auth.uid()));
create policy "responsable voit les stars de son departement" on public.utilisateurs for select using ((EXISTS ( SELECT 1
   FROM demandes_departement dd
  WHERE ((dd.star_id = utilisateurs.id) AND is_responsable_of(dd.departement_id)))));
create policy "update own row" on public.utilisateurs for update using ((id = auth.uid()));

-- --------------------------------------------------------------------------
-- Droits : identiques à la production
-- --------------------------------------------------------------------------

grant all on all tables in schema public to anon, authenticated, service_role;

revoke all on function public.formulaire_reponses_valider() from public, anon, authenticated;
revoke all on function public.formulaires_garde() from public, anon, authenticated;
revoke all on function public.formulaires_retirer_notifications() from public, anon, authenticated;
revoke all on function public.is_any_responsable() from public;
revoke all on function public.is_responsable_of(uuid) from public;
revoke all on function public.is_star_in_departement(uuid) from public;
revoke all on function public.push_subscriptions_pour(uuid) from anon;
revoke all on function public.star_a_repondu(uuid) from public, anon;
revoke all on function public.star_peut_repondre(uuid) from public, anon;
revoke all on function public.stars_planifies_le(uuid[], date, uuid) from anon;
revoke all on function public.supprimer_abonnement_push(text) from anon;

grant execute on function public.formulaire_reponses_valider() to service_role;
grant execute on function public.formulaires_garde() to service_role;
grant execute on function public.formulaires_retirer_notifications() to service_role;
grant execute on function public.is_any_responsable() to anon, authenticated, service_role;
grant execute on function public.is_responsable_of(uuid) to anon, authenticated, service_role;
grant execute on function public.is_star_in_departement(uuid) to anon, authenticated, service_role;
grant execute on function public.notifier_stars_sans_departement() to public, anon, authenticated, service_role;
grant execute on function public.push_subscriptions_pour(uuid) to public, authenticated, service_role;
grant execute on function public.star_a_repondu(uuid) to authenticated, service_role;
grant execute on function public.star_peut_repondre(uuid) to authenticated, service_role;
grant execute on function public.stars_planifies_le(uuid[], date, uuid) to public, authenticated, service_role;
grant execute on function public.supprimer_abonnement_push(text) to public, authenticated, service_role;
grant execute on function public.sync_statut_role_star() to public, anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Temps réel
-- --------------------------------------------------------------------------

alter publication supabase_realtime add table public.notifications;
