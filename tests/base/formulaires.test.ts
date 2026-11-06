import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { creerBase, en, ID, preparerDeuxDepartements } from "./outils";

describe("formulaires", () => {
  let db: PGlite;
  let formulaire: string;
  let q: { texte: string; choix: string; date: string };

  async function creerBrouillon(): Promise<string> {
    const [f] = await en<{ id: string }>(
      db,
      ID.respA,
      "insert into formulaires (departement_id, responsable_id, titre) values ($1, $2, 'Bilan') returning id",
      [ID.deptA, ID.respA],
    );
    return f.id;
  }

  async function ajouterQuestion(
    id: string,
    ordre: number,
    type: string,
    obligatoire: boolean,
    options: string[] | null = null,
  ): Promise<string> {
    const [question] = await en<{ id: string }>(
      db,
      ID.respA,
      `insert into formulaire_questions (formulaire_id, ordre, libelle, type, obligatoire, options)
       values ($1, $2, 'Question', $3, $4, $5) returning id`,
      [id, ordre, type, obligatoire, options ? JSON.stringify(options) : null],
    );
    return question.id;
  }

  const changerStatut = (id: string, statut: string) =>
    en(db, ID.respA, "update formulaires set statut = $1 where id = $2 returning id", [statut, id]);

  const repondre = (id: string, star: string, reponses: Record<string, unknown>) =>
    en(
      db,
      star,
      "insert into formulaire_reponses (formulaire_id, star_id, reponses) values ($1, $2, $3) returning id",
      [id, star, JSON.stringify(reponses)],
    );

  beforeAll(async () => {
    db = await creerBase();
    await preparerDeuxDepartements(db);
  });
  afterAll(() => db.close());

  beforeEach(async () => {
    await db.exec("delete from formulaires");
    formulaire = await creerBrouillon();
    q = {
      texte: await ajouterQuestion(formulaire, 0, "texte_court", true),
      choix: await ajouterQuestion(formulaire, 1, "choix_unique", false, ["Oui", "Non"]),
      date: await ajouterQuestion(formulaire, 2, "date", false),
    };
  });

  describe("visibilité", () => {
    const voit = async (utilisateur: string) =>
      (await en(db, utilisateur, "select id from formulaires where id = $1", [formulaire])).length === 1;

    it("un brouillon n'est visible que par son responsable", async () => {
      expect(await voit(ID.respA)).toBe(true);
      expect(await voit(ID.starA)).toBe(false);
      expect(await voit(ID.respB)).toBe(false);
    });

    it("un formulaire publié est visible par les stars du département seulement", async () => {
      await changerStatut(formulaire, "publie");
      expect(await voit(ID.starA)).toBe(true);
      expect(await voit(ID.starB)).toBe(false);
      expect(await voit(ID.respB)).toBe(false);
    });

    it("un responsable lit les réponses de son département, pas celles d'un autre", async () => {
      await changerStatut(formulaire, "publie");
      await repondre(formulaire, ID.starA, { [q.texte]: "Réponse" });
      const lire = (u: string) => en(db, u, "select id from formulaire_reponses");
      expect(await lire(ID.respA)).toHaveLength(1);
      expect(await lire(ID.respB)).toHaveLength(0);
    });

    it("un star ne lit pas la réponse d'un autre star", async () => {
      await db.query(
        "insert into star_sections (star_id, section_id) values ($1, $2) on conflict do nothing",
        [ID.starEnAttente, ID.sectionA],
      );
      await changerStatut(formulaire, "publie");
      await repondre(formulaire, ID.starA, { [q.texte]: "Réponse" });
      expect(await en(db, ID.starEnAttente, "select id from formulaire_reponses")).toEqual([]);
    });
  });

  describe("cycle de vie", () => {
    it("ne se publie pas sans question", async () => {
      const vide = await creerBrouillon();
      await expect(changerStatut(vide, "publie")).rejects.toThrow(/au moins une question/);
    });

    it("ne se crée pas directement publié", async () => {
      await expect(
        en(
          db,
          ID.respA,
          "insert into formulaires (departement_id, responsable_id, titre, statut) values ($1, $2, 'X', 'publie')",
          [ID.deptA, ID.respA],
        ),
      ).rejects.toThrow(/cree en brouillon/);
    });

    it("ne revient pas en arrière", async () => {
      await changerStatut(formulaire, "publie");
      await expect(changerStatut(formulaire, "brouillon")).rejects.toThrow(/non autorise/);
      await changerStatut(formulaire, "ferme");
      await expect(changerStatut(formulaire, "publie")).rejects.toThrow(/non autorise/);
    });

    it("pose les dates de publication et de fermeture", async () => {
      const dates = () =>
        en<{ date_publication: Date | null; date_fermeture: Date | null }>(
          db,
          ID.respA,
          "select date_publication, date_fermeture from formulaires where id = $1",
          [formulaire],
        );
      await changerStatut(formulaire, "publie");
      expect((await dates())[0].date_publication).not.toBeNull();
      await changerStatut(formulaire, "ferme");
      expect((await dates())[0].date_fermeture).not.toBeNull();
    });

    it("fige le titre et les questions après publication", async () => {
      await changerStatut(formulaire, "publie");
      await expect(
        en(db, ID.respA, "update formulaires set titre = 'Autre' where id = $1", [formulaire]),
      ).rejects.toThrow(/plus modifiable/);
      expect(
        await en(db, ID.respA, "update formulaire_questions set libelle = 'Autre' where id = $1 returning id", [
          q.texte,
        ]),
      ).toEqual([]);
      await expect(ajouterQuestion(formulaire, 9, "texte_court", false)).rejects.toThrow(/row-level security/);
    });

    it("un star ni un autre responsable ne modifient le formulaire", async () => {
      expect(
        await en(db, ID.respB, "update formulaires set titre = 'Intrus' where id = $1 returning id", [formulaire]),
      ).toEqual([]);
      await expect(
        en(
          db,
          ID.starA,
          "insert into formulaires (departement_id, responsable_id, titre) values ($1, $2, 'Intrus')",
          [ID.deptA, ID.starA],
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("réponses", () => {
    beforeEach(async () => {
      await changerStatut(formulaire, "publie");
    });

    it("accepte une réponse valide et retire les réponses vides", async () => {
      await repondre(formulaire, ID.starA, { [q.texte]: "Réponse", [q.choix]: "Oui", [q.date]: "" });
      const [ligne] = await en<{ reponses: Record<string, unknown> }>(
        db,
        ID.starA,
        "select reponses from formulaire_reponses where star_id = $1",
        [ID.starA],
      );
      expect(ligne.reponses).toEqual({ [q.texte]: "Réponse", [q.choix]: "Oui" });
    });

    it("refuse une question obligatoire vide", async () => {
      await expect(repondre(formulaire, ID.starA, { [q.choix]: "Oui" })).rejects.toThrow(/obligatoire/);
      await expect(repondre(formulaire, ID.starA, { [q.texte]: "   " })).rejects.toThrow(/obligatoire/);
    });

    it("refuse une option hors liste, une date invalide et une question inconnue", async () => {
      await expect(
        repondre(formulaire, ID.starA, { [q.texte]: "R", [q.choix]: "Peut-être" }),
      ).rejects.toThrow(/invalide/);
      await expect(
        repondre(formulaire, ID.starA, { [q.texte]: "R", [q.date]: "2027-02-31" }),
      ).rejects.toThrow(/invalide/);
      await expect(
        repondre(formulaire, ID.starA, { [q.texte]: "R", "00000000-0000-4000-8000-000000000000": "X" }),
      ).rejects.toThrow(/inconnue/);
    });

    it("refuse un star d'un autre département, ou répondant pour un autre", async () => {
      await expect(repondre(formulaire, ID.starB, { [q.texte]: "R" })).rejects.toThrow(/row-level security/);
      await expect(
        en(
          db,
          ID.starA,
          "insert into formulaire_reponses (formulaire_id, star_id, reponses) values ($1, $2, $3)",
          [formulaire, ID.starB, JSON.stringify({ [q.texte]: "R" })],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("n'autorise qu'une réponse par star, modifiable tant que le formulaire est ouvert", async () => {
      await repondre(formulaire, ID.starA, { [q.texte]: "Première" });
      await expect(repondre(formulaire, ID.starA, { [q.texte]: "Seconde" })).rejects.toThrow(
        /formulaire_id_star_id_key/,
      );
      const modifier = () =>
        en(
          db,
          ID.starA,
          "update formulaire_reponses set reponses = $1 where star_id = $2 returning id",
          [JSON.stringify({ [q.texte]: "Modifiée" }), ID.starA],
        );
      expect(await modifier()).toHaveLength(1);
      await changerStatut(formulaire, "ferme");
      await expect(modifier()).resolves.toEqual([]);
    });

    it("refuse une réponse après fermeture, le star gardant la lecture de la sienne", async () => {
      await repondre(formulaire, ID.starA, { [q.texte]: "R" });
      await changerStatut(formulaire, "ferme");
      await db.query(
        "insert into star_sections (star_id, section_id) values ($1, $2) on conflict do nothing",
        [ID.starEnAttente, ID.sectionA],
      );
      await expect(repondre(formulaire, ID.starEnAttente, { [q.texte]: "R" })).rejects.toThrow(
        /row-level security/,
      );
      expect(await en(db, ID.starA, "select id from formulaire_reponses")).toHaveLength(1);
    });

    it("le responsable lit les réponses sans pouvoir les modifier ni les supprimer", async () => {
      await repondre(formulaire, ID.starA, { [q.texte]: "R" });
      expect(
        await en(db, ID.respA, "update formulaire_reponses set reponses = '{}' returning id"),
      ).toEqual([]);
      expect(await en(db, ID.respA, "delete from formulaire_reponses returning id")).toEqual([]);
    });
  });

  describe("suppression", () => {
    const supprimer = (u: string) =>
      en(db, u, "delete from formulaires where id = $1 returning id", [formulaire]);

    it("un formulaire publié ne se supprime pas", async () => {
      await changerStatut(formulaire, "publie");
      expect(await supprimer(ID.respA)).toEqual([]);
    });

    it("un autre responsable ne supprime pas un formulaire fermé", async () => {
      await changerStatut(formulaire, "publie");
      await changerStatut(formulaire, "ferme");
      expect(await supprimer(ID.respB)).toEqual([]);
    });

    it("un formulaire fermé part avec ses réponses et ses notifications", async () => {
      await changerStatut(formulaire, "publie");
      await repondre(formulaire, ID.starA, { [q.texte]: "R" });
      await db.query(
        "insert into notifications (utilisateur_id, type, contenu, lien) values ($1, 'formulaire', 'Nouveau', $2)",
        [ID.starA, `/star/formulaires/${formulaire}`],
      );
      await changerStatut(formulaire, "ferme");

      expect(await supprimer(ID.respA)).toHaveLength(1);

      const compter = async (sql: string, p: unknown[]) =>
        (await db.query<{ n: number }>(sql, p)).rows[0].n;
      expect(
        await compter("select count(*)::int n from formulaire_reponses where formulaire_id = $1", [formulaire]),
      ).toBe(0);
      expect(
        await compter("select count(*)::int n from notifications where lien = $1", [
          `/star/formulaires/${formulaire}`,
        ]),
      ).toBe(0);
    });
  });
});
