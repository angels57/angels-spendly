"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// Lo que se ve de verdad: la clase "dark" de <html> que pone next-themes.
// Su resolvedTheme puede ir un paso por detrás del tema del sistema, y
// entonces el primer toque no cambiaba nada.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");

/**
 * Un toque cambia siempre a lo contrario de lo que se ve. Hasta el primer
 * toque se sigue el tema del dispositivo ("system").
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  // En el servidor no se sabe: icono de claro, sin desajuste al hidratar.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const Icon = dark ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={
        dark ? "Tema oscuro. Cambiar a claro" : "Tema claro. Cambiar a oscuro"
      }
      title={dark ? "Cambiar a claro" : "Cambiar a oscuro"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Icon />
    </Button>
  );
}
