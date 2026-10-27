"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { FormFooter } from "@/components/form-footer";
import { CurrencySelect } from "@/components/currency-select";
import type { Category } from "@/lib/data";
import { formatAmountInput, type CurrencyCode } from "@/lib/money";
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
  /** Moneda principal de la lista: la de un movimiento nuevo. */
  currency: CurrencyCode;
  onSubmit: (input: TransactionInput) => Promise<Result>;
  onDelete?: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(
    initial ? formatAmountInput(initial.amountCents, initial.currency) : "",
  );
  const [currencyCode, setCurrencyCode] = useState(
    initial?.currency ?? currency,
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
      setError("Escribe un monto mayor que cero, por ejemplo 12.000.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({
        amountCents,
        currency: currencyCode,
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
          <span className="text-sm font-semibold">Monto</span>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={currencyCode}
            required
            autoFocus={!initial}
            className="h-11 text-lg font-bold"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Moneda</span>
          <CurrencySelect
            value={currencyCode}
            onChange={setCurrencyCode}
            compact
            className="w-24"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Fecha</span>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="h-11"
        />
      </label>
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

      <FormFooter
        submitLabel={initial ? "Guardar cambios" : "Añadir"}
        pending={pending || deleting}
        deleteLabel="Eliminar movimiento"
        onDelete={onDelete && (() => startDelete(onDelete))}
      />
    </form>
  );
}
