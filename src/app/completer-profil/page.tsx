import { redirect } from "next/navigation";
import { CompleterProfilClient } from "@/components/inscription/CompleterProfilClient";
import { getUser, getUtilisateur } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Compléter mon profil — DeEplan" };

export default async function CompleterProfilPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Profil déjà créé → rien à faire ici.
  if (await getUtilisateur()) redirect("/apres-login");

  // Pré-remplissage du nom depuis les métadonnées du fournisseur (Google).
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const meta = (data?.claims?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
  };
  const complet = (meta.full_name ?? meta.name ?? "").trim();
  const prenomDefaut = meta.given_name ?? complet.split(" ")[0] ?? "";
  const nomDefaut =
    meta.family_name ?? complet.split(" ").slice(1).join(" ") ?? "";

  return (
    <CompleterProfilClient
      prenomDefaut={prenomDefaut}
      nomDefaut={nomDefaut}
    />
  );
}
