import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ManagerSkeleton } from "@/components/skeletons";
import { RecurringManager } from "@/components/recurring-manager";
import { getActiveList, getCategories, getRecurring } from "@/lib/data";
import { getDictionary, getLocalHref } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.recurring };
}

export default async function RecurringPage() {
  const [to, t] = await Promise.all([getLocalHref(), getDictionary()]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Link
          href={to("/transactions")}
          aria-label={t.recurring.back}
          className="rounded-full p-2 hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-extrabold">{t.recurring.title}</h2>
      </div>
      <Suspense fallback={<ManagerSkeleton rows={3} />}>
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
