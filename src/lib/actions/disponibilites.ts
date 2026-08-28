"use server";

import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PATH = "/star/disponibilites";
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `null` = « non renseigné » (la ligne est supprimée). */
export type ChangementDispo = {
  date: string;
  statut: "disponible" | "indisponible" | null;
};

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

/** Plancher d'édition : hier (UTC), pour absorber les décalages de fuseau. */
function plancherISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Enregistre en lot les changements de disponibilité du star courant :
 * `upsert` pour `disponible`/`indisponible`, `delete` pour `null`.
 */
export async function enregistrerDisponibilites(
  changements: ChangementDispo[],
): Promise<ActionResultat> {
  const acces = await getAcces();
  if (!acces?.star || acces.star.statut !== "valide")
    return { ok: false, erreur: "Accès réservé aux stars validés." };

  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  if (changements.length === 0) return { ok: true };
  if (changements.length > 100)
    return { ok: false, erreur: "Trop de modifications en une fois." };

  const plancher = plancherISO();
  const vues = new Set<string>();
  for (const c of changements) {
    if (!ISO_RE.test(c.date)) return { ok: false, erreur: "Date invalide." };
    if (vues.has(c.date)) return { ok: false, erreur: "Date en double." };
    vues.add(c.date);
    if (c.date < plancher)
      return { ok: false, erreur: "Impossible de modifier une date passée." };
    if (
      c.statut !== null &&
      c.statut !== "disponible" &&
      c.statut !== "indisponible"
    )
      return { ok: false, erreur: "Statut invalide." };
  }

  const supabase = await createClient();

  const aSupprimer = changements
    .filter((c) => c.statut === null)
    .map((c) => c.date);
  const aUpserter = changements
    .filter((c) => c.statut !== null)
    .map((c) => ({ star_id: user.id, date: c.date, statut: c.statut as string }));

  if (aSupprimer.length > 0) {
    const { error } = await supabase
      .from("disponibilites")
      .delete()
      .eq("star_id", user.id)
      .in("date", aSupprimer);
    if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
  }

  if (aUpserter.length > 0) {
    const { error } = await supabase
      .from("disponibilites")
      .upsert(aUpserter, { onConflict: "star_id,date" });
    if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
