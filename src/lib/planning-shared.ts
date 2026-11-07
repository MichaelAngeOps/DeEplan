/** Types et helpers du planning partagés client / serveur (aucun import serveur). */
import { aujourdhuiISO, dateCourteFr, estDimanche } from "@/lib/dates";
import type { StatutShift } from "@/types/domain";
import type { SectionAvecPostes } from "@/types/domain";

export interface ShiftCase {
  id: string;
  starId: string;
  /** `null` si le star n'est plus lisible (retiré de la section). */
  starNom: string | null;
  statut: StatutShift;
  heureDebut: string | null;
  heureFin: string | null;
  /** Le star s'est déclaré **indisponible** ce jour-là (conflit dispo/planning). */
  conflit: boolean;
}

export interface PlanningMois {
  sections: SectionAvecPostes[];
  /** Clé : `${posteId}_${YYYY-MM-DD}`. */
  cases: Record<string, ShiftCase>;
}

/** Clé d'une case du planning. */
export function cleCase(posteId: string, dateISO: string): string {
  return `${posteId}_${dateISO}`;
}

export interface Candidat {
  id: string;
  nom: string;
  /** A déjà un shift ce jour-là sur un AUTRE poste. */
  dejaPlanifieAilleurs: boolean;
}

/** Nombre de dimanches déjà planifiés à partir duquel une confirmation est demandée. */
export const SEUIL_DIMANCHES = 3;

/** Shifts tombant un dimanche, hors « n'a pas servi » (règle des 4 dimanches). */
export function compterDimanches(shifts: { date: string; statut: string }[]): number {
  return shifts.filter((s) => s.statut !== "na_pas_servi" && estDimanche(s.date)).length;
}

/** Vrai si l'assignation doit d'abord être confirmée. La règle se contourne librement. */
export function confirmationDimancheRequise({
  date,
  dimanchesDeja,
  memeStar,
  forcer,
}: {
  date: string;
  dimanchesDeja: number;
  memeStar: boolean;
  forcer: boolean;
}): boolean {
  return !memeStar && !forcer && estDimanche(date) && dimanchesDeja >= SEUIL_DIMANCHES;
}

/** Parmi les stars d'une section : ceux dont le rôle est validé et qui sont disponibles ce jour-là. */
export function idsCandidats(
  starIds: string[],
  roles: { utilisateur_id: string; statut: string }[],
  dispos: { star_id: string; statut: string }[],
): string[] {
  const valides = new Set(
    roles.filter((r) => r.statut === "valide").map((r) => r.utilisateur_id),
  );
  const disponibles = new Set(
    dispos.filter((d) => d.statut === "disponible").map((d) => d.star_id),
  );
  return starIds.filter((id) => valides.has(id) && disponibles.has(id));
}

/** Statut montré à l'écran. Un shift à venir reste `de_service` en base et s'affiche « Planifié ». */
export type StatutAffiche = StatutShift | "planifie";

export function statutAffiche(
  statut: StatutShift,
  date: string,
  aujourdhui: string = aujourdhuiISO(),
): StatutAffiche {
  return statut === "de_service" && date > aujourdhui ? "planifie" : statut;
}

/** On ne peut pas déclarer servi, ou non, un shift qui n'a pas encore eu lieu. */
export function statutDeclarable(date: string, aujourdhui: string = aujourdhuiISO()): boolean {
  return date <= aujourdhui;
}

/** Shifts dont le star ne fait plus partie de la section du poste, par exemple après un retrait. */
export function shiftsSansSection<T extends { star_id: string; sectionId: string }>(
  shifts: T[],
  liens: { star_id: string; section_id: string }[],
): T[] {
  const membres = new Set(liens.map((l) => `${l.star_id}_${l.section_id}`));
  return shifts.filter((s) => !membres.has(`${s.star_id}_${s.sectionId}`));
}

/** Texte d'un conflit. Le déclencheur `disponibilites_notifier_conflit` écrit le même, un test le vérifie. */
export function messageConflit(date: string, posteNom: string, starNom: string): string {
  return `Conflit le ${dateCourteFr(date)} au poste ${posteNom} : ${starNom} n'est plus disponible.`;
}

/** Dates qui passent à « indisponible » : réenregistrer le même statut ne doit rien renvoyer. */
export function datesDevenuesIndisponibles(
  changements: { date: string; statut: string | null }[],
  existants: { date: string; statut: string }[],
): string[] {
  const deja = new Set(existants.filter((e) => e.statut === "indisponible").map((e) => e.date));
  return changements
    .filter((c) => c.statut === "indisponible" && !deja.has(c.date))
    .map((c) => c.date);
}
