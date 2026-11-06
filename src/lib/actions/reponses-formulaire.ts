"use server";

import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { getFormulaireStar } from "@/lib/data/formulaires";
import {
  reponsesNettoyees,
  validerReponses,
  type Reponses,
} from "@/lib/formulaires-shared";
import { createClient } from "@/lib/supabase/server";

export type ResultatReponses =
  | { ok: true; date: string }
  | { ok: false; erreur: string; erreurs?: Record<string, string> };

const OUVERT_REQUIS = "Ce formulaire n'est plus ouvert aux réponses.";

/** Enregistre ou met à jour la réponse du star. La base revalide chaque réponse. */
export async function enregistrerReponses(
  formulaireId: string,
  reponses: Reponses,
): Promise<ResultatReponses> {
  const [acces, user] = await Promise.all([getAcces(), getUser()]);
  if (!user) return { ok: false, erreur: "Session expirée." };
  if (acces?.star?.statut !== "valide")
    return { ok: false, erreur: "Accès réservé aux stars validées." };

  let formulaire;
  try {
    formulaire = await getFormulaireStar(user.id, acces.star.sectionIds, formulaireId);
  } catch {
    return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
  }
  if (!formulaire) return { ok: false, erreur: "Ce formulaire n'est pas disponible." };
  if (!formulaire.modifiable) return { ok: false, erreur: OUVERT_REQUIS };

  const propres = reponsesNettoyees(reponses);
  const erreurs = validerReponses(formulaire.questions, propres);
  if (Object.keys(erreurs).length > 0)
    return { ok: false, erreur: "Vérifiez les réponses signalées.", erreurs };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formulaire_reponses")
    .upsert(
      { formulaire_id: formulaireId, star_id: user.id, reponses: propres },
      { onConflict: "formulaire_id,star_id" },
    )
    .select("date_modification")
    .single();

  if (error || !data) {
    if (error?.code === "42501") return { ok: false, erreur: OUVERT_REQUIS };
    if (error?.code === "23514")
      return { ok: false, erreur: "Certaines réponses ne sont pas valides. Vérifiez-les." };
    return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
  }

  revalidatePath("/star/formulaires");
  revalidatePath(`/star/formulaires/${formulaireId}`);
  revalidatePath("/responsable/annonces");
  revalidatePath(`/responsable/annonces/formulaires/${formulaireId}`);
  return { ok: true, date: data.date_modification };
}
