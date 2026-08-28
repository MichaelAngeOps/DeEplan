"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Déconnecte l'utilisateur courant et renvoie vers l'accueil. */
export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
