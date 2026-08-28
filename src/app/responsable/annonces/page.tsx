import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { AnnoncesResponsable } from "@/components/annonces/AnnoncesResponsable";
import { getAcces } from "@/lib/auth";
import { getAnnonces } from "@/lib/data/annonces";

export const metadata = { title: "Annonces — DeEplan" };

export default async function AnnoncesPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let annonces;
  try {
    annonces = await getAnnonces(acces.departementId);
  } catch {
    return (
      <>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
          Annonces
        </h1>
        <Banner tone="danger" className="mt-6 max-w-[760px]">
          Impossible de charger les annonces. Rechargez la page.
        </Banner>
      </>
    );
  }

  return <AnnoncesResponsable annonces={annonces} />;
}
