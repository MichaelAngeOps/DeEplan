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

/** La demande du star pour ce département est-elle encore en attente ? */
async function demandeEnAttente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  starId: string,
  departementId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("demandes_departement")
    .select("statut")
    .eq("star_id", starId)
    .eq("departement_id", departementId)
    .maybeSingle();
  return data?.statut === "en_attente";
}

function revalider() {
  revalidatePath("/responsable/validations");
  revalidatePath("/responsable/dashboard");
  revalidatePath("/responsable/stars");
}

/**
 * Valide la demande du star pour ce département et l'assigne à des sections.
 * Le statut global du rôle star est synchronisé par trigger.
 */
export async function validerCompte(
  starId: string,
  sectionIds: string[],
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  if (sectionIds.length === 0)
    return { ok: false, erreur: "Sélectionnez au moins une section." };

  const supabase = await createClient();

  if (!(await demandeEnAttente(supabase, starId, g.departementId)))
    return { ok: false, erreur: "Cette demande n'est plus en attente." };

  const { data: secs } = await supabase
    .from("sections")
    .select("id, nom")
    .eq("departement_id", g.departementId)
    .in("id", sectionIds);
  if ((secs ?? []).length !== sectionIds.length)
    return { ok: false, erreur: "Section invalide." };

  const { error: eDemande } = await supabase
    .from("demandes_departement")
    .update({ statut: "valide" })
    .eq("star_id", starId)
    .eq("departement_id", g.departementId);
  if (eDemande) return { ok: false, erreur: "Validation impossible. Réessayez." };

  const { error: eSec } = await supabase
    .from("star_sections")
    .upsert(
      sectionIds.map((section_id) => ({ star_id: starId, section_id })),
      { onConflict: "star_id,section_id", ignoreDuplicates: true },
    );
  if (eSec)
    return { ok: false, erreur: "Demande validée, mais l'assignation aux sections a échoué." };

  const { data: dept } = await supabase
    .from("departements")
    .select("nom")
    .eq("id", g.departementId)
    .maybeSingle();
  const noms = (secs ?? []).map((s) => s.nom).join(", ");
  await notifier(
    starId,
    "compte_valide",
    `Votre demande pour « ${dept?.nom ?? "le département"} » a été validée. Vous êtes affecté à : ${noms}.`,
  );

  revalider();
  return { ok: true };
}

/** Refuse la demande du star pour ce département (n'affecte pas ses autres départements). */
export async function refuserCompte(starId: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  if (!(await demandeEnAttente(supabase, starId, g.departementId)))
    return { ok: false, erreur: "Cette demande n'est plus en attente." };

  const { error } = await supabase
    .from("demandes_departement")
    .update({ statut: "refuse" })
    .eq("star_id", starId)
    .eq("departement_id", g.departementId);
  if (error) return { ok: false, erreur: "Refus impossible. Réessayez." };

  revalider();
  return { ok: true };
}
