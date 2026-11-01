import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetProgress } from "@/components/budget-progress";
import { MonthClosing, MonthSummary } from "@/components/month-summary";
import { DashboardFeed } from "@/components/dashboard-feed";
import {
  getActiveList,
  getCategories,
  getTransactions,
  type TransactionRow,
} from "@/lib/data";
import { budgetStatuses, spentByCategory } from "@/lib/budgets";
import {
  addMonths,
  homeMonth,
  monthParam,
  monthRange,
  parseMonthParam,
  shortMonthTitle,
} from "@/lib/dates";
import { totalsByCurrency } from "@/lib/money";
import { getDictionary, getLocalHref, getLocale } from "@/i18n/server";
import { toISODate } from "@/lib/parser";
import { userNow } from "@/lib/today";

const RECENT_LIMIT = 20;
/** Los primeros días del mes, el inicio muestra cómo cerró el anterior. */
const CLOSING_DAYS = 5;

export default function Home({ searchParams }: PageProps<"/[lang]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({
  searchParams,
}: Pick<PageProps<"/[lang]">, "searchParams">) {
  const [to, t, locale] = await Promise.all([
    getLocalHref(),
    getDictionary(),
    getLocale(),
  ]);
  // "Hoy" y "este mes" dependen de la hora: se calculan en cada request.
  await connection();
  const [list, now, params] = await Promise.all([
    getActiveList(),
    userNow(),
    searchParams,
  ]);
  const currentMonth = parseMonthParam(undefined, now);
  // ?month= elige el mes del resumen y los presupuestos. Los recientes y el
  // quick add siguen siendo de hoy.
  const month = homeMonth(params.month, now);
  const isCurrent = month.getTime() === currentMonth.getTime();
  const lastMonth = addMonths(currentMonth, -1);
  const monthBefore = addMonths(currentMonth, -2);
  const showClosing = isCurrent && now.getDate() <= CLOSING_DAYS;

  const [categories, monthTransactions, currentTransactions, closing, recent] =
    await Promise.all([
      getCategories(list.id),
      getTransactions(list.id, monthRange(month)),
      isCurrent ? null : getTransactions(list.id, monthRange(currentMonth)),
      // El mes pasado y el anterior, para compararlos.
      showClosing
        ? getTransactions(list.id, {
            from: monthRange(monthBefore).from,
            to: monthRange(currentMonth).from,
          })
        : null,
      getTransactions(list.id, { limit: RECENT_LIMIT }),
    ]);

  // Los presupuestos están en la moneda principal.
  const expenses = (transactions: TransactionRow[]) =>
    transactions.filter(
      (tx) => tx.category?.kind !== "income" && tx.currency === list.currency,
    );
  const spentIn = (transactions: TransactionRow[], m: Date) =>
    totalsByCurrency(
      transactions.filter((tx) => tx.occurredOn.startsWith(monthParam(m))),
      list.currency,
    )[0].spentCents;

  return (
    <>
      {closing && (
        <MonthClosing
          month={lastMonth}
          previousMonth={monthBefore}
          spentCents={spentIn(closing, lastMonth)}
          previousSpentCents={spentIn(closing, monthBefore)}
          currency={list.currency}
          now={now}
        />
      )}
      <MonthSummary
        transactions={monthTransactions}
        currency={list.currency}
        month={month}
        now={now}
      />
      <BudgetProgress
        statuses={budgetStatuses(categories, expenses(monthTransactions))}
        categories={categories}
        currency={list.currency}
        pastMonth={isCurrent ? undefined : shortMonthTitle(month, locale, now)}
      />
      <DashboardFeed
        recent={recent}
        more={
          recent.length === RECENT_LIMIT && (
            <Link
              href={to("/transactions")}
              className="text-center text-sm font-semibold text-primary"
            >
              {t.home.seeAll}
            </Link>
          )
        }
        categories={categories}
        currency={list.currency}
        today={toISODate(now)}
        month={monthParam(currentMonth)}
        spentThisMonth={spentByCategory(
          expenses(currentTransactions ?? monthTransactions),
        )}
      />
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
