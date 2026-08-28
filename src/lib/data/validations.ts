// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CompteEnAttente {
  id: string;
  nom: string;
  email: string;
  dateInscription: string;
}

/**
 * Comptes star en attente de validation.
 *
 * ⚠️ Politiques RLS « v1 » : un star en attente n'est rattaché à aucun
 * département tant qu'il n'est pas validé → **tout responsable voit tous les
 * comptes en attente** (limitation connue, cf. `docs/SCHEMA.md` #5). Le
 * rattachement se fait à la validation (assignation aux sections du département).
 */
export const getComptesEnAttente = cache(
  async (): Promise<CompteEnAttente[]> => {
    const supabase = await createClient();

    const { data: roles } = await supabase
      .from("roles_utilisateurs")
      .select("utilisateur_id")
      .eq("role", "star")
      .eq("statut", "en_attente");

    const ids = (roles ?? []).map((r) => r.utilisateur_id);
    if (ids.length === 0) return [];

    const { data: users } = await supabase
      .from("utilisateurs")
      .select("id, prenom, nom, email, date_creation")
      .in("id", ids);

    return (users ?? [])
      .map((u) => ({
        id: u.id,
        nom: `${u.prenom} ${u.nom}`.trim(),
        email: u.email,
        dateInscription: u.date_creation,
      }))
      .sort((a, b) => a.dateInscription.localeCompare(b.dateInscription));
  },
);
