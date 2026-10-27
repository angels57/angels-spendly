"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { asCurrencyCode, fromCents, toCents } from "@/lib/money";
import {
  currencySchema,
  recurringInputSchema,
  type RecurringInput,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; generated?: number } | { ok: false; message: string };

function invalid(error: z.ZodError): Result {
  return {
    ok: false,
    message: error.issues[0]?.message ?? "Revisa los datos.",
  };
}

export async function createRecurring(input: RecurringInput): Promise<Result> {
  await getCurrentUser();
  const parsed = recurringInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_transactions").insert({
    list_id: list.id,
    category_id: parsed.data.categoryId,
    amount: fromCents(parsed.data.amountCents),
    currency: parsed.data.currency,
    note: parsed.data.note,
    frequency: parsed.data.frequency,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    next_run: parsed.data.startDate,
  });
  if (error) return { ok: false, message: "No se pudo crear el recurrente." };

  // Si empieza hoy o en el pasado, crea ya los movimientos pendientes en
  // vez de esperar a la tarea diaria.
  const { data: generated, error: genError } = await supabase.rpc(
    "generate_recurring",
    { p_list_id: list.id },
  );
  if (genError) {
    return {
      ok: false,
      message: "Creado, pero no se generaron sus movimientos.",
    };
  }

  refresh();
  return { ok: true, generated: generated ?? 0 };
}

// Solo cambia lo que afecta a los próximos movimientos. Frecuencia e
// inicio definen el calendario: para cambiarlos, se crea otro recurrente.
const recurringUpdateSchema = z.object({
  amountCents: z.int().positive().max(9_999_999_999),
  currency: currencySchema,
  categoryId: z.uuid().nullable(),
  note: z.string().trim().min(1).max(200),
  endDate: z.iso.date().nullable(),
});

export type RecurringUpdate = z.infer<typeof recurringUpdateSchema>;

export async function updateRecurring(
  id: string,
  input: RecurringUpdate,
): Promise<Result> {
  await getCurrentUser();
  const parsed = recurringUpdateSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return { ok: false, message: "Revisa los datos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update({
      category_id: parsed.data.categoryId,
      amount: fromCents(parsed.data.amountCents),
      currency: parsed.data.currency,
      note: parsed.data.note,
      end_date: parsed.data.endDate,
    })
    .eq("id", id)
    .select("id");
  if (error?.code === "23514") {
    return {
      ok: false,
      message: "La fecha de fin no puede ser anterior al inicio.",
    };
  }
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo guardar el recurrente." };
  }

  refresh();
  return { ok: true };
}

export type DeletedRecurring = {
  id: string;
  input: RecurringInput;
  generatedCount: number;
  nextRun: string;
  /** Movimientos que ya había generado (al borrar quedan sueltos). */
  transactionIds: string[];
};

export async function deleteRecurring(
  id: string,
): Promise<
  { ok: true; data: DeletedRecurring } | { ok: false; message: string }
> {
  await getCurrentUser();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "Recurrente no válido." };
  }

  // Se guarda lo necesario para deshacer. Los movimientos ya generados se
  // conservan (recurring_id → null).
  const supabase = await createClient();
  const [rule, transactions] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select(
        "amount, currency, category_id, note, frequency, start_date, end_date, generated_count, next_run",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("transactions").select("id").eq("recurring_id", id),
  ]);
  if (rule.error || !rule.data || transactions.error) {
    return { ok: false, message: "No se pudo borrar el recurrente." };
  }

  const { data, error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) {
    return { ok: false, message: "No se pudo borrar el recurrente." };
  }

  refresh();
  const r = rule.data;
  return {
    ok: true,
    data: {
      id,
      input: {
        amountCents: toCents(r.amount),
        currency: asCurrencyCode(r.currency),
        categoryId: r.category_id,
        note: r.note,
        frequency: r.frequency,
        startDate: r.start_date,
        endDate: r.end_date,
      },
      generatedCount: r.generated_count,
      nextRun: r.next_run,
      transactionIds: transactions.data.map((t) => t.id),
    },
  };
}

const deletedRecurringSchema = z.object({
  id: z.uuid(),
  input: recurringInputSchema,
  generatedCount: z.int().min(0),
  nextRun: z.iso.date(),
  transactionIds: z.array(z.uuid()).max(5_000),
});

/** Deshace deleteRecurring: misma regla, mismo calendario, mismos movimientos. */
export async function restoreRecurring(
  deleted: DeletedRecurring,
): Promise<Result> {
  await getCurrentUser();
  const parsed = deletedRecurringSchema.safeParse(deleted);
  if (!parsed.success) return { ok: false, message: "No se pudo deshacer." };
  const { id, input, generatedCount, nextRun, transactionIds } = parsed.data;

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_transactions").insert({
    id,
    list_id: list.id,
    category_id: input.categoryId,
    amount: fromCents(input.amountCents),
    currency: input.currency,
    note: input.note,
    frequency: input.frequency,
    start_date: input.startDate,
    end_date: input.endDate,
    generated_count: generatedCount,
    next_run: nextRun,
  });
  if (error) return { ok: false, message: "No se pudo deshacer." };

  // PostgREST pone los ids del filtro "in" en la URL: por tandas.
  const results = await Promise.all(
    Array.from({ length: Math.ceil(transactionIds.length / 200) }, (_, i) =>
      supabase
        .from("transactions")
        .update({ recurring_id: id })
        .in("id", transactionIds.slice(i * 200, (i + 1) * 200))
        .is("recurring_id", null),
    ),
  );

  refresh();
  if (results.some((r) => r.error)) {
    return {
      ok: false,
      message: "Recurrente restaurado, pero no todos sus movimientos.",
    };
  }
  return { ok: true };
}
