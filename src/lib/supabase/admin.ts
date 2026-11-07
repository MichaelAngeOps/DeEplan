import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Client aux droits complets : il ignore la RLS et la clé ne doit jamais atteindre le navigateur.
 * Réservé à l'envoi des push aux responsables, depuis `@/lib/notify`. Tout autre besoin passe par
 * la session de l'utilisateur. Renvoie `null` si la clé n'est pas configurée.
 */
export function clientAdmin() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) return null;
  return createClient<Database>(env.supabaseUrl, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
