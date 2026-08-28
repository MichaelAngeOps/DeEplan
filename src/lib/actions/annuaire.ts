"use server";

import { revalidatePath } from "next/cache";
import { getAcces } from "@/lib/auth";
import { getAnnuaire } from "@/lib/data/annuaire";
import { notifier } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

/**
 * Active / désactive un star (soft-delete : `roles_utilisateurs.statut`).
 * L'historique (plannings, disponibilités) est conservé.
 */
export async function definirActivationStar(
  starId: string,
  actif: boolean,
): Promise<ActionResultat> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };

  const dansLeDepartement = (await getAnnuaire(acces.departementId)).some(
    (s) => s.id === starId,
  );
  if (!dansLeDepartement) return { ok: false, erreur: "Star introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("roles_utilisateurs")
    .update({ statut: actif ? "valide" : "desactive" })
    .eq("utilisateur_id", starId)
    .eq("role", "star");
  if (error) return { ok: false, erreur: "Mise à jour impossible. Réessayez." };

  if (actif) {
    await notifier(
      starId,
      "compte_valide",
      "Votre compte a été réactivé par votre responsable.",
    );
  }

  revalidatePath("/responsable/stars");
  revalidatePath(`/responsable/stars/${starId}`);
  return { ok: true };
}
