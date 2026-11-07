import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase } from "./outils";

describe("schéma de la base", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await creerBase();
  });
  afterAll(() => db.close());

  it("se recrée depuis le dépôt, avec les 15 tables attendues au minimum", async () => {
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int n from pg_tables where schemaname = 'public'",
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(15);
  });

  it("active la sécurité au niveau des lignes sur toutes les tables", async () => {
    const { rows } = await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and not rowsecurity",
    );
    expect(rows).toEqual([]);
  });

  it("donne un index à toutes les clés étrangères", async () => {
    const { rows } = await db.query<{ nom: string }>(
      `select c.conname nom
       from pg_constraint c
       where c.contype = 'f'
         and c.connamespace = 'public'::regnamespace
         and not exists (
           select 1 from pg_index i
           where i.indrelid = c.conrelid
             and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] @> c.conkey
             and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] <@ c.conkey
         )`,
    );
    expect(rows).toEqual([]);
  });

  it("ne garde pas deux index identiques", async () => {
    const { rows } = await db.query<{ cle: string }>(
      `select i.indrelid::regclass || ' ' || i.indkey::text cle
       from pg_index i
       join pg_class t on t.oid = i.indrelid
       where t.relnamespace = 'public'::regnamespace and i.indpred is null and i.indexprs is null
       group by i.indrelid, i.indkey, i.indclass, i.indoption
       having count(*) > 1`,
    );
    expect(rows).toEqual([]);
  });

  it("fige le search_path de toutes les fonctions SECURITY DEFINER", async () => {
    const { rows } = await db.query<{ proname: string }>(
      `select proname from pg_proc
       where pronamespace = 'public'::regnamespace and prosecdef
         and not coalesce(proconfig, '{}') @> array['search_path=""']`,
    );
    expect(rows).toEqual([]);
  });
});
