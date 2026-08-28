// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { aujourdhuiISO, estDimanche, iso, moisDecale } from "@/lib/dates";
import type { StatutShift } from "@/types/domain";

export interface StarAnnuaire {
  id: string;
  nom: string;
  email: string;
  /** Statut du star **dans ce département** : `valide` (actif) ou `refuse` (désactivé). */
  statut: "valide" | "refuse";
  sections: string[];
  dimanchesMois: number;
}

function bornesMoisCourant(): { debut: string; fin: string } {
  const now = new Date();
  return {
    debut: iso(now.getFullYear(), now.getMonth() + 1, 1),
    fin: moisDecale(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/** Stars du département : demandes `valide` (actifs) + `refuse` (désactivés). */
export const getAnnuaire = cache(
  async (departementId: string): Promise<StarAnnuaire[]> => {
    const supabase = await createClient();

    const { data: demandes } = await supabase
      .from("demandes_departement")
      .select("star_id, statut")
      .eq("departement_id", departementId)
      .in("statut", ["valide", "refuse"]);
    const statutParId = new Map(
      (demandes ?? []).map((d) => [d.star_id, d.statut as "valide" | "refuse"]),
    );
    const starIds = [...statutParId.keys()];
    if (starIds.length === 0) return [];

    const { data: secs } = await supabase
      .from("sections")
      .select("id, nom")
      .eq("departement_id", departementId);
    const nomSection = new Map((secs ?? []).map((s) => [s.id, s.nom]));
    const secIds = [...nomSection.keys()];

    const { debut, fin } = bornesMoisCourant();
    const [users, liensRes, plannings] = await Promise.all([
      supabase.from("utilisateurs").select("id, prenom, nom, email").in("id", starIds),
      secIds.length
        ? supabase
            .from("star_sections")
            .select("star_id, section_id")
            .in("section_id", secIds)
            .in("star_id", starIds)
        : Promise.resolve({ data: [] as { star_id: string; section_id: string }[] }),
      supabase
        .from("plannings")
        .select("star_id, date, statut")
        .in("star_id", starIds)
        .neq("statut", "na_pas_servi")
        .gte("date", debut)
        .lt("date", fin),
    ]);
    const liens = liensRes.data ?? [];

    const sectionsParStar = new Map<string, string[]>();
    for (const l of liens) {
      const nom = nomSection.get(l.section_id);
      if (!nom) continue;
      const arr = sectionsParStar.get(l.star_id) ?? [];
      arr.push(nom);
      sectionsParStar.set(l.star_id, arr);
    }
    const dimanchesParStar = new Map<string, number>();
    for (const p of plannings.data ?? []) {
      if (!estDimanche(p.date)) continue;
      dimanchesParStar.set(p.star_id, (dimanchesParStar.get(p.star_id) ?? 0) + 1);
    }

    return (users.data ?? [])
      .map((u) => ({
        id: u.id,
        nom: `${u.prenom} ${u.nom}`.trim(),
        email: u.email,
        statut: statutParId.get(u.id) ?? "valide",
        sections: (sectionsParStar.get(u.id) ?? []).sort((a, b) =>
          a.localeCompare(b, "fr"),
        ),
        dimanchesMois: dimanchesParStar.get(u.id) ?? 0,
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")) as StarAnnuaire[];
  },
);

export interface FicheStar extends StarAnnuaire {
  disponibilites: { date: string; statut: "disponible" | "indisponible" }[];
  derniersShifts: {
    date: string;
    posteNom: string;
    statut: StatutShift;
  }[];
}

/** Détail d'un star — vérifie qu'il appartient bien au département. */
export const getFicheStar = cache(
  async (departementId: string, starId: string): Promise<FicheStar | null> => {
    const annuaire = await getAnnuaire(departementId);
    const base = annuaire.find((s) => s.id === starId);
    if (!base) return null;

    const supabase = await createClient();
    const today = aujourdhuiISO();

    const [dispos, shifts] = await Promise.all([
      supabase
        .from("disponibilites")
        .select("date, statut")
        .eq("star_id", starId)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(12),
      supabase
        .from("plannings")
        .select("date, statut, postes!inner ( nom, sections!inner ( departement_id ) )")
        .eq("star_id", starId)
        .eq("postes.sections.departement_id", departementId)
        .order("date", { ascending: false })
        .limit(8),
    ]);

    return {
      ...base,
      disponibilites: (dispos.data ?? []).map((d) => ({
        date: d.date,
        statut: d.statut as "disponible" | "indisponible",
      })),
      derniersShifts: (shifts.data ?? []).map((s) => {
        const p = s.postes as unknown as { nom: string };
        return { date: s.date, posteNom: p.nom, statut: s.statut as StatutShift };
      }),
    };
  },
);
