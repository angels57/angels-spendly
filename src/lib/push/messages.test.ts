import { describe, expect, it } from "vitest";
import { buildNotification, type PushMessage } from "./messages";

// Intl separa con espacios de no separación: se comparan como espacios.
const plain = (text?: string) => text?.replace(/\s/g, " ");

const budget = (spentCents: number, extra: Partial<PushMessage> = {}) =>
  buildNotification({
    key: "budget:80:cat-1:2026-11",
    kind: "budget",
    locale: "es",
    hide_amounts: false,
    data: {
      threshold: 80,
      categoryId: "cat-1",
      emoji: "🍔",
      name: "Comida",
      spentCents,
      budgetCents: 50_000_000,
      currency: "COP",
    },
    ...extra,
  });

describe("buildNotification", () => {
  it("budget at 80%: percent and amounts", () => {
    const n = budget(41_000_000);
    expect(n?.title).toBe("🍔 Comida: llevas el 82 % del presupuesto");
    expect(plain(n?.body)).toBe("$ 410.000 de $ 500.000 este mes");
    expect(n?.url).toBe("/es");
    expect(n?.tag).toBe("budget:cat-1");
  });

  it("budget over 100%: used up", () => {
    expect(budget(52_000_000)?.title).toBe("🍔 Comida: presupuesto agotado");
  });

  it("hides amounts when asked", () => {
    expect(budget(41_000_000, { hide_amounts: true })?.body).not.toMatch(/\$/);
  });

  it("recurring in English", () => {
    const n = buildNotification({
      key: "recurring:tx-1",
      kind: "recurring",
      locale: "en",
      hide_amounts: false,
      data: {
        note: "Netflix",
        emoji: "🎮",
        amountCents: 1500,
        currency: "USD",
      },
    });
    expect(n).toEqual({
      title: "🎮 Netflix recorded",
      body: "$15.00 added automatically today",
      url: "/en/transactions",
      tag: "recurring:tx-1",
    });
  });

  it("month close compares with the month before", () => {
    const n = buildNotification({
      key: "month:2026-10",
      kind: "month",
      locale: "es",
      hide_amounts: false,
      data: {
        month: "2026-10",
        spentCents: 9_200_000,
        previousSpentCents: 10_000_000,
        currency: "COP",
      },
    });
    expect(n?.title).toBe("Octubre cerró");
    expect(plain(n?.body)).toBe("Gastaste $ 92.000 (−8 % frente a septiembre)");
    expect(n?.url).toBe("/es?month=2026-10");
  });

  it("month close without a previous month", () => {
    const n = buildNotification({
      key: "month:2026-10",
      kind: "month",
      locale: "en",
      hide_amounts: false,
      data: {
        month: "2026-10",
        spentCents: 1500,
        previousSpentCents: 0,
        currency: "USD",
      },
    });
    expect(n?.title).toBe("October is closed");
    expect(n?.body).toBe("You spent $15.00");
  });

  it("unknown kinds and locales", () => {
    expect(
      buildNotification({
        key: "x",
        kind: "nope",
        locale: "es",
        hide_amounts: false,
        data: {},
      }),
    ).toBeNull();
    expect(
      buildNotification({
        key: "daily:2026-11-01",
        kind: "daily",
        locale: "fr",
        hide_amounts: false,
        data: {},
      })?.title,
    ).toBe("Spent anything today?");
  });
});
