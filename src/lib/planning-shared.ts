/** Types et helpers du planning partagés client / serveur (aucun import serveur). */
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
