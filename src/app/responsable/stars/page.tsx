import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { AnnuaireClient } from "@/components/annuaire/AnnuaireClient";
import { getAcces } from "@/lib/auth";
import { getAnnuaire } from "@/lib/data/annuaire";

export const metadata = { title: "Annuaire des stars — DeEplan" };

export default async function StarsPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let stars;
  try {
    stars = await getAnnuaire(acces.departementId);
  } catch {
    return (
      <>
        <Entete />
        <Banner tone="danger" className="mt-6">
          Impossible de charger l&apos;annuaire. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <>
      <Entete />
      <div className="mt-6">
        <AnnuaireClient stars={stars} />
      </div>
    </>
  );
}

function Entete() {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Annuaire des stars
      </h1>
      <p className="mt-1 text-body text-ink-48">
        Les stars rattachés aux sections de votre département.
      </p>
    </div>
  );
}
