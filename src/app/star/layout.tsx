import { redirect } from "next/navigation";
import { StarShell } from "@/components/layout";
import { DeconnexionButton } from "@/components/layout/DeconnexionButton";
import { getAcces, getUser, getUtilisateur } from "@/lib/auth";
import { getNbNotificationsNonLues } from "@/lib/data/notifications";

export default async function StarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acces = await getAcces();
  if (!acces) redirect("/login");

  // Pas de rôle star, ou star non encore validé → écran d'attente.
  if (!acces.star) {
    redirect(acces.estResponsable ? "/responsable/dashboard" : "/compte-en-attente");
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
      sidebarFooter={<DeconnexionButton />}
      badges={{ "/star/notifications": nbNonLues }}
    >
      {children}
    </StarShell>
  );
}
