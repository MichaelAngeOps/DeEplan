import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée des retours d'authentification : liens email (réinitialisation
 * de mot de passe, magic link) **et** OAuth (Google). Échange le `code` PKCE
 * contre une session puis redirige vers `next` (défaut : `/apres-login`, qui
 * route selon les droits — ou `/completer-profil` si le profil n'existe pas).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/apres-login";
  const dest =
    next.startsWith("/") && !next.startsWith("//") ? next : "/apres-login";

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
