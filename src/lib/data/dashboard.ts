// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { lireTout } from "@/lib/supabase/pagination";
import { createClient } from "@/lib/supabase/server";
import { aujourdhuiISO } from "@/lib/dates";
import { shiftsSansSection } from "@/lib/planning-shared";
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

    const plannings = await lireTout((de, a) =>
      supabase
        .from("plannings")
        .select(
          "id, date, star_id, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( departement_id ) )",
        )
        .gte("date", today)
        .eq("postes.sections.departement_id", departementId)
        .order("id")
        .range(de, a),
    );

    if (plannings.length === 0) return [];

    const starIds = [...new Set(plannings.map((p) => p.star_id))];

    const indispo = await lireTout((de, a) =>
      supabase
        .from("disponibilites")
        .select("star_id, date")
        .eq("statut", "indisponible")
        .in("star_id", starIds)
        .gte("date", today)
        .order("id")
        .range(de, a),
    );

    const conflit = new Set(indispo.map((d) => `${d.star_id}_${d.date}`));

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
  id: string;
  starNom: string;
  posteNom: string;
  date: string;
}

/** Shifts à régler. Le statut `a_confirmer` est posé par une tâche planifiée de la base. */
export const getShiftsAConfirmer = cache(
  async (departementId: string): Promise<ShiftAConfirmer[]> => {
    const supabase = await createClient();
    const lignes = await lireTout((de, a) =>
      supabase
        .from("plannings")
        .select(
          "id, date, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( departement_id ) )",
        )
        .eq("statut", "a_confirmer")
        .eq("postes.sections.departement_id", departementId)
        .order("date", { ascending: true })
        .order("id")
        .range(de, a),
    ).catch(() => {
      throw new Error("Chargement des shifts à confirmer impossible.");
    });

    return lignes.map((r) => {
      const u = r.utilisateurs as { prenom: string; nom: string } | null;
      const po = r.postes as unknown as { nom: string };
      return {
        id: r.id,
        starNom: u ? `${u.prenom} ${u.nom}`.trim() : "Star",
        posteNom: po.nom,
        date: r.date,
      };
    });
  },
);

export interface ShiftAVenir {
  id: string;
  starNom: string;
  posteNom: string;
  date: string;
}

async function lireShiftsAVenir(departementId: string, starId?: string) {
  const supabase = await createClient();
  const lignes = await lireTout((de, a) => {
    const requete = supabase
      .from("plannings")
      .select(
        "id, date, star_id, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, section_id, sections!inner ( departement_id ) )",
      )
      .gte("date", aujourdhuiISO())
      .eq("postes.sections.departement_id", departementId);
    return (starId ? requete.eq("star_id", starId) : requete)
      .order("date", { ascending: true })
      .order("id")
      .range(de, a);
  }).catch(() => {
    throw new Error("Chargement des shifts à venir impossible.");
  });

  return lignes.map((r) => {
    const u = r.utilisateurs as { prenom: string; nom: string } | null;
    const po = r.postes as unknown as { nom: string; section_id: string };
    return {
      id: r.id,
      star_id: r.star_id,
      sectionId: po.section_id,
      starNom: u ? `${u.prenom} ${u.nom}`.trim() : "Star",
      posteNom: po.nom,
      date: r.date,
    };
  });
}

/** Shifts à venir d'un star dans ce département : annoncés avant de le retirer. */
export const getShiftsAVenirDuStar = cache(
  async (departementId: string, starId: string): Promise<ShiftAVenir[]> =>
    lireShiftsAVenir(departementId, starId),
);

/** Shifts à venir d'un star qui n'est plus dans la section : le responsable décide quoi en faire. */
export const getShiftsAReattribuer = cache(
  async (departementId: string): Promise<ShiftAVenir[]> => {
    const shifts = await lireShiftsAVenir(departementId);
    if (shifts.length === 0) return [];

    const supabase = await createClient();
    const starIds = [...new Set(shifts.map((s) => s.star_id))];
    const liens = await lireTout((de, a) =>
      supabase
        .from("star_sections")
        .select("star_id, section_id")
        .in("star_id", starIds)
        .order("star_id")
        .order("section_id")
        .range(de, a),
    ).catch(() => {
      throw new Error("Chargement des sections impossible.");
    });

    return shiftsSansSection(shifts, liens);
  },
);
