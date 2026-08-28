import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { ValidationsClient } from "@/components/validations/ValidationsClient";
import { getAcces } from "@/lib/auth";
import { getStructure } from "@/lib/data/structure";
import { getComptesEnAttente } from "@/lib/data/validations";

export const metadata = { title: "Comptes en attente — DeEplan" };

export default async function ValidationsPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let comptes;
  let sections;
  try {
    [comptes, sections] = await Promise.all([
      getComptesEnAttente(acces.departementId),
      getStructure(acces.departementId),
    ]);
  } catch {
    return (
      <>
        <Entete count={0} />
        <Banner tone="danger" className="mt-6 max-w-[720px]">
          Impossible de charger les comptes en attente. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <>
      <Entete count={comptes.length} />
      <ValidationsClient
        comptes={comptes}
        sections={sections.map((s) => ({ id: s.id, nom: s.nom }))}
      />
    </>
  );
}

function Entete({ count }: { count: number }) {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Comptes en attente de validation
      </h1>
      <p className="mt-1 text-body text-ink-48">
        {count === 0
          ? "Aucune inscription à traiter."
          : `${count} inscription${count > 1 ? "s" : ""} à traiter.`}
      </p>
    </div>
  );
}
