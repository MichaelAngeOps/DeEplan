// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { StatutDisponibilite } from "@/types/domain";

/** `{ 'YYYY-MM-DD': 'disponible' | 'indisponible' }` — l'absence de clé = « non renseigné ». */
export type DisposMap = Record<string, StatutDisponibilite>;

/**
 * Disponibilités du star sur l'intervalle `[debut, fin[` (bornes ISO).
 * RLS : `star_id = auth.uid()` — le filtre applicatif double la garde.
 */
export const getDisponibilites = cache(
  async (starId: string, debut: string, fin: string): Promise<DisposMap> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("disponibilites")
      .select("date, statut")
      .eq("star_id", starId)
      .gte("date", debut)
      .lt("date", fin);

    if (error) throw new Error("Chargement des disponibilités impossible.");

    const map: DisposMap = {};
    for (const d of data ?? []) map[d.date] = d.statut as StatutDisponibilite;
    return map;
  },
);

/**
 * Jours où le star a un shift planifié sur `[debut, fin[` — pour l'avertissement
 * de conflit (le star lit ses propres `plannings`, RLS OK). Non bloquant :
 * renvoie un ensemble vide en cas d'erreur.
 */
export const getJoursAvecShift = cache(
  async (starId: string, debut: string, fin: string): Promise<string[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("plannings")
      .select("date")
      .eq("star_id", starId)
      .gte("date", debut)
      .lt("date", fin);

    if (error) return [];
    return [...new Set((data ?? []).map((p) => p.date))];
  },
);
