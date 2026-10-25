// Montos: en la base son numeric(12,2); en el cliente se opera en centavos
// (enteros) para evitar errores de coma flotante como 0.1 + 0.2.

export function toCents(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error(`Monto inválido: ${amount}`);
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency = "EUR", locale = "es") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    fromCents(cents),
  );
}
