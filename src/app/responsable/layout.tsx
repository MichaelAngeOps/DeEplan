import { redirect } from "next/navigation";
import { ResponsableShell } from "@/components/layout";
import { DeconnexionButton } from "@/components/layout/DeconnexionButton";
import { getAcces, getUtilisateur, routePardefaut } from "@/lib/auth";

export default async function ResponsableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acces = await getAcces();
  if (!acces) redirect("/login");
  if (!acces.estResponsable) redirect(routePardefaut(acces));

  const u = await getUtilisateur();
  const nom = u ? `${u.prenom} ${u.nom}`.trim() : "Responsable";

  return (
    <ResponsableShell
      user={{ name: nom, role: "Responsable" }}
      sidebarFooter={<DeconnexionButton />}
    >
      {children}
    </ResponsableShell>
  );
}
