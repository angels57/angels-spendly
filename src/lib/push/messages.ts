import { hasLocale, localizePath, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { addMonths, monthLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

// Del aviso que decide la base de datos (push_budget_alert, push_due) al
// texto que se ve en el móvil, en el idioma de la cuenta. Funciones puras:
// se testean sin enviar nada.

/** Lo que recibe el service worker (public/sw.js). */
export type PushPayload = {
  title: string;
  body: string;
  /** Página que abre al tocar el aviso. */
  url: string;
  /** Avisos con el mismo tag se reemplazan en vez de acumularse. */
  tag: string;
};

export type PushMessage = {
  key: string;
  kind: string;
  locale: string;
  hide_amounts: boolean;
  data: unknown;
};

type BudgetData = {
  threshold: number;
  categoryId: string;
  emoji: string;
  name: string;
  spentCents: number;
  budgetCents: number;
  currency: string;
};
type RecurringData = {
  note: string;
  emoji: string | null;
  amountCents: number;
  currency: string;
};
type MonthData = {
  /** "YYYY-MM" */
  month: string;
  spentCents: number;
  previousSpentCents: number;
  currency: string;
};

export function buildNotification(message: PushMessage): PushPayload | null {
  const locale: Locale = hasLocale(message.locale) ? message.locale : "en";
  const t = DICTIONARIES[locale].push;
  const money = (cents: number, currency: string) =>
    formatMoney(cents, currency, locale);
  const hide = message.hide_amounts;
  const to = (path: string) => localizePath(locale, path);

  switch (message.kind) {
    case "budget": {
      const d = message.data as BudgetData;
      const percent = Math.floor((d.spentCents / d.budgetCents) * 100);
      return {
        title:
          d.spentCents >= d.budgetCents
            ? t.budgetOverTitle(d.emoji, d.name)
            : t.budgetTitle(d.emoji, d.name, percent),
        body: hide
          ? t.budgetBodyHidden
          : t.budgetBody(
              money(d.spentCents, d.currency),
              money(d.budgetCents, d.currency),
            ),
        url: to("/"),
        tag: `budget:${d.categoryId}`,
      };
    }
    case "recurring": {
      const d = message.data as RecurringData;
      return {
        title: t.recurringTitle(d.emoji ?? "🔁", d.note),
        body: hide
          ? t.recurringBodyHidden
          : t.recurringBody(money(d.amountCents, d.currency)),
        url: to("/transactions"),
        tag: message.key,
      };
    }
    case "daily":
      return {
        title: t.dailyTitle,
        body: t.dailyBody,
        url: to("/"),
        tag: "daily",
      };
    case "month": {
      const d = message.data as MonthData;
      const [year, month] = d.month.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      const name = capitalize(monthLabel(locale, date));
      const spent = money(d.spentCents, d.currency);
      const change =
        d.previousSpentCents > 0
          ? Math.round((d.spentCents / d.previousSpentCents - 1) * 100)
          : null;
      return {
        title: t.monthTitle(name),
        body: hide
          ? t.monthBodyHidden
          : change === null || change === 0
            ? t.monthBody(spent)
            : t.monthBodyChange(
                spent,
                change,
                monthLabel(locale, addMonths(date, -1)),
              ),
        url: `${to("/")}?month=${d.month}`,
        tag: message.key,
      };
    }
    case "test":
      return {
        title: t.testTitle,
        body: t.testBody,
        url: to("/settings"),
        tag: "test",
      };
    default:
      return null;
  }
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
