import { redirect } from "next/navigation";
import { StarShell } from "@/components/layout";
import { ProfilFooter } from "@/components/layout/ProfilFooter";
import { RealtimeNotifications } from "@/components/notifications/RealtimeNotifications";
import { getAcces, getUser, getUtilisateur } from "@/lib/auth";
import { getNbNotificationsNonLues } from "@/lib/data/notifications";

export default async function StarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acces = await getAcces();
  if (!acces) redirect("/login");

  // Pas de rôle star (ou profil incomplet) → `/apres-login` route correctement.
  if (!acces.star) {
    redirect(acces.estResponsable ? "/responsable/dashboard" : "/apres-login");
  }
  if (acces.star.statut !== "valide") redirect("/compte-en-attente");

  const u = await getUtilisateur();
  const nom = u ? `${u.prenom} ${u.nom}`.trim() : "Star";

  const user = await getUser();
  const nbNonLues = user ? await getNbNotificationsNonLues(user.id) : 0;

  return (
    <StarShell
      user={{ name: nom, role: "Star" }}
      mobileTitle="DeEplan"
      sidebarFooter={
        <ProfilFooter
          autreEspace={
            acces.estResponsable
              ? {
                  href: "/responsable/dashboard",
                  label: "Passer à l'espace Responsable",
                }
              : undefined
          }
          rejoindreDepartement
        />
      }
      badges={{ "/star/notifications": nbNonLues }}
    >
      {user && <RealtimeNotifications userId={user.id} />}
      {children}
    </StarShell>
  );
}
