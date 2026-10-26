// Montos: en la base son numeric(12,2); en el cliente se opera en centavos
// (enteros) para evitar errores de coma flotante como 0.1 + 0.2.

// Monedas que se pueden elegir. Se formatean como en Colombia ("$ 12.000",
// "US$ 12,00", "MXN 12,00"), así "$" solo es el peso colombiano; el euro,
// a la española ("12,00 €").
export const CURRENCIES = {
  COP: { name: "Peso colombiano", locale: "es-CO", decimals: 0 },
  USD: { name: "Dólar estadounidense", locale: "es-CO", decimals: 2 },
  EUR: { name: "Euro", locale: "es-ES", decimals: 2 },
  MXN: { name: "Peso mexicano", locale: "es-CO", decimals: 2 },
  PEN: { name: "Sol peruano", locale: "es-CO", decimals: 2 },
  CLP: { name: "Peso chileno", locale: "es-CO", decimals: 0 },
  ARS: { name: "Peso argentino", locale: "es-CO", decimals: 2 },
  BRL: { name: "Real brasileño", locale: "es-CO", decimals: 2 },
  GBP: { name: "Libra esterlina", locale: "es-CO", decimals: 2 },
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

export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
) {
  const { locale, decimals } = isCurrencyCode(currency)
    ? CURRENCIES[currency]
    : { locale: "es-CO", decimals: 2 };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromCents(cents));
}

export function currencyDecimals(currency: string) {
  return isCurrencyCode(currency) ? CURRENCIES[currency].decimals : 2;
}

/** Monto para un campo de texto: "12.000" en COP, "1.234,50" en USD. */
export function formatAmountInput(cents: number, currency: string) {
  const value = fromCents(cents);
  const decimals =
    currencyDecimals(currency) === 0 && Number.isInteger(value) ? 0 : 2;
  const [int, dec] = value.toFixed(decimals).split(".");
  return dec ? `${groupThousands(int)},${dec}` : groupThousands(int);
}

/**
 * Da formato a un monto mientras se escribe: "45000" → "45.000",
 * "1234,5" → "1.234,5". La coma es el decimal; un punto recién escrito al
 * final también ("12." → "12,"), para teclados que solo tienen punto. Los
 * demás puntos son de miles y se recalculan. Sin decimales (COP, CLP) solo
 * quedan dígitos.
 */
export function formatAmountTyping(raw: string, currency: string) {
  const decimals = currencyDecimals(currency);
  let text = raw.replace(/[^\d.,]/g, "");
  // Sin decimales, lo que va tras la coma se descarta ("45.000,5" → "45.000").
  if (decimals === 0 && text.includes(","))
    text = text.slice(0, text.indexOf(","));
  if (decimals > 0 && !text.includes(",") && text.endsWith(".")) {
    text = `${text.slice(0, -1)},`;
  }
  const comma = decimals > 0 ? text.indexOf(",") : -1;
  const intDigits = (comma === -1 ? text : text.slice(0, comma)).replace(
    /\D/g,
    "",
  );
  const int = intDigits.replace(/^0+(?=\d)/, "");
  if (comma === -1) return groupThousands(int);
  const dec = text
    .slice(comma + 1)
    .replace(/\D/g, "")
    .slice(0, decimals);
  return `${groupThousands(int || "0")},${dec}`;
}

function groupThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
