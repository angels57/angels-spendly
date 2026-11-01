import { describe, expect, it } from "vitest";
import { describeRecurrence } from "./recurrence";

describe("describeRecurrence", () => {
  it.each([
    ["monthly", "2026-01-31", "Cada mes, el día 31"],
    ["weekly", "2026-10-26", "Cada semana, los lunes"],
    ["weekly", "2026-10-24", "Cada semana, los sábados"],
    ["yearly", "2026-03-03", "Cada año, el 3 de marzo"],
  ] as const)("es: %s desde %s → %s", (frequency, start, text) => {
    expect(describeRecurrence(frequency, start, "es")).toBe(text);
  });

  it.each([
    ["monthly", "2026-01-31", "Every month on the 31st"],
    ["monthly", "2026-01-02", "Every month on the 2nd"],
    ["monthly", "2026-01-13", "Every month on the 13th"],
    ["monthly", "2026-01-23", "Every month on the 23rd"],
    ["weekly", "2026-10-26", "Every week on Mondays"],
    ["yearly", "2026-03-03", "Every year on March 3"],
  ] as const)("en: %s desde %s → %s", (frequency, start, text) => {
    expect(describeRecurrence(frequency, start, "en")).toBe(text);
  });
});
