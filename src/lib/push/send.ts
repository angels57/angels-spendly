import "server-only";
import webpush from "web-push";
import type { Json } from "@/lib/supabase/database.types";
import { buildNotification, type PushMessage } from "./messages";

// Envío de avisos push (cifrado y firmado con las claves VAPID). Las claves
// están en las variables de entorno; sin ellas no se envía nada.

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
// El servicio push escribe aquí si algo va mal con nuestros envíos.
const SUBJECT = "https://angels-spendly.vercel.app";

export function pushConfigured() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

type Subscription = { endpoint: string; p256dh: string; auth: string };

function asSubscriptions(value: Json): Subscription[] {
  return Array.isArray(value) ? (value as Subscription[]) : [];
}

/**
 * Envía cada aviso a todas las suscripciones de su usuario. Devuelve los
 * endpoints que el servicio push dio por muertos (404/410): hay que
 * borrarlos.
 */
export async function sendMessages(
  messages: (PushMessage & { subscriptions: Json })[],
): Promise<{ sent: number; gone: string[] }> {
  if (!pushConfigured()) return { sent: 0, gone: [] };
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    messages.flatMap((message) => {
      const payload = buildNotification(message);
      if (!payload) return [];
      return asSubscriptions(message.subscriptions).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
            {
              vapidDetails: {
                subject: SUBJECT,
                publicKey: PUBLIC_KEY!,
                privateKey: PRIVATE_KEY!,
              },
              // Si el móvil está apagado, el aviso espera hasta un día.
              TTL: 60 * 60 * 24,
              urgency: message.kind === "budget" ? "high" : "normal",
            },
          );
          sent++;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(sub.endpoint);
          else console.error("push: envío fallido", status ?? error);
        }
      });
    }),
  );
  return { sent, gone };
}
