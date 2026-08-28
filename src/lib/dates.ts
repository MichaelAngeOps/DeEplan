/** Utilitaires de date, sans dépendance. Format pivot : ISO `YYYY-MM-DD`. */

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Jours de semaine, lundi en tête (comme la maquette). */
export const JOURS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

/** Date du jour en ISO, dans le fuseau local de l'exécution. */
export function aujourdhuiISO(): string {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
