import type { Locale } from "@/i18n/config";
import { dateLocale, fromISODate } from "@/lib/dates";

type Frequency = "weekly" | "monthly" | "yearly";

/**
 * es: "Cada mes, el día 5" · "Cada semana, los lunes" · "Cada año, el 3 de marzo".
 * en: "Every month on the 5th" · "Every week on Mondays" · "Every year on March 3".
 */
export function describeRecurrence(
  frequency: Frequency,
  startDate: string,
  locale: Locale,
) {
  const date = fromISODate(startDate);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(dateLocale(locale), options).format(date);

  if (locale === "en") {
    switch (frequency) {
      case "weekly":
        return `Every week on ${format({ weekday: "long" })}s`;
      case "monthly":
        return `Every month on the ${ordinal(date.getDate())}`;
      case "yearly":
        return `Every year on ${format({ month: "long", day: "numeric" })}`;
    }
  }

  switch (frequency) {
    case "weekly": {
      const weekday = format({ weekday: "long" });
      // "sábado" → "los sábados"; "lunes" ya es plural.
      return `Cada semana, los ${weekday.endsWith("s") ? weekday : `${weekday}s`}`;
    }
    case "monthly":
      return `Cada mes, el día ${date.getDate()}`;
    case "yearly":
      return `Cada año, el ${format({ day: "numeric", month: "long" })}`;
  }
}

/** 1 → "1st", 2 → "2nd", 11 → "11th", 23 → "23rd". */
function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}
