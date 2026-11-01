import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TransactionRow } from "@/lib/data";
import {
  addMonths,
  monthLabel,
  monthParam,
  parseMonthParam,
  shortMonthTitle,
} from "@/lib/dates";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import {
  formatMoney,
  percentChange,
  totalsByCurrency,
  type CurrencyTotals,
  type CurrencyCode,
} from "@/lib/money";
import { getDictionary, getLocalHref, getLocale } from "@/i18n/server";

const MAX_BARS = 5;

/** El inicio en ese mes; el actual, sin parámetro. */
async function homeHref(month: Date, now: Date) {
  const to = await getLocalHref();
  return month.getTime() === parseMonthParam(undefined, now).getTime()
    ? to("/")
    : `${to("/")}?month=${monthParam(month)}`;
}

export async function MonthSummary({
  transactions,
  currency,
  month,
  now,
}: {
  transactions: TransactionRow[];
  currency: CurrencyCode;
  /** Primer día del mes que se muestra. */
  month: Date;
  /** Ahora, en la zona horaria del usuario. */
  now: Date;
}) {
  const [t, locale, to] = await Promise.all([
    getDictionary(),
    getLocale(),
    getLocalHref(),
  ]);
  const currentMonth = parseMonthParam(undefined, now);
  const isCurrent = month.getTime() === currentMonth.getTime();
  const title = shortMonthTitle(month, locale, now);
  const [prevHref, nextHref] = await Promise.all([
    homeHref(addMonths(month, -1), now),
    homeHref(addMonths(month, 1), now),
  ]);
  let spent = 0;
  let income = 0;
  const byCategory = new Map<
    string,
    { id: string; name: string; emoji: string; color: string; cents: number }
  >();

  // Sin tipos de cambio, los totales y las barras son de la moneda
  // principal; el resto se muestra aparte.
  const others = totalsByCurrency(transactions, currency).slice(1);

  for (const tx of transactions) {
    if (tx.currency !== currency) continue;
    if (tx.category?.kind === "income") {
      income += tx.amountCents;
      continue;
    }
    spent += tx.amountCents;
    const key = tx.categoryId ?? "none";
    const entry = byCategory.get(key) ?? {
      id: key,
      name: tx.category?.name ?? t.common.uncategorized,
      emoji: tx.category?.emoji ?? "💸",
      color: tx.category?.color ?? NO_CATEGORY_COLOR,
      cents: 0,
    };
    entry.cents += tx.amountCents;
    byCategory.set(key, entry);
  }

  const bars = [...byCategory.values()]
    .sort((a, b) => b.cents - a.cents)
    .slice(0, MAX_BARS);
  const max = bars[0]?.cents ?? 0;
  const arrowClass =
    "flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <Card>
      <CardHeader>
        <CardDescription className="first-letter:uppercase">
          {t.home.spentIn(title)}
        </CardDescription>
        <CardAction className="-mt-2 -mr-2 flex">
          <Link
            href={prevHref}
            aria-label={t.filters.previousMonth}
            className={arrowClass}
          >
            <ChevronLeft className="size-5" />
          </Link>
          {isCurrent ? (
            // Mantiene la flecha izquierda en su sitio.
            <span className="size-10" />
          ) : (
            <Link
              href={nextHref}
              aria-label={t.filters.nextMonth}
              className={arrowClass}
            >
              <ChevronRight className="size-5" />
            </Link>
          )}
        </CardAction>
        <CardTitle className="text-4xl font-extrabold tracking-tight">
          {formatMoney(spent, currency, locale)}
        </CardTitle>
        {income > 0 && (
          <p className="text-sm font-semibold text-emerald-600">
            {t.home.income(formatMoney(income, currency, locale))}
          </p>
        )}
        {others.length > 0 && <OtherCurrencies totals={others} />}
        {!isCurrent && (
          <Link
            href={to("/")}
            className="text-sm font-semibold text-primary first-letter:uppercase"
          >
            {t.home.backTo(monthLabel(locale, currentMonth))}
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {bars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isCurrent ? t.home.empty : t.home.emptyPast(title)}
          </p>
        ) : (
          <div className="flex h-44 items-end justify-center gap-3">
            {bars.map((bar) => (
              <Link
                key={bar.id}
                href={to(
                  `/transactions?month=${monthParam(month)}&category=${bar.id}`,
                )}
                aria-label={t.home.seeCategory(bar.name, title)}
                className="flex h-full max-w-20 min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-2xl transition-opacity hover:opacity-80"
              >
                <div
                  className="flex min-h-14 w-full flex-col items-center justify-end rounded-2xl pb-2"
                  style={{
                    height: `${(bar.cents / max) * 80}%`,
                    background: bar.color,
                  }}
                >
                  <span className="text-lg">{bar.emoji}</span>
                  <span className="text-xs font-bold text-neutral-900">
                    {Math.round((bar.cents / spent) * 100)}%
                  </span>
                </div>
                <span className="w-full truncate text-center text-xs text-muted-foreground">
                  {bar.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** "Octubre cerró en $1.240.000 · 8 % menos que septiembre", los primeros
 * días del mes, mientras el actual aún está casi vacío. */
export async function MonthClosing({
  month,
  previousMonth,
  spentCents,
  previousSpentCents,
  currency,
  now,
}: {
  month: Date;
  previousMonth: Date;
  spentCents: number;
  previousSpentCents: number;
  currency: CurrencyCode;
  now: Date;
}) {
  if (spentCents === 0) return null;
  const [t, locale, href] = await Promise.all([
    getDictionary(),
    getLocale(),
    homeHref(month, now),
  ]);
  const change = percentChange(spentCents, previousSpentCents);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 text-sm transition-colors hover:bg-muted"
    >
      <span className="text-2xl">🗓️</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold first-letter:uppercase">
          {t.home.closed(
            shortMonthTitle(month, locale, now),
            formatMoney(spentCents, currency, locale),
          )}
        </span>
        {change !== null && (
          <span className="text-muted-foreground">
            {t.home.vsPrevious(
              change,
              shortMonthTitle(previousMonth, locale, now),
            )}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}

/** "Además: US$ 20,00 · +12,00 €" */
export async function OtherCurrencies({
  totals,
}: {
  totals: CurrencyTotals[];
}) {
  const t = await getDictionary();
  const locale = await getLocale();
  const parts = totals.flatMap((t) => [
    ...(t.spentCents > 0
      ? [formatMoney(t.spentCents, t.currency, locale)]
      : []),
    ...(t.incomeCents > 0
      ? [`+${formatMoney(t.incomeCents, t.currency, locale)}`]
      : []),
  ]);
  return (
    <p className="text-sm text-muted-foreground">
      {t.home.otherCurrencies(parts.join(" · "))}
    </p>
  );
}
