"use client";

import { useState, useTransition } from "react";
import { Plus, Repeat, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { FormFooter } from "@/components/form-footer";
import { selectClassName } from "@/components/transaction-form";
import {
  createRecurring,
  deleteRecurring,
  restoreRecurring,
  updateRecurring,
} from "@/app/(app)/recurring/actions";
import type { Category, RecurringRow } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { CurrencySelect } from "@/components/currency-select";
import { formatAmountInput, formatMoney, type CurrencyCode } from "@/lib/money";
import { parseAmount, toISODate } from "@/lib/parser";
import { describeRecurrence, FREQUENCY_LABELS } from "@/lib/recurrence";
import {
  FREQUENCIES,
  recurringInputSchema,
  NO_CATEGORY_COLOR,
} from "@/lib/schemas";

type Editing = { mode: "new" } | { mode: "edit"; rule: RecurringRow };

export function RecurringManager({
  rules,
  categories,
  currency,
}: {
  rules: RecurringRow[];
  categories: Category[];
  currency: CurrencyCode;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const close = () => setEditing(null);
  const active = rules.filter((r) => r.nextRun !== null);
  const finished = rules.filter((r) => r.nextRun === null);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <p className="text-sm text-muted-foreground">
        Alquiler, suscripciones, sueldo… Se añaden solos a tus movimientos en su
        fecha.
      </p>
      <Button
        size="lg"
        variant="outline"
        className="h-11"
        onClick={() => setEditing({ mode: "new" })}
      >
        <Plus />
        Nuevo recurrente
      </Button>

      {[
        { title: "Activos", items: active },
        { title: "Terminados", items: finished },
      ].map(
        (section) =>
          section.items.length > 0 && (
            <section key={section.title} className="flex flex-col gap-1">
              <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {section.title}
              </h2>
              <ul>
                {section.items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setEditing({ mode: "edit", rule: r })}
                      className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                        style={{
                          background: r.category?.color ?? NO_CATEGORY_COLOR,
                        }}
                      >
                        {r.category?.emoji ?? "🔁"}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold">{r.note}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {describeRecurrence(r.frequency, r.startDate)}
                          {r.nextRun
                            ? ` · próximo: ${dayLabel(r.nextRun).toLowerCase()}`
                            : r.endDate && ` · terminó ${dayLabel(r.endDate)}`}
                        </span>
                      </span>
                      <span
                        className={`font-bold tabular-nums ${r.category?.kind === "income" ? "text-emerald-600" : ""}`}
                      >
                        {r.category?.kind === "income" ? "+" : "−"}
                        {formatMoney(r.amountCents, r.currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}

      {rules.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Repeat className="size-8" />
          Aún no tienes movimientos recurrentes.
        </div>
      )}

      <Drawer open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              {editing?.mode === "edit"
                ? "Editar recurrente"
                : "Nuevo recurrente"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pt-4">
            {editing && (
              <RecurringForm
                key={editing.mode === "edit" ? editing.rule.id : "new"}
                rule={editing.mode === "edit" ? editing.rule : null}
                categories={categories}
                currency={currency}
                onDone={close}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function RecurringForm({
  rule,
  categories,
  currency,
  onDone,
}: {
  rule: RecurringRow | null;
  categories: Category[];
  currency: CurrencyCode;
  onDone: () => void;
}) {
  const [note, setNote] = useState(rule?.note ?? "");
  const [amount, setAmount] = useState(
    rule ? formatAmountInput(rule.amountCents, rule.currency) : "",
  );
  const [currencyCode, setCurrencyCode] = useState(rule?.currency ?? currency);
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? "");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>(
    rule?.frequency ?? "monthly",
  );
  const [startDate, setStartDate] = useState(
    rule?.startDate ?? toISODate(new Date()),
  );
  const [endDate, setEndDate] = useState(rule?.endDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const amountCents = parseAmount(amount);
    if (amountCents === null) {
      setError("Escribe un monto mayor que cero, por ejemplo 45.000.");
      return;
    }
    const parsed = recurringInputSchema.safeParse({
      amountCents,
      currency: currencyCode,
      categoryId: categoryId || null,
      note,
      frequency,
      startDate,
      endDate: endDate || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = rule
        ? await updateRecurring(rule.id, parsed.data)
        : await createRecurring(parsed.data);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(
        rule
          ? "Recurrente guardado"
          : result.generated
            ? `Recurrente creado · ${result.generated} ${result.generated === 1 ? "movimiento añadido" : "movimientos añadidos"}`
            : "Recurrente creado",
      );
      onDone();
    });
  }

  function remove() {
    if (!rule) return;
    startTransition(async () => {
      const result = await deleteRecurring(rule.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDone();
      toast(`${rule.note} eliminado`, {
        description: "Los movimientos ya creados se conservan.",
        duration: 8000,
        action: {
          label: "Deshacer",
          onClick: async () => {
            const restored = await restoreRecurring(result.data);
            if (!restored.ok) toast.error(restored.message);
          },
        },
      });
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nombre</span>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Alquiler, Netflix, Sueldo…"
          className="h-11"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">Monto</span>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={currencyCode}
            className="h-11 font-bold"
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
        <span className="text-sm font-semibold">Categoría</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClassName}
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">Se repite</span>
          <select
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as (typeof FREQUENCIES)[number])
            }
            disabled={rule !== null}
            className={selectClassName}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">Desde</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={rule !== null}
            className="h-11"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {describeRecurrence(frequency, startDate)}
        {rule && ". Para cambiar la frecuencia o el inicio, crea uno nuevo."}
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recurring-end" className="text-sm font-semibold">
          Hasta (opcional)
        </label>
        <div className="flex gap-2">
          <Input
            id="recurring-end"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-11"
          />
          {/* El selector de fecha del móvil no deja vaciar el campo. */}
          {endDate && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Quitar fecha de fin"
              onClick={() => setEndDate("")}
              className="size-11 shrink-0"
            >
              <X />
            </Button>
          )}
        </div>
        {!endDate && (
          <span className="text-xs text-muted-foreground">
            Sin fecha de fin: se repite hasta que lo borres.
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <FormFooter
        submitLabel={rule ? "Guardar cambios" : "Crear recurrente"}
        pending={pending}
        deleteLabel="Eliminar recurrente"
        onDelete={rule ? remove : undefined}
      />
    </form>
  );
}
