import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Préfixes accessibles sans être connecté. */
const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/inscription",
  "/mot-de-passe-oublie",
  "/auth",
  "/design", // pages de vérification temporaires (Lot 0)
];

/** Chemins de bruit (sondes, monitoring) : ne pas solliciter l'auth Supabase. */
const IGNORES = ["/metrics", "/health", "/healthz", "/.well-known", "/robots.txt"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isIgnore(pathname: string): boolean {
  return IGNORES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  if (isIgnore(request.nextUrl.pathname)) return NextResponse.next();

  const { response, user, error } = await updateSession(request);

  // Erreur transitoire côté auth (rate limit, indisponibilité) : ne pas
  // déconnecter l'utilisateur — laisser passer, les gardes de page décideront.
  const authIndisponible =
    !user && !!error && (error.status === 429 || (error.status ?? 0) >= 500);

  if (!user && !authIndisponible && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("suite", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    // Reporter les cookies de session rafraîchis par `updateSession` :
    // sans ça, un refresh + redirection perd la nouvelle session.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Toutes les requêtes sauf :
     * - _next/static, _next/image
     * - favicon, fichiers d'images
     * - metrics / health / .well-known (sondes de monitoring)
     */
    "/((?!_next/static|_next/image|favicon.ico|metrics|health|healthz|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
