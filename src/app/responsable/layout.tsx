import { redirect } from "next/navigation";
import { ResponsableShell } from "@/components/layout";
import { ProfilFooter } from "@/components/layout/ProfilFooter";
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
  const cumuleStar = acces.star?.statut === "valide";

  return (
    <ResponsableShell
      user={{ name: nom, role: "Responsable" }}
      sidebarFooter={
        <ProfilFooter
          autreEspace={
            cumuleStar
              ? { href: "/star/calendrier", label: "Passer à l'espace Star" }
              : undefined
          }
        />
      }
    >
      {children}
    </ResponsableShell>
  );
}
