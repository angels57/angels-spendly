import { describe, expect, it } from "vitest";
import { normalizeKeyword, parseKeywords, suggestKeywords } from "./keywords";

describe("suggestKeywords", () => {
  it("sugiere según el nombre", () => {
    expect(suggestKeywords("Transporte", [])).toEqual([
      "uber",
      "didi",
      "taxi",
      "cabify",
      "indriver",
      "sitp",
      "transmilenio",
      "metro",
    ]);
  });

  it("entiende plurales y tildes", () => {
    expect(suggestKeywords("Mascotas", [])).toContain("veterinario");
    expect(suggestKeywords("Educación", [])).toContain("matricula");
  });

  it("no repite las que ya tiene ni las de otras categorías", () => {
    const result = suggestKeywords(
      "Transporte",
      ["Uber", "taxi"],
      new Set(["didi"]),
    );
    expect(result).not.toContain("uber");
    expect(result).not.toContain("taxi");
    expect(result).not.toContain("didi");
    expect(result[0]).toBe("cabify");
  });

  it("sin tema conocido no sugiere nada", () => {
    expect(suggestKeywords("Varios", [])).toEqual([]);
    expect(suggestKeywords("", [])).toEqual([]);
  });
});

describe("parseKeywords", () => {
  it("separa por comas y limpia", () => {
    expect(parseKeywords("uber, Taxi ,, metro")).toEqual([
      "uber",
      "taxi",
      "metro",
    ]);
  });
});

describe("normalizeKeyword", () => {
  it("compara sin tildes ni mayúsculas", () => {
    expect(normalizeKeyword(" Café ")).toBe(normalizeKeyword("cafe"));
  });
});
