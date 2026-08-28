import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar, Card, StatusBadge } from "@/components/ui";
import { FicheStarActions } from "@/components/annuaire/FicheStarActions";
import { getAcces } from "@/lib/auth";
import { getFicheStar } from "@/lib/data/annuaire";

function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function FicheStarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  const { id } = await params;
  const fiche = await getFicheStar(acces.departementId, id);
  if (!fiche) notFound();

  return (
    <>
      <Link
        href="/responsable/stars"
        className="flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={15} />
        Retour à l&apos;annuaire
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar name={fiche.nom} size="lg" />
        <div className="flex-1">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.3px] text-ink">
            {fiche.nom}
          </h1>
          <p className="mt-0.5 text-caption text-ink-48">{fiche.email}</p>
          <p className="mt-0.5 text-fine text-ink-48">
            {fiche.sections.join(", ") || "Aucune section"} ·{" "}
            {fiche.statut === "valide"
              ? "Actif"
              : fiche.statut === "desactive"
                ? "Désactivé"
                : "En attente"}
          </p>
        </div>
        {fiche.statut !== "en_attente" && (
          <FicheStarActions starId={fiche.id} actif={fiche.statut === "valide"} />
        )}
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Card title="Dimanches travaillés (ce mois)">
          <p className="font-display text-[32px] font-semibold tracking-[-0.3px] text-accent">
            {fiche.dimanchesMois}
          </p>
        </Card>

        <Card title="Sections assignées">
          {fiche.sections.length === 0 ? (
            <p className="text-caption text-ink-48">Aucune.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fiche.sections.map((s) => (
                <span
                  key={s}
                  className="rounded-pill bg-parchment px-3 py-1 text-[12px] font-semibold text-ink"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Disponibilités à venir">
          {fiche.disponibilites.length === 0 ? (
            <p className="text-caption text-ink-48">Aucune saisie.</p>
          ) : (
            fiche.disponibilites.map((d) => (
              <div
                key={d.date}
                className="flex justify-between border-b border-hairline py-1.5 text-caption last:border-0"
              >
                <span className="text-ink">{dateFr(d.date)}</span>
                <span
                  className={
                    d.statut === "disponible" ? "text-success" : "text-danger"
                  }
                >
                  {d.statut === "disponible" ? "Disponible" : "Indisponible"}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card title="Derniers shifts">
          {fiche.derniersShifts.length === 0 ? (
            <p className="text-caption text-ink-48">Aucun shift.</p>
          ) : (
            fiche.derniersShifts.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-hairline py-1.5 text-caption last:border-0"
              >
                <span className="text-ink">
                  {dateFr(s.date)} · {s.posteNom}
                </span>
                <StatusBadge statut={s.statut} />
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
