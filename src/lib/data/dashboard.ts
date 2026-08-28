// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { aujourdhuiISO } from "@/lib/dates";
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

export interface ConflitDispo {
  planningId: string;
  starNom: string;
  posteNom: string;
  date: string;
}

/**
 * Shifts à venir dont le star s'est déclaré **indisponible** ce jour-là
 * (prompt §8 — conflit dispo/planning). `plannings` et `disponibilites` n'ont
 * pas de FK commune → jointure applicative sur `(star_id, date)`.
 */
export const getConflitsDispo = cache(
  async (departementId: string): Promise<ConflitDispo[]> => {
    const supabase = await createClient();
    const today = aujourdhuiISO();

    const { data: plannings } = await supabase
      .from("plannings")
      .select(
        "id, date, star_id, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( departement_id ) )",
      )
      .gte("date", today)
      .eq("postes.sections.departement_id", departementId);

    if (!plannings || plannings.length === 0) return [];

    const starIds = [...new Set(plannings.map((p) => p.star_id))];
    const dates = [...new Set(plannings.map((p) => p.date))];

    const { data: indispo } = await supabase
      .from("disponibilites")
      .select("star_id, date")
      .eq("statut", "indisponible")
      .in("star_id", starIds)
      .in("date", dates);

    const conflit = new Set(
      (indispo ?? []).map((d) => `${d.star_id}_${d.date}`),
    );

    return plannings
      .filter((p) => conflit.has(`${p.star_id}_${p.date}`))
      .map((p) => {
        const u = p.utilisateurs as { prenom: string; nom: string } | null;
        const po = p.postes as unknown as { nom: string };
        return {
          planningId: p.id,
          starNom: u ? `${u.prenom} ${u.nom}`.trim() : "Star",
          posteNom: po.nom,
          date: p.date,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
);

export interface ShiftAConfirmer {
  starNom: string;
  posteNom: string;
  date: string;
}

/**
 * Shifts au statut `a_confirmer`. ⚠️ Ce statut est censé être posé automatiquement
 * (24 h sans mise à jour) par une Edge Function — **hors périmètre de cette
 * phase** (prompt §10). En pratique le bloc reste vide pour l'instant.
 */
export const getShiftsAConfirmer = cache(
  async (departementId: string): Promise<ShiftAConfirmer[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("plannings")
      .select(
        "date, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( departement_id ) )",
      )
      .eq("statut", "a_confirmer")
      .eq("postes.sections.departement_id", departementId);

    return (data ?? []).map((r) => {
      const u = r.utilisateurs as { prenom: string; nom: string } | null;
      const po = r.postes as unknown as { nom: string };
      return {
        starNom: u ? `${u.prenom} ${u.nom}`.trim() : "Star",
        posteNom: po.nom,
        date: r.date,
      };
    });
  },
);
