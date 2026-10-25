"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { categoryInputSchema, type CategoryInput } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; message: string };

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

  const { error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, list_id: list.id, sort_order: count ?? 0 });
  if (error) return { ok: false, message: "No se pudo crear la categoría." };

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
    .update(parsed.data)
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo guardar la categoría." };
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
