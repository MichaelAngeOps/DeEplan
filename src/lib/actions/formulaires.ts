"use server";

import { revalidatePath } from "next/cache";
import { journaliserErreur } from "@/lib/journal";
import { getAcces, getUser } from "@/lib/auth";
import {
  getFormulaire,
  getReponsesFormulaire,
  type FormulaireDetail,
  type ReponseNominative,
} from "@/lib/data/formulaires";
import {
  estTypeChoix,
  optionsNettoyees,
  titreConfirmeCorrespond,
  validerFormulaire,
  type ErreursFormulaire,
  type FormulaireSaisie,
} from "@/lib/formulaires-shared";
import { notifierPlusieurs } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

const PATH_LISTE = "/responsable/annonces";

export type ResultatSauvegarde =
  | { ok: true; id: string }
  /** `id` : présent si le brouillon existe déjà malgré l'échec (publication refusée). */
  | { ok: false; erreur: string; erreurs?: ErreursFormulaire; id?: string };

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

async function garde(): Promise<
  | { ok: true; departementId: string; userId: string }
  | { ok: false; erreur: string }
> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };
  return { ok: true, departementId: acces.departementId, userId: user.id };
}

function revalider(id?: string) {
  revalidatePath(PATH_LISTE);
  if (id) revalidatePath(`${PATH_LISTE}/formulaires/${id}`);
}

function propre(v: string): string {
  return v.trim().replace(/[ \t]+/g, " ");
}

function lignesQuestions(formulaireId: string, saisie: FormulaireSaisie) {
  return saisie.questions.map((q, ordre) => ({
    formulaire_id: formulaireId,
    ordre,
    libelle: propre(q.libelle),
    type: q.type,
    options: estTypeChoix(q.type) ? optionsNettoyees(q.options) : null,
    obligatoire: q.obligatoire,
  }));
}

/** Crée ou met à jour un brouillon. La saisie doit déjà être validée. */
async function sauvegarder(
  g: { departementId: string; userId: string },
  saisie: FormulaireSaisie,
  id?: string,
): Promise<ResultatSauvegarde> {
  const supabase = await createClient();
  const titre = propre(saisie.titre);
  const description = saisie.description.trim() || null;

  if (id) {
    const { data, error } = await supabase
      .from("formulaires")
      .update({ titre, description })
      .eq("id", id)
      .eq("departement_id", g.departementId)
      .eq("statut", "brouillon")
      .select("id");
    if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez.", id };
    if (!data?.length)
      return { ok: false, erreur: "Ce formulaire n'est plus modifiable." };

    const suppression = await supabase
      .from("formulaire_questions")
      .delete()
      .eq("formulaire_id", id);
    if (suppression.error)
      return { ok: false, erreur: "Enregistrement impossible. Réessayez.", id };

    if (saisie.questions.length > 0) {
      const ajout = await supabase
        .from("formulaire_questions")
        .insert(lignesQuestions(id, saisie));
      if (ajout.error)
        return {
          ok: false,
          erreur: "Les questions n'ont pas été enregistrées. Réessayez sans quitter cette page.",
          id,
        };
    }
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("formulaires")
    .insert({
      departement_id: g.departementId,
      responsable_id: g.userId,
      titre,
      description,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };

  if (saisie.questions.length > 0) {
    const ajout = await supabase
      .from("formulaire_questions")
      .insert(lignesQuestions(data.id, saisie));
    if (ajout.error) {
      // Pas de brouillon sans ses questions : un nouvel essai repart de zéro.
      await supabase.from("formulaires").delete().eq("id", data.id);
      return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
    }
  }
  return { ok: true, id: data.id };
}

export async function enregistrerBrouillon(
  saisie: FormulaireSaisie,
  id?: string,
): Promise<ResultatSauvegarde> {
  const g = await garde();
  if (!g.ok) return g;

  const erreurs = validerFormulaire(saisie, { publication: false });
  if (erreurs) return { ok: false, erreur: "Corrigez les champs signalés.", erreurs };

  const res = await sauvegarder(g, saisie, id);
  if (res.ok) revalider(res.id);
  return res;
}

/** Enregistre puis publie : les stars du département sont notifiés avec un lien direct. */
export async function publierFormulaire(
  saisie: FormulaireSaisie,
  id?: string,
): Promise<ResultatSauvegarde> {
  const g = await garde();
  if (!g.ok) return g;

  const erreurs = validerFormulaire(saisie, { publication: true });
  if (erreurs) return { ok: false, erreur: "Corrigez les champs signalés.", erreurs };

  const sauvegarde = await sauvegarder(g, saisie, id);
  if (!sauvegarde.ok) return sauvegarde;
  const formulaireId = sauvegarde.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formulaires")
    .update({ statut: "publie" })
    .eq("id", formulaireId)
    .eq("departement_id", g.departementId)
    .eq("statut", "brouillon")
    .select("id");
  if (error || !data?.length) {
    revalider(formulaireId);
    return {
      ok: false,
      erreur: "Publication impossible. Votre brouillon est enregistré, réessayez.",
      id: formulaireId,
    };
  }

  const { data: secs } = await supabase
    .from("sections")
    .select("id")
    .eq("departement_id", g.departementId);
  const sectionIds = (secs ?? []).map((s) => s.id);
  if (sectionIds.length > 0) {
    const { data: liens } = await supabase
      .from("star_sections")
      .select("star_id")
      .in("section_id", sectionIds);
    const starIds = [...new Set((liens ?? []).map((l) => l.star_id))];
    await notifierPlusieurs(
      starIds,
      "formulaire",
      `Nouveau formulaire à remplir disponible : ${propre(saisie.titre)}`,
      `/star/formulaires/${formulaireId}`,
    );
  }

  revalider(formulaireId);
  revalidatePath("/star/notifications");
  revalidatePath("/star", "layout"); // pastille de navigation
  return { ok: true, id: formulaireId };
}

/** Ferme un formulaire publié : plus de réponses possibles, les réponses restent consultables. */
export async function fermerFormulaire(id: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formulaires")
    .update({ statut: "ferme" })
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .eq("statut", "publie")
    .select("id");
  if (error) return { ok: false, erreur: "Fermeture impossible. Réessayez." };
  if (!data?.length) return { ok: false, erreur: "Ce formulaire n'est plus ouvert." };

  revalider(id);
  return { ok: true };
}

export type ResultatPartage =
  | { ok: true; formulaire: FormulaireDetail; reponses: ReponseNominative[] }
  | { ok: false; erreur: string };

/** Données du PDF d'un formulaire fermé, réservées au responsable du département. */
export async function chargerPartageFormulaire(id: string): Promise<ResultatPartage> {
  const g = await garde();
  if (!g.ok) return g;

  try {
    const formulaire = await getFormulaire(g.departementId, id);
    if (!formulaire) return { ok: false, erreur: "Ce formulaire n'existe plus." };
    if (formulaire.statut !== "ferme")
      return { ok: false, erreur: "Fermez le formulaire avant de le partager." };
    return { ok: true, formulaire, reponses: await getReponsesFormulaire(id) };
  } catch (e) {
    journaliserErreur("actions/formulaires", e);
    return { ok: false, erreur: "Chargement des réponses impossible. Réessayez." };
  }
}

/**
 * Supprime définitivement un formulaire fermé et toutes ses réponses. Le titre
 * retapé est revérifié ici. La base retire aussi les notifications liées.
 */
export async function supprimerFormulaireFerme(
  id: string,
  titreConfirme: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();
  const { data: formulaire, error: erreurLecture } = await supabase
    .from("formulaires")
    .select("titre, statut")
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .maybeSingle();
  if (erreurLecture) return { ok: false, erreur: "Suppression impossible. Réessayez." };
  if (!formulaire) return { ok: false, erreur: "Ce formulaire n'existe plus." };
  if (formulaire.statut !== "ferme")
    return { ok: false, erreur: "Fermez le formulaire avant de le supprimer." };
  if (!titreConfirmeCorrespond(titreConfirme, formulaire.titre))
    return { ok: false, erreur: "Le titre saisi ne correspond pas." };

  const { data, error } = await supabase
    .from("formulaires")
    .delete()
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .eq("statut", "ferme")
    .select("id");
  if (error) return { ok: false, erreur: "Suppression impossible. Réessayez." };
  if (!data?.length) return { ok: false, erreur: "Ce formulaire n'existe plus." };

  revalider();
  revalidatePath("/responsable/stars", "layout");
  revalidatePath("/star/formulaires");
  revalidatePath("/star/notifications");
  revalidatePath("/star", "layout"); // pastille de navigation
  return { ok: true };
}

/** Supprime un brouillon. Un formulaire publié doit d'abord être fermé. */
export async function supprimerBrouillon(id: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formulaires")
    .delete()
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .eq("statut", "brouillon")
    .select("id");
  if (error) return { ok: false, erreur: "Suppression impossible. Réessayez." };
  if (!data?.length) return { ok: false, erreur: "Ce brouillon n'existe plus." };

  revalider();
  return { ok: true };
}
