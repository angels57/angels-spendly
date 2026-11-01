import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TransactionRow } from "@/lib/data";
import { monthLabel } from "@/lib/dates";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import {
  formatMoney,
  totalsByCurrency,
  type CurrencyTotals,
  type CurrencyCode,
} from "@/lib/money";
import { getDictionary, getLocale } from "@/i18n/server";

const MAX_BARS = 5;

export async function MonthSummary({
  transactions,
  currency,
  now,
}: {
  transactions: TransactionRow[];
  currency: CurrencyCode;
  /** Ahora, en la zona horaria del usuario. */
  now: Date;
}) {
  const t = await getDictionary();
  const locale = await getLocale();
  let spent = 0;
  let income = 0;
  const byCategory = new Map<
    string,
    { name: string; emoji: string; color: string; cents: number }
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
    const key = tx.category?.name ?? t.common.uncategorized;
    const entry = byCategory.get(key) ?? {
      name: key,
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

  return (
    <Card>
      <CardHeader>
        <CardDescription className="first-letter:uppercase">
          {t.home.spentIn(monthLabel(locale, now))}
        </CardDescription>
        <CardTitle className="text-4xl font-extrabold tracking-tight">
          {formatMoney(spent, currency, locale)}
        </CardTitle>
        {income > 0 && (
          <p className="text-sm font-semibold text-emerald-600">
            {t.home.income(formatMoney(income, currency, locale))}
          </p>
        )}
        {others.length > 0 && <OtherCurrencies totals={others} />}
      </CardHeader>
      <CardContent>
        {bars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.home.empty}
          </p>
        ) : (
          <div className="flex h-44 items-end justify-center gap-3">
            {bars.map((bar) => (
              <div
                key={bar.name}
                className="flex h-full max-w-20 min-w-0 flex-1 flex-col items-center justify-end gap-1"
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
