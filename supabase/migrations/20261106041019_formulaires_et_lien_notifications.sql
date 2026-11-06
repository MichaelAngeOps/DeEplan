-- Appliquée sur deeplan-prod le 2026-11-05 (heure d'Ottawa, via MCP).
-- Lot A9a : formulaires à remplir + notifications cliquables.

-- ---------------------------------------------------------------------------
-- Notifications : lien interne facultatif (chemin relatif uniquement)
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column lien text
  constraint notifications_lien_chemin_interne
  check (lien is null or lien ~ '^/[^/\\]');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.formulaires (
  id uuid primary key default gen_random_uuid(),
  departement_id uuid not null references public.departements(id) on delete cascade,
  responsable_id uuid not null references public.utilisateurs(id) on delete cascade,
  titre text not null check (char_length(btrim(titre)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  statut text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'ferme')),
  date_creation timestamptz not null default now(),
  date_publication timestamptz,
  date_fermeture timestamptz
);
create index formulaires_departement_id_date_idx
  on public.formulaires (departement_id, date_creation desc);
create index formulaires_responsable_id_idx on public.formulaires (responsable_id);

create table public.formulaire_questions (
  id uuid primary key default gen_random_uuid(),
  formulaire_id uuid not null references public.formulaires(id) on delete cascade,
  ordre integer not null check (ordre >= 0),
  libelle text not null check (char_length(btrim(libelle)) between 1 and 500),
  type text not null check (type in (
    'texte_court', 'texte_long', 'choix_unique', 'choix_multiple', 'oui_non', 'date'
  )),
  options jsonb,
  obligatoire boolean not null default false,
  unique (formulaire_id, ordre),
  constraint formulaire_questions_options_selon_type check (
    case
      when type in ('choix_unique', 'choix_multiple') then
        case when jsonb_typeof(options) = 'array'
             then jsonb_array_length(options) between 2 and 50
             else false end
      else options is null
    end
  )
);

create table public.formulaire_reponses (
  id uuid primary key default gen_random_uuid(),
  formulaire_id uuid not null references public.formulaires(id) on delete cascade,
  star_id uuid not null references public.utilisateurs(id) on delete cascade,
  reponses jsonb not null default '{}'::jsonb,
  date_soumission timestamptz not null default now(),
  date_modification timestamptz not null default now(),
  unique (formulaire_id, star_id)
);
create index formulaire_reponses_star_id_idx on public.formulaire_reponses (star_id);

-- ---------------------------------------------------------------------------
-- Garde du cycle de vie d'un formulaire
-- brouillon -> publie -> ferme ; contenu figé dès la publication.
-- ---------------------------------------------------------------------------
create function public.formulaires_garde()
  returns trigger language plpgsql security definer set search_path = ''
as $$
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
end $$;

create trigger trg_formulaires_garde
  before insert or update on public.formulaires
  for each row execute function public.formulaires_garde();

-- ---------------------------------------------------------------------------
-- Validation des réponses selon le type de chaque question
-- ---------------------------------------------------------------------------
create function public.formulaire_reponses_valider()
  returns trigger language plpgsql security definer set search_path = ''
as $$
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
end $$;

create trigger trg_formulaire_reponses_valider
  before insert or update on public.formulaire_reponses
  for each row execute function public.formulaire_reponses_valider();

-- ---------------------------------------------------------------------------
-- Fonctions d'aide RLS (évitent la récursion entre formulaires et réponses)
-- ---------------------------------------------------------------------------
create function public.star_peut_repondre(p_formulaire uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.formulaires f
    where f.id = p_formulaire
      and f.statut = 'publie'
      and public.is_star_in_departement(f.departement_id)
  );
$$;

create function public.star_a_repondu(p_formulaire uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.formulaire_reponses r
    where r.formulaire_id = p_formulaire and r.star_id = (select auth.uid())
  );
$$;

revoke execute on function public.star_peut_repondre(uuid) from public, anon;
revoke execute on function public.star_a_repondu(uuid) from public, anon;
grant execute on function public.star_peut_repondre(uuid) to authenticated;
grant execute on function public.star_a_repondu(uuid) to authenticated;
revoke execute on function public.formulaires_garde() from public, anon, authenticated;
revoke execute on function public.formulaire_reponses_valider() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.formulaires enable row level security;
alter table public.formulaire_questions enable row level security;
alter table public.formulaire_reponses enable row level security;

create policy "lecture formulaires" on public.formulaires
  for select to authenticated
  using (
    public.is_responsable_of(departement_id)
    or (statut <> 'brouillon' and public.is_star_in_departement(departement_id))
    or public.star_a_repondu(id)
  );

create policy "responsable cree un formulaire" on public.formulaires
  for insert to authenticated
  with check (
    public.is_responsable_of(departement_id)
    and responsable_id = (select auth.uid())
  );

create policy "responsable modifie un formulaire" on public.formulaires
  for update to authenticated
  using (public.is_responsable_of(departement_id))
  with check (public.is_responsable_of(departement_id));

create policy "responsable supprime un brouillon" on public.formulaires
  for delete to authenticated
  using (public.is_responsable_of(departement_id) and statut = 'brouillon');

create policy "lecture questions" on public.formulaire_questions
  for select to authenticated
  using (exists (select 1 from public.formulaires f where f.id = formulaire_id));

create policy "responsable ajoute une question" on public.formulaire_questions
  for insert to authenticated
  with check (exists (
    select 1 from public.formulaires f
    where f.id = formulaire_id and f.statut = 'brouillon'
      and public.is_responsable_of(f.departement_id)
  ));

create policy "responsable modifie une question" on public.formulaire_questions
  for update to authenticated
  using (exists (
    select 1 from public.formulaires f
    where f.id = formulaire_id and f.statut = 'brouillon'
      and public.is_responsable_of(f.departement_id)
  ))
  with check (exists (
    select 1 from public.formulaires f
    where f.id = formulaire_id and f.statut = 'brouillon'
      and public.is_responsable_of(f.departement_id)
  ));

create policy "responsable supprime une question" on public.formulaire_questions
  for delete to authenticated
  using (exists (
    select 1 from public.formulaires f
    where f.id = formulaire_id and f.statut = 'brouillon'
      and public.is_responsable_of(f.departement_id)
  ));

create policy "lecture reponses" on public.formulaire_reponses
  for select to authenticated
  using (
    star_id = (select auth.uid())
    or exists (
      select 1 from public.formulaires f
      where f.id = formulaire_id and public.is_responsable_of(f.departement_id)
    )
  );

create policy "star enregistre sa reponse" on public.formulaire_reponses
  for insert to authenticated
  with check (star_id = (select auth.uid()) and public.star_peut_repondre(formulaire_id));

create policy "star modifie sa reponse" on public.formulaire_reponses
  for update to authenticated
  using (star_id = (select auth.uid()) and public.star_peut_repondre(formulaire_id))
  with check (star_id = (select auth.uid()) and public.star_peut_repondre(formulaire_id));
