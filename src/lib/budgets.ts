// Cálculos de presupuestos: funciones puras para usarlas en servidor y
// cliente y para poder testearlas.

type CategoryLike = {
  id: string;
  kind: "expense" | "income";
  budgetCents: number | null;
};

type TransactionLike = {
  categoryId: string | null;
  amountCents: number;
};

export type BudgetStatus = {
  categoryId: string;
  budgetCents: number;
  spentCents: number;
  /** Negativo si ya se pasó del presupuesto. */
  remainingCents: number;
  /** Gastado / presupuesto (1 = 100 %). */
  ratio: number;
};

/** Gastado por categoría (en centavos) de una lista de movimientos. */
export function spentByCategory(
  transactions: TransactionLike[],
): Record<string, number> {
  const spent: Record<string, number> = {};
  for (const t of transactions) {
    if (!t.categoryId) continue;
    spent[t.categoryId] = (spent[t.categoryId] ?? 0) + t.amountCents;
  }
  return spent;
}

/** Estado de cada categoría de gasto con presupuesto, la más apurada primero. */
export function budgetStatuses(
  categories: CategoryLike[],
  monthTransactions: TransactionLike[],
): BudgetStatus[] {
  const spent = spentByCategory(monthTransactions);
  return categories
    .filter(
      (c): c is CategoryLike & { budgetCents: number } =>
        c.kind === "expense" && c.budgetCents !== null && c.budgetCents > 0,
    )
    .map((c) => {
      const spentCents = spent[c.id] ?? 0;
      return {
        categoryId: c.id,
        budgetCents: c.budgetCents,
        spentCents,
        remainingCents: c.budgetCents - spentCents,
        ratio: spentCents / c.budgetCents,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
