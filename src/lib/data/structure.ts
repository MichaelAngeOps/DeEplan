// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SectionAvecPostes } from "@/types/domain";

/**
 * Sections du département (triées par nom) avec leurs postes imbriqués (triés
 * par nom). Le filtre applicatif sur `departementId` double la garde RLS
 * (`is_responsable_of`) — cf. `docs/SCHEMA.md`.
 */
export const getStructure = cache(
  async (departementId: string): Promise<SectionAvecPostes[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sections")
      .select(
        "id, departement_id, nom, postes ( id, section_id, nom, description )",
      )
      .eq("departement_id", departementId)
      .order("nom", { ascending: true })
      .order("nom", { referencedTable: "postes", ascending: true });

    if (error) throw new Error("Chargement de la structure impossible.");

    return (data ?? []).map((s) => ({
      id: s.id,
      departement_id: s.departement_id,
      nom: s.nom,
      postes: s.postes ?? [],
    }));
  },
);
