import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server Actions).
 *
 * Note : le `setAll` peut échouer quand il est appelé depuis un Server Component
 * (les cookies y sont en lecture seule) — c'est sans conséquence tant qu'un
 * middleware rafraîchit la session à chaque navigation. Le middleware sera mis
 * en place avec le lot « Authentification » (prompt §9).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Appelé depuis un Server Component : ignoré (voir note ci-dessus).
        }
      },
    },
  });
}
