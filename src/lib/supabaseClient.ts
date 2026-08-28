"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Client Supabase côté navigateur (Client Components).
 * Pour les Server Components / Route Handlers / Middleware, utiliser
 * `@/lib/supabase/server` à la place.
 */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
