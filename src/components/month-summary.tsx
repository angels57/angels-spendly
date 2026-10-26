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
import { formatMoney } from "@/lib/money";

const MAX_BARS = 5;

export function MonthSummary({
  transactions,
  currency,
}: {
  transactions: TransactionRow[];
  currency: string;
}) {
  let spent = 0;
  let income = 0;
  const byCategory = new Map<
    string,
    { name: string; emoji: string; color: string; cents: number }
  >();

  for (const t of transactions) {
    if (t.category?.kind === "income") {
      income += t.amountCents;
      continue;
    }
    spent += t.amountCents;
    const key = t.category?.name ?? "Sin categoría";
    const entry = byCategory.get(key) ?? {
      name: key,
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

  return (
    <Card>
      <CardHeader>
        <CardDescription className="first-letter:uppercase">
          Gastado en {monthLabel()}
        </CardDescription>
        <CardTitle className="text-4xl font-extrabold tracking-tight">
          {formatMoney(spent, currency)}
        </CardTitle>
        {income > 0 && (
          <p className="text-sm font-semibold text-emerald-600">
            +{formatMoney(income, currency)} de ingresos
          </p>
        )}
      </CardHeader>
      <CardContent>
        {bars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay gastos este mes. Escribe el primero abajo 👇
          </p>
        ) : (
          <div className="flex h-44 items-end gap-3">
            {bars.map((bar) => (
              <div
                key={bar.name}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
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
