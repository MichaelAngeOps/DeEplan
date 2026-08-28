import { redirect } from "next/navigation";
import { getAcces, routePardefaut } from "@/lib/auth";

/** Empêche un utilisateur déjà connecté de revenir sur les écrans d'auth. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acces = await getAcces();
  if (acces) redirect(routePardefaut(acces));
  return <>{children}</>;
}
