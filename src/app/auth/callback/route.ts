import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces del correo (entrar, confirmar cuenta, recuperar
// contraseña): canjea el código PKCE por una sesión y sigue a `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Solo rutas internas: "/x" sí; "//otro.com" y "/\otro.com" no.
  const destination = /^\/(?![/\\])/.test(next) ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
