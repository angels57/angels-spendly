"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { selectClassName } from "@/components/transaction-form";
import type { Category } from "@/lib/data";

const SEARCH_DEBOUNCE_MS = 300;

type Filters = { month: string; q: string; category: string };

export function filtersHref({ month, q, category }: Filters) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  return `/transactions?${params}`;
}

export function TransactionFilters({
  filters,
  monthTitle,
  prevMonth,
  nextMonth,
  categories,
}: {
  filters: Filters;
  monthTitle: string;
  prevMonth: string;
  nextMonth: string | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const { month, category } = filters;

  // La búsqueda actualiza la URL al dejar de escribir.
  useEffect(() => {
    if (q.trim() === filters.q) return;
    const timer = setTimeout(() => {
      router.replace(filtersHref({ month, category, q: q.trim() }), {
        scroll: false,
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, filters.q, month, category, router]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href={filtersHref({ ...filters, month: prevMonth })}
          aria-label="Mes anterior"
          className="rounded-full p-3 hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-extrabold first-letter:uppercase">
          {monthTitle}
        </h2>
        {nextMonth ? (
          <Link
            href={filtersHref({ ...filters, month: nextMonth })}
            aria-label="Mes siguiente"
            className="rounded-full p-3 hover:bg-muted"
          >
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          // Mantiene el título centrado cuando no hay mes siguiente.
          <span className="size-9" />
        )}
      </div>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar en las notas</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="h-11 pl-9"
          />
        </label>
        <label className="w-40">
          <span className="sr-only">Filtrar por categoría</span>
          <select
            value={filters.category}
            onChange={(e) =>
              router.replace(
                filtersHref({ ...filters, q, category: e.target.value }),
                { scroll: false },
              )
            }
            className={selectClassName}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
            <option value="none">Sin categoría</option>
          </select>
        </label>
      </div>
    </div>
  );
}
