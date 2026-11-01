import { describe, expect, it } from "vitest";
import { parseExpense } from "@/lib/parser";
import { cleanTranscript, spelledNumbersToDigits } from "./transcript";

describe("cleanTranscript", () => {
  it.each([
    ["Tinto 3000.", "Tinto 3000"],
    ["Farmacia 19.900.", "Farmacia 19.900"],
    ["Arriendo 1.200.000.", "Arriendo 1.200.000"],
    ["café 4,500.", "café 4,500"],
    ["¡Cine con amigos 20.000 ante ayer!", "Cine con amigos 20.000 ante ayer"],
    ["Netflix, 15 dólares.", "Netflix 15 dólares"],
    ["Tinto tres mil ayer.", "Tinto 3000 ayer"],
    ["  ", ""],
  ])("%s → %s", (text, expected) => {
    expect(cleanTranscript(text)).toBe(expected);
  });
});

describe("spelledNumbersToDigits", () => {
  it.each([
    ["almuerzo veinticinco mil", "almuerzo 25000"],
    ["taxi doce mil quinientos", "taxi 12500"],
    ["mercado ochenta y cinco mil ayer", "mercado 85000 ayer"],
    ["arriendo un millón doscientos mil", "arriendo 1200000"],
    ["dos millones", "2000000"],
    ["cena con Ana cuarenta y dos mil", "cena con Ana 42000"],
    ["farmacia diecinueve mil novecientos", "farmacia 19900"],
    ["café cuatro mil quinientos", "café 4500"],
    ["Netflix quince dólares", "Netflix 15 dólares"],
    ["cien mil", "100000"],
    ["ciento veinte mil", "120000"],
  ])("%s → %s", (text, expected) => {
    expect(spelledNumbersToDigits(text)).toBe(expected);
  });

  it("deja igual lo que no es un número", () => {
    expect(spelledNumbersToDigits("un café con mil amigos")).toBe(
      "un café con mil amigos",
    );
    expect(spelledNumbersToDigits("cine y palomitas")).toBe("cine y palomitas");
    expect(spelledNumbersToDigits("Tinto 3 mil")).toBe("Tinto 3 mil");
  });

  it("la «y» solo une decenas con unidades", () => {
    expect(spelledNumbersToDigits("treinta y uber")).toBe("30 y uber");
    expect(spelledNumbersToDigits("doce y cinco")).toBe("12 y 5");
  });
});

describe("del dictado al gasto", () => {
  const NOW = new Date(2026, 9, 26, 12);
  it.each([
    ["Tinto tres mil ayer.", 300_000, "2026-10-25"],
    ["Taxi doce mil quinientos.", 1_250_000, "2026-10-26"],
    ["Arriendo un millón doscientos mil.", 120_000_000, "2026-10-26"],
    ["Cine con amigos 20.000 ante ayer.", 2_000_000, "2026-10-24"],
  ])("%s", (spoken, cents, date) => {
    const parsed = parseExpense(cleanTranscript(spoken), [], NOW);
    expect(parsed.amountCents).toBe(cents);
    expect(parsed.date).toBe(date);
  });
});
