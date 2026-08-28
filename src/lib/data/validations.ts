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
 * Demandes de rattachement **en attente** pour un département donné
 * (Lot A2-bis — table `demandes_departement`).
 */
export const getComptesEnAttente = cache(
  async (departementId: string): Promise<CompteEnAttente[]> => {
    const supabase = await createClient();

    const { data: demandes } = await supabase
      .from("demandes_departement")
      .select("star_id")
      .eq("departement_id", departementId)
      .eq("statut", "en_attente");

    const ids = (demandes ?? []).map((d) => d.star_id);
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
