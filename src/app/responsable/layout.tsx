import { redirect } from "next/navigation";
import { ResponsableShell } from "@/components/layout";
import { ProfilFooter } from "@/components/layout/ProfilFooter";
import { RealtimeNotifications } from "@/components/notifications/RealtimeNotifications";
import { getAcces, getUser, getUtilisateur, routePardefaut } from "@/lib/auth";
import { getNbNotificationsNonLues } from "@/lib/data/notifications";

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
  const user = await getUser();
  const nbNonLues = user ? await getNbNotificationsNonLues(user.id, "responsable") : 0;

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
      badges={{ "/responsable/notifications": nbNonLues }}
    >
      {user && <RealtimeNotifications userId={user.id} />}
      {children}
    </ResponsableShell>
  );
}
