import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout";
import { ChoixDepartementClient } from "@/components/inscription/ChoixDepartementClient";
import { getAcces } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choisir mon département — DeEplan" };

export default async function ChoisirDepartementPage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");
  if (!acces.star) redirect("/apres-login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("departements")
    .select("id, nom")
    .order("nom");

  // Départements pas encore demandés (ou refusés → re-demandables).
  const dejaActifs = new Set(
    acces.star.departements
      .filter((d) => d.statut !== "refuse")
      .map((d) => d.id),
  );
  const departements = (data ?? [])
    .filter((d) => !dejaActifs.has(d.id))
    .map((d) => ({ id: d.id, nom: d.nom }));

  return (
    <AuthShell
      heading="Choisir mon département"
      subheading="Sélectionnez le ou les départements que vous souhaitez rejoindre. Chaque responsable validera votre demande."
    >
      <ChoixDepartementClient departements={departements} />
    </AuthShell>
  );
}
