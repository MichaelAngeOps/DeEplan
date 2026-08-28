import { redirect } from "next/navigation";
import { Banner, Card } from "@/components/ui";
import { AlertesPanel } from "@/components/dashboard/AlertesPanel";
import { StarsDeService } from "@/components/dashboard/StarsDeService";
import { getAcces } from "@/lib/auth";
import {
  getConflitsDispo,
  getShiftsAConfirmer,
  getShiftsDuJour,
} from "@/lib/data/dashboard";
import { getComptesEnAttente } from "@/lib/data/validations";
import { aujourdhuiISO } from "@/lib/dates";

export const metadata = { title: "Tableau de bord — DeEplan" };

export default async function DashboardPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");
  const departementId = acces.departementId;

  let shifts: Awaited<ReturnType<typeof getShiftsDuJour>> | null = null;
  let conflits: Awaited<ReturnType<typeof getConflitsDispo>> = [];
  let aConfirmer: Awaited<ReturnType<typeof getShiftsAConfirmer>> = [];
  let nbEnAttente = 0;
  try {
    [shifts, conflits, aConfirmer, nbEnAttente] = await Promise.all([
      getShiftsDuJour(departementId, aujourdhuiISO()),
      getConflitsDispo(departementId),
      getShiftsAConfirmer(departementId),
      getComptesEnAttente(departementId).then((c) => c.length),
    ]);
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

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Stars de service aujourd'hui"
          headerAction={
            <span className="text-fine text-ink-48">
              {shifts?.length ?? 0} planifié{(shifts?.length ?? 0) > 1 ? "s" : ""}
            </span>
          }
        >
          {shifts === null ? (
            <Banner tone="danger">
              Chargement du tableau de bord impossible. Rechargez la page.
            </Banner>
          ) : shifts.length === 0 ? (
            <p className="text-caption text-ink-48">
              Personne n&apos;est de service aujourd&apos;hui.
            </p>
          ) : (
            <StarsDeService shifts={shifts} />
          )}
        </Card>

        <AlertesPanel
          conflits={conflits}
          aConfirmer={aConfirmer}
          nbEnAttente={nbEnAttente}
        />
      </div>
    </>
  );
}
