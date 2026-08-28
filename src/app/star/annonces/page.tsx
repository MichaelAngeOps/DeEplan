import { Banner, EmptyState } from "@/components/ui";
import { getDepartementId } from "@/lib/auth";
import { getAnnonces } from "@/lib/data/annonces";

export const metadata = { title: "Annonces — DeEplan" };

function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function StarAnnoncesPage() {
  const departementId = await getDepartementId();

  let annonces: Awaited<ReturnType<typeof getAnnonces>> = [];
  if (departementId) {
    try {
      annonces = await getAnnonces(departementId);
    } catch {
      return (
        <>
          <Titre />
          <Banner tone="danger" className="mt-4 max-w-[560px]">
            Impossible de charger les annonces. Rechargez la page.
          </Banner>
        </>
      );
    }
  }

  return (
    <>
      <Titre />
      {annonces.length === 0 ? (
        <EmptyState
          className="mt-4 max-w-[560px]"
          message="Aucune annonce pour le moment."
        />
      ) : (
        <div className="mt-4 flex max-w-[560px] flex-col gap-3">
          {annonces.map((a) => (
            <article
              key={a.id}
              className="rounded-lg border border-hairline bg-canvas p-4"
            >
              <p className="text-fine text-ink-48">{dateFr(a.date)}</p>
              <h3 className="mt-1 text-caption-strong text-ink">{a.titre}</h3>
              <p className="mt-1 whitespace-pre-wrap text-caption text-ink-48">
                {a.contenu}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Titre() {
  return (
    <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
      Annonces
    </h2>
  );
}
