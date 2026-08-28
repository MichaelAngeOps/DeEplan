import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout";
import { ChoixDepartementClient } from "@/components/inscription/ChoixDepartementClient";
import { getAcces } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choisir mon département — DeEplan" };

export default async function ChoisirDepartementPage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");
  if (!acces.star || acces.star.statut === "valide") redirect("/apres-login");
  if (acces.star.statut === "desactive") redirect("/compte-en-attente");
  if (acces.star.departementChoisi) redirect("/compte-en-attente");

  const supabase = await createClient();
  const { data } = await supabase
    .from("departements")
    .select("id, nom")
    .order("nom");
  const departements = (data ?? []).map((d) => ({ id: d.id, nom: d.nom }));

  return (
    <AuthShell
      heading="Choisir mon département"
      subheading="Sélectionnez le département que vous souhaitez rejoindre. Son responsable validera ensuite votre compte."
    >
      <ChoixDepartementClient departements={departements} />
    </AuthShell>
  );
}
