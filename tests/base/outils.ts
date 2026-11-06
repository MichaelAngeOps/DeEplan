import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

/** Dernière migration incluse dans `schema-complet.sql`. */
const VERSION_DU_SCHEMA = "20261106064650";

const SUPABASE = join(process.cwd(), "supabase");

/** Ce que Supabase fournit déjà sur un vrai projet. */
const ENVIRONNEMENT_SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create schema auth;
  grant usage on schema auth to public;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
`;

/** Migrations ajoutées depuis la photographie du schéma, dans l'ordre. */
export function migrationsPosterieures(): string[] {
  return readdirSync(join(SUPABASE, "migrations"))
    .filter((f) => f.endsWith(".sql") && f.slice(0, 14) > VERSION_DU_SCHEMA)
    .sort();
}

/** Crée une base temporaire en mémoire, sans aucun lien avec la production. */
export async function creerBase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(ENVIRONNEMENT_SUPABASE);
  await db.exec(readFileSync(join(SUPABASE, "schema", "schema-complet.sql"), "utf8"));
  for (const fichier of migrationsPosterieures()) {
    await db.exec(readFileSync(join(SUPABASE, "migrations", fichier), "utf8"));
  }
  await db.exec("set search_path = public");
  return db;
}

/** Exécute une requête avec les droits d'un utilisateur connecté, ou d'un visiteur si `null`. */
export async function en<T = Record<string, unknown>>(
  db: PGlite,
  utilisateur: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [utilisateur ?? ""]);
    await tx.exec(`set local role ${utilisateur ? "authenticated" : "anon"}`);
    return (await tx.query<T>(sql, params)).rows;
  });
}

export const ID = {
  respA: "00000000-0000-4000-8000-00000000000a",
  respB: "00000000-0000-4000-8000-00000000000b",
  starA: "00000000-0000-4000-8000-0000000000a1",
  starB: "00000000-0000-4000-8000-0000000000b1",
  starEnAttente: "00000000-0000-4000-8000-0000000000a2",
  deptA: "00000000-0000-4000-8000-000000000d0a",
  deptB: "00000000-0000-4000-8000-000000000d0b",
  sectionA: "00000000-0000-4000-8000-000000000e0a",
  sectionB: "00000000-0000-4000-8000-000000000e0b",
  posteA: "00000000-0000-4000-8000-000000000f0a",
  posteB: "00000000-0000-4000-8000-000000000f0b",
} as const;

/**
 * Deux départements étanches. A : respA, starA (validé) et starEnAttente.
 * B : respB et starB (validé). Insertions faites hors RLS, comme une préparation de test.
 */
export async function preparerDeuxDepartements(db: PGlite): Promise<void> {
  const personnes = [ID.respA, ID.respB, ID.starA, ID.starB, ID.starEnAttente];
  for (const id of personnes) {
    await db.query("insert into auth.users (id) values ($1)", [id]);
    await db.query(
      "insert into utilisateurs (id, email, nom, prenom) values ($1, $2, 'Test', 'Compte')",
      [id, `${id}@test.local`],
    );
  }
  for (const star of [ID.starA, ID.starB, ID.starEnAttente]) {
    await db.query(
      "insert into roles_utilisateurs (utilisateur_id, role) values ($1, 'star')",
      [star],
    );
  }
  await db.query(
    `insert into departements (id, nom, responsable_id) values
       ($1, 'Département A', $3), ($2, 'Département B', $4)`,
    [ID.deptA, ID.deptB, ID.respA, ID.respB],
  );
  await db.query(
    `insert into sections (id, departement_id, nom) values
       ($1, $3, 'Section A'), ($2, $4, 'Section B')`,
    [ID.sectionA, ID.sectionB, ID.deptA, ID.deptB],
  );
  await db.query(
    `insert into postes (id, section_id, nom) values
       ($1, $3, 'Poste A'), ($2, $4, 'Poste B')`,
    [ID.posteA, ID.posteB, ID.sectionA, ID.sectionB],
  );
  await db.query(
    `insert into demandes_departement (star_id, departement_id, statut) values
       ($1, $4, 'valide'), ($2, $5, 'valide'), ($3, $4, 'en_attente')`,
    [ID.starA, ID.starB, ID.starEnAttente, ID.deptA, ID.deptB],
  );
  await db.query(
    "insert into star_sections (star_id, section_id) values ($1, $3), ($2, $4)",
    [ID.starA, ID.starB, ID.sectionA, ID.sectionB],
  );
}
