"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Share, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/provider";

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/** Claro / Oscuro / Auto (el del dispositivo). */
export function ThemeSelect() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  // El tema guardado solo se conoce en el cliente.
  const current = useMounted() ? (theme ?? "system") : null;

  return (
    <div
      role="radiogroup"
      aria-label={t.theme.label}
      className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
    >
      {THEMES.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
            current === value
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {t.theme[value]}
        </button>
      ))}
    </div>
  );
}

// Evento no estándar de Chrome/Android para instalar la PWA.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = "installed" | "ios" | "other";

function readInstallState(): InstallState {
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other";
}

/** Estado de la instalación como app y cómo hacerla. */
export function InstallRow() {
  const t = useT();
  const state = useSyncExternalStore(
    noopSubscribe,
    readInstallState,
    () => null,
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (state === null) return null;
  if (state === "installed" || installed) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4 text-emerald-600" />
        {t.install.installed}
      </p>
    );
  }
  if (deferred) {
    return (
      <Button
        variant="outline"
        className="h-11"
        onClick={async () => {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          setDeferred(null);
          if (outcome === "accepted") setInstalled(true);
        }}
      >
        {t.install.button}
      </Button>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      {state === "ios" ? (
        <>
          {t.install.safariTap}{" "}
          <Share className="inline size-4 align-text-bottom" />{" "}
          {t.install.shareThenAdd}
        </>
      ) : (
        t.install.otherBrowsers
      )}
    </p>
  );
}
