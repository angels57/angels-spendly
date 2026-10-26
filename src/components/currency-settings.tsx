"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/currency-select";
import { setListCurrency } from "@/app/(app)/actions";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";

/** Moneda principal de la lista: la de totales, barras y presupuestos. */
export function CurrencySettings({ currency }: { currency: CurrencyCode }) {
  const [value, setValue] = useState(currency);
  const [pending, startTransition] = useTransition();

  function change(next: CurrencyCode) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await setListCurrency(next);
      if (!result.ok) {
        setValue(previous);
        toast.error(result.message);
        return;
      }
      toast.success(`Moneda principal: ${CURRENCIES[next].name}`);
    });
  }

  return (
    <section className="flex flex-col gap-1.5 rounded-xl border p-4">
      <label htmlFor="list-currency" className="text-sm font-semibold">
        Moneda principal
      </label>
      <CurrencySelect
        id="list-currency"
        value={value}
        onChange={change}
        disabled={pending}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Los totales y presupuestos se calculan en esta moneda. Puedes anotar
        gastos en otras (por ejemplo «netflix 15 usd»): se muestran aparte.
      </p>
    </section>
  );
}
