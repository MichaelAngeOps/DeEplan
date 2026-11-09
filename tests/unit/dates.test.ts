import { describe, expect, it } from "vitest";
import {
  aujourdhuiISO,
  colonneEstJourCle,
  dateCourteFr,
  estJourCle,
  initialeJour,
  INITIALES_JOURS,
  decalagePremierJour,
  estDimanche,
  formatInstant,
  formatJour,
  iso,
  joursDansMois,
  libelleMois,
  moisCourant,
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

describe("fuseau d'Ottawa-Gatineau", () => {
  const jour = (instant: string) => aujourdhuiISO(new Date(instant));

  it("ne passe pas au lendemain en soirée, quand UTC a déjà changé de jour", () => {
    expect(jour("2026-11-07T04:42:00Z")).toBe("2026-11-06");
    expect(jour("2026-11-07T00:30:00Z")).toBe("2026-11-06");
  });

  it("change de jour à minuit, heure d'hiver", () => {
    expect(jour("2026-11-07T04:59:00Z")).toBe("2026-11-06");
    expect(jour("2026-11-07T05:00:00Z")).toBe("2026-11-07");
  });

  it("change de jour à minuit, heure d'été", () => {
    expect(jour("2026-07-15T03:59:00Z")).toBe("2026-07-14");
    expect(jour("2026-07-15T04:00:00Z")).toBe("2026-07-15");
  });

  it("reste juste les jours de changement d'heure", () => {
    expect(jour("2026-03-08T04:59:00Z")).toBe("2026-03-07");
    expect(jour("2026-03-08T05:00:00Z")).toBe("2026-03-08");
    expect(jour("2026-03-09T03:59:00Z")).toBe("2026-03-08");
    expect(jour("2026-11-01T03:59:00Z")).toBe("2026-10-31");
    expect(jour("2026-11-01T04:00:00Z")).toBe("2026-11-01");
    expect(jour("2026-11-02T04:59:00Z")).toBe("2026-11-01");
    expect(jour("2026-11-02T05:00:00Z")).toBe("2026-11-02");
  });

  it("donne le bon mois au changement de mois et d'année", () => {
    expect(moisCourant(new Date("2026-12-01T04:30:00Z"))).toEqual({ annee: 2026, mois: 11 });
    expect(moisCourant(new Date("2027-01-01T04:59:00Z"))).toEqual({ annee: 2026, mois: 12 });
    expect(moisCourant(new Date("2027-01-01T05:00:00Z"))).toEqual({ annee: 2027, mois: 1 });
  });

  it("affiche un jour du calendrier sans le décaler", () => {
    const option = { weekday: "long", day: "numeric", month: "long" } as const;
    expect(formatJour("2026-11-20", option)).toBe("vendredi 20 novembre");
    expect(formatJour("2026-11-01", option)).toBe("dimanche 1 novembre");
  });

  it("affiche un instant à l'heure d'Ottawa", () => {
    const option = { day: "2-digit", month: "2-digit", year: "numeric" } as const;
    expect(formatInstant("2026-11-07T04:42:00Z", option)).toBe("06/11/2026");
    expect(formatInstant(new Date("2026-11-07T05:00:00Z"), option)).toBe("07/11/2026");
  });
});

describe("jours de shifts consacrés", () => {
  it("met en évidence mercredi, vendredi, samedi et dimanche, et eux seuls", () => {
    // Semaine du lundi 2 au dimanche 8 novembre 2026.
    const semaine = ["02", "03", "04", "05", "06", "07", "08"].map((j) => estJourCle(`2026-11-${j}`));
    expect(semaine).toEqual([false, false, true, false, true, true, true]);
  });

  it("donne la même réponse par colonne de calendrier, lundi en tête", () => {
    expect(Array.from({ length: 7 }, (_, i) => colonneEstJourCle(i))).toEqual([
      false, false, true, false, true, true, true,
    ]);
  });

  it("écrit les initiales des jours, lundi en tête", () => {
    expect(INITIALES_JOURS.join("")).toBe("LMMJVSD");
    expect(initialeJour(0)).toBe("D");
    expect(initialeJour(1)).toBe("L");
    expect(initialeJour(3)).toBe("M");
    expect(initialeJour(6)).toBe("S");
  });
});
