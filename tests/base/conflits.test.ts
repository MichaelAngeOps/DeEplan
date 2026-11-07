import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase, en, ID, preparerDeuxDepartements } from "./outils";

const JOUR = "2099-03-10";
const AUTRE_JOUR = "2099-03-11";

describe("notification de conflit au responsable", () => {
  let db: PGlite;

  const declarer = (date: string, statut: string, star: string = ID.starA) =>
    en(
      db,
      star,
      `insert into disponibilites (star_id, date, statut) values ($1, $2, $3)
       on conflict (star_id, date) do update set statut = excluded.statut`,
      [star, date, statut],
    );

  async function shift(star: string, poste: string, cree_par: string, date: string = JOUR) {
    await db.query(
      `insert into disponibilites (star_id, date, statut) values ($1, $2, 'disponible')
       on conflict (star_id, date) do update set statut = 'disponible'`,
      [star, date],
    );
    await db.query(
      "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, $3, $4)",
      [star, poste, date, cree_par],
    );
  }

  const conflits = async (utilisateur?: string) =>
    (
      await db.query<{ utilisateur_id: string; contenu: string; lien: string }>(
        `select utilisateur_id, contenu, lien from notifications
         where type = 'conflit_dispo' and ($1::uuid is null or utilisateur_id = $1::uuid)`,
        [utilisateur ?? null],
      )
    ).rows;

  beforeAll(async () => {
    db = await creerBase();
    await preparerDeuxDepartements(db);
  });
  afterAll(() => db.close());
  beforeEach(async () => {
    await db.exec("delete from notifications; delete from plannings; delete from disponibilites;");
  });

  it("prévient le responsable, avec le jour, le poste, le star et le lien", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "indisponible");
    const [n, ...reste] = await conflits();
    expect(reste).toEqual([]);
    expect(n.utilisateur_id).toBe(ID.respA);
    expect(n.contenu).toBe("Conflit le 10/03 au poste Poste A : Compte Test n'est plus disponible.");
    expect(n.lien).toBe("/responsable/dashboard");
  });

  it("prévient aussi quand le star n'avait pas encore de ligne ce jour-là", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await db.query("delete from disponibilites where date = $1", [JOUR]);
    await declarer(JOUR, "indisponible");
    expect(await conflits()).toHaveLength(1);
  });

  it("ne prévient pas si le star n'a aucun shift ce jour-là", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(AUTRE_JOUR, "indisponible");
    expect(await conflits()).toEqual([]);
  });

  it("ne prévient pas quand le star se déclare disponible", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "disponible");
    expect(await conflits()).toEqual([]);
  });

  it("ne répète pas la notification si le même statut est réenregistré", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "indisponible");
    await declarer(JOUR, "indisponible");
    expect(await conflits()).toHaveLength(1);
  });

  it("prévient de nouveau après un retour à disponible", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "indisponible");
    await declarer(JOUR, "disponible");
    await declarer(JOUR, "indisponible");
    expect(await conflits()).toHaveLength(2);
  });

  it("ignore un shift déjà passé", async () => {
    await shift(ID.starA, ID.posteA, ID.respA, "2020-01-15");
    await db.query("delete from disponibilites where date = '2020-01-15'");
    await db.query(
      "insert into disponibilites (star_id, date, statut) values ($1, '2020-01-15', 'indisponible')",
      [ID.starA],
    );
    expect(await conflits()).toEqual([]);
  });

  it("ne prévient que le responsable du département concerné", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "indisponible");
    expect(await conflits(ID.respA)).toHaveLength(1);
    expect(await conflits(ID.respB)).toEqual([]);
  });

  it("ne concerne pas les autres stars planifiés le même jour", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await shift(ID.starB, ID.posteB, ID.respB);
    await declarer(JOUR, "indisponible");
    expect(await conflits(ID.respA)).toHaveLength(1);
    expect(await conflits(ID.respB)).toEqual([]);
  });

  it("prévient chaque responsable d'un star présent dans deux départements", async () => {
    await db.query("insert into star_sections (star_id, section_id) values ($1, $2)", [
      ID.starA,
      ID.sectionB,
    ]);
    await shift(ID.starA, ID.posteA, ID.respA);
    await shift(ID.starA, ID.posteB, ID.respB);
    await declarer(JOUR, "indisponible");
    expect(await conflits(ID.respA)).toHaveLength(1);
    expect(await conflits(ID.respB)).toHaveLength(1);
    await db.query("delete from star_sections where star_id = $1 and section_id = $2", [
      ID.starA,
      ID.sectionB,
    ]);
  });

  it("n'est lisible que par le responsable destinataire", async () => {
    await shift(ID.starA, ID.posteA, ID.respA);
    await declarer(JOUR, "indisponible");
    const lire = (u: string) => en(db, u, "select id from notifications where type = 'conflit_dispo'");
    expect(await lire(ID.respA)).toHaveLength(1);
    expect(await lire(ID.starA)).toEqual([]);
    expect(await lire(ID.respB)).toEqual([]);
  });

  it("un star ne peut toujours pas écrire de notification lui-même", async () => {
    await expect(
      en(
        db,
        ID.starA,
        "insert into notifications (utilisateur_id, type, contenu) values ($1, 'conflit_dispo', 'faux')",
        [ID.respA],
      ),
    ).rejects.toThrow(/row-level security/);
  });
});
