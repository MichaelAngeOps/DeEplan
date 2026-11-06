import { Card } from "@/components/ui";
import type { QuestionFormulaire } from "@/lib/data/formulaires";
import {
  dateReponseLisible,
  type Reponses,
  type ValeurReponse,
} from "@/lib/formulaires-shared";

function Valeur({
  question,
  valeur,
}: {
  question: QuestionFormulaire;
  valeur: ValeurReponse | undefined;
}) {
  if (valeur === undefined)
    return <p className="text-caption italic text-ink-48">Sans réponse</p>;

  if (Array.isArray(valeur))
    return (
      <ul className="list-disc pl-5 text-caption text-ink">
        {valeur.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    );

  if (typeof valeur === "boolean")
    return <p className="text-caption text-ink">{valeur ? "Oui" : "Non"}</p>;

  return (
    <p className="whitespace-pre-wrap break-words text-caption text-ink">
      {question.type === "date" ? dateReponseLisible(valeur) : valeur}
    </p>
  );
}

export function ReponsesStar({
  questions,
  reponses,
}: {
  questions: QuestionFormulaire[];
  reponses: Reponses;
}) {
  return (
    <Card>
      <ol className="flex flex-col">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className="border-b border-hairline py-3 first:pt-0 last:border-0 last:pb-0"
          >
            <p className="mb-1.5 text-caption-strong text-ink">
              {i + 1}. {q.libelle}
            </p>
            <Valeur question={q} valeur={reponses[q.id]} />
          </li>
        ))}
      </ol>
    </Card>
  );
}
