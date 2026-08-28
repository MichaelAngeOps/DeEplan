// Serveur uniquement (dépend de next/headers via @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { StatutRole, Utilisateur } from "@/types/domain";

/** Identité minimale de l'utilisateur courant (extraite du JWT vérifié). */
export interface UtilisateurAuth {
  id: string;
  email: string | null;
}

/** Accès applicatif de l'utilisateur courant. */
export interface Acces {
  /** Possède un département → accès espace Responsable (RLS `is_any_responsable`). */
  estResponsable: boolean;
  departementId: string | null;
  /** Rôle « star » si présent (quel que soit son statut), sinon `null`. */
  star: {
    statut: StatutRole;
    sectionIds: string[];
    /** Département choisi à l'inscription (avant validation), ou `null`. */
    departementChoisi: string | null;
  } | null;
}

/**
 * Utilisateur `auth` courant, ou `null`. Vérification **locale** du JWT via
 * `getClaims()` (ES256 + JWKS) — pas d'appel `/auth/v1/user` par rendu (le
 * middleware a déjà validé + rafraîchi la session pour cette requête).
 */
export const getUser = cache(async (): Promise<UtilisateurAuth | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c || typeof c.sub !== "string") return null;
  return { id: c.sub, email: typeof c.email === "string" ? c.email : null };
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
      .select("role, statut, departement_id")
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
          departementChoisi: roleStar.departement_id ?? null,
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
