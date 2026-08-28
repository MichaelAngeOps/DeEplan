// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getStructure } from "@/lib/data/structure";
import type { SectionAvecPostes, StatutShift } from "@/types/domain";

export interface ShiftCase {
  id: string;
  starId: string;
  /** `null` si le star n'est plus lisible (retiré de la section). */
  starNom: string | null;
  statut: StatutShift;
  heureDebut: string | null;
  heureFin: string | null;
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

/**
 * Planning du département sur l'intervalle `[debut, fin[` : structure
 * (sections + postes, via `getStructure`) + shifts indexés par case.
 * RLS : le responsable ne voit que les plannings de ses postes.
 */
export const getPlanningMois = cache(
  async (
    departementId: string,
    debut: string,
    fin: string,
  ): Promise<PlanningMois> => {
    const supabase = await createClient();

    const sections = await getStructure(departementId);

    const { data, error } = await supabase
      .from("plannings")
      .select(
        "id, poste_id, date, statut, heure_debut, heure_fin, star_id, utilisateurs!plannings_star_id_fkey ( prenom, nom )",
      )
      .gte("date", debut)
      .lt("date", fin);

    if (error) throw new Error("Chargement du planning impossible.");

    const cases: Record<string, ShiftCase> = {};
    for (const r of data ?? []) {
      const u = r.utilisateurs as { prenom: string; nom: string } | null;
      cases[cleCase(r.poste_id, r.date)] = {
        id: r.id,
        starId: r.star_id,
        starNom: u ? `${u.prenom} ${u.nom}`.trim() : null,
        statut: r.statut as StatutShift,
        heureDebut: r.heure_debut,
        heureFin: r.heure_fin,
      };
    }

    return { sections, cases };
  },
);
