import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  hasLocale,
  localizePath,
  matchAcceptLanguage,
  splitLocale,
  type Locale,
} from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

// 1. Rutas sin idioma ("/", "/transactions", enlaces antiguos, la PWA ya
//    instalada): redirigen a /{idioma}/… según cookie → navegador → inglés.
// 2. Rutas con idioma: la cookie recuerda ese idioma (la leen las Server
//    Actions) y se comprueba la sesión.
// /auth/callback no lleva idioma: así no cambian las Redirect URLs de Supabase.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth/")) return updateSession(request);

  const { locale, path } = splitLocale(pathname);
  if (!locale) {
    const chosen = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = localizePath(chosen, pathname);
    return rememberLocale(NextResponse.redirect(url), chosen);
  }

  const response = await updateSession(request, { locale, path });
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    rememberLocale(response, locale);
  }
  return response;
}

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(saved)) return saved;
  return (
    matchAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

function rememberLocale(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    // Everything except static files, images and the PWA assets.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
