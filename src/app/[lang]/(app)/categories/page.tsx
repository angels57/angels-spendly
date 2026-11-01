import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryManager } from "@/components/category-manager";
import { getActiveList, getCategoriesWithCounts } from "@/lib/data";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.categories };
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  const list = await getActiveList();
  const categories = await getCategoriesWithCounts(list.id);
  return <CategoryManager categories={categories} currency={list.currency} />;
}
