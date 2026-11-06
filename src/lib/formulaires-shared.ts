// Partagé client + serveur (aucune dépendance serveur).
import type { StatutFormulaire, TypeQuestion } from "@/types/domain";

export const TITRE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const LIBELLE_MAX = 500;
export const OPTION_MAX = 200;
export const OPTIONS_MIN = 2;
export const OPTIONS_MAX = 50;
export const QUESTIONS_MAX = 100;

export const TYPES_QUESTION: { valeur: TypeQuestion; label: string }[] = [
  { valeur: "texte_court", label: "Texte court" },
  { valeur: "texte_long", label: "Texte long" },
  { valeur: "choix_unique", label: "Choix unique" },
  { valeur: "choix_multiple", label: "Choix multiple" },
  { valeur: "oui_non", label: "Oui / Non" },
  { valeur: "date", label: "Date" },
];

export const LIBELLE_TYPE = Object.fromEntries(
  TYPES_QUESTION.map((t) => [t.valeur, t.label]),
) as Record<TypeQuestion, string>;

export const LIBELLE_STATUT: Record<StatutFormulaire, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  ferme: "Fermé",
};

export function estTypeChoix(type: TypeQuestion): boolean {
  return type === "choix_unique" || type === "choix_multiple";
}

/** Question telle que saisie dans l'éditeur. `cle` ne sert qu'à l'affichage. */
export interface QuestionSaisie {
  cle: string;
  libelle: string;
  type: TypeQuestion;
  options: string[];
  obligatoire: boolean;
}

export interface FormulaireSaisie {
  titre: string;
  description: string;
  questions: QuestionSaisie[];
}

export interface ErreursFormulaire {
  titre?: string;
  description?: string;
  /** Erreur par `cle` de question. */
  questions: Record<string, string>;
  general?: string;
}

function propre(v: string): string {
  return v.trim().replace(/[ \t]+/g, " ");
}

function cleComparaison(v: string): string {
  return propre(v)
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Options non vides, sans espaces superflus. */
export function optionsNettoyees(options: string[]): string[] {
  return options.map(propre).filter(Boolean);
}

/**
 * Valide la saisie. Un brouillon peut n'avoir aucune question ; la publication
 * en exige au moins une. Renvoie `null` si tout est valide.
 */
export function validerFormulaire(
  saisie: FormulaireSaisie,
  { publication }: { publication: boolean },
): ErreursFormulaire | null {
  const erreurs: ErreursFormulaire = { questions: {} };

  const titre = propre(saisie.titre);
  if (!titre) erreurs.titre = "Le titre est requis.";
  else if (titre.length > TITRE_MAX)
    erreurs.titre = `Le titre ne doit pas dépasser ${TITRE_MAX} caractères.`;

  if (saisie.description.trim().length > DESCRIPTION_MAX)
    erreurs.description = `La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.`;

  if (publication && saisie.questions.length === 0)
    erreurs.general = "Ajoutez au moins une question avant de publier.";
  if (saisie.questions.length > QUESTIONS_MAX)
    erreurs.general = `Un formulaire ne peut pas dépasser ${QUESTIONS_MAX} questions.`;

  for (const q of saisie.questions) {
    const libelle = propre(q.libelle);
    if (!libelle) {
      erreurs.questions[q.cle] = "Le libellé de la question est requis.";
      continue;
    }
    if (libelle.length > LIBELLE_MAX) {
      erreurs.questions[q.cle] = `Le libellé ne doit pas dépasser ${LIBELLE_MAX} caractères.`;
      continue;
    }
    if (estTypeChoix(q.type)) {
      const options = optionsNettoyees(q.options);
      if (options.length < OPTIONS_MIN)
        erreurs.questions[q.cle] = `Indiquez au moins ${OPTIONS_MIN} options.`;
      else if (options.length > OPTIONS_MAX)
        erreurs.questions[q.cle] = `Une question ne peut pas dépasser ${OPTIONS_MAX} options.`;
      else if (options.some((o) => o.length > OPTION_MAX))
        erreurs.questions[q.cle] = `Une option ne doit pas dépasser ${OPTION_MAX} caractères.`;
      else if (new Set(options.map(cleComparaison)).size !== options.length)
        erreurs.questions[q.cle] = "Deux options sont identiques.";
    }
  }

  const aDesErreurs =
    erreurs.titre ||
    erreurs.description ||
    erreurs.general ||
    Object.keys(erreurs.questions).length > 0;
  return aDesErreurs ? erreurs : null;
}

/** Date lisible, toujours à l'heure d'Ottawa-Gatineau (identique serveur et client). */
export function dateFormulaire(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Toronto",
  });
}
