import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { toCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

// Capa de acceso a datos: toda lectura pasa por aquí y verifica la sesión.
// RLS es la segunda barrera: aunque algo se escape, Postgres filtra.

export type Category = Pick<
  Tables<"categories">,
  "id" | "name" | "emoji" | "color" | "kind" | "keywords"
>;

export type TransactionRow = {
  id: string;
  amountCents: number;
  currency: string;
  occurredOn: string;
  note: string;
  categoryId: string | null;
  category: Pick<Category, "name" | "emoji" | "color" | "kind"> | null;
};

export type CategoryWithCount = Category & { transactionCount: number };

export type TransactionFilters = {
  /** Desde esta fecha (YYYY-MM-DD), inclusive. */
  from?: string;
  /** Hasta esta fecha (YYYY-MM-DD), exclusive. */
  to?: string;
  /** Texto a buscar en la nota. */
  q?: string;
  /** Id de categoría, o "none" para los movimientos sin categoría. */
  categoryId?: string;
  limit?: number;
};

export const getCurrentUser = cache(async () => {
  // getClaims() comprueba la caducidad del JWT con la hora actual: sin
  // esto, Next lo detecta como Date.now() durante el prerender.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { id: data.claims.sub, email: data.claims.email as string };
});

// Por ahora cada usuario usa su primera lista ("Personal"). El selector
// de listas llega con las listas compartidas (Fase 4).
export const getActiveList = cache(async () => {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, emoji, currency")
    .order("created_at")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
});

export async function getCategories(listId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, emoji, color, kind, keywords")
    .eq("list_id", listId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCategoriesWithCounts(
  listId: string,
): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, emoji, color, kind, keywords, transactions(count)")
    .eq("list_id", listId)
    .order("sort_order");
  if (error) throw error;
  return data.map(({ transactions, ...category }) => ({
    ...category,
    transactionCount: transactions[0]?.count ?? 0,
  }));
}

export async function getTransactions(
  listId: string,
  { from, to, q, categoryId, limit }: TransactionFilters = {},
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, amount, currency, occurred_on, note, category_id, category:categories!transactions_category_same_list_fkey(name, emoji, color, kind)",
    )
    .eq("list_id", listId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (from) query = query.gte("occurred_on", from);
  if (to) query = query.lt("occurred_on", to);
  if (q) query = query.ilike("note", `%${escapeLike(q)}%`);
  if (categoryId === "none") query = query.is("category_id", null);
  else if (categoryId) query = query.eq("category_id", categoryId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((t) => ({
    id: t.id,
    amountCents: toCents(t.amount),
    currency: t.currency,
    occurredOn: t.occurred_on,
    note: t.note,
    categoryId: t.category_id,
    category: t.category,
  }));
}

// "50%" debe buscar el texto literal, no usar % como comodín.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}
