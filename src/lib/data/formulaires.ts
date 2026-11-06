// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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
