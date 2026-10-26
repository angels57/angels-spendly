import { describe, expect, it } from "vitest";
import { EMOJI_GROUPS, isSingleEmoji, suggestEmoji } from "./emoji";

describe("suggestEmoji", () => {
  it.each([
    ["Mascotas", "🐶"],
    ["Gasolina", "⛽"],
    ["Arriendo", "🏠"],
    ["Suscripciones", "📺"],
    ["Vacaciones", "✈️"],
    ["Servicios públicos", "💡"],
    ["Droguería", "💊"],
    ["Sueldo", "💵"],
    ["Café de la mañana", "☕"],
    ["Seguro del carro", "🛡️"],
  ])("%s → %s", (name, emoji) => {
    expect(suggestEmoji(name)).toBe(emoji);
  });

  it("sin coincidencia devuelve null", () => {
    expect(suggestEmoji("Varios")).toBeNull();
    expect(suggestEmoji("")).toBeNull();
  });
});

describe("isSingleEmoji", () => {
  it.each(["🐶", "🛍️", "❤️", "👍🏽", "👩‍👧", "🇨🇴", "1️⃣", " 🍕 "])(
    "%s es un solo emoji",
    (text) => {
      expect(isSingleEmoji(text)).toBe(true);
    },
  );

  it.each(["", "a", "abc", "🍕🍔", "🍕a", "12"])(
    "%s no es un solo emoji",
    (text) => {
      expect(isSingleEmoji(text)).toBe(false);
    },
  );

  it("todos los emojis curados son válidos y no se repiten", () => {
    const all = EMOJI_GROUPS.flatMap((g) => [...g.emojis]);
    expect(all.every(isSingleEmoji)).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });
});
