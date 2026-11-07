// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { lireTout } from "@/lib/supabase/pagination";
import { createClient } from "@/lib/supabase/server";
import { getStructure } from "@/lib/data/structure";
import { cleCase, type PlanningMois, type ShiftCase } from "@/lib/planning-shared";
import type { StatutShift } from "@/types/domain";

export type { PlanningMois, ShiftCase };
export { cleCase };

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

    // Filtre par département : un compte aux deux rôles lit aussi ses propres shifts de star.
    const shifts = await lireTout((de, a) =>
      supabase
        .from("plannings")
        .select(
          "id, poste_id, date, statut, heure_debut, heure_fin, star_id, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( sections!inner ( departement_id ) )",
        )
        .gte("date", debut)
        .lt("date", fin)
        .eq("postes.sections.departement_id", departementId)
        .order("id")
        .range(de, a),
    ).catch(() => {
      throw new Error("Chargement du planning impossible.");
    });

    const cases: Record<string, ShiftCase> = {};
    for (const r of shifts) {
      const u = r.utilisateurs as { prenom: string; nom: string } | null;
      cases[cleCase(r.poste_id, r.date)] = {
        id: r.id,
        starId: r.star_id,
        starNom: u ? `${u.prenom} ${u.nom}`.trim() : null,
        statut: r.statut as StatutShift,
        heureDebut: r.heure_debut,
        heureFin: r.heure_fin,
        conflit: false,
      };
    }

    // Conflits dispo/planning : star déclaré indisponible un jour où il est
    // planifié (prompt §8). `plannings` × `disponibilites` sans FK commune →
    // jointure applicative sur `(star_id, date)`.
    if (shifts.length > 0) {
      const starIds = [...new Set(shifts.map((r) => r.star_id))];
      const dates = [...new Set(shifts.map((r) => r.date))];
      const indispo = await lireTout((de, a) =>
        supabase
          .from("disponibilites")
          .select("star_id, date")
          .eq("statut", "indisponible")
          .in("star_id", starIds)
          .in("date", dates)
          .order("id")
          .range(de, a),
      ).catch(() => {
        throw new Error("Chargement des conflits impossible.");
      });
      const enConflit = new Set(indispo.map((d) => `${d.star_id}_${d.date}`));
      for (const r of shifts) {
        if (enConflit.has(`${r.star_id}_${r.date}`)) {
          const c = cases[cleCase(r.poste_id, r.date)];
          if (c) c.conflit = true;
        }
      }
    }

    return { sections, cases };
  },
);
