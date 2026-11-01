// Idiomas de la app. Funciones puras: las usan el proxy, el servidor y el
// cliente. El idioma vive en la URL (/en/…, /es/…); la cookie recuerda la
// última elección para las rutas sin prefijo y para Server Actions.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string | null | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** "/es/transactions" → { locale: "es", path: "/transactions" }. */
export function splitLocale(pathname: string): {
  locale: Locale | null;
  path: string;
} {
  const [, first, ...rest] = pathname.split("/");
  if (!hasLocale(first)) return { locale: null, path: pathname };
  return { locale: first, path: `/${rest.join("/")}` };
}

/** ("es", "/transactions?q=x") → "/es/transactions?q=x"; ("es", "/") → "/es". */
export function localizePath(locale: Locale, path: string) {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path}`;
}

/**
 * El primer idioma admitido de una cabecera Accept-Language, por
 * preferencia: "es-CO,es;q=0.9,en;q=0.8" → "es". Null si no hay ninguno.
 */
export function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        quality: q ? Number(q.slice(2)) : 1,
        index,
      };
    })
    .filter((entry) => entry.language && entry.quality > 0)
    // Misma calidad: gana el que aparece antes.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return (
    (ranked.find((entry) => hasLocale(entry.language))?.language as
      Locale | undefined) ?? null
  );
}
