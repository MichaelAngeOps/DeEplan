import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase, en, ID, preparerDeuxDepartements } from "./outils";

const AUJOURDHUI = "2027-03-10";
const HIER = "2027-03-09";
const AVANT_HIER = "2027-03-08";
const DEMAIN = "2027-03-11";

describe("passage automatique à « à confirmer »", () => {
  let db: PGlite;

  async function shift(date: string, statut = "de_service"): Promise<void> {
    await db.query(
      `insert into disponibilites (star_id, date, statut) values ($1, $2, 'disponible')
       on conflict (star_id, date) do update set statut = 'disponible'`,
      [ID.starA, date],
    );
    await db.query(
      "insert into plannings (star_id, poste_id, date, cree_par, statut) values ($1, $2, $3, $4, $5)",
      [ID.starA, ID.posteA, date, ID.respA, statut],
    );
  }

  const statut = async (date: string) =>
    (await db.query<{ statut: string }>("select statut from plannings where date = $1", [date]))
      .rows[0].statut;

  const marquer = async (jour: string) =>
    (
      await db.query<{ nb: number }>("select public.shifts_marquer_a_confirmer($1::date) nb", [jour])
    ).rows[0].nb;

  beforeAll(async () => {
    db = await creerBase();
    await preparerDeuxDepartements(db);
  });
  afterAll(() => db.close());
  beforeEach(async () => {
    await db.exec("delete from plannings; delete from disponibilites;");
  });

  it("marque un shift passé resté sans mise à jour", async () => {
    await shift(HIER);
    await shift(AVANT_HIER);
    expect(await marquer(AUJOURDHUI)).toBe(2);
    expect(await statut(HIER)).toBe("a_confirmer");
    expect(await statut(AVANT_HIER)).toBe("a_confirmer");
  });

  it("ne touche pas au shift du jour ni aux shifts à venir", async () => {
    await shift(AUJOURDHUI);
    await shift(DEMAIN);
    expect(await marquer(AUJOURDHUI)).toBe(0);
    expect(await statut(AUJOURDHUI)).toBe("de_service");
    expect(await statut(DEMAIN)).toBe("de_service");
  });

  it("ne remplace jamais un statut déjà posé par le responsable", async () => {
    await shift(HIER, "a_servi");
    await shift(AVANT_HIER, "na_pas_servi");
    expect(await marquer(AUJOURDHUI)).toBe(0);
    expect(await statut(HIER)).toBe("a_servi");
    expect(await statut(AVANT_HIER)).toBe("na_pas_servi");
  });

  it("peut être relancée sans effet de plus", async () => {
    await shift(HIER);
    expect(await marquer(AUJOURDHUI)).toBe(1);
    expect(await marquer(AUJOURDHUI)).toBe(0);
  });

  it("marque aussi un star devenu indisponible depuis", async () => {
    await shift(HIER);
    await db.query("update disponibilites set statut = 'indisponible' where date = $1", [HIER]);
    expect(await marquer(AUJOURDHUI)).toBe(1);
  });

  it("utilise par défaut la date d'Ottawa", async () => {
    const jours = await db.query<{ aujourdhui: string; hier: string }>(
      `select ((now() at time zone 'America/Toronto')::date)::text aujourdhui,
              ((now() at time zone 'America/Toronto')::date - 1)::text hier`,
    );
    const { aujourdhui, hier } = jours.rows[0];
    await shift(aujourdhui);
    await shift(hier);
    await db.query("select public.shifts_marquer_a_confirmer()");
    expect(await statut(aujourdhui)).toBe("de_service");
    expect(await statut(hier)).toBe("a_confirmer");
  });

  it("n'est appelable ni par un visiteur ni par un utilisateur connecté", async () => {
    await expect(en(db, null, "select public.shifts_marquer_a_confirmer()")).rejects.toThrow(
      /permission denied/,
    );
    await expect(en(db, ID.respA, "select public.shifts_marquer_a_confirmer()")).rejects.toThrow(
      /permission denied/,
    );
  });

  it("laisse le responsable régler un shift à confirmer, et personne d'autre", async () => {
    await shift(HIER, "a_confirmer");
    const regler = (u: string) =>
      en(db, u, "update plannings set statut = 'a_servi' where date = $1 returning id", [HIER]);
    expect(await regler(ID.starA)).toEqual([]);
    expect(await regler(ID.respB)).toEqual([]);
    expect(await regler(ID.respA)).toHaveLength(1);
  });
});
