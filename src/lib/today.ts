import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
  nowInTimeZone,
  TIME_ZONE_COOKIE,
} from "@/lib/dates";

/** "Ahora" en la zona horaria del usuario (la cookie que guarda TimeZoneSync). */
export async function userNow() {
  const cookie = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  return nowInTimeZone(
    cookie && isValidTimeZone(cookie) ? cookie : DEFAULT_TIME_ZONE,
  );
}
