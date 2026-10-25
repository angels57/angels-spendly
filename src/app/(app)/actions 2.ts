"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { fromCents, toCents } from "@/lib/money";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { transactionInputSchema, type TransactionInput } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

// Las Server Actions se pueden llamar con un POST directo: siempre validar
// sesión y datos aquí, no solo en el cliente. RLS limita además cada
// operación a las listas de las que el usuario es miembro.

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string };

const SAVE_ERROR = "No se pudo guardar. Inténtalo de nuevo.";

export async function createTransaction(
  input: TransactionInput & { source: "manual" | "text" },
): Promise<Result> {
  await getCurrentUser();
  const parsed = transactionInputSchema
    .extend({ source: z.enum(["manual", "text"]) })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa el monto y la fecha." };
  }

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    list_id: list.id,
    category_id: parsed.data.categoryId,
    amount: fromCents(parsed.data.amountCents),
    currency: list.currency,
    occurred_on: parsed.data.date,
    note: parsed.data.note,
    source: parsed.data.source,
  });
  if (error) return { ok: false, message: SAVE_ERROR };

  refresh();
  return { ok: true };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Result> {
  await getCurrentUser();
  const parsed = transactionInputSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return { ok: false, message: "Revisa el monto y la fecha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({
      category_id: parsed.data.categoryId,
      amount: fromCents(parsed.data.amountCents),
      occurred_on: parsed.data.date,
      note: parsed.data.note,
    })
    .eq("id", id)
    .select("id");
  // Sin filas: no existe o RLS lo oculta (no es de tus listas).
  if (error || data.length === 0) return { ok: false, message: SAVE_ERROR };

  refresh();
  return { ok: true };
}

export type DeletedTransaction = TransactionInput & {
  id: string;
  source: "manual" | "text" | "voice" | "ai";
};

export async function deleteTransaction(
  id: string,
): Promise<Result<DeletedTransaction>> {
  await getCurrentUser();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "Movimiento no válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("id, amount, occurred_on, category_id, note, source")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, message: "No se pudo borrar. Inténtalo de nuevo." };
  }

  refresh();
  // Devolvemos lo borrado para poder deshacer desde el aviso.
  return {
    ok: true,
    data: {
      id: data.id,
      amountCents: toCents(data.amount),
      date: data.occurred_on,
      categoryId: data.category_id,
      note: data.note,
      source: data.source,
    },
  };
}

export async function restoreTransaction(
  deleted: DeletedTransaction,
): Promise<Result> {
  await getCurrentUser();
  const parsed = transactionInputSchema
    .extend({
      id: z.uuid(),
      source: z.enum(["manual", "text", "voice", "ai"]),
    })
    .safeParse(deleted);
  if (!parsed.success) return { ok: false, message: SAVE_ERROR };

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    id: parsed.data.id,
    list_id: list.id,
    category_id: parsed.data.categoryId,
    amount: fromCents(parsed.data.amountCents),
    currency: list.currency,
    occurred_on: parsed.data.date,
    note: parsed.data.note,
    source: parsed.data.source,
  });
  if (error) return { ok: false, message: SAVE_ERROR };

  refresh();
  return { ok: true };
}
