"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/data";
import type { ErrorCode } from "@/i18n/errors";
import { getRequestLocale } from "@/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { pushConfigured, sendMessages } from "@/lib/push/send";

// Suscripciones push del dispositivo y preferencias de avisos. RLS limita
// cada operación a las filas del propio usuario.

type Result = { ok: true } | { ok: false; error: ErrorCode };

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

/** Guarda la suscripción de este navegador (PushSubscription.toJSON()). */
export async function savePushSubscription(
  subscription: unknown,
  userAgent: string,
): Promise<Result> {
  await getCurrentUser();
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false, error: "push_subscribe_failed" };

  const supabase = await createClient();
  const { endpoint, keys } = parsed.data;
  // El mismo navegador puede volver a suscribirse: se reemplaza la fila.
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent.slice(0, 300),
  });
  return error ? { ok: false, error: "push_subscribe_failed" } : { ok: true };
}

export async function deletePushSubscription(
  endpoint: string,
): Promise<Result> {
  await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  return error ? { ok: false, error: "save_failed" } : { ok: true };
}

const prefsSchema = z
  .object({
    notifyBudget: z.boolean(),
    notifyRecurring: z.boolean(),
    notifyMonthClose: z.boolean(),
    notifyHideAmounts: z.boolean(),
    // "HH:MM" o null (apagado).
    dailyReminderAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  })
  .partial();

export type NotificationPrefsInput = z.infer<typeof prefsSchema>;

export async function setNotificationPrefs(
  input: NotificationPrefsInput,
): Promise<Result> {
  const user = await getCurrentUser();
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "check_data" };
  const p = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      notify_budget: p.notifyBudget,
      notify_recurring: p.notifyRecurring,
      notify_month_close: p.notifyMonthClose,
      notify_hide_amounts: p.notifyHideAmounts,
      daily_reminder_at: p.dailyReminderAt,
    })
    .eq("id", user.id)
    .select("id");
  return error || data.length === 0
    ? { ok: false, error: "save_failed" }
    : { ok: true };
}

/** Aviso de prueba a todos los dispositivos del usuario. */
export async function sendTestPush(): Promise<Result> {
  const user = await getCurrentUser();
  if (!pushConfigured()) return { ok: false, error: "push_send_failed" };
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (!subscriptions?.length) return { ok: false, error: "push_send_failed" };

  const { sent, gone } = await sendMessages([
    {
      key: "test",
      kind: "test",
      locale: await getRequestLocale(),
      hide_amounts: false,
      data: {},
      subscriptions,
    },
  ]);
  if (gone.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  }
  return sent > 0 ? { ok: true } : { ok: false, error: "push_send_failed" };
}
