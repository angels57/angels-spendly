"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { fromCents, toCents } from "@/lib/money";
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

export type DeletedCategory = {
  id: string;
  input: CategoryInput;
  sortOrder: number;
  /** Movimientos y recurrentes que quedaron sin categoría al borrarla. */
  transactionIds: string[];
  recurringIds: string[];
};

export async function deleteCategory(
  id: string,
): Promise<
  { ok: true; data: DeletedCategory } | { ok: false; message: string }
> {
  await getCurrentUser();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "Categoría no válida." };
  }

  // Antes de borrar se guarda lo necesario para deshacer: la categoría, su
  // presupuesto y qué movimientos/recurrentes la usaban (al borrarla quedan
  // "sin categoría" por on delete set null).
  const supabase = await createClient();
  const [category, transactions, recurring] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "name, emoji, color, kind, keywords, sort_order, budgets!budgets_category_same_list_fkey(amount)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("transactions").select("id").eq("category_id", id),
    supabase.from("recurring_transactions").select("id").eq("category_id", id),
  ]);
  if (
    category.error ||
    !category.data ||
    transactions.error ||
    recurring.error
  ) {
    return { ok: false, message: "No se pudo borrar la categoría." };
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo borrar la categoría." };
  }

  refresh();
  const c = category.data;
  return {
    ok: true,
    data: {
      id,
      input: {
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        kind: c.kind,
        keywords: c.keywords,
        budgetCents: c.budgets ? toCents(c.budgets.amount) : null,
      },
      sortOrder: c.sort_order,
      transactionIds: transactions.data.map((t) => t.id),
      recurringIds: recurring.data.map((r) => r.id),
    },
  };
}

const deletedCategorySchema = z.object({
  id: z.uuid(),
  input: categoryInputSchema,
  sortOrder: z.int(),
  transactionIds: z.array(z.uuid()).max(20_000),
  recurringIds: z.array(z.uuid()).max(1_000),
});

// PostgREST pone los ids del filtro "in" en la URL: por tandas.
const ID_BATCH = 200;

/** Deshace deleteCategory: misma id, presupuesto y movimientos de vuelta. */
export async function restoreCategory(
  deleted: DeletedCategory,
): Promise<Result> {
  await getCurrentUser();
  const parsed = deletedCategorySchema.safeParse(deleted);
  if (!parsed.success) return { ok: false, message: "No se pudo deshacer." };
  const { id, input, sortOrder, transactionIds, recurringIds } = parsed.data;

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    ...categoryColumns(input),
    id,
    list_id: list.id,
    sort_order: sortOrder,
  });
  if (error) return { ok: false, message: "No se pudo deshacer." };

  const budget = await saveBudget(supabase, list.id, id, input);
  // Solo los que siguen sin categoría: si alguno se cambió mientras tanto,
  // se respeta.
  const relinks = [
    ...chunk(transactionIds).map((ids) =>
      supabase
        .from("transactions")
        .update({ category_id: id })
        .in("id", ids)
        .is("category_id", null),
    ),
    ...chunk(recurringIds).map((ids) =>
      supabase
        .from("recurring_transactions")
        .update({ category_id: id })
        .in("id", ids)
        .is("category_id", null),
    ),
  ];
  const results = await Promise.all(relinks);

  refresh();
  if (budget.error || results.some((r) => r.error)) {
    return {
      ok: false,
      message: "Categoría restaurada, pero no todos sus movimientos.",
    };
  }
  return { ok: true };
}

function chunk<T>(items: T[]): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += ID_BATCH) {
    batches.push(items.slice(i, i + ID_BATCH));
  }
  return batches;
}
