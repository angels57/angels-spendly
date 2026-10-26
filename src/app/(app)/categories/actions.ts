"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { fromCents } from "@/lib/money";
import { categoryInputSchema, type CategoryInput } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; message: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Un presupuesto por categoría: se crea/actualiza o se borra si es null.
// Los ingresos no llevan presupuesto.
async function saveBudget(
  supabase: Supabase,
  listId: string,
  categoryId: string,
  { kind, budgetCents }: CategoryInput,
) {
  if (kind === "income" || budgetCents === null) {
    return supabase.from("budgets").delete().eq("category_id", categoryId);
  }
  return supabase.from("budgets").upsert(
    {
      list_id: listId,
      category_id: categoryId,
      amount: fromCents(budgetCents),
    },
    { onConflict: "list_id,category_id" },
  );
}

// El presupuesto vive en su propia tabla.
function categoryColumns({
  name,
  emoji,
  color,
  kind,
  keywords,
}: CategoryInput) {
  return { name, emoji, color, kind, keywords };
}

function invalid(error: z.ZodError): Result {
  return {
    ok: false,
    message: error.issues[0]?.message ?? "Revisa los datos.",
  };
}

export async function createCategory(input: CategoryInput): Promise<Result> {
  await getCurrentUser();
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const list = await getActiveList();
  const supabase = await createClient();
  // Al final del orden actual.
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("list_id", list.id);

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...categoryColumns(parsed.data),
      list_id: list.id,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "No se pudo crear la categoría." };

  const budget = await saveBudget(supabase, list.id, data.id, parsed.data);
  if (budget.error) {
    return { ok: false, message: "Categoría creada, pero no su presupuesto." };
  }

  refresh();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<Result> {
  await getCurrentUser();
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "Categoría no válida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(categoryColumns(parsed.data))
    .eq("id", id)
    .select("id, list_id");
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo guardar la categoría." };
  }

  const budget = await saveBudget(supabase, data[0].list_id, id, parsed.data);
  if (budget.error) {
    return { ok: false, message: "No se pudo guardar el presupuesto." };
  }

  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  await getCurrentUser();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "Categoría no válida." };
  }

  // Sus movimientos quedan "sin categoría" (on delete set null).
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo borrar la categoría." };
  }

  refresh();
  return { ok: true };
}
