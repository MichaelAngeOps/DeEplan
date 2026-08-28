// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { StatutShift } from "@/types/domain";

export interface ShiftStar {
  id: string;
  date: string;
  sectionNom: string;
  posteNom: string;
  heureDebut: string | null;
  heureFin: string | null;
  description: string | null;
  statut: StatutShift;
}

/** `{ 'YYYY-MM-DD': ShiftStar[] }` — les shifts du star sur `[debut, fin[`
 *  (un star peut avoir plusieurs shifts le même jour, sur des postes différents). */
export type ShiftsStarMap = Record<string, ShiftStar[]>;

export const getShiftsStar = cache(
  async (
    starId: string,
    debut: string,
    fin: string,
  ): Promise<ShiftsStarMap> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("plannings")
      .select(
        "id, date, statut, heure_debut, heure_fin, description, postes!inner ( nom, sections!inner ( nom ) )",
      )
      .eq("star_id", starId)
      .gte("date", debut)
      .lt("date", fin);

    if (error) throw new Error("Chargement de votre calendrier impossible.");

    const map: ShiftsStarMap = {};
    for (const r of data ?? []) {
      const p = r.postes as unknown as { nom: string; sections: { nom: string } };
      (map[r.date] ??= []).push({
        id: r.id,
        date: r.date,
        sectionNom: p.sections.nom,
        posteNom: p.nom,
        heureDebut: r.heure_debut,
        heureFin: r.heure_fin,
        description: r.description,
        statut: r.statut as StatutShift,
      });
    }
    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => a.posteNom.localeCompare(b.posteNom, "fr"));
    }
    return map;
  },
);
