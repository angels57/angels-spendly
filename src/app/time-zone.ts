"use server";

import { cookies } from "next/headers";
import { isValidTimeZone, TIME_ZONE_COOKIE } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

/**
 * Guarda la zona horaria del dispositivo: en una cookie, para las páginas,
 * y en el perfil, para que los recurrentes se generen en su fecha local.
 * Devuelve si la cookie cambió (hay que volver a pedir la página).
 */
export async function saveTimeZone(timeZone: string): Promise<boolean> {
  if (!isValidTimeZone(timeZone)) return false;

  const cookieStore = await cookies();
  const changed = cookieStore.get(TIME_ZONE_COOKIE)?.value !== timeZone;
  if (changed) {
    cookieStore.set(TIME_ZONE_COOKIE, timeZone, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // En /login aún no hay sesión: basta con la cookie.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    await supabase
      .from("profiles")
      .update({ time_zone: timeZone })
      .eq("id", data.claims.sub)
      .neq("time_zone", timeZone);
  }
  return changed;
}
