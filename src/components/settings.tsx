"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Monitor, Moon, Share, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/provider";
import { setLocale } from "@/app/[lang]/(app)/actions";
import {
  LOCALE_NAMES,
  LOCALES,
  localizePath,
  splitLocale,
  type Locale,
} from "@/i18n/config";

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

/** English / Español: lo guarda en la cuenta y abre la misma página en ese idioma. */
export function LanguageSelect() {
  const t = useT();
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current || pending) return;
    startTransition(async () => {
      const result = await setLocale(locale);
      if (!result.ok) {
        toast.error(t.errors[result.error]);
        return;
      }
      router.replace(localizePath(locale, splitLocale(pathname).path));
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.settings.language}
      className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          role="radio"
          lang={locale}
          aria-checked={current === locale}
          disabled={pending}
          onClick={() => choose(locale)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
            current === locale
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {pending && current !== locale && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {LOCALE_NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
