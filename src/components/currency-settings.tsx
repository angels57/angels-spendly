"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/currency-select";
import { setListCurrency } from "@/app/[lang]/(app)/actions";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";
import { useT } from "@/i18n/provider";

/** Moneda principal de la lista: la de totales, barras y presupuestos. */
export function CurrencySettings({ currency }: { currency: CurrencyCode }) {
  const t = useT();
  const [value, setValue] = useState(currency);
  const [pending, startTransition] = useTransition();

  function change(next: CurrencyCode) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await setListCurrency(next);
      if (!result.ok) {
        setValue(previous);
        toast.error(t.errors[result.error]);
        return;
      }
      toast.success(t.currency.mainSet(CURRENCIES[next].name));
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="list-currency" className="text-sm font-semibold">
        {t.currency.main}
      </label>
      <CurrencySelect
        id="list-currency"
        value={value}
        onChange={change}
        disabled={pending}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">{t.currency.mainHint}</p>
    </div>
  );
}
