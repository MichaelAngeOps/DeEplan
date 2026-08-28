// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { estDimanche, iso, moisDecale } from "@/lib/dates";
import type { Candidat } from "@/lib/planning-shared";

export type { Candidat };

/**
 * Candidats à l'assignation d'un poste un jour donné (prompt §8, filtrage
 * strict) : stars **de la section** (rôle star **validé**) ET **`disponible`
 * ce jour-là**. « Non renseigné » et « indisponible » sont exclus.
 */
export const getCandidats = cache(
  async (
    sectionId: string,
    posteId: string,
    dateISO: string,
  ): Promise<Candidat[]> => {
    const supabase = await createClient();

    const { data: liens } = await supabase
      .from("star_sections")
      .select("star_id")
      .eq("section_id", sectionId);
    const starIds = (liens ?? []).map((l) => l.star_id);
    if (starIds.length === 0) return [];

    const [roles, users, dispos, planifiesAilleurs] = await Promise.all([
      supabase
        .from("roles_utilisateurs")
        .select("utilisateur_id, statut")
        .eq("role", "star")
        .in("utilisateur_id", starIds),
      supabase.from("utilisateurs").select("id, prenom, nom").in("id", starIds),
      supabase
        .from("disponibilites")
        .select("star_id, statut")
        .eq("date", dateISO)
        .in("star_id", starIds),
      // Déjà planifié ce jour-là, **tous départements confondus** (fonction
      // SECURITY DEFINER — le responsable ne voit que ses propres plannings).
      supabase.rpc("stars_planifies_le", {
        p_stars: starIds,
        p_date: dateISO,
        p_exclure_poste: posteId,
      }),
    ]);

    const valides = new Set(
      (roles.data ?? [])
        .filter((r) => r.statut === "valide")
        .map((r) => r.utilisateur_id),
    );
    const disponibles = new Set(
      (dispos.data ?? [])
        .filter((d) => d.statut === "disponible")
        .map((d) => d.star_id),
    );
    const nomParId = new Map(
      (users.data ?? []).map((u) => [u.id, `${u.prenom} ${u.nom}`.trim()]),
    );
    const planifies = new Set(
      ((planifiesAilleurs.data as string[] | null) ?? []),
    );

    return starIds
      .filter((id) => valides.has(id) && disponibles.has(id))
      .map((id) => ({
        id,
        nom: nomParId.get(id) ?? "Star",
        dejaPlanifieAilleurs: planifies.has(id),
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  },
);

/**
 * Nombre de shifts du star ce mois tombant un **dimanche**, hors
 * `na_pas_servi` (règle des 4 dimanches, prompt §8).
 */
export const getComptageDimanches = cache(
  async (starId: string, annee: number, mois: number): Promise<number> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("plannings")
      .select("date, statut")
      .eq("star_id", starId)
      .neq("statut", "na_pas_servi")
      .gte("date", iso(annee, mois, 1))
      .lt("date", moisDecale(annee, mois, 1));
    return (data ?? []).filter((p) => estDimanche(p.date)).length;
  },
);
