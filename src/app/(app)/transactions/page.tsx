import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { ManualAdd } from "@/components/manual-add";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionList } from "@/components/transaction-list";
import { getActiveList, getCategories, getTransactions } from "@/lib/data";
import {
  addMonths,
  monthParam,
  monthRange,
  monthTitle,
  parseMonthParam,
} from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Movimientos · MonAi" };

export default function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <TransactionsView searchParams={searchParams} />
    </Suspense>
  );
}

async function TransactionsView({
  searchParams,
}: Pick<PageProps<"/transactions">, "searchParams">) {
  // El mes por defecto depende de la fecha actual.
  await connection();
  const params = await searchParams;
  const month = parseMonthParam(params.month);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  // Un id inválido haría fallar la consulta: se ignora.
  const category =
    params.category === "none" || z.uuid().safeParse(params.category).success
      ? (params.category as string)
      : "";

  const list = await getActiveList();
  const [categories, transactions] = await Promise.all([
    getCategories(list.id),
    getTransactions(list.id, {
      ...monthRange(month),
      q: q || undefined,
      categoryId: category || undefined,
    }),
  ]);

  let spent = 0;
  let income = 0;
  for (const t of transactions) {
    if (t.category?.kind === "income") income += t.amountCents;
    else spent += t.amountCents;
  }

  const current = parseMonthParam(undefined);
  const next = addMonths(month, 1);
  const filtered = Boolean(q || category);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <TransactionFilters
        // Al cambiar de mes o filtro desde fuera, el buscador se reinicia.
        key={`${monthParam(month)}|${category}`}
        filters={{ month: monthParam(month), q, category }}
        monthTitle={monthTitle(month)}
        prevMonth={monthParam(addMonths(month, -1))}
        nextMonth={next <= current ? monthParam(next) : null}
        categories={categories}
      />

      <p className="text-sm text-muted-foreground">
        {transactions.length}{" "}
        {transactions.length === 1 ? "movimiento" : "movimientos"}
        {spent > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-foreground">
              −{formatMoney(spent, list.currency)}
            </span>
          </>
        )}
        {income > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-emerald-600">
              +{formatMoney(income, list.currency)}
            </span>
          </>
        )}
      </p>

      <ManualAdd categories={categories} currency={list.currency} />

      <TransactionList
        transactions={transactions}
        categories={categories}
        currency={list.currency}
        empty={
          <p className="py-10 text-center text-sm text-muted-foreground">
            {filtered
              ? "Ningún movimiento coincide con los filtros."
              : "No hay movimientos este mes."}
          </p>
        }
      />
    </div>
  );
}
