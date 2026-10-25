import { Suspense } from "react";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSummary } from "@/components/month-summary";
import { QuickAdd } from "@/components/quick-add";
import { TransactionList } from "@/components/transaction-list";
import { signOut } from "@/app/login/actions";
import {
  getActiveList,
  getCategories,
  getCurrentUser,
  getTransactions,
} from "@/lib/data";
import { startOfMonthISO } from "@/lib/dates";

const RECENT_LIMIT = 30;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-6">
      {/* Todo lo que depende de la sesión se transmite tras este Suspense. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  // "Hoy" y "este mes" dependen de la hora: se calculan en cada request.
  await connection();
  const [user, list] = await Promise.all([getCurrentUser(), getActiveList()]);
  const [categories, monthTransactions, recent] = await Promise.all([
    getCategories(list.id),
    getTransactions(list.id, { from: startOfMonthISO() }),
    getTransactions(list.id, { limit: RECENT_LIMIT }),
  ]);

  return (
    <>
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-2xl">
          {list.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight">{list.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </Button>
        </form>
      </header>

      <MonthSummary transactions={monthTransactions} currency={list.currency} />
      <TransactionList transactions={recent} />

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-background via-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QuickAdd categories={categories} currency={list.currency} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </>
  );
}
