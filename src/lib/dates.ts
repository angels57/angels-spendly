import { toISODate } from "@/lib/parser";

// Fechas de la base (YYYY-MM-DD) como Date local, sin desfase de zona.
export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayLabel(iso: string, now = new Date()) {
  const today = toISODate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (iso === today) return "Hoy";
  if (iso === toISODate(yesterday)) return "Ayer";
  const date = fromISODate(iso);
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function startOfMonthISO(now = new Date()) {
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function monthLabel(now = new Date()) {
  return new Intl.DateTimeFormat("es", { month: "long" }).format(now);
}
