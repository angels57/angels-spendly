import {
  TransactionGroups,
  type TransactionGroup,
} from "@/components/transaction-groups";
import type { Category, TransactionRow } from "@/lib/data";
import { dayLabel } from "@/lib/dates";

// Agrupa por día en el servidor; la interacción (editar/borrar) es cliente.
export function TransactionList({
  transactions,
  categories,
  currency,
  empty,
}: {
  transactions: TransactionRow[];
  categories: Category[];
  currency: string;
  empty?: React.ReactNode;
}) {
  if (transactions.length === 0) return empty ?? null;

  const groups = new Map<string, TransactionGroup>();
  for (const t of transactions) {
    const group = groups.get(t.occurredOn) ?? {
      day: t.occurredOn,
      label: dayLabel(t.occurredOn),
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
