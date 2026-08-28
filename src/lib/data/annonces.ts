// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  date: string;
}

/** Annonces du département, les plus récentes d'abord. RLS : membre du département. */
export const getAnnonces = cache(
  async (departementId: string): Promise<Annonce[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("annonces")
      .select("id, titre, contenu, date_publication")
      .eq("departement_id", departementId)
      .order("date_publication", { ascending: false });

    if (error) throw new Error("Chargement des annonces impossible.");

    return (data ?? []).map((a) => ({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu,
      date: a.date_publication,
    }));
  },
);
