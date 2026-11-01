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

const MAX_BARS = 5;

/** El inicio en ese mes; el actual, sin parámetro. */
function homeHref(month: Date, now: Date) {
  return month.getTime() === parseMonthParam(undefined, now).getTime()
    ? "/"
    : `/?month=${monthParam(month)}`;
}

export function MonthSummary({
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
  const currentMonth = parseMonthParam(undefined, now);
  const isCurrent = month.getTime() === currentMonth.getTime();
  const title = shortMonthTitle(month, now);
  let spent = 0;
  let income = 0;
  const byCategory = new Map<
    string,
    {
      id: string;
      name: string;
      emoji: string;
      color: string;
      cents: number;
    }
  >();

  // Sin tipos de cambio, los totales y las barras son de la moneda
  // principal; el resto se muestra aparte.
  const others = totalsByCurrency(transactions, currency).slice(1);

  for (const t of transactions) {
    if (t.currency !== currency) continue;
    if (t.category?.kind === "income") {
      income += t.amountCents;
      continue;
    }
    spent += t.amountCents;
    const key = t.categoryId ?? "none";
    const entry = byCategory.get(key) ?? {
      id: key,
      name: t.category?.name ?? "Sin categoría",
      emoji: t.category?.emoji ?? "💸",
      color: t.category?.color ?? NO_CATEGORY_COLOR,
      cents: 0,
    };
    entry.cents += t.amountCents;
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
          Gastado en {title}
        </CardDescription>
        <CardAction className="-mt-2 -mr-2 flex">
          <Link
            href={homeHref(addMonths(month, -1), now)}
            aria-label="Mes anterior"
            className={arrowClass}
          >
            <ChevronLeft className="size-5" />
          </Link>
          {isCurrent ? (
            // Mantiene la flecha izquierda en su sitio.
            <span className="size-10" />
          ) : (
            <Link
              href={homeHref(addMonths(month, 1), now)}
              aria-label="Mes siguiente"
              className={arrowClass}
            >
              <ChevronRight className="size-5" />
            </Link>
          )}
        </CardAction>
        <CardTitle className="text-4xl font-extrabold tracking-tight">
          {formatMoney(spent, currency)}
        </CardTitle>
        {income > 0 && (
          <p className="text-sm font-semibold text-emerald-600">
            +{formatMoney(income, currency)} de ingresos
          </p>
        )}
        {others.length > 0 && <OtherCurrencies totals={others} />}
        {!isCurrent && (
          <Link
            href="/"
            className="text-sm font-semibold text-primary first-letter:uppercase"
          >
            Volver a {monthLabel(currentMonth)}
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {bars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isCurrent
              ? "Aún no hay gastos este mes. Escribe el primero abajo 👇"
              : `No hubo gastos en ${title}.`}
          </p>
        ) : (
          <div className="flex h-44 items-end justify-center gap-3">
            {bars.map((bar) => (
              <Link
                key={bar.id}
                href={`/transactions?month=${monthParam(month)}&category=${bar.id}`}
                aria-label={`Ver ${bar.name} en ${title}`}
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
export function MonthClosing({
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
  const change = percentChange(spentCents, previousSpentCents);
  const previous = shortMonthTitle(previousMonth, now);

  return (
    <Link
      href={homeHref(month, now)}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 text-sm transition-colors hover:bg-muted"
    >
      <span className="text-2xl">🗓️</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold first-letter:uppercase">
          {shortMonthTitle(month, now)} cerró en{" "}
          {formatMoney(spentCents, currency)}
        </span>
        {change !== null && (
          <span className="text-muted-foreground">
            {change === 0
              ? `Igual que ${previous}`
              : `${Math.abs(change)} % ${change < 0 ? "menos" : "más"} que ${previous}`}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}

/** "Además: US$ 20,00 · +12,00 €" */
export function OtherCurrencies({ totals }: { totals: CurrencyTotals[] }) {
  const parts = totals.flatMap((t) => [
    ...(t.spentCents > 0 ? [formatMoney(t.spentCents, t.currency)] : []),
    ...(t.incomeCents > 0
      ? [`+${formatMoney(t.incomeCents, t.currency)}`]
      : []),
  ]);
  return (
    <p className="text-sm text-muted-foreground">Además: {parts.join(" · ")}</p>
  );
}
