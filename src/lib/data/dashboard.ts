// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { StatutShift } from "@/types/domain";

export interface ShiftDuJour {
  id: string;
  starNom: string | null;
  posteNom: string;
  sectionNom: string;
  heureDebut: string | null;
  heureFin: string | null;
  statut: StatutShift;
}

/** Shifts d'un jour donné dans le département (dashboard « Stars de service »). */
export const getShiftsDuJour = cache(
  async (departementId: string, dateISO: string): Promise<ShiftDuJour[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("plannings")
      .select(
        "id, statut, heure_debut, heure_fin, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( nom, departement_id ) )",
      )
      .eq("date", dateISO)
      .eq("postes.sections.departement_id", departementId);

    if (error) throw new Error("Chargement des shifts du jour impossible.");

    return (data ?? [])
      .map((r) => {
        const u = r.utilisateurs as { prenom: string; nom: string } | null;
        const p = r.postes as unknown as {
          nom: string;
          sections: { nom: string };
        };
        return {
          id: r.id,
          starNom: u ? `${u.prenom} ${u.nom}`.trim() : null,
          posteNom: p.nom,
          sectionNom: p.sections.nom,
          heureDebut: r.heure_debut,
          heureFin: r.heure_fin,
          statut: r.statut as StatutShift,
        };
      })
      .sort((a, b) =>
        `${a.sectionNom} ${a.posteNom}`.localeCompare(
          `${b.sectionNom} ${b.posteNom}`,
          "fr",
        ),
      );
  },
);
