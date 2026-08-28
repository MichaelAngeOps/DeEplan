import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée des liens d'authentification par email (réinitialisation de
 * mot de passe, invitation, magic link…). Échange le `code` PKCE contre une
 * session puis redirige vers `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?erreur=lien_invalide`,
  );
}
