import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { StructureClient } from "@/components/structure/StructureClient";
import { getAcces } from "@/lib/auth";
import { getStructure } from "@/lib/data/structure";

export const metadata = { title: "Structure — DeEplan" };

export default async function StructurePage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let sections;
  try {
    sections = await getStructure(acces.departementId);
  } catch {
    return (
      <>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
          Structure du département
        </h1>
        <Banner tone="danger" className="mt-6 max-w-[820px]">
          Impossible de charger la structure du département. Rechargez la page.
        </Banner>
      </>
    );
  }

  return <StructureClient sections={sections} />;
}
