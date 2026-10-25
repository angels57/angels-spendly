import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
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
  category: Pick<Category, "name" | "emoji" | "color" | "kind"> | null;
};

export const getCurrentUser = cache(async () => {
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

export async function getTransactions(
  listId: string,
  { from, limit }: { from?: string; limit?: number } = {},
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, amount, currency, occurred_on, note, category:categories(name, emoji, color, kind)",
    )
    .eq("list_id", listId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (from) query = query.gte("occurred_on", from);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((t) => ({
    id: t.id,
    amountCents: toCents(t.amount),
    currency: t.currency,
    occurredOn: t.occurred_on,
    note: t.note,
    category: t.category,
  }));
}
