import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayLabel,
  monthParam,
  monthRange,
  parseMonthParam,
} from "./dates";

const NOW = new Date(2026, 9, 25, 12);

describe("dates", () => {
  it("etiqueta hoy, ayer y fechas anteriores", () => {
    expect(dayLabel("2026-10-25", NOW)).toBe("Hoy");
    expect(dayLabel("2026-10-24", NOW)).toBe("Ayer");
    expect(dayLabel("2026-10-23", NOW)).toBe("vie, 23 oct");
    expect(dayLabel("2025-12-31", NOW)).toBe("mié, 31 dic 2025");
  });

  it("lee el mes de la URL y vuelve al actual si no es válido", () => {
    expect(monthParam(parseMonthParam("2026-03", NOW))).toBe("2026-03");
    expect(monthParam(parseMonthParam("2026-13", NOW))).toBe("2026-10");
    expect(monthParam(parseMonthParam(undefined, NOW))).toBe("2026-10");
    expect(monthParam(parseMonthParam(["2026-03"], NOW))).toBe("2026-10");
  });

  it("calcula el rango del mes y cruza años", () => {
    const december = parseMonthParam("2025-12", NOW);
    expect(monthRange(december)).toEqual({
      from: "2025-12-01",
      to: "2026-01-01",
    });
    expect(monthParam(addMonths(december, -12))).toBe("2024-12");
  });
});
