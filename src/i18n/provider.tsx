"use client";

import { createContext, useContext } from "react";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Idioma y textos para Client Components. El layout raíz los recibe del
// servidor (root params) y los reparte por contexto.

const I18nContext = createContext<{
  locale: Locale;
  dictionary: Dictionary;
} | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return <I18nContext value={{ locale, dictionary }}>{children}</I18nContext>;
}

function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("Falta <I18nProvider> en el árbol.");
  return value;
}

/** Textos del idioma actual. */
export function useT() {
  return useI18n().dictionary;
}

export function useLocale() {
  return useI18n().locale;
}

/** Ruta interna con el prefijo del idioma actual: "/settings" → "/es/settings". */
export function useLocalHref() {
  const { locale } = useI18n();
  return (path: string) => localizePath(locale, path);
}
