"use server";

import { revalidatePath } from "next/cache";
import { getAcces } from "@/lib/auth";
import { notifier } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

async function garde(): Promise<
  { ok: true; departementId: string } | { ok: false; erreur: string }
> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  return { ok: true, departementId: acces.departementId };
}

async function estStarEnAttente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  starId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("roles_utilisateurs")
    .select("id")
    .eq("utilisateur_id", starId)
    .eq("role", "star")
    .eq("statut", "en_attente")
    .maybeSingle();
  return Boolean(data);
}

/** Valide un compte star et l'assigne à une ou plusieurs sections du département. */
export async function validerCompte(
  starId: string,
  sectionIds: string[],
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  if (sectionIds.length === 0)
    return { ok: false, erreur: "Sélectionnez au moins une section." };

  const supabase = await createClient();

  if (!(await estStarEnAttente(supabase, starId)))
    return { ok: false, erreur: "Ce compte n'est plus en attente." };

  const { data: secs } = await supabase
    .from("sections")
    .select("id, nom")
    .eq("departement_id", g.departementId)
    .in("id", sectionIds);
  if ((secs ?? []).length !== sectionIds.length)
    return { ok: false, erreur: "Section invalide." };

  const { error: eRole } = await supabase
    .from("roles_utilisateurs")
    .update({ statut: "valide" })
    .eq("utilisateur_id", starId)
    .eq("role", "star");
  if (eRole) return { ok: false, erreur: "Validation impossible. Réessayez." };

  const { error: eSec } = await supabase
    .from("star_sections")
    .upsert(
      sectionIds.map((section_id) => ({ star_id: starId, section_id })),
      { onConflict: "star_id,section_id", ignoreDuplicates: true },
    );
  if (eSec)
    return { ok: false, erreur: "Compte validé, mais l'assignation aux sections a échoué." };

  const noms = (secs ?? []).map((s) => s.nom).join(", ");
  await notifier(
    starId,
    "compte_valide",
    `Votre compte a été validé. Vous êtes affecté à : ${noms}.`,
  );

  revalidatePath("/responsable/validations");
  revalidatePath("/responsable/dashboard");
  return { ok: true };
}

/** Refuse un compte star (statut → `desactive`). */
export async function refuserCompte(starId: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  if (!(await estStarEnAttente(supabase, starId)))
    return { ok: false, erreur: "Ce compte n'est plus en attente." };

  const { error } = await supabase
    .from("roles_utilisateurs")
    .update({ statut: "desactive" })
    .eq("utilisateur_id", starId)
    .eq("role", "star");
  if (error) return { ok: false, erreur: "Refus impossible. Réessayez." };

  revalidatePath("/responsable/validations");
  revalidatePath("/responsable/dashboard");
  return { ok: true };
}
