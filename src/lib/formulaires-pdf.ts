// Partagé client + scripts de vérification : aucune dépendance serveur ni pdfmake.
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { FormulaireDetail, ReponseNominative } from "@/lib/data/formulaires";
import {
  dateFormulaire,
  dateReponseLisible,
  type ValeurReponse,
} from "@/lib/formulaires-shared";

const SANS_REPONSE = "Sans réponse";

function texteReponse(
  type: FormulaireDetail["questions"][number]["type"],
  valeur: ValeurReponse | undefined,
): string {
  if (valeur === undefined) return SANS_REPONSE;
  if (Array.isArray(valeur)) return valeur.join(", ");
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  return type === "date" ? dateReponseLisible(valeur) : valeur;
}

/** Définition du PDF : le formulaire, puis les réponses de chaque star. */
export function definitionPdf(
  formulaire: FormulaireDetail,
  reponses: ReponseNominative[],
): TDocumentDefinitions {
  const dates = [
    formulaire.datePublication && `Publié le ${dateFormulaire(formulaire.datePublication)}`,
    formulaire.dateFermeture && `Fermé le ${dateFormulaire(formulaire.dateFermeture)}`,
  ].filter(Boolean);

  const entete: Content[] = [
    { text: formulaire.titre, style: "titre" },
    { text: dates.join(" · "), style: "discret" },
    ...(formulaire.description
      ? [{ text: formulaire.description, margin: [0, 10, 0, 0] } as Content]
      : []),
    {
      text: `${reponses.length} réponse${reponses.length > 1 ? "s" : ""}`,
      style: "discret",
      margin: [0, 10, 0, 0],
    },
  ];

  const corps: Content[] =
    reponses.length === 0
      ? [{ text: "Aucune réponse reçue.", margin: [0, 20, 0, 0] }]
      : reponses.flatMap((r): Content[] => [
          {
            text: r.starNom,
            style: "star",
            // Garde le nom avec le début de ses réponses.
            headlineLevel: 1,
          },
          {
            text: `Rempli le ${dateFormulaire(r.dateModification)}`,
            style: "discret",
            margin: [0, 0, 0, 6],
          },
          ...formulaire.questions.flatMap((q, i): Content[] => {
            const valeur = r.reponses[q.id];
            return [
              { text: `${i + 1}. ${q.libelle}`, style: "question" },
              {
                text: texteReponse(q.type, valeur),
                margin: [0, 2, 0, 0],
                ...(valeur === undefined ? { italics: true, color: "#7b7b80" } : {}),
              },
            ];
          }),
        ]);

  return {
    info: { title: formulaire.titre },
    pageSize: "LETTER",
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { fontSize: 10.5, lineHeight: 1.25 },
    styles: {
      titre: { fontSize: 20, bold: true },
      star: { fontSize: 14, bold: true, margin: [0, 22, 0, 2] },
      question: { bold: true, margin: [0, 8, 0, 0] },
      discret: { fontSize: 9.5, color: "#7b7b80" },
    },
    // Évite un nom de star seul en bas de page, séparé de ses réponses.
    pageBreakBefore: (noeud, requetes) =>
      noeud.headlineLevel === 1 && requetes.getFollowingNodesOnPage().length < 3,
    footer: (page, total) => ({
      text: `${page} / ${total}`,
      alignment: "center",
      fontSize: 8.5,
      color: "#7b7b80",
    }),
    content: [...entete, ...corps],
  };
}

/** Nom de fichier sûr, sans accents ni caractères spéciaux. */
export function nomFichierPdf(titre: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
  return `${base || "formulaire"}.pdf`;
}
