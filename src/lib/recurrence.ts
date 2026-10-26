import { fromISODate } from "@/lib/dates";

type Frequency = "weekly" | "monthly" | "yearly";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Cada semana",
  monthly: "Cada mes",
  yearly: "Cada año",
};

/** "Cada mes, el día 5" · "Cada semana, los lunes" · "Cada año, el 3 de marzo". */
export function describeRecurrence(frequency: Frequency, startDate: string) {
  const date = fromISODate(startDate);
  switch (frequency) {
    case "weekly": {
      const weekday = new Intl.DateTimeFormat("es", {
        weekday: "long",
      }).format(date);
      // "sábado" → "los sábados"; "lunes" ya es plural.
      return `Cada semana, los ${weekday.endsWith("s") ? weekday : `${weekday}s`}`;
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
