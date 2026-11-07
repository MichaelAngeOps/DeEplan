import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase, en, ID, preparerDeuxDepartements } from "./outils";

const JOUR = "2027-03-10";
const AUTRE_JOUR = "2027-03-11";
const POSTE_A2 = "00000000-0000-4000-8000-000000000f2a";
const SECTION_A2 = "00000000-0000-4000-8000-000000000e2a";

describe("filtrage strict des candidats", () => {
  let db: PGlite;

  const assigner = (star: string, poste: string = ID.posteA, date: string = JOUR) =>
    en(
      db,
      ID.respA,
      "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, $3, $4) returning id",
      [star, poste, date, ID.respA],
    );

  const dispo = (star: string, date: string, statut: string) =>
    db.query(
      `insert into disponibilites (star_id, date, statut) values ($1, $2, $3)
       on conflict (star_id, date) do update set statut = excluded.statut`,
      [star, date, statut],
    );

  beforeAll(async () => {
    db = await creerBase();
    await preparerDeuxDepartements(db);
    await db.query("insert into sections (id, departement_id, nom) values ($1, $2, 'Section A2')", [
      SECTION_A2,
      ID.deptA,
    ]);
    await db.query("insert into postes (id, section_id, nom) values ($1, $2, 'Poste A2')", [
      POSTE_A2,
      SECTION_A2,
    ]);
  });
  afterAll(() => db.close());

  beforeEach(async () => {
    await db.exec("delete from plannings; delete from disponibilites;");
  });

  it("accepte un star de la section, validé et disponible", async () => {
    await dispo(ID.starA, JOUR, "disponible");
    expect(await assigner(ID.starA)).toHaveLength(1);
  });

  it("refuse un star qui n'a rien déclaré ce jour-là", async () => {
    await expect(assigner(ID.starA)).rejects.toThrow(/pas disponible/);
  });

  it("refuse un star indisponible", async () => {
    await dispo(ID.starA, JOUR, "indisponible");
    await expect(assigner(ID.starA)).rejects.toThrow(/pas disponible/);
  });

  it("refuse un star disponible un autre jour seulement", async () => {
    await dispo(ID.starA, AUTRE_JOUR, "disponible");
    await expect(assigner(ID.starA)).rejects.toThrow(/pas disponible/);
  });

  it("refuse un star d'une autre section du même département", async () => {
    await dispo(ID.starA, JOUR, "disponible");
    await expect(assigner(ID.starA, POSTE_A2)).rejects.toThrow(/section de ce poste/);
  });

  it("refuse un star dont le compte n'est pas validé", async () => {
    await db.query(
      "insert into star_sections (star_id, section_id) values ($1, $2) on conflict do nothing",
      [ID.starEnAttente, ID.sectionA],
    );
    await dispo(ID.starEnAttente, JOUR, "disponible");
    await expect(assigner(ID.starEnAttente)).rejects.toThrow(/pas valide/);
    await db.query("delete from star_sections where star_id = $1", [ID.starEnAttente]);
  });

  it("ne laisse rien en base après un refus", async () => {
    await expect(assigner(ID.starA)).rejects.toThrow();
    const { rows } = await db.query("select id from plannings");
    expect(rows).toEqual([]);
  });

  it("refuse de déplacer un shift vers un jour où le star n'est pas disponible", async () => {
    await dispo(ID.starA, JOUR, "disponible");
    await assigner(ID.starA);
    await expect(
      en(db, ID.respA, "update plannings set date = $1 where star_id = $2", [AUTRE_JOUR, ID.starA]),
    ).rejects.toThrow(/pas disponible/);
  });

  it("refuse de déplacer un shift vers un poste d'une autre section", async () => {
    await dispo(ID.starA, JOUR, "disponible");
    await assigner(ID.starA);
    await expect(
      en(db, ID.respA, "update plannings set poste_id = $1 where star_id = $2", [POSTE_A2, ID.starA]),
    ).rejects.toThrow(/section de ce poste/);
  });

  it("contrôle aussi le remplacement d'un star sur une case occupée", async () => {
    await dispo(ID.starA, JOUR, "disponible");
    const remplacer = () =>
      en(
        db,
        ID.respA,
        `insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, $3, $4)
         on conflict (poste_id, date) do update set star_id = excluded.star_id`,
        [ID.starB, ID.posteA, JOUR, ID.respA],
      );
    await assigner(ID.starA);
    await expect(remplacer()).rejects.toThrow(/section de ce poste/);
  });

  describe("shift déjà attribué", () => {
    beforeEach(async () => {
      await dispo(ID.starA, JOUR, "disponible");
      await assigner(ID.starA);
      await dispo(ID.starA, JOUR, "indisponible");
    });

    it("reste en place si le star devient indisponible", async () => {
      const { rows } = await db.query("select id from plannings where star_id = $1", [ID.starA]);
      expect(rows).toHaveLength(1);
    });

    it("garde son statut modifiable", async () => {
      expect(
        await en(db, ID.respA, "update plannings set statut = 'a_servi' where star_id = $1 returning id", [
          ID.starA,
        ]),
      ).toHaveLength(1);
    });

    it("accepte une mise à jour qui réécrit le même star, le même poste et la même date", async () => {
      expect(
        await en(
          db,
          ID.respA,
          "update plannings set star_id = star_id, poste_id = poste_id, date = date where star_id = $1 returning id",
          [ID.starA],
        ),
      ).toHaveLength(1);
    });

    it("garde ses horaires modifiables", async () => {
      expect(
        await en(db, ID.respA, "update plannings set heure_debut = '09:00' where star_id = $1 returning id", [
          ID.starA,
        ]),
      ).toHaveLength(1);
    });
  });

  it("ne révèle pas les disponibilités d'un autre département", async () => {
    // Disponible ou non, la réponse est identique : la RLS refuse avant tout contrôle.
    const essai = () =>
      en(
        db,
        ID.respA,
        "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, $3, $4)",
        [ID.starB, ID.posteB, JOUR, ID.respA],
      );
    await expect(essai()).rejects.toThrow(/row-level security/);
    await dispo(ID.starB, JOUR, "disponible");
    await expect(essai()).rejects.toThrow(/row-level security/);
  });
});
