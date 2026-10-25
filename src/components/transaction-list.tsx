import type { TransactionRow } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export function TransactionList({
  transactions,
}: {
  transactions: TransactionRow[];
}) {
  if (transactions.length === 0) return null;

  const days = new Map<string, TransactionRow[]>();
  for (const t of transactions) {
    days.set(t.occurredOn, [...(days.get(t.occurredOn) ?? []), t]);
  }

  return (
    <section aria-label="Movimientos recientes" className="flex flex-col gap-5">
      {[...days].map(([day, items]) => (
        <div key={day} className="flex flex-col gap-1">
          <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {dayLabel(day)}
          </h2>
          <ul className="flex flex-col">
            {items.map((t) => {
              const income = t.category?.kind === "income";
              const showCategory =
                t.note &&
                t.category &&
                t.note.toLocaleLowerCase() !==
                  t.category.name.toLocaleLowerCase();
              return (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                    style={{ background: t.category?.color ?? "var(--muted)" }}
                  >
                    {t.category?.emoji ?? "💸"}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">
                      {t.note || t.category?.name || "Gasto"}
                    </span>
                    {showCategory && (
                      <span className="text-xs text-muted-foreground">
                        {t.category?.name}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-bold tabular-nums ${income ? "text-emerald-600" : ""}`}
                  >
                    {income ? "+" : "−"}
                    {formatMoney(t.amountCents, t.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
