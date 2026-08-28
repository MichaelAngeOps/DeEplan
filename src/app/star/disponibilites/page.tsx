import { Banner } from "@/components/ui";
import { DisponibilitesClient } from "@/components/disponibilites/DisponibilitesClient";
import { getUser } from "@/lib/auth";
import { getDisponibilites, getJoursAvecShift } from "@/lib/data/disponibilites";
import { moisDecale, premierDuMois } from "@/lib/dates";

export const metadata = { title: "Mes disponibilités — DeEplan" };

/** Mois éditables : le mois courant + les 2 suivants. */
const NB_MOIS = 3;

export default async function DisponibilitesPage() {
  const user = await getUser();
  if (!user) return null; // le layout Star gère la redirection

  const now = new Date();
  const annee = now.getFullYear();
  const mois = now.getMonth() + 1;

  const debut = premierDuMois(annee, mois);
  const fin = moisDecale(annee, mois, NB_MOIS);
  const moisEditables = Array.from({ length: NB_MOIS }, (_, i) => {
    const iso = moisDecale(annee, mois, i); // "YYYY-MM-01"
    const [a, m] = iso.split("-");
    return { annee: Number(a), mois: Number(m) };
  });

  let dispos;
  let joursAvecShift: string[];
  try {
    [dispos, joursAvecShift] = await Promise.all([
      getDisponibilites(user.id, debut, fin),
      getJoursAvecShift(user.id, debut, fin),
    ]);
  } catch {
    return (
      <>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Mes disponibilités
        </h2>
        <Banner tone="danger" className="mt-4 max-w-[520px]">
          Impossible de charger vos disponibilités. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <DisponibilitesClient
      dispos={dispos}
      joursAvecShift={joursAvecShift}
      moisEditables={moisEditables}
    />
  );
}
