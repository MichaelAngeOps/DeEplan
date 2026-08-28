"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ChoixResultat = { ok: true } | { ok: false; erreur: string };

/**
 * Le star demande à rejoindre un ou plusieurs départements (crée des lignes
 * `demandes_departement` en `en_attente`). Chaque responsable valide la sienne.
 */
export async function choisirDepartements(
  departementIds: string[],
): Promise<ChoixResultat> {
  const acces = await getAcces();
  if (!acces?.star) return { ok: false, erreur: "Action indisponible." };

  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  if (departementIds.length === 0)
    return { ok: false, erreur: "Sélectionnez au moins un département." };

  const supabase = await createClient();

  const { data: depts } = await supabase
    .from("departements")
    .select("id")
    .in("id", departementIds);
  if ((depts ?? []).length !== departementIds.length)
    return { ok: false, erreur: "Département invalide." };

  // Ne (re)demander que les départements non déjà demandés (hors 'refuse').
  const dejaDemandes = new Set(
    acces.star.departements
      .filter((d) => d.statut !== "refuse")
      .map((d) => d.id),
  );
  const aDemander = departementIds.filter((id) => !dejaDemandes.has(id));
  if (aDemander.length === 0) {
    redirect("/compte-en-attente");
  }

  // Nettoie d'éventuelles demandes 'refuse' que le star re-soumet.
  await supabase
    .from("demandes_departement")
    .delete()
    .eq("star_id", user.id)
    .eq("statut", "refuse")
    .in("departement_id", aDemander);

  const { error } = await supabase.from("demandes_departement").insert(
    aDemander.map((departement_id) => ({
      star_id: user.id,
      departement_id,
      statut: "en_attente",
    })),
  );
  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };

  revalidatePath("/star/mes-departements");
  redirect("/compte-en-attente");
}
