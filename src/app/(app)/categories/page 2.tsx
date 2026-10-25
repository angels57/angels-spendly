import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryManager } from "@/components/category-manager";
import { getActiveList, getCategoriesWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Categorías · MonAi" };

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
  return <CategoryManager categories={categories} />;
}
