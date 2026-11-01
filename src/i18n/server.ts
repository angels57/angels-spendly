import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, localizePath, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";

// Idioma y textos en Server Components, sin pasarlos por props: el idioma
// es el parámetro raíz de app/[lang]. No sirve en Server Actions ni Route
// Handlers (ver request.ts).

export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary() {
  return DICTIONARIES[await getLocale()];
}

/**
 * Para enlaces internos: resuelve el idioma una vez y devuelve
 * `to("/settings")` → "/es/settings" (síncrona, cómoda dentro del JSX).
 */
export async function getLocalHref() {
  const locale = await getLocale();
  return (path: string) => localizePath(locale, path);
}
