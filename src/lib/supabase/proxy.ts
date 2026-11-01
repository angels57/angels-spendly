import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { localizePath, type Locale } from "@/i18n/config";

// Refreshes the auth session on every request and writes the updated
// cookies to both the request (for Server Components) and the response.
// `route`: idioma y ruta sin prefijo ("/es/login" → es, "/login"). Sin él
// (p. ej. /auth/callback) solo se refresca la sesión.
export async function updateSession(
  request: NextRequest,
  route?: { locale: Locale; path: string },
) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims():
  // it validates the JWT and triggers the refresh.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  if (!route) return response;

  // Chequeo optimista: la autorización real está en la DAL y en RLS.
  const { locale, path } = route;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  if (!signedIn && !isPublic) {
    return redirectKeepingCookies(
      request,
      response,
      localizePath(locale, "/login"),
    );
  }
  if (signedIn && path === "/login") {
    return redirectKeepingCookies(request, response, localizePath(locale, "/"));
  }

  return response;
}

const PUBLIC_PATHS = ["/login", "/offline"];

function redirectKeepingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
