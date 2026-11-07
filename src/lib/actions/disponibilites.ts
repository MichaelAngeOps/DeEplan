"use server";

import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { aujourdhuiISO } from "@/lib/dates";
import { journaliserErreur } from "@/lib/journal";
import { pousserConflitsAuxResponsables } from "@/lib/notify";
import { datesDevenuesIndisponibles } from "@/lib/planning-shared";
import { createClient } from "@/lib/supabase/server";

const PATH = "/star/disponibilites";
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `null` = « non renseigné » (la ligne est supprimée). */
export type ChangementDispo = {
  date: string;
  statut: "disponible" | "indisponible" | null;
};

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

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

  const plancher = aujourdhuiISO();
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

  // À lire avant l'écriture, pour ne prévenir qu'au passage à « indisponible ».
  const { data: existants, error: erreurLecture } = await supabase
    .from("disponibilites")
    .select("date, statut")
    .eq("star_id", user.id)
    .in(
      "date",
      changements.map((c) => c.date),
    );
  if (erreurLecture) journaliserErreur("actions/disponibilites", erreurLecture);

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

  // Sans lecture fiable, pas de push : la notification en base reste créée par le déclencheur.
  if (!erreurLecture)
    await pousserConflitsAuxResponsables(
      user.id,
      datesDevenuesIndisponibles(changements, existants ?? []),
    );

  revalidatePath(PATH);
  return { ok: true };
}
