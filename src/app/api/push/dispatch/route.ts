import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { pushConfigured, sendMessages } from "@/lib/push/send";

/**
 * Avisos programados (recurrentes, recordatorio diario, cierre de mes).
 * La llama pg_cron cada 15 minutos con el secreto en x-dispatch-secret; la
 * ruta no lo conoce: se lo pasa a push_due(), que lo comprueba en la base
 * de datos y reserva los avisos que tocan.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-dispatch-secret");
  if (!secret) return new Response("Missing secret", { status: 401 });
  if (!pushConfigured()) {
    return Response.json({ sent: 0, skipped: "VAPID keys not set" });
  }

  // Sin sesión (rol anon): el secreto es la llave de push_due/push_forget.
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase.rpc("push_due", {
    p_secret: secret,
  });
  if (error) {
    const forbidden = error.code === "42501";
    if (!forbidden) console.error("push: push_due", error.message);
    return new Response(forbidden ? "Forbidden" : "Error", {
      status: forbidden ? 403 : 500,
    });
  }

  const { sent, gone } = await sendMessages(data);
  if (gone.length > 0) {
    await supabase.rpc("push_forget", {
      p_secret: secret,
      p_endpoints: gone,
    });
  }
  return Response.json({ messages: data.length, sent, gone: gone.length });
}
