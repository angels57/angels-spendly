import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  hasLocale,
  localizePath,
  splitLocale,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces del correo (entrar, confirmar cuenta, recuperar
// contraseña): canjea el código PKCE por una sesión y sigue a `next`. Vive
// fuera de /[lang] para no cambiar las Redirect URLs de Supabase; el idioma
// sale de `next` o de la cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(cookie) ? cookie : DEFAULT_LOCALE;
  const next = searchParams.get("next") ?? "/";
  // Solo rutas internas: "/x" sí; "//otro.com" y "/\otro.com" no.
  const internal = /^\/(?![/\\])/.test(next) ? next : "/";
  const destination = splitLocale(internal).locale
    ? internal
    : localizePath(locale, internal);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(
    `${origin}${localizePath(locale, "/login")}?error=link`,
  );
}
