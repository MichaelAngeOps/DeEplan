"use server";

import { revalidatePath } from "next/cache";
import { getAcces } from "@/lib/auth";
import { getAnnuaire } from "@/lib/data/annuaire";
import { notifier } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

/**
 * Active / retire un star **de ce département** (Lot A2-bis) :
 * `demandes_departement.statut` ↔ `valide` / `refuse`. En cas de retrait, le
 * star est aussi retiré des sections du département. Ses autres départements et
 * son historique sont conservés. Le statut global du rôle est synchronisé par
 * trigger (il perd l'accès seulement si c'était son dernier département actif).
 */
export async function definirActivationStar(
  starId: string,
  actif: boolean,
): Promise<ActionResultat> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  const departementId = acces.departementId;

  const dansLeDepartement = (await getAnnuaire(departementId)).some(
    (s) => s.id === starId,
  );
  if (!dansLeDepartement) return { ok: false, erreur: "Star introuvable." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("demandes_departement")
    .update({ statut: actif ? "valide" : "refuse" })
    .eq("star_id", starId)
    .eq("departement_id", departementId);
  if (error) return { ok: false, erreur: "Mise à jour impossible. Réessayez." };

  const { data: dept } = await supabase
    .from("departements")
    .select("nom")
    .eq("id", departementId)
    .maybeSingle();

  if (actif) {
    await notifier(
      starId,
      "compte_valide",
      `Vous avez été réintégré dans « ${dept?.nom ?? "le département"} ».`,
    );
  } else {
    // Retire le star des sections de ce département.
    const { data: secs } = await supabase
      .from("sections")
      .select("id")
      .eq("departement_id", departementId);
    const secIds = (secs ?? []).map((s) => s.id);
    if (secIds.length > 0) {
      await supabase
        .from("star_sections")
        .delete()
        .eq("star_id", starId)
        .in("section_id", secIds);
    }
    await notifier(
      starId,
      "shift_retire",
      `Vous avez été retiré du département « ${dept?.nom ?? ""} ».`,
    );
  }

  revalidatePath("/responsable/stars");
  revalidatePath(`/responsable/stars/${starId}`);
  revalidatePath("/responsable/dashboard");
  return { ok: true };
}
