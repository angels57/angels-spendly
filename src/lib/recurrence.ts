import type { Locale } from "@/i18n/config";
import { dateLocale, fromISODate } from "@/lib/dates";
import { LAST_DAY_OF_MONTH, type Frequency } from "@/lib/schemas";

// Los nombres de las frecuencias ("Cada mes", "Every month") están en los
// diccionarios: recurringForm.frequency.

/** "15" · "el último día" / "15th" · "the last day". */
export function monthDayLabel(day: number, locale: Locale) {
  if (day === LAST_DAY_OF_MONTH) {
    return locale === "en" ? "the last day" : "el último día";
  }
  return locale === "en" ? ordinal(day) : String(day);
}

/**
 * es: "Cada mes, el día 5" · "Cada semana, los lunes" · "Cada año, el 3 de
 * marzo" · "Cada quincena, el 15 y el último día".
 * en: "Every month on the 5th" · "Every week on Mondays" · "Every year on
 * March 3" · "Twice a month, on the 15th and the last day".
 */
export function describeRecurrence(
  frequency: Frequency,
  startDate: string,
  locale: Locale,
  days?: { firstDay: number | null; secondDay: number | null },
) {
  const date = fromISODate(startDate);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(dateLocale(locale), options).format(date);

  if (locale === "en") {
    switch (frequency) {
      case "weekly":
        return `Every week on ${format({ weekday: "long" })}s`;
      case "semimonthly": {
        if (!days?.firstDay || !days.secondDay) return "Twice a month";
        return `Twice a month, on the ${ordinal(days.firstDay)} and ${
          days.secondDay === LAST_DAY_OF_MONTH
            ? "the last day"
            : `${ordinal(days.secondDay)}`
        }`;
      }
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
    case "semimonthly": {
      if (!days?.firstDay || !days.secondDay) return "Cada quincena";
      const second = monthDayLabel(days.secondDay, locale);
      return days.secondDay === LAST_DAY_OF_MONTH
        ? `Cada quincena, el ${days.firstDay} y ${second}`
        : `Cada quincena, los días ${days.firstDay} y ${second}`;
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
