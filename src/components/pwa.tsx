"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Share, WifiOff, X } from "lucide-react";
import { useOffline } from "next/offline";
import { Button } from "@/components/ui/button";
import { APP_SHORT_NAME } from "@/lib/brand";
import { useT } from "@/i18n/provider";
import { saveTimeZone } from "@/app/time-zone";

/** Registra el service worker (solo en producción: en dev rompería el HMR). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sin service worker la app funciona igual, solo sin modo offline.
      });
  }, []);
  return null;
}

const TIME_ZONE_SYNCED_KEY = "spendly:time-zone-synced";

/**
 * Manda la zona horaria del dispositivo al servidor (cookie y perfil), una
 * vez por sesión del navegador o cuando cambia. Si la cookie era otra (o es
 * la primera visita), vuelve a pedir la página con la fecha correcta.
 */
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    try {
      if (sessionStorage.getItem(TIME_ZONE_SYNCED_KEY) === timeZone) return;
    } catch {
      // Sin almacenamiento: se sincroniza en cada carga.
    }
    saveTimeZone(timeZone)
      .then((changed) => {
        try {
          sessionStorage.setItem(TIME_ZONE_SYNCED_KEY, timeZone);
        } catch {
          // Sin almacenamiento: se volverá a mandar en la próxima carga.
        }
        if (changed) router.refresh();
      })
      .catch(() => {
        // Sin conexión: se reintenta en la próxima carga.
      });
  }, [router]);
  return null;
}

export function OfflineBanner() {
  const offline = useOffline();
  const t = useT();
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-sm font-semibold text-background"
    >
      <WifiOff className="size-4" />
      {t.install.offlineBanner}
    </div>
  );
}

// Evento no estándar de Chrome/Android para instalar la PWA.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "spendly:install-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

function useIsIosSafariNotInstalled() {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(navigator as Navigator & { standalone?: boolean }).standalone &&
      !matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
}

/** Invita a instalar la app: botón en Android/Chrome, instrucciones en iOS. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(true);
  const t = useT();
  const isIos = useIsIosSafariNotInstalled();

  useEffect(() => {
    // localStorage solo existe en el cliente: se lee tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(readDismissed());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Sin almacenamiento: se volverá a mostrar en la próxima visita.
    }
  }

  if (dismissed || (!deferred && !isIos)) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 text-sm">
      <span className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="font-semibold">{t.install.title(APP_SHORT_NAME)}</p>
        {deferred ? (
          <p className="text-muted-foreground">{t.install.openFromHome}</p>
        ) : (
          <p className="text-muted-foreground">
            {t.install.tap}{" "}
            <Share className="inline size-4 align-text-bottom" />{" "}
            {t.install.shareThenAdd}
          </p>
        )}
      </div>
      {deferred && (
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            setDeferred(null);
            if (outcome === "dismissed") dismiss();
          }}
        >
          {t.install.buttonShort}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.install.dismiss}
        onClick={dismiss}
      >
        <X />
      </Button>
    </div>
  );
}
