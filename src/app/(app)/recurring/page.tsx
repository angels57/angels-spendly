import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringManager } from "@/components/recurring-manager";
import { getActiveList, getCategories, getRecurring } from "@/lib/data";

export const metadata: Metadata = { title: "Recurrentes · MonAi" };

export default function RecurringPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Link
          href="/transactions"
          aria-label="Volver a movimientos"
          className="rounded-full p-2 hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-extrabold">Recurrentes</h2>
      </div>
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <Recurring />
      </Suspense>
    </div>
  );
}

async function Recurring() {
  const list = await getActiveList();
  const [rules, categories] = await Promise.all([
    getRecurring(list.id),
    getCategories(list.id),
  ]);
  return (
    <RecurringManager
      rules={rules}
      categories={categories}
      currency={list.currency}
    />
  );
}
