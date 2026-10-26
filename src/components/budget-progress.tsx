import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category } from "@/lib/data";
import type { BudgetStatus } from "@/lib/budgets";
import { formatMoney } from "@/lib/money";

export function BudgetProgress({
  statuses,
  categories,
  currency,
}: {
  statuses: BudgetStatus[];
  categories: Category[];
  currency: string;
}) {
  if (statuses.length === 0) {
    return (
      <Link
        href="/categories"
        className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted"
      >
        💡 Ponle un presupuesto mensual a tus categorías para saber cuánto te
        queda.
      </Link>
    );
  }

  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presupuestos</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {statuses.map((s) => {
            const category = byId.get(s.categoryId);
            if (!category) return null;
            const over = s.remainingCents < 0;
            return (
              <li key={s.categoryId} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">
                    {category.emoji} {category.name}
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${over ? "font-bold text-destructive" : "text-muted-foreground"}`}
                  >
                    {over
                      ? `+${formatMoney(-s.remainingCents, currency)} de más`
                      : `Quedan ${formatMoney(s.remainingCents, currency)}`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${category.name}: ${formatMoney(s.spentCents, currency)} de ${formatMoney(s.budgetCents, currency)}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(s.ratio * 100)}
                  className="h-2.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full ${over ? "bg-destructive" : ""}`}
                    style={{
                      width: `${Math.min(s.ratio, 1) * 100}%`,
                      background: over ? undefined : category.color,
                      // El pastel, más intenso, para que destaque sobre el fondo.
                      filter: over ? undefined : "saturate(3) brightness(0.9)",
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatMoney(s.spentCents, currency)} de{" "}
                  {formatMoney(s.budgetCents, currency)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
