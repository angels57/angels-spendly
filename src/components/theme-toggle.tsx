"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const NEXT = { system: "light", light: "dark", dark: "system" } as const;
const LABEL = {
  system: "Tema: automático",
  light: "Tema: claro",
  dark: "Tema: oscuro",
} as const;

type Theme = keyof typeof NEXT;

// El tema guardado solo se conoce en el cliente: en el servidor se pinta
// el icono neutro para no provocar un desajuste de hidratación.
const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current: Theme =
    mounted && theme && theme in NEXT ? (theme as Theme) : "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`${LABEL[current]}. Cambiar tema`}
      title={LABEL[current]}
      onClick={() => setTheme(NEXT[current])}
    >
      <Icon />
    </Button>
  );
}
