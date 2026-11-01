import type { Locale } from "@/i18n/config";

// Montos: en la base son numeric(12,2); en el cliente se opera en centavos
// (enteros) para evitar errores de coma flotante como 0.1 + 0.2.

// Monedas que se pueden elegir (los nombres, por idioma, en los
// diccionarios). Formato según el idioma de la interfaz:
// - es: como en Colombia ("$ 12.000", "US$ 12,00", "MXN 12,00"), así "$"
//   solo es el peso colombiano; el euro, a la española ("12,00 €").
// - en: en-US ("COP 12,000", "$12.00", "€12.00"): el símbolo solo cuando
//   no es ambiguo, si no el código.
export const CURRENCIES = {
  COP: { es: "es-CO", decimals: 0 },
  USD: { es: "es-CO", decimals: 2 },
  EUR: { es: "es-ES", decimals: 2 },
  MXN: { es: "es-CO", decimals: 2 },
  PEN: { es: "es-CO", decimals: 2 },
  CLP: { es: "es-CO", decimals: 0 },
  ARS: { es: "es-CO", decimals: 2 },
  BRL: { es: "es-CO", decimals: 2 },
  GBP: { es: "es-CO", decimals: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as [
  CurrencyCode,
  ...CurrencyCode[],
];

export const DEFAULT_CURRENCY: CurrencyCode = "COP";

export function isCurrencyCode(code: string): code is CurrencyCode {
  return Object.hasOwn(CURRENCIES, code);
}

/** Para datos de la base: la app solo guarda monedas admitidas. */
export function asCurrencyCode(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}

export function toCents(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error(`Monto inválido: ${amount}`);
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency: string, locale: Locale) {
  const decimals = currencyDecimals(currency);
  const intlLocale =
    locale === "en"
      ? "en-US"
      : isCurrencyCode(currency)
        ? CURRENCIES[currency].es
        : "es-CO";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromCents(cents));
}

export function currencyDecimals(currency: string) {
  return isCurrencyCode(currency) ? CURRENCIES[currency].decimals : 2;
}

// Separadores al escribir montos: "1.234,50" en español, "1,234.50" en inglés.
const SEPARATORS: Record<Locale, { group: string; decimal: string }> = {
  en: { group: ",", decimal: "." },
  es: { group: ".", decimal: "," },
};

/** Monto para un campo de texto: "12.000" / "12,000" en COP, "1.234,50" / "1,234.50" en USD. */
export function formatAmountInput(
  cents: number,
  currency: string,
  locale: Locale,
) {
  const { group, decimal } = SEPARATORS[locale];
  const value = fromCents(cents);
  const decimals =
    currencyDecimals(currency) === 0 && Number.isInteger(value) ? 0 : 2;
  const [int, dec] = value.toFixed(decimals).split(".");
  const grouped = groupThousands(int, group);
  return dec ? `${grouped}${decimal}${dec}` : grouped;
}

/**
 * Da formato a un monto mientras se escribe: "45000" → "45.000" (es) o
 * "45,000" (en). El separador decimal del idioma es el decimal; el otro, si
 * se acaba de escribir al final, también ("12." → "12," en español), para
 * teclados que solo tienen uno. El resto son miles y se recalculan. Sin
 * decimales (COP, CLP) solo quedan dígitos.
 */
export function formatAmountTyping(
  raw: string,
  currency: string,
  locale: Locale,
) {
  const { group, decimal } = SEPARATORS[locale];
  const decimals = currencyDecimals(currency);
  let text = raw.replace(/[^\d.,]/g, "");
  // Sin decimales, lo que va tras el decimal se descarta ("45.000,5" → "45.000").
  if (decimals === 0 && text.includes(decimal)) {
    text = text.slice(0, text.indexOf(decimal));
  }
  if (decimals > 0 && !text.includes(decimal) && text.endsWith(group)) {
    text = `${text.slice(0, -1)}${decimal}`;
  }
  const point = decimals > 0 ? text.indexOf(decimal) : -1;
  const intDigits = (point === -1 ? text : text.slice(0, point)).replace(
    /\D/g,
    "",
  );
  const int = intDigits.replace(/^0+(?=\d)/, "");
  if (point === -1) return groupThousands(int, group);
  const dec = text
    .slice(point + 1)
    .replace(/\D/g, "")
    .slice(0, decimals);
  return `${groupThousands(int || "0", group)}${decimal}${dec}`;
}

function groupThousands(digits: string, group: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

export type CurrencyTotals = {
  currency: string;
  spentCents: number;
  incomeCents: number;
};

/**
 * Gastado e ingresado por moneda. Sin tipos de cambio no se pueden sumar
 * monedas distintas: la principal va primero y el resto, por gasto.
 */
export function totalsByCurrency(
  transactions: {
    amountCents: number;
    currency: string;
    category: { kind: "expense" | "income" } | null;
  }[],
  mainCurrency: string,
): CurrencyTotals[] {
  const totals = new Map<string, CurrencyTotals>([
    [mainCurrency, { currency: mainCurrency, spentCents: 0, incomeCents: 0 }],
  ]);
  for (const t of transactions) {
    const entry = totals.get(t.currency) ?? {
      currency: t.currency,
      spentCents: 0,
      incomeCents: 0,
    };
    if (t.category?.kind === "income") entry.incomeCents += t.amountCents;
    else entry.spentCents += t.amountCents;
    totals.set(t.currency, entry);
  }
  const [main, ...others] = totals.values();
  return [main, ...others.sort((a, b) => b.spentCents - a.spentCents)];
}
