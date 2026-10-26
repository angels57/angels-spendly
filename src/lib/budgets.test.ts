import { describe, expect, it } from "vitest";
import { budgetStatuses, spentByCategory } from "./budgets";

const categories = [
  { id: "comida", kind: "expense" as const, budgetCents: 20000 },
  { id: "ocio", kind: "expense" as const, budgetCents: 5000 },
  { id: "casa", kind: "expense" as const, budgetCents: null },
  { id: "sueldo", kind: "income" as const, budgetCents: 100000 },
];

const transactions = [
  { categoryId: "comida", amountCents: 1850 },
  { categoryId: "comida", amountCents: 4000 },
  { categoryId: "ocio", amountCents: 6000 },
  { categoryId: "casa", amountCents: 80000 },
  { categoryId: null, amountCents: 999 },
];

describe("budgets", () => {
  it("suma lo gastado por categoría e ignora lo que no tiene categoría", () => {
    expect(spentByCategory(transactions)).toEqual({
      comida: 5850,
      ocio: 6000,
      casa: 80000,
    });
  });

  it("solo incluye gastos con presupuesto, la más apurada primero", () => {
    const statuses = budgetStatuses(categories, transactions);
    expect(statuses.map((s) => s.categoryId)).toEqual(["ocio", "comida"]);
  });

  it("calcula lo que queda y marca el exceso con negativo", () => {
    const [ocio, comida] = budgetStatuses(categories, transactions);
    expect(ocio).toMatchObject({ remainingCents: -1000, ratio: 1.2 });
    expect(comida).toMatchObject({
      spentCents: 5850,
      remainingCents: 14150,
      ratio: 0.2925,
    });
  });

  it("una categoría con presupuesto y sin gastos queda a cero", () => {
    expect(budgetStatuses(categories, [])).toEqual([
      expect.objectContaining({
        categoryId: "comida",
        spentCents: 0,
        ratio: 0,
      }),
      expect.objectContaining({ categoryId: "ocio", spentCents: 0, ratio: 0 }),
    ]);
  });
});
