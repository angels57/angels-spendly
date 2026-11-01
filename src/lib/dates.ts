import { toISODate } from "@/lib/parser";
import type { Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";

/** Locale de Intl para fechas: "en" → "en-US" ("Oct 26"), "es" → "es". */
export function dateLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es";
}

// Fechas de la base (YYYY-MM-DD) como Date local, sin desfase de zona.
export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayLabel(iso: string, locale: Locale, now = new Date()) {
  const { today: todayLabel, yesterday: yesterdayLabel } =
    DICTIONARIES[locale].common;
  const today = toISODate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (iso === today) return todayLabel;
  if (iso === toISODate(yesterday)) return yesterdayLabel;
  const date = fromISODate(iso);
  return new Intl.DateTimeFormat(dateLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function startOfMonthISO(now = new Date()) {
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function monthLabel(locale: Locale, now = new Date()) {
  return new Intl.DateTimeFormat(dateLocale(locale), { month: "long" }).format(
    now,
  );
}

// Meses como "YYYY-MM" en la URL (?month=2026-10).

export function parseMonthParam(param: unknown, now = new Date()) {
  const match =
    typeof param === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(param) : null;
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
}

export function monthParam(month: Date) {
  return toISODate(month).slice(0, 7);
}

export function addMonths(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

/** Rango [from, to) del mes, para filtrar por occurred_on. */
export function monthRange(month: Date) {
  return {
    from: toISODate(month),
    to: toISODate(addMonths(month, 1)),
  };
}

export function monthTitle(month: Date, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(month);
}
