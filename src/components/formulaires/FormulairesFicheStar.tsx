import Link from "next/link";
import { Card } from "@/components/ui";
import type { FormulaireDuStar } from "@/lib/data/formulaires";
import { dateFormulaire } from "@/lib/formulaires-shared";

/** Carte « Formulaires » de la fiche d'un star. `null` : le chargement a échoué. */
export function FormulairesFicheStar({
  starId,
  formulaires,
}: {
  starId: string;
  formulaires: FormulaireDuStar[] | null;
}) {
  return (
    <Card title="Formulaires" className="md:col-span-2">
      {formulaires === null ? (
        <p role="alert" className="text-caption text-danger">
          Impossible de charger les formulaires. Rechargez la page.
        </p>
      ) : formulaires.length === 0 ? (
        <p className="text-caption text-ink-48">Aucun formulaire.</p>
      ) : (
        formulaires.map((f) => (
          <div
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hairline py-2.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-caption-strong text-ink">{f.titre}</p>
              <p className="mt-0.5 text-fine text-ink-48">
                {f.dateReponse
                  ? `Rempli le ${dateFormulaire(f.dateReponse)}`
                  : f.statut === "ferme"
                    ? "Non rempli · Formulaire fermé"
                    : "Pas encore rempli"}
              </p>
            </div>
            {f.dateReponse && (
              <Link
                href={`/responsable/stars/${starId}/formulaires/${f.id}`}
                className="flex-none text-fine font-semibold text-accent"
              >
                Voir formulaire
              </Link>
            )}
          </div>
        ))
      )}
    </Card>
  );
}
