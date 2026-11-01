import { fromISODate } from "@/lib/dates";
import { LAST_DAY_OF_MONTH, type Frequency } from "@/lib/schemas";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Cada semana",
  semimonthly: "Cada quincena",
  monthly: "Cada mes",
  yearly: "Cada año",
};

/** "15" · "el último día". */
export function monthDayLabel(day: number) {
  return day === LAST_DAY_OF_MONTH ? "el último día" : String(day);
}

/** "Cada mes, el día 5" · "Cada semana, los lunes" · "Cada año, el 3 de marzo"
 * · "Cada quincena, el 15 y el último día". */
export function describeRecurrence(
  frequency: Frequency,
  startDate: string,
  days?: { firstDay: number | null; secondDay: number | null },
) {
  const date = fromISODate(startDate);
  switch (frequency) {
    case "weekly": {
      const weekday = new Intl.DateTimeFormat("es", {
        weekday: "long",
      }).format(date);
      // "sábado" → "los sábados"; "lunes" ya es plural.
      return `Cada semana, los ${weekday.endsWith("s") ? weekday : `${weekday}s`}`;
    }
    case "semimonthly": {
      if (!days?.firstDay || !days.secondDay) return "Cada quincena";
      const second = monthDayLabel(days.secondDay);
      return days.secondDay === LAST_DAY_OF_MONTH
        ? `Cada quincena, el ${days.firstDay} y ${second}`
        : `Cada quincena, los días ${days.firstDay} y ${second}`;
    }
    case "monthly":
      return `Cada mes, el día ${date.getDate()}`;
    case "yearly":
      return `Cada año, el ${new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "long",
      }).format(date)}`;
  }
}
