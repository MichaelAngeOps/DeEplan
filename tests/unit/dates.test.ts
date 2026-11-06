import { describe, expect, it } from "vitest";
import {
  dateCourteFr,
  decalagePremierJour,
  estDimanche,
  iso,
  joursDansMois,
  libelleMois,
  moisDecale,
  ym,
} from "@/lib/dates";

describe("dates", () => {
  it("formate une date ISO avec des zéros", () => {
    expect(iso(2026, 8, 3)).toBe("2026-08-03");
  });

  it("passe d'une année à l'autre", () => {
    expect(ym(2026, 13)).toEqual({ annee: 2027, mois: 1 });
    expect(ym(2026, 0)).toEqual({ annee: 2025, mois: 12 });
    expect(moisDecale(2026, 12, 1)).toBe("2027-01-01");
    expect(moisDecale(2026, 1, -1)).toBe("2025-12-01");
  });

  it("compte les jours du mois, années bissextiles comprises", () => {
    expect(joursDansMois(2026, 2)).toBe(28);
    expect(joursDansMois(2028, 2)).toBe(29);
    expect(joursDansMois(2026, 11)).toBe(30);
    expect(joursDansMois(2026, 12)).toBe(31);
  });

  it("place le premier du mois dans une semaine qui commence lundi", () => {
    expect(decalagePremierJour(2026, 11)).toBe(6); // dimanche 1er novembre 2026
    expect(decalagePremierJour(2026, 6)).toBe(0); // lundi 1er juin 2026
  });

  it("reconnaît les dimanches, base de la règle des 4 dimanches", () => {
    expect(estDimanche("2026-11-01")).toBe(true);
    expect(estDimanche("2026-11-08")).toBe(true);
    expect(estDimanche("2026-11-07")).toBe(false);
    expect(estDimanche("2026-11-09")).toBe(false);
  });

  it("affiche les dates en français", () => {
    expect(libelleMois(2026, 8)).toBe("août 2026");
    expect(dateCourteFr("2026-08-14")).toBe("14/08");
  });
});
