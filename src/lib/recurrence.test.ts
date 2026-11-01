import { describe, expect, it } from "vitest";
import { describeRecurrence } from "./recurrence";

describe("describeRecurrence", () => {
  it.each([
    ["monthly", "2026-01-31", "Cada mes, el día 31"],
    ["weekly", "2026-10-26", "Cada semana, los lunes"],
    ["weekly", "2026-10-24", "Cada semana, los sábados"],
    ["yearly", "2026-03-03", "Cada año, el 3 de marzo"],
  ] as const)("%s desde %s → %s", (frequency, start, text) => {
    expect(describeRecurrence(frequency, start)).toBe(text);
  });

  it.each([
    [15, 31, "Cada quincena, el 15 y el último día"],
    [1, 15, "Cada quincena, los días 1 y 15"],
  ])("quincena %i y %i → %s", (firstDay, secondDay, text) => {
    expect(
      describeRecurrence("semimonthly", "2026-11-01", { firstDay, secondDay }),
    ).toBe(text);
  });
});
