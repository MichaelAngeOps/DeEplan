// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Reponses } from "@/lib/formulaires-shared";
import type { StatutFormulaire, TypeQuestion } from "@/types/domain";

export interface FormulaireResume {
  id: string;
  titre: string;
  statut: StatutFormulaire;
  dateCreation: string;
  datePublication: string | null;
  dateFermeture: string | null;
  nbQuestions: number;
  nbReponses: number;
}

export interface QuestionFormulaire {
  id: string;
  libelle: string;
  type: TypeQuestion;
  options: string[];
  obligatoire: boolean;
}

export interface FormulaireDetail extends FormulaireResume {
  description: string | null;
  questions: QuestionFormulaire[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function compte(rel: { count: number }[] | null | undefined): number {
  return rel?.[0]?.count ?? 0;
}

function optionsDepuisJson(options: unknown): string[] {
  return Array.isArray(options)
    ? options.filter((o): o is string => typeof o === "string")
    : [];
}

/** Formulaires du département, les plus récents d'abord. */
export const getFormulaires = cache(
  async (departementId: string): Promise<FormulaireResume[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formulaires")
      .select(
        "id, titre, statut, date_creation, date_publication, date_fermeture, formulaire_questions(count), formulaire_reponses(count)",
      )
      .eq("departement_id", departementId)
      .order("date_creation", { ascending: false });

    if (error) throw new Error("Chargement des formulaires impossible.");

    return (data ?? []).map((f) => ({
      id: f.id,
      titre: f.titre,
      statut: f.statut as StatutFormulaire,
      dateCreation: f.date_creation,
      datePublication: f.date_publication,
      dateFermeture: f.date_fermeture,
      nbQuestions: compte(f.formulaire_questions),
      nbReponses: compte(f.formulaire_reponses),
    }));
  },
);

// --------------------------------------------------------------------------
// Côté Star
// --------------------------------------------------------------------------

export interface FormulaireStarResume {
  id: string;
  titre: string;
  departementNom: string;
  statut: "publie" | "ferme";
  datePublication: string | null;
  dateFermeture: string | null;
  /** Date de la dernière réponse du star, ou `null` s'il n'a pas répondu. */
  dateReponse: string | null;
}

export interface FormulaireStarDetail extends FormulaireStarResume {
  description: string | null;
  questions: QuestionFormulaire[];
  reponses: Reponses;
  /** Publié et star toujours membre du département. */
  modifiable: boolean;
}

/** Départements où le star a une section (même règle que la base : `is_star_in_departement`). */
async function departementsDuStar(sectionIds: string[]): Promise<string[]> {
  if (sectionIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("departement_id")
    .in("id", sectionIds);
  if (error) throw new Error("Chargement des formulaires impossible.");
  return [...new Set((data ?? []).map((s) => s.departement_id))];
}

/**
 * Formulaires publiés ou fermés du star : ceux de ses départements, plus ceux
 * auxquels il a répondu. Le filtre est explicite car un utilisateur qui cumule
 * les deux rôles voit aussi, via la RLS, les formulaires de son propre département.
 */
export const getFormulairesStar = cache(
  async (starId: string, sectionIds: string[]): Promise<FormulaireStarResume[]> => {
    const supabase = await createClient();

    const [departementIds, mesReponses] = await Promise.all([
      departementsDuStar(sectionIds),
      supabase
        .from("formulaire_reponses")
        .select("formulaire_id, date_modification")
        .eq("star_id", starId),
    ]);
    if (mesReponses.error) throw new Error("Chargement des formulaires impossible.");

    const dateParFormulaire = new Map(
      (mesReponses.data ?? []).map((r) => [r.formulaire_id, r.date_modification]),
    );
    const filtres = [
      departementIds.length > 0 && `departement_id.in.(${departementIds.join(",")})`,
      dateParFormulaire.size > 0 && `id.in.(${[...dateParFormulaire.keys()].join(",")})`,
    ].filter(Boolean);
    if (filtres.length === 0) return [];

    const { data, error } = await supabase
      .from("formulaires")
      .select(
        "id, titre, statut, date_creation, date_publication, date_fermeture, departements(nom)",
      )
      .neq("statut", "brouillon")
      .or(filtres.join(","))
      .order("date_publication", { ascending: false });
    if (error) throw new Error("Chargement des formulaires impossible.");

    return (data ?? []).map((f) => ({
      id: f.id,
      titre: f.titre,
      departementNom: f.departements?.nom ?? "",
      statut: f.statut as "publie" | "ferme",
      datePublication: f.date_publication,
      dateFermeture: f.date_fermeture,
      dateReponse: dateParFormulaire.get(f.id) ?? null,
    }));
  },
);

/** Formulaire à afficher au star avec sa réponse, ou `null` s'il n'y a pas accès. */
export const getFormulaireStar = cache(
  async (
    starId: string,
    sectionIds: string[],
    formulaireId: string,
  ): Promise<FormulaireStarDetail | null> => {
    if (!UUID.test(formulaireId)) return null;
    const supabase = await createClient();

    const [departementIds, formulaire, reponse] = await Promise.all([
      departementsDuStar(sectionIds),
      supabase
        .from("formulaires")
        .select(
          "id, titre, description, statut, departement_id, date_publication, date_fermeture, departements(nom), formulaire_questions(id, ordre, libelle, type, options, obligatoire)",
        )
        .eq("id", formulaireId)
        .neq("statut", "brouillon")
        .maybeSingle(),
      supabase
        .from("formulaire_reponses")
        .select("reponses, date_modification")
        .eq("formulaire_id", formulaireId)
        .eq("star_id", starId)
        .maybeSingle(),
    ]);
    if (formulaire.error || reponse.error)
      throw new Error("Chargement du formulaire impossible.");

    const f = formulaire.data;
    if (!f) return null;

    const membre = departementIds.includes(f.departement_id);
    if (!membre && !reponse.data) return null;

    const statut = f.statut as "publie" | "ferme";
    return {
      id: f.id,
      titre: f.titre,
      description: f.description,
      departementNom: f.departements?.nom ?? "",
      statut,
      datePublication: f.date_publication,
      dateFermeture: f.date_fermeture,
      dateReponse: reponse.data?.date_modification ?? null,
      questions: [...f.formulaire_questions]
        .sort((a, b) => a.ordre - b.ordre)
        .map((q) => ({
          id: q.id,
          libelle: q.libelle,
          type: q.type as TypeQuestion,
          options: optionsDepuisJson(q.options),
          obligatoire: q.obligatoire,
        })),
      reponses: (reponse.data?.reponses ?? {}) as Reponses,
      modifiable: statut === "publie" && membre,
    };
  },
);

// --------------------------------------------------------------------------
// Fiche d'un star, côté Responsable
// --------------------------------------------------------------------------

export interface FormulaireDuStar {
  id: string;
  titre: string;
  statut: "publie" | "ferme";
  datePublication: string | null;
  /** Date de la dernière réponse du star, ou `null` s'il n'a pas répondu. */
  dateReponse: string | null;
}

export interface ReponseDuStar {
  reponses: Reponses;
  dateModification: string;
}

/** Formulaires publiés ou fermés du département, avec la réponse éventuelle du star. */
export const getFormulairesDuStar = cache(
  async (departementId: string, starId: string): Promise<FormulaireDuStar[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formulaires")
      .select(
        "id, titre, statut, date_publication, formulaire_reponses(star_id, date_modification)",
      )
      .eq("departement_id", departementId)
      .neq("statut", "brouillon")
      .eq("formulaire_reponses.star_id", starId)
      .order("date_publication", { ascending: false });

    if (error) throw new Error("Chargement des formulaires impossible.");

    return (data ?? []).map((f) => ({
      id: f.id,
      titre: f.titre,
      statut: f.statut as "publie" | "ferme",
      datePublication: f.date_publication,
      dateReponse:
        f.formulaire_reponses.find((r) => r.star_id === starId)?.date_modification ?? null,
    }));
  },
);

export interface ReponseNominative extends ReponseDuStar {
  starNom: string;
}

/** Toutes les réponses d'un formulaire, triées par nom de star (pour le PDF). */
export const getReponsesFormulaire = cache(
  async (formulaireId: string): Promise<ReponseNominative[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formulaire_reponses")
      .select("reponses, date_modification, utilisateurs(prenom, nom)")
      .eq("formulaire_id", formulaireId);

    if (error) throw new Error("Chargement des réponses impossible.");

    return (data ?? [])
      .map((r) => ({
        starNom: r.utilisateurs
          ? `${r.utilisateurs.prenom} ${r.utilisateurs.nom}`.trim()
          : "Star",
        reponses: r.reponses as Reponses,
        dateModification: r.date_modification,
      }))
      .sort((a, b) => a.starNom.localeCompare(b.starNom, "fr"));
  },
);

/** Réponse d'un star à un formulaire, ou `null` s'il n'a pas répondu. */
export const getReponseDuStar = cache(
  async (formulaireId: string, starId: string): Promise<ReponseDuStar | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formulaire_reponses")
      .select("reponses, date_modification")
      .eq("formulaire_id", formulaireId)
      .eq("star_id", starId)
      .maybeSingle();

    if (error) throw new Error("Chargement de la réponse impossible.");
    if (!data) return null;
    return {
      reponses: data.reponses as Reponses,
      dateModification: data.date_modification,
    };
  },
);

/** Formulaire complet du département, ou `null` s'il n'existe pas ou n'en fait pas partie. */
export const getFormulaire = cache(
  async (
    departementId: string,
    formulaireId: string,
  ): Promise<FormulaireDetail | null> => {
    if (!UUID.test(formulaireId)) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formulaires")
      .select(
        "id, titre, description, statut, date_creation, date_publication, date_fermeture, formulaire_questions(id, ordre, libelle, type, options, obligatoire), formulaire_reponses(count)",
      )
      .eq("id", formulaireId)
      .eq("departement_id", departementId)
      .maybeSingle();

    if (error) throw new Error("Chargement du formulaire impossible.");
    if (!data) return null;

    const questions = [...data.formulaire_questions]
      .sort((a, b) => a.ordre - b.ordre)
      .map((q) => ({
        id: q.id,
        libelle: q.libelle,
        type: q.type as TypeQuestion,
        options: optionsDepuisJson(q.options),
        obligatoire: q.obligatoire,
      }));

    return {
      id: data.id,
      titre: data.titre,
      description: data.description,
      statut: data.statut as StatutFormulaire,
      dateCreation: data.date_creation,
      datePublication: data.date_publication,
      dateFermeture: data.date_fermeture,
      nbQuestions: questions.length,
      nbReponses: compte(data.formulaire_reponses),
      questions,
    };
  },
);
