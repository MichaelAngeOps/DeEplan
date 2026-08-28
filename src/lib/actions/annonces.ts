"use server";

import { revalidatePath } from "next/cache";
import { getAcces, getUser } from "@/lib/auth";
import { notifierPlusieurs } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

const PATH_R = "/responsable/annonces";
const TITRE_MAX = 120;
const CONTENU_MAX = 5000;

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

function propre(v: string): string {
  return v.trim().replace(/[ \t]+/g, " ");
}

function valider(titre: string, contenu: string): string | null {
  if (!propre(titre)) return "Le titre est requis.";
  if (propre(titre).length > TITRE_MAX)
    return `Le titre ne doit pas dépasser ${TITRE_MAX} caractères.`;
  if (!contenu.trim()) return "Le contenu est requis.";
  if (contenu.trim().length > CONTENU_MAX)
    return `Le contenu ne doit pas dépasser ${CONTENU_MAX} caractères.`;
  return null;
}

async function garde(): Promise<
  { ok: true; departementId: string } | { ok: false; erreur: string }
> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  return { ok: true, departementId: acces.departementId };
}

function revalider() {
  revalidatePath(PATH_R);
  revalidatePath("/star/notifications");
  revalidatePath("/star", "layout"); // pastille de nav
}

export async function creerAnnonce(
  titre: string,
  contenu: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;
  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };

  const probleme = valider(titre, contenu);
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();
  const { error } = await supabase.from("annonces").insert({
    departement_id: g.departementId,
    responsable_id: user.id,
    titre: propre(titre),
    contenu: contenu.trim(),
  });
  if (error) return { ok: false, erreur: "Publication impossible. Réessayez." };

  // Notifie chaque star du département (best-effort).
  const { data: secs } = await supabase
    .from("sections")
    .select("id")
    .eq("departement_id", g.departementId);
  const { data: liens } = await supabase
    .from("star_sections")
    .select("star_id")
    .in("section_id", (secs ?? []).map((s) => s.id));
  const starIds = [...new Set((liens ?? []).map((l) => l.star_id))];
  // Notification autonome : titre + contenu complet (il n'y a plus d'écran
  // « Annonces » côté Star, tout passe par les notifications).
  await notifierPlusieurs(
    starIds,
    "annonce",
    `📣 ${propre(titre)}\n\n${contenu.trim()}`,
  );

  revalider();
  return { ok: true };
}

export async function modifierAnnonce(
  id: string,
  titre: string,
  contenu: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const probleme = valider(titre, contenu);
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();
  const { data: existe } = await supabase
    .from("annonces")
    .select("id")
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .maybeSingle();
  if (!existe) return { ok: false, erreur: "Annonce introuvable." };

  const { error } = await supabase
    .from("annonces")
    .update({ titre: propre(titre), contenu: contenu.trim() })
    .eq("id", id);
  if (error) return { ok: false, erreur: "Modification impossible. Réessayez." };

  revalider();
  return { ok: true };
}

export async function supprimerAnnonce(id: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();
  const { data: existe } = await supabase
    .from("annonces")
    .select("id")
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .maybeSingle();
  if (!existe) return { ok: false, erreur: "Annonce introuvable." };

  const { error } = await supabase.from("annonces").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessayez." };

  revalider();
  return { ok: true };
}
