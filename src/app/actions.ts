"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/money";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const newTransactionSchema = z.object({
  amountCents: z.int().positive().max(9_999_999_999),
  date: z.iso.date(),
  categoryId: z.uuid().nullable(),
  note: z.string().trim().max(200),
  source: z.enum(["manual", "text"]),
});

export type NewTransaction = z.infer<typeof newTransactionSchema>;

export async function createTransaction(
  input: NewTransaction,
): Promise<{ ok: true } | { ok: false; message: string }> {
  // Las Server Actions se pueden llamar con un POST directo: siempre
  // validar sesión y datos aquí, no solo en el cliente.
  await getCurrentUser();
  const parsed = newTransactionSchema.safeParse(input);
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
  if (error) {
    return { ok: false, message: "No se pudo guardar. Inténtalo de nuevo." };
  }

  refresh();
  return { ok: true };
}
