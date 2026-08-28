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
 * Comptes star en attente de validation **pour un département donné** (Lot A2) :
 * stars ayant choisi ce département à l'inscription. RLS scopée depuis la
 * migration `star_choisit_departement_a_inscription`.
 */
export const getComptesEnAttente = cache(
  async (departementId: string): Promise<CompteEnAttente[]> => {
    const supabase = await createClient();

    const { data: roles } = await supabase
      .from("roles_utilisateurs")
      .select("utilisateur_id")
      .eq("role", "star")
      .eq("statut", "en_attente")
      .eq("departement_id", departementId);

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
