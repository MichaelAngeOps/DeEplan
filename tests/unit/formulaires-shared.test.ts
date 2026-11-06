import { describe, expect, it } from "vitest";
import {
  dateFormulaire,
  dateReponseLisible,
  QUESTIONS_MAX,
  reponsesNettoyees,
  titreConfirmeCorrespond,
  validerFormulaire,
  validerReponses,
  type FormulaireSaisie,
  type QuestionAValider,
  type QuestionSaisie,
} from "@/lib/formulaires-shared";

function question(partiel: Partial<QuestionSaisie> = {}): QuestionSaisie {
  return { cle: "q1", libelle: "Question", type: "texte_court", options: [], obligatoire: false, ...partiel };
}

function saisie(partiel: Partial<FormulaireSaisie> = {}): FormulaireSaisie {
  return { titre: "Bilan", description: "", questions: [question()], ...partiel };
}

describe("titreConfirmeCorrespond", () => {
  it("accepte le titre, quels que soient majuscules, accents, espaces et apostrophes", () => {
    expect(titreConfirmeCorrespond("bilan du culte", "bilan du culte")).toBe(true);
    expect(titreConfirmeCorrespond("  BILAN  du Culte ", "bilan du culte")).toBe(true);
    expect(titreConfirmeCorrespond("ete", "Été")).toBe(true);
    expect(titreConfirmeCorrespond("l'equipe", "L’équipe")).toBe(true);
  });

  it("refuse un autre titre ou une saisie vide", () => {
    expect(titreConfirmeCorrespond("bilan", "bilan du culte")).toBe(false);
    expect(titreConfirmeCorrespond("", "bilan")).toBe(false);
    expect(titreConfirmeCorrespond("", "   ")).toBe(false);
  });
});

describe("validerFormulaire", () => {
  it("accepte un formulaire correct", () => {
    expect(validerFormulaire(saisie(), { publication: true })).toBeNull();
  });

  it("exige un titre", () => {
    expect(validerFormulaire(saisie({ titre: "   " }), { publication: false })?.titre).toBeDefined();
  });

  it("autorise un brouillon sans question, mais pas sa publication", () => {
    const vide = saisie({ questions: [] });
    expect(validerFormulaire(vide, { publication: false })).toBeNull();
    expect(validerFormulaire(vide, { publication: true })?.general).toBeDefined();
  });

  it("limite le nombre de questions", () => {
    const trop = Array.from({ length: QUESTIONS_MAX + 1 }, (_, i) => question({ cle: `q${i}` }));
    expect(validerFormulaire(saisie({ questions: trop }), { publication: false })?.general).toBeDefined();
  });

  it("signale le libellé manquant sur la bonne question", () => {
    const res = validerFormulaire(saisie({ questions: [question({ cle: "a", libelle: " " })] }), {
      publication: false,
    });
    expect(res?.questions.a).toBeDefined();
  });

  it("exige deux options distinctes pour une question à choix", () => {
    const avecOptions = (options: string[]) =>
      validerFormulaire(saisie({ questions: [question({ type: "choix_unique", options })] }), {
        publication: false,
      })?.questions.q1;
    expect(avecOptions(["Oui", "  "])).toMatch(/au moins/);
    expect(avecOptions(["Été", "ete"])).toMatch(/identiques/);
    expect(avecOptions(["Oui", "Non"])).toBeUndefined();
  });
});

describe("validerReponses", () => {
  const q = (partiel: Partial<QuestionAValider>): QuestionAValider => ({
    id: "q",
    type: "texte_court",
    options: [],
    obligatoire: false,
    ...partiel,
  });

  it("exige les questions obligatoires, y compris face à des espaces", () => {
    const obligatoire = [q({ obligatoire: true })];
    expect(validerReponses(obligatoire, {}).q).toBeDefined();
    expect(validerReponses(obligatoire, { q: "   " }).q).toBeDefined();
    expect(validerReponses(obligatoire, { q: "Réponse" })).toEqual({});
  });

  it("accepte « Non » comme réponse à une question oui/non obligatoire", () => {
    expect(validerReponses([q({ type: "oui_non", obligatoire: true })], { q: false })).toEqual({});
  });

  it("limite la longueur des textes", () => {
    expect(validerReponses([q({})], { q: "x".repeat(501) }).q).toBeDefined();
    expect(validerReponses([q({ type: "texte_long" })], { q: "x".repeat(5000) })).toEqual({});
    expect(validerReponses([q({ type: "texte_long" })], { q: "x".repeat(5001) }).q).toBeDefined();
  });

  it("refuse une option hors liste ou répétée", () => {
    const options = ["A", "B"];
    expect(validerReponses([q({ type: "choix_unique", options })], { q: "C" }).q).toBeDefined();
    expect(validerReponses([q({ type: "choix_unique", options })], { q: "A" })).toEqual({});
    expect(validerReponses([q({ type: "choix_multiple", options })], { q: ["A", "A"] }).q).toBeDefined();
    expect(validerReponses([q({ type: "choix_multiple", options })], { q: ["A", "B"] })).toEqual({});
  });

  it("refuse une date impossible", () => {
    const date = [q({ type: "date" })];
    expect(validerReponses(date, { q: "2027-02-31" }).q).toBeDefined();
    expect(validerReponses(date, { q: "demain" }).q).toBeDefined();
    expect(validerReponses(date, { q: "2028-02-29" })).toEqual({});
  });
});

describe("reponsesNettoyees", () => {
  it("retire les réponses vides et les espaces, en gardant « Non »", () => {
    expect(reponsesNettoyees({ a: "  texte ", b: "  ", c: [], d: false, e: ["A"] })).toEqual({
      a: "texte",
      d: false,
      e: ["A"],
    });
  });
});

describe("dates des formulaires", () => {
  it("affiche la date saisie sans décalage de fuseau", () => {
    expect(dateReponseLisible("2027-01-01")).toContain("2027");
    expect(dateReponseLisible("2027-01-01")).toContain("1");
    expect(dateReponseLisible("2027-01-01")).toContain("janvier");
  });

  it("utilise l'heure d'Ottawa-Gatineau", () => {
    // 2 h UTC le 1er janvier correspond encore au 31 décembre à Ottawa.
    expect(dateFormulaire("2027-01-01T02:00:00Z")).toContain("décembre");
  });
});
