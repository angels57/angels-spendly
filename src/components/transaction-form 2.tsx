"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/data";
import { parseAmount, toISODate } from "@/lib/parser";
import type { TransactionInput } from "@/lib/schemas";

type Result = { ok: true } | { ok: false; message: string };

export const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function TransactionForm({
  initial,
  categories,
  currency,
  onSubmit,
  onDelete,
}: {
  initial?: TransactionInput;
  categories: Category[];
  currency: string;
  onSubmit: (input: TransactionInput) => Promise<Result>;
  onDelete?: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(
    initial ? (initial.amountCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [date, setDate] = useState(initial?.date ?? toISODate(new Date()));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const amountCents = parseAmount(amount);
    if (amountCents === null) {
      setError("Escribe un monto mayor que cero, por ejemplo 12,50.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({
        amountCents,
        date,
        categoryId: categoryId || null,
        note: note.trim(),
      });
      if (!result.ok) setError(result.message);
    });
  }

  const expenses = categories.filter((c) => c.kind === "expense");
  const incomes = categories.filter((c) => c.kind === "income");

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">Monto ({currency})</span>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            required
            autoFocus={!initial}
            className="h-11 text-lg font-bold"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">Fecha</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-11"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Categoría</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClassName}
        >
          <option value="">Sin categoría</option>
          <optgroup label="Gastos">
            {expenses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </optgroup>
          {incomes.length > 0 && (
            <optgroup label="Ingresos">
              {incomes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nota</span>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Opcional"
          className="h-11"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label="Borrar movimiento"
            disabled={deleting || pending}
            onClick={() => startDelete(onDelete)}
            className="h-11 text-destructive"
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={pending || deleting}
          className="h-11 flex-1"
        >
          {pending && <Loader2 className="animate-spin" />}
          {initial ? "Guardar cambios" : "Añadir"}
        </Button>
      </div>
    </form>
  );
}
