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

/**
 * Confirmation de suppression : le titre retapé doit correspondre, sans tenir compte
 * des majuscules, des accents, des espaces en trop ni du style d'apostrophe.
 */
export function titreConfirmeCorrespond(saisie: string, titre: string): boolean {
  const normaliser = (v: string) =>
    cleComparaison(v.replace(/\s+/g, " ")).replace(/[’‘ʼ]/g, "'");
  const cible = normaliser(titre);
  return cible !== "" && normaliser(saisie) === cible;
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

// --------------------------------------------------------------------------
// Réponses d'un star
// --------------------------------------------------------------------------

/** Texte, option ou date : `string` · choix multiple : `string[]` · oui/non : `boolean`. */
export type ValeurReponse = string | string[] | boolean;
export type Reponses = Record<string, ValeurReponse>;

export const REPONSE_COURTE_MAX = 500;
export const REPONSE_LONGUE_MAX = 5000;

export interface QuestionAValider {
  id: string;
  type: TypeQuestion;
  options: string[];
  obligatoire: boolean;
}

function estVide(v: ValeurReponse | undefined): boolean {
  if (v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function dateValide(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function erreurReponse(q: QuestionAValider, v: ValeurReponse): string | null {
  const invalide = "Cette réponse n'est pas valide.";
  switch (q.type) {
    case "texte_court":
      if (typeof v !== "string") return invalide;
      return v.length > REPONSE_COURTE_MAX
        ? `La réponse ne doit pas dépasser ${REPONSE_COURTE_MAX} caractères.`
        : null;
    case "texte_long":
      if (typeof v !== "string") return invalide;
      return v.length > REPONSE_LONGUE_MAX
        ? `La réponse ne doit pas dépasser ${REPONSE_LONGUE_MAX} caractères.`
        : null;
    case "choix_unique":
      return typeof v === "string" && q.options.includes(v) ? null : invalide;
    case "choix_multiple":
      return Array.isArray(v) &&
        new Set(v).size === v.length &&
        v.every((o) => q.options.includes(o))
        ? null
        : invalide;
    case "oui_non":
      return typeof v === "boolean" ? null : invalide;
    case "date":
      return typeof v === "string" && dateValide(v) ? null : "Cette date n'est pas valide.";
  }
}

/** Erreurs par identifiant de question. Objet vide si tout est valide. */
export function validerReponses(
  questions: QuestionAValider[],
  reponses: Reponses,
): Record<string, string> {
  const erreurs: Record<string, string> = {};
  for (const q of questions) {
    const v = reponses[q.id];
    if (estVide(v)) {
      if (q.obligatoire) erreurs[q.id] = "Cette question est obligatoire.";
      continue;
    }
    const erreur = erreurReponse(q, v as ValeurReponse);
    if (erreur) erreurs[q.id] = erreur;
  }
  return erreurs;
}

/** Retire les réponses vides et les espaces autour des textes. */
export function reponsesNettoyees(reponses: Reponses): Reponses {
  const resultat: Reponses = {};
  for (const [id, v] of Object.entries(reponses)) {
    if (estVide(v)) continue;
    resultat[id] = typeof v === "string" ? v.trim() : v;
  }
  return resultat;
}

/** Date saisie par un star (`AAAA-MM-JJ`), sans décalage de fuseau. */
export function dateReponseLisible(valeur: string): string {
  return new Date(`${valeur}T12:00:00Z`).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
