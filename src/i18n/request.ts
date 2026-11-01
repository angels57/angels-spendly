import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_OPTIONS,
  hasLocale,
  type Locale,
} from "@/i18n/config";

/**
 * Idioma en Server Actions y Route Handlers, donde no hay root params: la
 * cookie que el proxy mantiene igual al idioma de la URL que se está viendo.
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

/** Recuerda el idioma en la cookie (Server Actions y Route Handlers). */
export async function setLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
}
