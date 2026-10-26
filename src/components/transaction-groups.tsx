"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import {
  deleteTransaction,
  restoreTransaction,
  updateTransaction,
} from "@/app/(app)/actions";
import type { Category, TransactionRow } from "@/lib/data";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import { formatMoney } from "@/lib/money";

export type TransactionGroup = {
  day: string;
  label: string;
  items: TransactionRow[];
};

export function TransactionGroups({
  groups,
  categories,
  currency,
}: {
  groups: TransactionGroup[];
  categories: Category[];
  currency: string;
}) {
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const close = () => setEditing(null);

  async function remove(transaction: TransactionRow) {
    const result = await deleteTransaction(transaction.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    close();
    toast(`${formatMoney(transaction.amountCents, currency)} borrado`, {
      // Más que los 4 s por defecto: da tiempo a pulsar "Deshacer".
      duration: 8000,
      action: {
        label: "Deshacer",
        onClick: async () => {
          const restored = await restoreTransaction(result.data);
          if (!restored.ok) toast.error(restored.message);
        },
      },
    });
  }

  return (
    <>
      <section aria-label="Movimientos" className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-1">
            <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </h2>
            <ul className="flex flex-col">
              {group.items.map((t) => (
                <li key={t.id}>
                  <TransactionItem
                    transaction={t}
                    onSelect={() => setEditing(t)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <Drawer open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              Editar movimiento
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {editing && (
              <TransactionForm
                // Clave por id: al abrir otro movimiento el formulario se reinicia.
                key={editing.id}
                initial={{
                  amountCents: editing.amountCents,
                  date: editing.occurredOn,
                  categoryId: editing.categoryId,
                  note: editing.note,
                }}
                categories={categories}
                currency={currency}
                onSubmit={async (input) => {
                  const result = await updateTransaction(editing.id, input);
                  if (result.ok) {
                    close();
                    toast.success("Cambios guardados");
                  }
                  return result;
                }}
                onDelete={() => remove(editing)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function TransactionItem({
  transaction: t,
  onSelect,
}: {
  transaction: TransactionRow;
  onSelect: () => void;
}) {
  const income = t.category?.kind === "income";
  const title = t.note || t.category?.name || "Sin categoría";
  const showCategory =
    t.note &&
    t.category &&
    t.note.toLocaleLowerCase() !== t.category.name.toLocaleLowerCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
        style={{ background: t.category?.color ?? NO_CATEGORY_COLOR }}
      >
        {t.category?.emoji ?? "💸"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 truncate font-semibold">
          <span className="truncate">{title}</span>
          {t.recurring && (
            <Repeat
              aria-label="Recurrente"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
        </span>
        {showCategory && (
          <span className="text-xs text-muted-foreground">
            {t.category?.name}
          </span>
        )}
      </span>
      <span
        className={`font-bold tabular-nums ${income ? "text-emerald-600" : ""}`}
      >
        {income ? "+" : "−"}
        {formatMoney(t.amountCents, t.currency)}
      </span>
    </button>
  );
}
