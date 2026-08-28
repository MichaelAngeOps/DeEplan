"use server";

import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { getCandidats, getComptageDimanches } from "@/lib/data/candidats";
import { dateCourteFr, estDimanche } from "@/lib/dates";
import { notifier } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";
import type { Candidat } from "@/lib/data/candidats";

const PATH = "/responsable/planning";
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEURE_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AssignationInput {
  posteId: string;
  sectionId: string;
  date: string;
  starId: string;
  /** `""` si non précisé (les deux doivent être vides ou tous les deux remplis). */
  heureDebut: string;
  heureFin: string;
  /** Passe outre la règle des 4 dimanches. */
  forcerDimanche?: boolean;
}

export type AssignationResultat =
  | { ok: true }
  | { ok: false; erreur: string }
  | { ok: false; confirmationDimanche: string };

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

async function garde(): Promise<
  { ok: true; departementId: string } | { ok: false; erreur: string }
> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  return { ok: true, departementId: acces.departementId };
}

/** Le poste appartient-il bien à une section du département ? */
async function posteValide(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posteId: string,
  sectionId: string,
  departementId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("postes")
    .select("id, section_id, sections!inner(id, departement_id)")
    .eq("id", posteId)
    .eq("section_id", sectionId)
    .eq("sections.departement_id", departementId)
    .maybeSingle();
  return Boolean(data);
}

/** Candidats d'une case — appelé à l'ouverture de la modale d'assignation. */
export async function chargerCandidats(
  sectionId: string,
  posteId: string,
  date: string,
): Promise<{ ok: true; candidats: Candidat[] } | { ok: false; erreur: string }> {
  const g = await garde();
  if (!g.ok) return g;
  if (!ISO_RE.test(date)) return { ok: false, erreur: "Date invalide." };

  const supabase = await createClient();
  if (!(await posteValide(supabase, posteId, sectionId, g.departementId)))
    return { ok: false, erreur: "Poste introuvable." };

  try {
    return { ok: true, candidats: await getCandidats(sectionId, posteId, date) };
  } catch {
    return { ok: false, erreur: "Chargement des candidats impossible." };
  }
}

export async function assignerShift(
  input: AssignationInput,
): Promise<AssignationResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  const { posteId, sectionId, date, starId, heureDebut, heureFin } = input;

  if (!ISO_RE.test(date)) return { ok: false, erreur: "Date invalide." };

  const avecHeures = heureDebut !== "" || heureFin !== "";
  if (avecHeures) {
    if (!HEURE_RE.test(heureDebut) || !HEURE_RE.test(heureFin))
      return { ok: false, erreur: "Heures invalides (format HH:MM)." };
    if (heureDebut >= heureFin)
      return { ok: false, erreur: "L'heure de fin doit suivre l'heure de début." };
  }

  const supabase = await createClient();

  if (!(await posteValide(supabase, posteId, sectionId, g.departementId)))
    return { ok: false, erreur: "Poste introuvable." };

  // §8 — le star doit être candidat (section + disponible ce jour).
  const candidats = await getCandidats(sectionId, posteId, date);
  if (!candidats.some((c) => c.id === starId))
    return {
      ok: false,
      erreur: "Ce star n'est pas disponible pour ce poste à cette date.",
    };

  // Case déjà occupée ?
  const { data: existant } = await supabase
    .from("plannings")
    .select("id, star_id")
    .eq("poste_id", posteId)
    .eq("date", date)
    .maybeSingle();

  const modificationMemeStar = existant?.star_id === starId;

  // Règle des 4 dimanches — seulement pour une nouvelle assignation de ce star.
  if (!modificationMemeStar && estDimanche(date) && !input.forcerDimanche) {
    const [a, m] = date.split("-").map(Number);
    const dejaDimanches = await getComptageDimanches(starId, a, m);
    if (dejaDimanches >= 3) {
      const nom = candidats.find((c) => c.id === starId)?.nom ?? "Ce star";
      return {
        ok: false,
        confirmationDimanche: `${nom} a déjà ${dejaDimanches} dimanches planifiés ce mois-ci. Confirmer cette assignation ?`,
      };
    }
  }

  const heures = {
    heure_debut: avecHeures ? heureDebut : null,
    heure_fin: avecHeures ? heureFin : null,
  };

  if (existant && modificationMemeStar) {
    const { error } = await supabase
      .from("plannings")
      .update(heures)
      .eq("id", existant.id);
    if (error) return { ok: false, erreur: "Enregistrement impossible." };
  } else {
    const { error } = await supabase.from("plannings").upsert(
      {
        poste_id: posteId,
        date,
        star_id: starId,
        cree_par: user.id,
        statut: "de_service",
        ...heures,
      },
      { onConflict: "poste_id,date" },
    );
    if (error) return { ok: false, erreur: "Assignation impossible." };
  }

  // Notifications (best-effort).
  const { data: poste } = await supabase
    .from("postes")
    .select("nom")
    .eq("id", posteId)
    .maybeSingle();
  const q = poste?.nom ?? "un poste";
  const jj = dateCourteFr(date);
  if (existant && modificationMemeStar) {
    await notifier(starId, "shift_modifie", `Vos horaires du ${jj} (${q}) ont été modifiés.`);
  } else {
    await notifier(starId, "shift_assigne", `Un shift vous a été assigné : ${q} le ${jj}.`);
    if (existant && existant.star_id !== starId) {
      await notifier(
        existant.star_id,
        "shift_retire",
        `Votre shift du ${jj} (${q}) a été réattribué à un autre star.`,
      );
    }
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Statut manuel d'un shift par le responsable (dashboard « Stars de service »). */
export async function definirStatutShift(
  shiftId: string,
  statut: "de_service" | "a_servi" | "na_pas_servi",
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("plannings")
    .select("id, postes!inner(sections!inner(departement_id))")
    .eq("id", shiftId)
    .eq("postes.sections.departement_id", g.departementId)
    .maybeSingle();
  if (!shift) return { ok: false, erreur: "Shift introuvable." };

  const { error } = await supabase
    .from("plannings")
    .update({ statut })
    .eq("id", shiftId);
  if (error) return { ok: false, erreur: "Mise à jour du statut impossible." };

  revalidatePath("/responsable/dashboard");
  revalidatePath(PATH);
  return { ok: true };
}

export async function retirerShift(shiftId: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("plannings")
    .select(
      "id, date, star_id, postes!inner(nom, sections!inner(departement_id))",
    )
    .eq("id", shiftId)
    .eq("postes.sections.departement_id", g.departementId)
    .maybeSingle();
  if (!shift) return { ok: false, erreur: "Shift introuvable." };

  const { error } = await supabase.from("plannings").delete().eq("id", shiftId);
  if (error) return { ok: false, erreur: "Retrait impossible." };

  const po = shift.postes as unknown as { nom: string };
  await notifier(
    shift.star_id,
    "shift_retire",
    `Votre shift du ${dateCourteFr(shift.date)} (${po.nom}) a été retiré.`,
  );

  revalidatePath(PATH);
  return { ok: true };
}
