import {
  TransactionGroups,
  type TransactionGroup,
} from "@/components/transaction-groups";
import type { Category, TransactionRow } from "@/lib/data";
import type { CurrencyCode } from "@/lib/money";

// Agrupa por día; la etiqueta del día ("Hoy", "Mon, Oct 26") y la
// interacción (editar/borrar) van en TransactionGroups, que es cliente.
export function TransactionList({
  transactions,
  categories,
  currency,
  empty,
}: {
  transactions: TransactionRow[];
  categories: Category[];
  currency: CurrencyCode;
  empty?: React.ReactNode;
}) {
  if (transactions.length === 0) return empty ?? null;

  const groups = new Map<string, TransactionGroup>();
  for (const t of transactions) {
    const group = groups.get(t.occurredOn) ?? {
      day: t.occurredOn,
      items: [],
    };
    group.items.push(t);
    groups.set(t.occurredOn, group);
  }

  return (
    <TransactionGroups
      groups={[...groups.values()]}
      categories={categories}
      currency={currency}
    />
  );
}
