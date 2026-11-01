"use client";

import { createContext, useContext } from "react";
import { localizePath, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";

// Idioma y textos para Client Components. El layout raíz pasa solo el
// idioma: los diccionarios tienen funciones (plurales, variables) que no se
// pueden enviar del servidor al cliente, así que se importan aquí.

const I18nContext = createContext<Locale | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <I18nContext value={locale}>{children}</I18nContext>;
}

export function useLocale(): Locale {
  const locale = useContext(I18nContext);
  if (!locale) throw new Error("Falta <I18nProvider> en el árbol.");
  return locale;
}

/** Textos del idioma actual. */
export function useT() {
  return DICTIONARIES[useLocale()];
}

/** Ruta interna con el prefijo del idioma actual: "/settings" → "/es/settings". */
export function useLocalHref() {
  const locale = useLocale();
  return (path: string) => localizePath(locale, path);
}
