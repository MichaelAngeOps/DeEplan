/** Utilitaires de date, sans dépendance. Format pivot : ISO `YYYY-MM-DD`. */

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Fuseau de référence de l'application. */
export const FUSEAU = "America/Toronto";

/** Jours de semaine, lundi en tête (comme la maquette). */
export const JOURS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Initiales des jours, lundi en tête, au-dessus des cases des calendriers. */
export const INITIALES_JOURS = ["L", "M", "M", "J", "V", "S", "D"];

/** Initiale d'un jour de semaine de `jourSemaine` (0 = dimanche). */
export function initialeJour(jour: number): string {
  return INITIALES_JOURS[(jour + 6) % 7];
}

/**
 * Jours de shifts consacrés, mis en évidence dans les calendriers : mercredi, vendredi, samedi et
 * dimanche (numérotation de `jourSemaine`). Communs à tous les départements (décision du 2026-11-08).
 */
export const JOURS_CLES: readonly number[] = [3, 5, 6, 0];

/** Vrai si la date ISO tombe un jour de shifts consacré. */
export function estJourCle(dateISO: string): boolean {
  return JOURS_CLES.includes(jourSemaine(dateISO));
}

/** Vrai si la colonne `index` (0 = lundi) d'un calendrier est un jour de shifts consacré. */
export function colonneEstJourCle(index: number): boolean {
  return JOURS_CLES.includes((index + 1) % 7);
}

/** `2026-08` → `{ annee: 2026, mois: 8 }` (mois 1–12). */
export function ym(annee: number, mois: number): { annee: number; mois: number } {
  const idx = (mois - 1 + 12) % 12;
  const rollAnnee = annee + Math.floor((mois - 1) / 12);
  return { annee: rollAnnee, mois: idx + 1 };
}

/** `iso(2026, 8, 3)` → `"2026-08-03"`. */
export function iso(annee: number, mois: number, jour: number): string {
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

/** Premier jour du mois, en ISO. */
export function premierDuMois(annee: number, mois: number): string {
  return iso(annee, mois, 1);
}

/** Ajoute `n` mois à `(annee, mois)` et renvoie le 1er de ce mois en ISO. */
export function moisDecale(annee: number, mois: number, n: number): string {
  const t = ym(annee, mois + n);
  return premierDuMois(t.annee, t.mois);
}

/** Nombre de jours dans le mois (mois 1–12). */
export function joursDansMois(annee: number, mois: number): number {
  return new Date(annee, mois, 0).getDate();
}

/** Index du 1er du mois dans une semaine lundi=0 … dimanche=6. */
export function decalagePremierJour(annee: number, mois: number): number {
  return (new Date(annee, mois - 1, 1).getDay() + 6) % 7;
}

/** `"août 2026"`. */
export function libelleMois(annee: number, mois: number): string {
  return `${MOIS_FR[mois - 1]} ${annee}`;
}

/** Date du jour à Ottawa-Gatineau, identique sur le serveur et sur tout appareil. */
export function aujourdhuiISO(maintenant: Date = new Date()): string {
  const parties = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(maintenant);
  const valeur = (type: Intl.DateTimeFormatPartTypes) =>
    parties.find((p) => p.type === type)?.value ?? "";
  return `${valeur("year")}-${valeur("month")}-${valeur("day")}`;
}

/** Mois en cours à Ottawa-Gatineau. */
export function moisCourant(maintenant: Date = new Date()): { annee: number; mois: number } {
  const [annee, mois] = aujourdhuiISO(maintenant).split("-").map(Number);
  return { annee, mois };
}

/**
 * Affiche un jour du calendrier (`AAAA-MM-JJ`). Ce jour ne change pas selon le fuseau :
 * `new Date("2026-11-20")` vaut minuit UTC, soit la veille au soir à Ottawa.
 */
export function formatJour(dateISO: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateISO}T12:00:00Z`).toLocaleDateString("fr-FR", {
    ...options,
    timeZone: "UTC",
  });
}

/** Affiche un instant précis (date de création, d'envoi…) à l'heure d'Ottawa-Gatineau. */
export function formatInstant(
  instant: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(instant).toLocaleString("fr-FR", { ...options, timeZone: FUSEAU });
}

/** `"2026-08-14"` → `"14/08"`. */
export function dateCourteFr(dateISO: string): string {
  const [, m, j] = dateISO.split("-");
  return `${j}/${m}`;
}

/** Jour de semaine d'une date ISO : 0 = dimanche … 6 = samedi (calcul local, sans fuseau). */
export function jourSemaine(dateISO: string): number {
  const [a, m, j] = dateISO.split("-").map(Number);
  return new Date(a, m - 1, j).getDay();
}

/** Vrai si la date ISO tombe un dimanche. */
export function estDimanche(dateISO: string): boolean {
  return jourSemaine(dateISO) === 0;
}
