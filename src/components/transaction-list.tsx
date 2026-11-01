import {
  TransactionGroups,
  type TransactionGroup,
} from "@/components/transaction-groups";
import type { Category, TransactionRow } from "@/lib/data";
import { dayLabel, fromISODate } from "@/lib/dates";
import type { CurrencyCode } from "@/lib/money";

// Agrupa por día en el servidor; la interacción (editar/borrar) es cliente.
export function TransactionList({
  transactions,
  categories,
  currency,
  today,
  empty,
}: {
  transactions: TransactionRow[];
  categories: Category[];
  currency: CurrencyCode;
  /** Hoy (YYYY-MM-DD) en la zona horaria del usuario, para «Hoy» y «Ayer». */
  today: string;
  empty?: React.ReactNode;
}) {
  if (transactions.length === 0) return empty ?? null;

  const groups = new Map<string, TransactionGroup>();
  for (const t of transactions) {
    const group = groups.get(t.occurredOn) ?? {
      day: t.occurredOn,
      label: dayLabel(t.occurredOn, fromISODate(today)),
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
