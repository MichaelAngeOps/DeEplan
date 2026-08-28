import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Rafraîchit la session Supabase à chaque requête et propage les cookies
 * mis à jour sur la réponse. Renvoie `{ response, user, error }`.
 *
 * IMPORTANT : ne rien exécuter entre `createServerClient` et `getUser()`
 * (risque de déconnexions aléatoires — cf. docs @supabase/ssr).
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { response, user, error };
}
