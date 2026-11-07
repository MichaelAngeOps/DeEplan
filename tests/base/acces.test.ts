import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase, en, ID, preparerDeuxDepartements } from "./outils";

const JOUR = "2027-01-10";

describe("règles d'accès", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await creerBase();
    await preparerDeuxDepartements(db);
    await db.query(
      `insert into disponibilites (star_id, date, statut) values
         ($1, $3, 'disponible'), ($2, $3, 'disponible')`,
      [ID.starA, ID.starB, JOUR],
    );
    await db.query(
      `insert into plannings (star_id, poste_id, date, cree_par) values
         ($1, $3, $5, $6), ($2, $4, $5, $7)`,
      [ID.starA, ID.starB, ID.posteA, ID.posteB, JOUR, ID.respA, ID.respB],
    );
  });
  afterAll(() => db.close());

  describe("visiteur non connecté", () => {
    it.each([
      "utilisateurs",
      "roles_utilisateurs",
      "demandes_departement",
      "departements",
      "sections",
      "postes",
      "star_sections",
      "disponibilites",
      "plannings",
      "annonces",
      "notifications",
      "push_subscriptions",
      "formulaires",
      "formulaire_questions",
      "formulaire_reponses",
    ])("ne lit rien dans %s", async (table) => {
      expect(await en(db, null, `select * from ${table}`)).toEqual([]);
    });
  });

  describe("étanchéité entre départements", () => {
    it("un responsable ne voit que les stars de son département", async () => {
      const lignes = await en<{ id: string }>(db, ID.respA, "select id from utilisateurs");
      const ids = lignes.map((l) => l.id);
      expect(ids).toEqual(expect.arrayContaining([ID.respA, ID.starA, ID.starEnAttente]));
      expect(ids).not.toContain(ID.starB);
      expect(ids).not.toContain(ID.respB);
    });

    it("un responsable ne voit que les plannings de ses postes", async () => {
      const lignes = await en<{ poste_id: string }>(db, ID.respA, "select poste_id from plannings");
      expect(lignes.map((l) => l.poste_id)).toEqual([ID.posteA]);
    });

    it("un responsable ne voit que les disponibilités de ses stars", async () => {
      const lignes = await en<{ star_id: string }>(db, ID.respA, "select star_id from disponibilites");
      expect(lignes.map((l) => l.star_id)).toEqual([ID.starA]);
    });

    it("un responsable ne planifie pas sur le poste d'un autre département", async () => {
      await expect(
        en(
          db,
          ID.respA,
          "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, '2027-01-11', $3)",
          [ID.starB, ID.posteB, ID.respA],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("un responsable ne modifie pas la structure d'un autre département", async () => {
      await expect(
        en(db, ID.respA, "insert into sections (departement_id, nom) values ($1, 'Intrus')", [ID.deptB]),
      ).rejects.toThrow(/row-level security/);
      expect(
        await en(db, ID.respA, "update departements set nom = 'Intrus' where id = $1 returning id", [ID.deptB]),
      ).toEqual([]);
    });

    it("un responsable ne se déclare pas responsable d'un département existant", async () => {
      await expect(
        en(db, ID.respA, "update departements set responsable_id = $1 where id = $2 returning id", [
          ID.respB,
          ID.deptA,
        ]),
      ).rejects.toThrow(/row-level security/);
    });

    it("un responsable ne valide pas la demande d'un autre département", async () => {
      expect(
        await en(
          db,
          ID.respB,
          "update demandes_departement set statut = 'valide' where star_id = $1 returning star_id",
          [ID.starEnAttente],
        ),
      ).toEqual([]);
    });
  });

  describe("droits d'un star", () => {
    it("ne s'attribue pas un shift", async () => {
      await expect(
        en(
          db,
          ID.starA,
          "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, '2027-01-12', $1)",
          [ID.starA, ID.posteA],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("ne voit que ses propres plannings et disponibilités", async () => {
      const plannings = await en<{ star_id: string }>(db, ID.starA, "select star_id from plannings");
      const dispos = await en<{ star_id: string }>(db, ID.starA, "select star_id from disponibilites");
      expect(plannings.map((l) => l.star_id)).toEqual([ID.starA]);
      expect(dispos.map((l) => l.star_id)).toEqual([ID.starA]);
    });

    it("ne modifie pas la disponibilité d'un autre star", async () => {
      expect(
        await en(
          db,
          ID.starA,
          "update disponibilites set statut = 'indisponible' where star_id = $1 returning id",
          [ID.starB],
        ),
      ).toEqual([]);
    });

    it("ne valide pas son propre compte", async () => {
      await expect(
        en(
          db,
          ID.starEnAttente,
          "update roles_utilisateurs set statut = 'valide' where utilisateur_id = $1 returning id",
          [ID.starEnAttente],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("ne valide pas sa propre demande de département", async () => {
      await expect(
        en(
          db,
          ID.starEnAttente,
          "update demandes_departement set statut = 'valide' where star_id = $1 returning star_id",
          [ID.starEnAttente],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("ne se crée pas un rôle déjà validé", async () => {
      await expect(
        en(
          db,
          ID.respA,
          "insert into roles_utilisateurs (utilisateur_id, role, statut) values ($1, 'star', 'valide')",
          [ID.respA],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("ne lit pas les informations d'un autre compte", async () => {
      const lignes = await en<{ id: string }>(db, ID.starA, "select id from utilisateurs");
      expect(lignes.map((l) => l.id)).toEqual([ID.starA]);
    });
  });

  describe("statut du rôle star", () => {
    const statut = async (star: string) =>
      (
        await db.query<{ statut: string }>(
          "select statut from roles_utilisateurs where utilisateur_id = $1 and role = 'star'",
          [star],
        )
      ).rows[0].statut;

    it("suit la décision du responsable", async () => {
      expect(await statut(ID.starA)).toBe("valide");
      expect(await statut(ID.starEnAttente)).toBe("en_attente");

      await en(db, ID.respA, "update demandes_departement set statut = 'refuse' where star_id = $1", [
        ID.starEnAttente,
      ]);
      expect(await statut(ID.starEnAttente)).toBe("desactive");

      await en(db, ID.respA, "update demandes_departement set statut = 'valide' where star_id = $1", [
        ID.starEnAttente,
      ]);
      expect(await statut(ID.starEnAttente)).toBe("valide");

      await en(db, ID.respA, "update demandes_departement set statut = 'en_attente' where star_id = $1", [
        ID.starEnAttente,
      ]);
      expect(await statut(ID.starEnAttente)).toBe("en_attente");
    });
  });

  describe("planning", () => {
    it("n'accepte qu'un star par poste et par jour", async () => {
      await expect(
        en(
          db,
          ID.respA,
          "insert into plannings (star_id, poste_id, date, cree_par) values ($1, $2, $3, $4)",
          [ID.starEnAttente, ID.posteA, JOUR, ID.respA],
        ),
      ).rejects.toThrow(/plannings_poste_id_date_key/);
    });
  });

  describe("notifications", () => {
    beforeAll(async () => {
      await db.query(
        "insert into notifications (utilisateur_id, type, contenu) values ($1, 'test', 'pour A'), ($2, 'test', 'pour B')",
        [ID.starA, ID.starB],
      );
    });

    it("chacun ne lit que les siennes", async () => {
      const lignes = await en<{ contenu: string }>(
        db,
        ID.starA,
        "select contenu from notifications where type = 'test'",
      );
      expect(lignes.map((l) => l.contenu)).toEqual(["pour A"]);
    });

    it("personne ne marque comme lues celles d'un autre", async () => {
      expect(
        await en(db, ID.starA, "update notifications set lu = true where utilisateur_id = $1 returning id", [
          ID.starB,
        ]),
      ).toEqual([]);
    });

    it("un responsable ne notifie que ses stars", async () => {
      await en(db, ID.respA, "insert into notifications (utilisateur_id, type, contenu) values ($1, 'x', 'ok')", [
        ID.starA,
      ]);
      await expect(
        en(db, ID.respA, "insert into notifications (utilisateur_id, type, contenu) values ($1, 'x', 'non')", [
          ID.starB,
        ]),
      ).rejects.toThrow(/row-level security/);
    });

    it("un star ne notifie personne", async () => {
      await expect(
        en(db, ID.starA, "insert into notifications (utilisateur_id, type, contenu) values ($1, 'x', 'non')", [
          ID.starB,
        ]),
      ).rejects.toThrow(/row-level security/);
    });

    it("refuse un lien de notification vers un site externe", async () => {
      await expect(
        en(
          db,
          ID.respA,
          "insert into notifications (utilisateur_id, type, contenu, lien) values ($1, 'x', 'non', $2)",
          [ID.starA, "//site-externe.example"],
        ),
      ).rejects.toThrow(/notifications_lien_chemin_interne/);
    });
  });
});
