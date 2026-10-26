import { describe, expect, it } from "vitest";
import {
  formatAmountInput,
  formatAmountTyping,
  formatMoney,
  fromCents,
  toCents,
  totalsByCurrency,
} from "./money";

describe("money", () => {
  it("convierte a centavos sin errores de coma flotante", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(toCents("45.50")).toBe(4550);
    expect(toCents(19.99)).toBe(1999);
  });

  it("vuelve de centavos a unidades", () => {
    expect(fromCents(4550)).toBe(45.5);
  });

  it("rechaza montos que no son números", () => {
    expect(() => toCents("abc")).toThrow();
  });

  it("formatea cada moneda sin ambigüedad", () => {
    // Intl separa el símbolo con un espacio no separable (U+00A0).
    expect(formatMoney(1_200_000_00)).toBe("$ 1.200.000");
    expect(formatMoney(1250, "USD")).toBe("US$ 12,50");
    expect(formatMoney(72927, "EUR")).toBe("729,27 €");
    expect(formatMoney(1250, "MXN")).toBe("MXN 12,50");
  });

  it("prepara el monto para un campo de texto", () => {
    expect(formatAmountInput(1_200_000, "COP")).toBe("12.000");
    expect(formatAmountInput(150_000_000, "COP")).toBe("1.500.000");
    expect(formatAmountInput(1250, "USD")).toBe("12,50");
    expect(formatAmountInput(123_450, "USD")).toBe("1.234,50");
    expect(formatAmountInput(1250, "COP")).toBe("12,50");
  });

  it.each([
    ["45000", "COP", "45.000"],
    ["1.5000", "COP", "15.000"],
    ["45.000,5", "COP", "45.000"],
    ["007", "COP", "7"],
    ["", "COP", ""],
    ["1234", "USD", "1.234"],
    ["1.234,5", "USD", "1.234,5"],
    ["12.", "USD", "12,"],
    ["12,999", "USD", "12,99"],
    [",5", "USD", "0,5"],
    ["1.2345", "USD", "12.345"],
    ["$ 12a", "USD", "12"],
  ])("al escribir %s en %s → %s", (raw, currency, text) => {
    expect(formatAmountTyping(raw, currency)).toBe(text);
  });
});

describe("totalsByCurrency", () => {
  const expense = { kind: "expense" as const };
  const income = { kind: "income" as const };

  it("separa por moneda, con la principal primero aunque esté vacía", () => {
    expect(
      totalsByCurrency(
        [
          { amountCents: 500, currency: "EUR", category: expense },
          { amountCents: 2000, currency: "USD", category: null },
          { amountCents: 100, currency: "USD", category: income },
        ],
        "COP",
      ),
    ).toEqual([
      { currency: "COP", spentCents: 0, incomeCents: 0 },
      { currency: "USD", spentCents: 2000, incomeCents: 100 },
      { currency: "EUR", spentCents: 500, incomeCents: 0 },
    ]);
  });
});
