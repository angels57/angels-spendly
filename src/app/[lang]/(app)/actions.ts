"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { asCurrencyCode, fromCents, toCents } from "@/lib/money";
import { getActiveList, getCurrentUser } from "@/lib/data";
import {
  currencySchema,
  transactionInputSchema,
  type TransactionInput,
} from "@/lib/schemas";
import type { ErrorCode } from "@/i18n/errors";
import { hasLocale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/request";
import { createClient } from "@/lib/supabase/server";

// Las Server Actions se pueden llamar con un POST directo: siempre validar
// sesión y datos aquí, no solo en el cliente. RLS limita además cada
// operación a las listas de las que el usuario es miembro.

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: ErrorCode };

const SAVE_ERROR = "save_failed";

export async function createTransaction(
  input: TransactionInput & { source: "manual" | "text" },
): Promise<Result> {
  await getCurrentUser();
  const parsed = transactionInputSchema
    .extend({ source: z.enum(["manual", "text"]) })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "check_amount_date" };
  }

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    list_id: list.id,
    category_id: parsed.data.categoryId,
    amount: fromCents(parsed.data.amountCents),
    currency: parsed.data.currency,
    occurred_on: parsed.data.date,
    note: parsed.data.note,
    source: parsed.data.source,
  });
  if (error) return { ok: false, error: SAVE_ERROR };

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
    return { ok: false, error: "check_amount_date" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({
      category_id: parsed.data.categoryId,
      amount: fromCents(parsed.data.amountCents),
      currency: parsed.data.currency,
      occurred_on: parsed.data.date,
      note: parsed.data.note,
    })
    .eq("id", id)
    .select("id");
  // Sin filas: no existe o RLS lo oculta (no es de tus listas).
  if (error || data.length === 0) return { ok: false, error: SAVE_ERROR };

  refresh();
  return { ok: true };
}

const SOURCES = ["manual", "text", "voice", "ai", "recurring"] as const;

export type DeletedTransaction = TransactionInput & {
  id: string;
  source: (typeof SOURCES)[number];
  recurringId: string | null;
};

export async function deleteTransaction(
  id: string,
): Promise<Result<DeletedTransaction>> {
  await getCurrentUser();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: "invalid_transaction" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select(
      "id, amount, currency, occurred_on, category_id, note, source, recurring_id",
    )
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "delete_failed" };
  }

  refresh();
  // Devolvemos lo borrado para poder deshacer desde el aviso.
  return {
    ok: true,
    data: {
      id: data.id,
      amountCents: toCents(data.amount),
      currency: asCurrencyCode(data.currency),
      date: data.occurred_on,
      categoryId: data.category_id,
      note: data.note,
      source: data.source,
      recurringId: data.recurring_id,
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
      source: z.enum(SOURCES),
      recurringId: z.uuid().nullable(),
    })
    .safeParse(deleted);
  if (!parsed.success) return { ok: false, error: SAVE_ERROR };

  const list = await getActiveList();
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    id: parsed.data.id,
    list_id: list.id,
    category_id: parsed.data.categoryId,
    amount: fromCents(parsed.data.amountCents),
    currency: parsed.data.currency,
    occurred_on: parsed.data.date,
    note: parsed.data.note,
    source: parsed.data.source,
    recurring_id: parsed.data.recurringId,
  });
  if (error) return { ok: false, error: SAVE_ERROR };

  refresh();
  return { ok: true };
}

/** Moneda principal de la lista: la de totales y presupuestos. */
export async function setListCurrency(currency: string): Promise<Result> {
  await getCurrentUser();
  const parsed = currencySchema.safeParse(currency);
  if (!parsed.success) return { ok: false, error: "invalid_currency" };

  const list = await getActiveList();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .update({ currency: parsed.data })
    .eq("id", list.id)
    .select("id");
  // Sin filas: RLS solo deja cambiarla al dueño de la lista.
  if (error || data.length === 0) {
    return { ok: false, error: "owner_only" };
  }

  refresh();
  return { ok: true };
}

/**
 * Idioma de la cuenta. Se guarda en el perfil (manda al iniciar sesión, en
 * cualquier dispositivo), en los metadatos de Auth (las plantillas de correo
 * de Supabase solo ven esos) y en la cookie (para lo que queda de sesión).
 * Quien llama navega luego a la misma página con el nuevo prefijo.
 */
export async function setLocale(locale: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!hasLocale(locale)) return { ok: false, error: "check_data" };

  const supabase = await createClient();
  const [profile, auth] = await Promise.all([
    supabase.from("profiles").update({ locale }).eq("id", user.id).select("id"),
    supabase.auth.updateUser({ data: { locale } }),
  ]);
  await setLocaleCookie(locale);
  if (profile.error || profile.data.length === 0 || auth.error) {
    return { ok: false, error: "save_failed" };
  }
  return { ok: true };
}
