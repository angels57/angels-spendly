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

  it.each([
    [15, 31, "Cada quincena, el 15 y el último día"],
    [1, 15, "Cada quincena, los días 1 y 15"],
  ])("es: quincena %i y %i → %s", (firstDay, secondDay, text) => {
    expect(
      describeRecurrence("semimonthly", "2026-11-01", "es", {
        firstDay,
        secondDay,
      }),
    ).toBe(text);
  });

  it.each([
    [15, 31, "Twice a month, on the 15th and the last day"],
    [1, 15, "Twice a month, on the 1st and 15th"],
  ])("en: quincena %i y %i → %s", (firstDay, secondDay, text) => {
    expect(
      describeRecurrence("semimonthly", "2026-11-01", "en", {
        firstDay,
        secondDay,
      }),
    ).toBe(text);
  });
});
