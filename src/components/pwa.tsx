"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Share, WifiOff, X } from "lucide-react";
import { useOffline } from "next/offline";
import { Button } from "@/components/ui/button";

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

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-sm font-semibold text-background"
    >
      <WifiOff className="size-4" />
      Sin conexión. Lo que guardes se enviará al reconectar.
    </div>
  );
}

// Evento no estándar de Chrome/Android para instalar la PWA.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "monai:install-dismissed";

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
        <p className="font-semibold">Instala MonAi</p>
        {deferred ? (
          <p className="text-muted-foreground">
            Ábrela desde tu pantalla de inicio, como una app.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Pulsa <Share className="inline size-4 align-text-bottom" />{" "}
            Compartir y luego «Añadir a pantalla de inicio».
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
          Instalar
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="No mostrar más"
        onClick={dismiss}
      >
        <X />
      </Button>
    </div>
  );
}
