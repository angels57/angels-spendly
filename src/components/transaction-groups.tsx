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
} from "@/app/[lang]/(app)/actions";
import type { Category, TransactionRow } from "@/lib/data";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { useT, useLocale } from "@/i18n/provider";
import { dayLabel, fromISODate } from "@/lib/dates";
import { ROW_EXIT_MS, pause, useArrivals } from "@/lib/motion";

export type TransactionGroup = {
  day: string;
  items: TransactionRow[];
};

export function TransactionGroups({
  groups,
  categories,
  currency,
  today,
}: {
  groups: TransactionGroup[];
  categories: Category[];
  currency: CurrencyCode;
  /** Hoy (YYYY-MM-DD) en la zona horaria del usuario: "Today" / "Yesterday". */
  today: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  // Solo una fila deslizada (abierta) a la vez.
  const [swipedId, setSwipedId] = useState<string | null>(null);
  // Borrado desde el formulario: la fila sale animada como al deslizar.
  const [removingId, setRemovingId] = useState<string | null>(null);
  const close = () => setEditing(null);
  const items = groups.flatMap((g) => g.items);
  const { fresh, confirmed } = useArrivals(items);
  // Ya borrada: si vuelve (deshacer), entra visible.
  if (removingId && !items.some((tx) => tx.id === removingId)) {
    setRemovingId(null);
  }

  async function remove(transaction: TransactionRow) {
    const result = await deleteTransaction(transaction.id);
    if (!result.ok) {
      toast.error(t.errors[result.error]);
      return false;
    }
    close();
    toast(
      t.transactionForm.deleted(
        formatMoney(transaction.amountCents, transaction.currency, locale),
      ),
      {
        // Más que los 4 s por defecto: da tiempo a pulsar "Deshacer".
        duration: 8000,
        action: {
          label: t.common.undo,
          onClick: async () => {
            const restored = await restoreTransaction(result.data);
            if (!restored.ok) toast.error(t.errors[restored.error]);
          },
        },
      },
    );
    return true;
  }

  async function removeFromForm(transaction: TransactionRow) {
    close();
    setRemovingId(transaction.id);
    await pause(ROW_EXIT_MS);
    if (!(await remove(transaction))) setRemovingId(null);
  }

  return (
    <>
      <section aria-label={t.nav.transactions} className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-1">
            <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {dayLabel(group.day, locale, fromISODate(today))}
            </h2>
            <ul className="flex flex-col">
              {group.items.map((t) => (
                <li
                  key={t.id}
                  // grid: animate-row-in abre la fila desde altura 0.
                  className={cn(
                    "grid grid-rows-[1fr]",
                    fresh.has(t.id) && "animate-row-in",
                  )}
                >
                  {t.pending ? (
                    <div className="min-h-0 overflow-hidden rounded-2xl">
                      <TransactionItem transaction={t} />
                    </div>
                  ) : (
                    <SwipeRow
                      open={swipedId === t.id}
                      onOpenChange={(open) => setSwipedId(open ? t.id : null)}
                      onEdit={() => {
                        setSwipedId(null);
                        setEditing(t);
                      }}
                      onDelete={() => remove(t)}
                      removing={removingId === t.id}
                    >
                      <TransactionItem
                        transaction={t}
                        confirmed={confirmed.has(t.id)}
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
              {t.transactionForm.editTitle}
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
                onSubmit={(input) => updateTransaction(editing.id, input)}
                onSaved={() => {
                  close();
                  toast.success(t.common.changesSaved);
                }}
                onDelete={() => removeFromForm(editing)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function TransactionItem({
  transaction: tx,
  confirmed = false,
  onSelect,
}: {
  transaction: TransactionRow;
  /** Acaba de reemplazar a su versión optimista: el resaltado se apaga. */
  confirmed?: boolean;
  /** Sin él (movimiento aún guardándose) la fila no se puede tocar. */
  onSelect?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const income = tx.category?.kind === "income";
  const title = tx.note || tx.category?.name || t.common.uncategorized;
  const showCategory =
    tx.note &&
    tx.category &&
    tx.note.toLocaleLowerCase() !== tx.category.name.toLocaleLowerCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      aria-busy={tx.pending || undefined}
      className={cn(
        "flex w-full pressable items-center gap-3 rounded-2xl bg-background px-1 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        tx.pending && "bg-primary/5 opacity-70 hover:bg-primary/5",
        confirmed && "animate-row-confirmed",
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
        style={{ background: tx.category?.color ?? NO_CATEGORY_COLOR }}
      >
        {tx.category?.emoji ?? "💸"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 truncate font-semibold">
          <span className="truncate">{title}</span>
          {tx.recurring && (
            <Repeat
              aria-label={t.transactionForm.recurring}
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
        </span>
        {tx.pending ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            {t.transactionForm.saving}
          </span>
        ) : (
          showCategory && (
            <span className="text-xs text-muted-foreground">
              {tx.category?.name}
            </span>
          )
        )}
      </span>
      <span
        className={`font-bold tabular-nums ${income ? "text-emerald-600" : ""}`}
      >
        {income ? "+" : "−"}
        {formatMoney(tx.amountCents, tx.currency, locale)}
      </span>
    </button>
  );
}
