import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the auth session on every request and writes the updated
// cookies to both the request (for Server Components) and the response.
export async function updateSession(request: NextRequest) {
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

  // Chequeo optimista: la autorización real está en la DAL y en RLS.
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (!signedIn && !isPublic) {
    return redirectKeepingCookies(request, response, "/login");
  }
  if (signedIn && pathname === "/login") {
    return redirectKeepingCookies(request, response, "/");
  }

  return response;
}

const PUBLIC_PATHS = ["/login", "/auth", "/offline"];

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
