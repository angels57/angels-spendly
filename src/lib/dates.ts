import { toISODate } from "@/lib/parser";
import type { Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";

/** Locale de Intl para fechas: "en" → "en-US" ("Oct 26"), "es" → "es". */
export function dateLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es";
}

// Zona horaria del usuario. El servidor corre en UTC: sin ella, en
// Colombia a las 7 de la noche del 31 de octubre ya sería noviembre.
export const TIME_ZONE_COOKIE = "tz";
/** Hasta que el navegador mande la suya. */
export const DEFAULT_TIME_ZONE = "America/Bogota";

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * La hora de `timeZone` como Date con esa hora local, para usar
 * getDate()/getMonth() igual en el servidor (UTC) y en el navegador.
 */
export function nowInTimeZone(timeZone: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)]),
  );
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
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

/** Mes del inicio: el de ?month=, sin pasar del actual (no hay futuros). */
export function homeMonth(param: unknown, now = new Date()) {
  const current = parseMonthParam(undefined, now);
  const requested = parseMonthParam(param, now);
  return requested > current ? current : requested;
}

/** "octubre" en el año actual, "diciembre de 2025" en otro. */
export function shortMonthTitle(month: Date, locale: Locale, now = new Date()) {
  return month.getFullYear() === now.getFullYear()
    ? monthLabel(locale, month)
    : monthTitle(month, locale);
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
