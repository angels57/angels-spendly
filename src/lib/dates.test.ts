import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayLabel,
  monthLabel,
  isValidTimeZone,
  nowInTimeZone,
  monthParam,
  monthTitle,
  monthRange,
  parseMonthParam,
} from "./dates";

const NOW = new Date(2026, 9, 25, 12);

describe("nowInTimeZone", () => {
  // 31 oct, 19:42 en Bogotá = 1 nov, 00:42 UTC.
  const utc = new Date(Date.UTC(2026, 10, 1, 0, 42));

  it("da la fecha del usuario aunque en UTC ya sea otro día", () => {
    const now = nowInTimeZone("America/Bogota", utc);
    expect([now.getFullYear(), now.getMonth(), now.getDate()]).toEqual([
      2026, 9, 31,
    ]);
    expect([now.getHours(), now.getMinutes()]).toEqual([19, 42]);
    expect(monthParam(parseMonthParam(undefined, now))).toBe("2026-10");
  });

  it("en UTC sigue siendo noviembre", () => {
    expect(nowInTimeZone("UTC", utc).getMonth()).toBe(10);
  });

  it("valida la zona horaria", () => {
    expect(isValidTimeZone("America/Mexico_City")).toBe(true);
    expect(isValidTimeZone("Marte/Olympus")).toBe(false);
  });
});

describe("dates", () => {
  it("etiqueta hoy, ayer y fechas anteriores", () => {
    expect(dayLabel("2026-10-25", "es", NOW)).toBe("Hoy");
    expect(dayLabel("2026-10-24", "es", NOW)).toBe("Ayer");
    expect(dayLabel("2026-10-23", "es", NOW)).toBe("vie, 23 oct");
    expect(dayLabel("2025-12-31", "es", NOW)).toBe("mié, 31 dic 2025");
  });

  it("en inglés", () => {
    expect(dayLabel("2026-10-25", "en", NOW)).toBe("Today");
    expect(dayLabel("2026-10-24", "en", NOW)).toBe("Yesterday");
    expect(dayLabel("2026-10-23", "en", NOW)).toBe("Fri, Oct 23");
    expect(dayLabel("2025-12-31", "en", NOW)).toBe("Wed, Dec 31, 2025");
    expect(monthLabel("en", NOW)).toBe("October");
    expect(monthTitle(parseMonthParam("2026-10", NOW), "en")).toBe(
      "October 2026",
    );
    expect(monthTitle(parseMonthParam("2026-10", NOW), "es")).toBe(
      "octubre de 2026",
    );
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
