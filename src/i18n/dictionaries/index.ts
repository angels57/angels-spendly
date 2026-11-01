import type { Locale } from "@/i18n/config";
import { en, type Dictionary } from "./en";
import { es } from "./es";

export type { Dictionary };

// Dos idiomas y pocos textos: se importan los dos sin carga diferida.
export const DICTIONARIES: Record<Locale, Dictionary> = { en, es };
