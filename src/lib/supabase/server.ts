import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server Actions).
 *
 * Le `setAll` peut échouer depuis un Server Component (cookies en lecture seule) —
 * sans conséquence tant que le middleware rafraîchit la session à chaque navigation
 * (`src/middleware.ts`).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
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
          // Server Component : ignoré (le middleware s'en charge).
        }
      },
    },
  });
}
