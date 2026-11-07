import { describe, expect, it } from "vitest";
import {
  compterDimanches,
  confirmationDimancheRequise,
  datesDevenuesIndisponibles,
  idsCandidats,
  shiftsSansSection,
  statutAffiche,
  statutDeclarable,
} from "@/lib/planning-shared";

// Dimanches de novembre 2026 : 1, 8, 15, 22, 29.
const DIMANCHE = "2026-11-22";
const LUNDI = "2026-11-23";

describe("compterDimanches", () => {
  it("ne compte que les dimanches", () => {
    expect(
      compterDimanches([
        { date: "2026-11-01", statut: "de_service" },
        { date: "2026-11-02", statut: "de_service" },
        { date: "2026-11-08", statut: "a_servi" },
      ]),
    ).toBe(2);
  });

  it("ignore les shifts marqués « n'a pas servi »", () => {
    expect(
      compterDimanches([
        { date: "2026-11-01", statut: "na_pas_servi" },
        { date: "2026-11-08", statut: "a_confirmer" },
      ]),
    ).toBe(1);
  });
});

describe("confirmationDimancheRequise", () => {
  const base = { date: DIMANCHE, dimanchesDeja: 3, memeStar: false, forcer: false };

  it("demande confirmation avant le 4e dimanche", () => {
    expect(confirmationDimancheRequise(base)).toBe(true);
    expect(confirmationDimancheRequise({ ...base, dimanchesDeja: 4 })).toBe(true);
  });

  it("ne demande rien jusqu'au 3e dimanche", () => {
    expect(confirmationDimancheRequise({ ...base, dimanchesDeja: 2 })).toBe(false);
    expect(confirmationDimancheRequise({ ...base, dimanchesDeja: 0 })).toBe(false);
  });

  it("ne s'applique qu'aux dimanches", () => {
    expect(confirmationDimancheRequise({ ...base, date: LUNDI })).toBe(false);
  });

  it("peut être contournée librement", () => {
    expect(confirmationDimancheRequise({ ...base, forcer: true })).toBe(false);
  });

  it("ne s'applique pas à une simple modification du même star", () => {
    expect(confirmationDimancheRequise({ ...base, memeStar: true })).toBe(false);
  });
});

describe("idsCandidats", () => {
  const roles = [
    { utilisateur_id: "a", statut: "valide" },
    { utilisateur_id: "b", statut: "valide" },
    { utilisateur_id: "c", statut: "en_attente" },
    { utilisateur_id: "d", statut: "valide" },
  ];
  const dispos = [
    { star_id: "a", statut: "disponible" },
    { star_id: "b", statut: "indisponible" },
    { star_id: "c", statut: "disponible" },
  ];

  it("garde seulement les stars validés et disponibles", () => {
    expect(idsCandidats(["a", "b", "c", "d"], roles, dispos)).toEqual(["a"]);
  });

  it("exclut un star validé et disponible, mais absent de la section", () => {
    expect(idsCandidats(["b", "c"], roles, dispos)).toEqual([]);
  });
});

describe("statutAffiche", () => {
  const AUJOURDHUI = "2026-11-10";

  it("montre « Planifié » pour un shift à venir", () => {
    expect(statutAffiche("de_service", "2026-11-11", AUJOURDHUI)).toBe("planifie");
  });

  it("montre « De service » le jour même", () => {
    expect(statutAffiche("de_service", AUJOURDHUI, AUJOURDHUI)).toBe("de_service");
  });

  it("garde le statut d'un shift passé en attente de la tâche planifiée", () => {
    expect(statutAffiche("de_service", "2026-11-09", AUJOURDHUI)).toBe("de_service");
  });

  it("ne change aucun autre statut", () => {
    expect(statutAffiche("a_servi", "2026-11-11", AUJOURDHUI)).toBe("a_servi");
    expect(statutAffiche("a_confirmer", "2026-11-09", AUJOURDHUI)).toBe("a_confirmer");
  });
});

describe("statutDeclarable", () => {
  it("refuse un shift à venir, accepte le jour même et le passé", () => {
    expect(statutDeclarable("2026-11-11", "2026-11-10")).toBe(false);
    expect(statutDeclarable("2026-11-10", "2026-11-10")).toBe(true);
    expect(statutDeclarable("2026-11-09", "2026-11-10")).toBe(true);
  });
});

describe("shiftsSansSection", () => {
  const shift = (star_id: string, sectionId: string) => ({ star_id, sectionId, date: "2026-12-01" });
  const liens = [
    { star_id: "a", section_id: "s1" },
    { star_id: "b", section_id: "s2" },
  ];

  it("garde un star retiré de la section et ignore les membres", () => {
    expect(shiftsSansSection([shift("a", "s1"), shift("c", "s1")], liens)).toEqual([shift("c", "s1")]);
  });

  it("signale un star présent dans une autre section seulement", () => {
    expect(shiftsSansSection([shift("b", "s1")], liens)).toEqual([shift("b", "s1")]);
  });
});

describe("datesDevenuesIndisponibles", () => {
  it("garde seulement les vrais passages à « indisponible »", () => {
    expect(
      datesDevenuesIndisponibles(
        [
          { date: "2026-12-01", statut: "indisponible" },
          { date: "2026-12-02", statut: "indisponible" },
          { date: "2026-12-03", statut: "indisponible" },
          { date: "2026-12-04", statut: "disponible" },
          { date: "2026-12-05", statut: null },
        ],
        [
          { date: "2026-12-01", statut: "disponible" },
          { date: "2026-12-02", statut: "indisponible" },
        ],
      ),
    ).toEqual(["2026-12-01", "2026-12-03"]);
  });
});
