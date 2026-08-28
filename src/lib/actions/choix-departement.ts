"use server";

import { redirect } from "next/navigation";
import { getAcces, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ChoixResultat = { ok: true } | { ok: false; erreur: string };

/** Le star (en attente) choisit le département qu'il souhaite rejoindre. */
export async function choisirDepartement(
  departementId: string,
): Promise<ChoixResultat> {
  const acces = await getAcces();
  if (!acces?.star || acces.star.statut !== "en_attente")
    return { ok: false, erreur: "Action indisponible." };

  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  const supabase = await createClient();
  const { data: dept } = await supabase
    .from("departements")
    .select("id")
    .eq("id", departementId)
    .maybeSingle();
  if (!dept) return { ok: false, erreur: "Département introuvable." };

  const { error } = await supabase
    .from("roles_utilisateurs")
    .update({ departement_id: departementId })
    .eq("utilisateur_id", user.id)
    .eq("role", "star")
    .eq("statut", "en_attente");
  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };

  redirect("/compte-en-attente");
}
