import { describe, expect, it } from "vitest";
import { normalizeKeyword, parseKeywords, suggestKeywords } from "./keywords";

describe("suggestKeywords", () => {
  it("sugiere según el nombre", () => {
    expect(suggestKeywords("Transporte", [], "es")).toEqual([
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
    expect(suggestKeywords("Mascotas", [], "es")).toContain("veterinario");
    expect(suggestKeywords("Educación", [], "es")).toContain("matricula");
  });

  it("no repite las que ya tiene ni las de otras categorías", () => {
    const result = suggestKeywords(
      "Transporte",
      ["Uber", "taxi"],
      "es",
      new Set(["didi"]),
    );
    expect(result).not.toContain("uber");
    expect(result).not.toContain("taxi");
    expect(result).not.toContain("didi");
    expect(result[0]).toBe("cabify");
  });

  it("sin tema conocido no sugiere nada", () => {
    expect(suggestKeywords("Varios", [], "es")).toEqual([]);
    expect(suggestKeywords("", [], "es")).toEqual([]);
  });
});

describe("suggestKeywords en inglés", () => {
  it("reconoce nombres en inglés y sugiere en inglés", () => {
    expect(suggestKeywords("Transport", [], "en")).toEqual([
      "uber",
      "lyft",
      "taxi",
      "bus",
      "subway",
      "train",
      "gas",
      "fuel",
    ]);
    expect(suggestKeywords("Pets", [], "en")).toContain("vet");
  });

  it("un nombre en español con la app en inglés sugiere en inglés", () => {
    expect(suggestKeywords("Mascotas", [], "en")).toContain("vet");
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
