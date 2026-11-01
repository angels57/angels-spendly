import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { pushConfigured, sendMessages } from "./send";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Tras guardar un gasto: si su categoría cruzó el 80 % o el 100 % del
 * presupuesto del mes, avisa (una vez por umbral y mes; lo decide
 * push_budget_alert). Va en after(): no retrasa el guardado.
 */
export async function sendBudgetAlert(
  supabase: Supabase,
  categoryId: string,
  occurredOn: string,
) {
  // Sin claves no se reserva el aviso: llegará cuando estén configuradas.
  if (!pushConfigured()) return;
  const { data, error } = await supabase.rpc("push_budget_alert", {
    p_category_id: categoryId,
    p_occurred_on: occurredOn,
  });
  if (error) {
    console.error("push: aviso de presupuesto", error.message);
    return;
  }
  if (!data.length) return;
  const { gone } = await sendMessages(data);
  if (gone.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  }
}
