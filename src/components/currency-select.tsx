"use client";

import { cn } from "cn";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/money";
import { useT } from "@/i18n/provider";

/** Selector de moneda. `compact` muestra solo el código ("COP"). */
export function CurrencySelect({
  value,
  onChange,
  compact = false,
  className,
  ...props
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  compact?: boolean;
  className?: string;
} & Omit<React.ComponentProps<"select">, "value" | "onChange">) {
  const t = useT();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      className={cn(
        "h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
        className,
      )}
      {...props}
    >
      {CURRENCY_CODES.map((code) => (
        <option key={code} value={code}>
          {compact ? code : `${code} · ${t.currencies[code]}`}
        </option>
      ))}
    </select>
  );
}
