"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowUp, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTransaction } from "@/app/(app)/actions";
import type { Category } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import { formatMoney } from "@/lib/money";
import { parseExpense } from "@/lib/parser";

const FALLBACK_CATEGORY = "Otros";

export function QuickAdd({
  categories,
  currency,
  month,
  spentThisMonth,
}: {
  categories: Category[];
  currency: string;
  /** Mes actual "YYYY-MM": el presupuesto solo aplica a gastos de este mes. */
  month: string;
  /** Gastado este mes por categoría, en centavos. */
  spentThisMonth: Record<string, number>;
}) {
  const [text, setText] = useState("");
  // La categoría que elige el usuario a mano gana a la que adivina el parser.
  const [pickedCategoryId, setPickedCategoryId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(
    () => (text.trim() ? parseExpense(text, categories) : null),
    [text, categories],
  );
  const fallbackId =
    categories.find((c) => c.name === FALLBACK_CATEGORY)?.id ?? null;
  const categoryId = pickedCategoryId ?? parsed?.categoryId ?? fallbackId;
  const category = categories.find((c) => c.id === categoryId);

  // Cuánto quedaría del presupuesto si se guarda este gasto.
  const remainingAfter =
    parsed?.amountCents != null &&
    category?.budgetCents != null &&
    category.kind === "expense" &&
    parsed.date.startsWith(month)
      ? category.budgetCents -
        (spentThisMonth[category.id] ?? 0) -
        parsed.amountCents
      : null;

  function reset() {
    setText("");
    setPickedCategoryId(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed || pending) return;
    if (parsed.amountCents === null) {
      toast.error("Falta el monto", { description: "Por ejemplo: comida 12" });
      return;
    }
    const amountCents = parsed.amountCents;
    startTransition(async () => {
      const result = await createTransaction({
        amountCents,
        date: parsed.date,
        categoryId,
        note: parsed.note,
        source: "text",
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        `${category?.emoji ?? "💸"} ${formatMoney(amountCents, currency)} guardado`,
      );
      reset();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-3xl border bg-card p-2 shadow-lg"
    >
      {parsed && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center gap-1.5 px-1 pt-1 text-sm"
        >
          <span
            className={`rounded-full px-2.5 py-1 font-bold ${
              parsed.amountCents === null
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            {parsed.amountCents === null
              ? "¿Monto?"
              : `${category?.kind === "income" ? "+" : ""}${formatMoney(parsed.amountCents, currency)}`}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <CalendarDays className="size-3.5" />
            {dayLabel(parsed.date)}
          </span>
          <label className="relative">
            <span className="sr-only">Categoría</span>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setPickedCategoryId(e.target.value || null)}
              className="cursor-pointer appearance-none rounded-full py-1 pr-2.5 pl-2.5 font-semibold text-neutral-900"
              style={{ background: category?.color ?? NO_CATEGORY_COLOR }}
            >
              {!categoryId && <option value="">Sin categoría</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
          {remainingAfter !== null && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                remainingAfter < 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {remainingAfter < 0
                ? `+${formatMoney(-remainingAfter, currency)} sobre el presupuesto`
                : `Quedarán ${formatMoney(remainingAfter, currency)}`}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="comida 12 ayer"
          aria-label="Nuevo gasto"
          autoComplete="off"
          enterKeyHint="send"
          className="h-12 rounded-2xl border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Guardar gasto"
          disabled={!parsed || pending}
          className="size-11 shrink-0 rounded-2xl"
        >
          {pending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </Button>
      </div>
    </form>
  );
}
