import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryManager } from "@/components/category-manager";
import { CurrencySettings } from "@/components/currency-settings";
import { getActiveList, getCategoriesWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Categorías" };

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
  return (
    <>
      <CurrencySettings
        // Si la moneda cambia en otro sitio, el selector se reinicia.
        key={list.currency}
        currency={list.currency}
      />
      <CategoryManager categories={categories} currency={list.currency} />
    </>
  );
}
