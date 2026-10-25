import { describe, expect, it } from "vitest";
import { formatMoney, fromCents, toCents } from "./money";

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

  it("formatea según moneda e idioma", () => {
    // Intl separa el símbolo con un espacio no separable (U+00A0).
    expect(formatMoney(72927, "EUR", "es")).toBe("729,27 €");
    expect(formatMoney(1200, "USD", "en")).toBe("$12.00");
  });
});
