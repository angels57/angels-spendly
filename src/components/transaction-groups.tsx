"use client";

import { useState } from "react";
import { Loader2, Repeat } from "lucide-react";
import { cn } from "cn";
import { SwipeRow } from "@/components/swipe-row";
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
import { formatMoney, type CurrencyCode } from "@/lib/money";

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
  currency: CurrencyCode;
}) {
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  // Solo una fila deslizada (abierta) a la vez.
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const close = () => setEditing(null);

  async function remove(transaction: TransactionRow) {
    const result = await deleteTransaction(transaction.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    close();
    toast(
      `${formatMoney(transaction.amountCents, transaction.currency)} borrado`,
      {
        // Más que los 4 s por defecto: da tiempo a pulsar "Deshacer".
        duration: 8000,
        action: {
          label: "Deshacer",
          onClick: async () => {
            const restored = await restoreTransaction(result.data);
            if (!restored.ok) toast.error(restored.message);
          },
        },
      },
    );
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
                  {t.pending ? (
                    <TransactionItem transaction={t} />
                  ) : (
                    <SwipeRow
                      open={swipedId === t.id}
                      onOpenChange={(open) => setSwipedId(open ? t.id : null)}
                      onEdit={() => {
                        setSwipedId(null);
                        setEditing(t);
                      }}
                      onDelete={() => remove(t)}
                    >
                      <TransactionItem
                        transaction={t}
                        onSelect={() => setEditing(t)}
                      />
                    </SwipeRow>
                  )}
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
          <div className="overflow-y-auto px-4 pt-4">
            {editing && (
              <TransactionForm
                // Clave por id: al abrir otro movimiento el formulario se reinicia.
                key={editing.id}
                initial={{
                  amountCents: editing.amountCents,
                  currency: editing.currency,
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
  /** Sin él (movimiento aún guardándose) la fila no se puede tocar. */
  onSelect?: () => void;
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
      disabled={!onSelect}
      aria-busy={t.pending || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-background px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        t.pending && "bg-primary/5 hover:bg-primary/5",
      )}
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
        {t.pending ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Guardando…
          </span>
        ) : (
          showCategory && (
            <span className="text-xs text-muted-foreground">
              {t.category?.name}
            </span>
          )
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
