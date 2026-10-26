import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetProgress } from "@/components/budget-progress";
import { MonthSummary } from "@/components/month-summary";
import { QuickAdd } from "@/components/quick-add";
import { TransactionList } from "@/components/transaction-list";
import { getActiveList, getCategories, getTransactions } from "@/lib/data";
import { budgetStatuses, spentByCategory } from "@/lib/budgets";
import { startOfMonthISO } from "@/lib/dates";

const RECENT_LIMIT = 20;

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  // "Hoy" y "este mes" dependen de la hora: se calculan en cada request.
  await connection();
  const list = await getActiveList();
  const [categories, monthTransactions, recent] = await Promise.all([
    getCategories(list.id),
    getTransactions(list.id, { from: startOfMonthISO() }),
    getTransactions(list.id, { limit: RECENT_LIMIT }),
  ]);
  const monthStart = startOfMonthISO();
  const monthExpenses = monthTransactions.filter(
    (t) => t.category?.kind !== "income",
  );

  return (
    <>
      <MonthSummary transactions={monthTransactions} currency={list.currency} />
      <BudgetProgress
        statuses={budgetStatuses(categories, monthExpenses)}
        categories={categories}
        currency={list.currency}
      />
      <TransactionList
        transactions={recent}
        categories={categories}
        currency={list.currency}
      />
      {recent.length === RECENT_LIMIT && (
        <Link
          href="/transactions"
          className="text-center text-sm font-semibold text-primary"
        >
          Ver todos los movimientos
        </Link>
      )}

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-background via-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QuickAdd
          categories={categories}
          currency={list.currency}
          month={monthStart.slice(0, 7)}
          spentThisMonth={spentByCategory(monthExpenses)}
        />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </>
  );
}
