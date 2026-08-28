import { NextResponse, type NextRequest } from "next/server";
import { getAcces, routePardefaut } from "@/lib/auth";

/**
 * Point d'atterrissage après connexion : calcule la destination selon les
 * droits et redirige. `?suite=` permet de revenir à la page demandée
 * initialement (si compatible avec les droits).
 */
export async function GET(request: NextRequest) {
  const acces = await getAcces();
  if (!acces) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const suite = request.nextUrl.searchParams.get("suite");
  const cible = routePardefaut(acces);

  const dest =
    suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : cible;

  return NextResponse.redirect(new URL(dest, request.url));
}
