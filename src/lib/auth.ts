// Serveur uniquement (dépend de next/headers via @/lib/supabase/server).
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { StatutRole, Utilisateur } from "@/types/domain";

/** Accès applicatif de l'utilisateur courant. */
export interface Acces {
  /** Possède un département → accès espace Responsable (RLS `is_any_responsable`). */
  estResponsable: boolean;
  departementId: string | null;
  /** Rôle « star » si présent (quel que soit son statut), sinon `null`. */
  star: { statut: StatutRole; sectionIds: string[] } | null;
}

/** Utilisateur `auth` courant (session vérifiée côté serveur), ou `null`. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();

  // Une erreur transitoire (429 rate limit, 5xx) ne doit pas faire passer un
  // utilisateur connecté pour déconnecté → une nouvelle tentative après pause.
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await supabase.auth.getUser();
    if (!error) return data.user;
    const transitoire = error.status === 429 || (error.status ?? 0) >= 500;
    if (!transitoire || essai === 1) return null;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
});

/** Ligne `public.utilisateurs` de l'utilisateur courant, ou `null`. */
export const getUtilisateur = cache(async (): Promise<Utilisateur | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("utilisateurs")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

/** Droits d'accès de l'utilisateur courant. `null` si non connecté. */
export const getAcces = cache(async (): Promise<Acces | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const [departements, roles, sections] = await Promise.all([
    supabase.from("departements").select("id").eq("responsable_id", user.id),
    supabase
      .from("roles_utilisateurs")
      .select("role, statut")
      .eq("utilisateur_id", user.id),
    supabase.from("star_sections").select("section_id").eq("star_id", user.id),
  ]);

  const roleStar = roles.data?.find((r) => r.role === "star");

  return {
    estResponsable: (departements.data?.length ?? 0) > 0,
    departementId: departements.data?.[0]?.id ?? null,
    star: roleStar
      ? {
          statut: roleStar.statut as StatutRole,
          sectionIds: (sections.data ?? []).map((s) => s.section_id),
        }
      : null,
  };
});

/** Destination par défaut selon les droits (utilisé après login). */
export function routePardefaut(acces: Acces): string {
  const starValide = acces.star?.statut === "valide";
  if (acces.estResponsable && starValide) return "/choix-role";
  if (acces.estResponsable) return "/responsable/dashboard";
  if (acces.star) {
    return starValide ? "/star/calendrier" : "/compte-en-attente";
  }
  // Aucun rôle exploitable : renvoyer vers l'attente (cas inscription star pure).
  return "/compte-en-attente";
}
