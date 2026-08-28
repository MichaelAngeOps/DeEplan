import { redirect } from "next/navigation";
import { Banner, Card } from "@/components/ui";
import { StarsDeService } from "@/components/dashboard/StarsDeService";
import { getAcces } from "@/lib/auth";
import { getShiftsDuJour } from "@/lib/data/dashboard";
import { aujourdhuiISO } from "@/lib/dates";

export const metadata = { title: "Tableau de bord — DeEplan" };

export default async function DashboardPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let shifts: Awaited<ReturnType<typeof getShiftsDuJour>> | null = null;
  try {
    shifts = await getShiftsDuJour(acces.departementId, aujourdhuiISO());
  } catch {
    shifts = null;
  }

  const dateLisible = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Tableau de bord
      </h1>
      <p className="mt-1 text-body capitalize text-ink-48">{dateLisible}</p>

      {acces.star?.statut === "en_attente" && (
        <Banner tone="info" className="mt-5 max-w-container-text">
          Votre rôle Star est en attente de validation par un responsable.
        </Banner>
      )}

      <Card
        className="mt-6 max-w-container-text"
        title="Stars de service aujourd'hui"
        headerAction={
          <span className="text-fine text-ink-48">
            {shifts?.length ?? 0} planifié{(shifts?.length ?? 0) > 1 ? "s" : ""}
          </span>
        }
      >
        {shifts === null ? (
          <Banner tone="danger">
            Chargement des shifts du jour impossible. Rechargez la page.
          </Banner>
        ) : shifts.length === 0 ? (
          <p className="text-caption text-ink-48">
            Personne n&apos;est de service aujourd&apos;hui.
          </p>
        ) : (
          <StarsDeService shifts={shifts} />
        )}
      </Card>
    </>
  );
}
