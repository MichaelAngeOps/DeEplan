import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Rafraîchit la session Supabase à chaque requête et propage les cookies
 * mis à jour sur la réponse. Renvoie `{ response, user, error }`.
 *
 * Vérification du JWT **en local** via `getClaims()` (clés asymétriques ES256
 * + JWKS mis en cache) : évite un appel `/auth/v1/user` à chaque navigation
 * (endpoint soumis à un rate limit strict). `getClaims()` rafraîchit le jeton
 * via `getSession()` s'il est proche de l'expiration → `setAll` écrit alors les
 * nouveaux cookies. Compromis assumé : un compte supprimé/banni côté serveur
 * garde son accès jusqu'à l'expiration du jeton (≤ 1 h).
 *
 * IMPORTANT : ne rien exécuter entre `createServerClient` et `getClaims()`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  const user = typeof sub === "string" ? { id: sub } : null;

  return { response, user, error };
}
