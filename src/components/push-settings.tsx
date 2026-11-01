"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { selectClassName } from "@/components/transaction-form";
import { useLocale, useT } from "@/i18n/provider";
import { dateLocale } from "@/lib/dates";
import { APP_SHORT_NAME } from "@/lib/brand";
import type { NotificationPrefs } from "@/lib/data";
import {
  deletePushSubscription,
  savePushSubscription,
  sendTestPush,
  setNotificationPrefs,
  type NotificationPrefsInput,
} from "@/app/[lang]/(app)/settings/push-actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
/** Horas para el recordatorio diario. */
const REMINDER_TIMES = [
  "08:00",
  "12:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

type Status =
  | "loading"
  | "unconfigured"
  | "unsupported"
  /** iPhone/iPad en Safari: push solo en la app instalada. */
  | "install"
  | "denied"
  | "off"
  | "on";

/**
 * Ajustes → Notificaciones. El permiso se pide solo al tocar "Activar"
 * (iOS lo exige). Cada dispositivo tiene su suscripción; las preferencias
 * son de la cuenta.
 */
export function PushSettings({ prefs }: { prefs: NotificationPrefs }) {
  const t = useT();
  const tn = t.notifications;
  const [status, setStatus] = useState<Status>("loading");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    detect().then(setStatus);
  }, []);

  function enable() {
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) throw new Error("Sin service worker");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY!),
        });
        const result = await savePushSubscription(
          subscription.toJSON(),
          navigator.userAgent,
        );
        if (!result.ok) {
          await subscription.unsubscribe();
          toast.error(t.errors[result.error]);
          return;
        }
        setStatus("on");
      } catch {
        toast.error(t.errors.push_subscribe_failed);
      }
    });
  }

  function disable() {
    startTransition(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    });
  }

  function test() {
    startTransition(async () => {
      const result = await sendTestPush();
      if (result.ok) toast.success(tn.testSent);
      else toast.error(t.errors[result.error]);
    });
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-14 items-center px-4">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const message = {
    unconfigured: tn.notConfigured,
    unsupported: tn.unsupported,
    install: tn.installFirst(APP_SHORT_NAME),
    denied: tn.denied,
  }[status as string];
  if (message) {
    return (
      <p className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
        <BellOff className="mt-0.5 size-5 shrink-0" />
        {message}
      </p>
    );
  }

  if (status === "off") {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">{tn.enableHint}</p>
        <Button size="lg" className="h-11" onClick={enable} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Bell />}
          {tn.enable}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-2 font-semibold">
          <Bell className="size-5 shrink-0 text-primary" />
          {tn.enabled}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={test}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            {tn.sendTest}
          </Button>
          <Button
            variant="ghost"
            className="h-11 text-muted-foreground"
            onClick={disable}
            disabled={pending}
          >
            {tn.disable}
          </Button>
        </div>
      </div>
      <Preferences initial={prefs} />
    </>
  );
}

function Preferences({ initial }: { initial: NotificationPrefs }) {
  const t = useT();
  const tn = t.notifications;
  const locale = useLocale();
  const [prefs, setPrefs] = useState(initial);

  // Se guarda al momento; si falla, vuelve el valor anterior.
  async function save(change: NotificationPrefsInput) {
    const before = prefs;
    setPrefs({ ...prefs, ...change });
    const result = await setNotificationPrefs(change);
    if (!result.ok) {
      setPrefs(before);
      toast.error(t.errors[result.error]);
    }
  }

  const time = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return new Intl.DateTimeFormat(dateLocale(locale), {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(2000, 0, 1, hours, minutes));
  };

  return (
    <>
      <Toggle
        label={tn.budget}
        hint={tn.budgetHint}
        checked={prefs.notifyBudget}
        onChange={(value) => save({ notifyBudget: value })}
      />
      <Toggle
        label={tn.recurring}
        hint={tn.recurringHint}
        checked={prefs.notifyRecurring}
        onChange={(value) => save({ notifyRecurring: value })}
      />
      <Toggle
        label={tn.monthClose}
        hint={tn.monthCloseHint}
        checked={prefs.notifyMonthClose}
        onChange={(value) => save({ notifyMonthClose: value })}
      />
      <label className="flex min-h-14 items-center gap-3 px-4 py-3">
        <span className="flex flex-1 flex-col">
          <span className="font-semibold">{tn.daily}</span>
          <span className="text-xs text-muted-foreground">{tn.dailyHint}</span>
        </span>
        <select
          value={prefs.dailyReminderAt ?? ""}
          onChange={(e) => save({ dailyReminderAt: e.target.value || null })}
          className={cn(selectClassName, "w-auto")}
        >
          <option value="">{tn.off}</option>
          {REMINDER_TIMES.map((value) => (
            <option key={value} value={value}>
              {time(value)}
            </option>
          ))}
        </select>
      </label>
      <Toggle
        label={tn.hideAmounts}
        hint={tn.hideAmountsHint}
        checked={prefs.notifyHideAmounts}
        onChange={(value) => save({ notifyHideAmounts: value })}
      />
    </>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
    >
      <span className="flex flex-1 flex-col">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

async function detect(): Promise<Status> {
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // El iPad se presenta como Mac.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  // En Safari de iOS PushManager solo existe en la app instalada.
  if (!supported) return ios ? "install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  // El service worker se registra solo en producción (pwa.tsx).
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return "unsupported";
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

/** La clave VAPID pública (base64url) como la pide pushManager.subscribe. */
function base64UrlToBytes(value: string) {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
