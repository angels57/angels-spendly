"use client";

import { useOptimistic } from "react";
import { QuickAdd } from "@/components/quick-add";
import { TransactionList } from "@/components/transaction-list";
import type { Category, TransactionRow } from "@/lib/data";
import type { CurrencyCode } from "@/lib/money";

/**
 * Movimientos recientes + quick add del inicio. Comparten estado para el
 * guardado instantáneo: el gasto aparece en la lista ("Guardando…") en
 * cuanto se envía; al confirmarse, refresh() trae la fila real en la misma
 * transición y la optimista desaparece sin parpadeo. Si falla, React la
 * quita sola y el quick add devuelve el texto.
 */
export function DashboardFeed({
  recent,
  more,
  categories,
  currency,
  month,
  spentThisMonth,
}: {
  recent: TransactionRow[];
  /** Enlace "Ver todos", si hay más de los que se muestran. */
  more?: React.ReactNode;
  categories: Category[];
  currency: CurrencyCode;
  month: string;
  spentThisMonth: Record<string, number>;
}) {
  const [transactions, addOptimistic] = useOptimistic(
    recent,
    (current, added: TransactionRow) =>
      // Más reciente primero; una fecha pasada ("ayer") cae en su día.
      [added, ...current].sort((a, b) =>
        b.occurredOn.localeCompare(a.occurredOn),
      ),
  );

  return (
    <>
      <TransactionList
        transactions={transactions}
        categories={categories}
        currency={currency}
      />
      {more}
      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-background via-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QuickAdd
          categories={categories}
          currency={currency}
          month={month}
          spentThisMonth={spentThisMonth}
          onOptimistic={addOptimistic}
        />
      </div>
    </>
  );
}
