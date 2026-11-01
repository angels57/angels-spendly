import { describe, expect, it } from "vitest";
import {
  hasLocale,
  localizePath,
  matchAcceptLanguage,
  splitLocale,
} from "./config";

describe("hasLocale", () => {
  it("solo admite en y es", () => {
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("es")).toBe(true);
    expect(hasLocale("fr")).toBe(false);
    expect(hasLocale(undefined)).toBe(false);
  });
});

describe("splitLocale", () => {
  it.each([
    ["/es/transactions", "es", "/transactions"],
    ["/en", "en", "/"],
    ["/en/", "en", "/"],
    ["/transactions", null, "/transactions"],
    ["/", null, "/"],
    ["/english", null, "/english"],
  ])("%s → %s %s", (pathname, locale, path) => {
    expect(splitLocale(pathname)).toEqual({ locale, path });
  });
});

describe("localizePath", () => {
  it.each([
    ["/", "/es"],
    ["/transactions", "/es/transactions"],
    ["/transactions?month=2026-10", "/es/transactions?month=2026-10"],
  ])("%s → %s", (path, localized) => {
    expect(localizePath("es", path)).toBe(localized);
  });
});

describe("matchAcceptLanguage", () => {
  it.each([
    ["es-CO,es;q=0.9,en;q=0.8", "es"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,fr;q=0.9,es;q=0.5", "es"],
    ["de,en;q=0.2,es;q=0.7", "es"],
    ["es;q=0,en", "en"],
    ["fr,de", null],
    ["", null],
    [null, null],
  ])("%s → %s", (header, locale) => {
    expect(matchAcceptLanguage(header)).toBe(locale);
  });
});
