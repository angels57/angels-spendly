"use client";

import { Input } from "@/components/ui/input";
import { currencyDecimals, formatAmountTyping } from "@/lib/money";

/**
 * Campo de monto que se formatea mientras se escribe ("45000" → "45.000").
 * En monedas sin decimales (COP) abre el teclado solo numérico.
 */
export function AmountInput({
  value,
  onChange,
  currency,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  currency: string;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const decimals = currencyDecimals(currency);
  return (
    <Input
      inputMode={decimals === 0 ? "numeric" : "decimal"}
      placeholder={decimals === 0 ? "0" : "0,00"}
      autoComplete="off"
      {...props}
      value={value}
      onChange={(e) => onChange(formatAmountTyping(e.target.value, currency))}
    />
  );
}
