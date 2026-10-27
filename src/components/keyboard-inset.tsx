"use client";

import { useEffect } from "react";

// iOS no encoge la página al abrir el teclado (ignora interactive-widget):
// el teclado tapa la parte de abajo y, además, iOS desplaza la página para
// mostrar el campo. Aquí se publica:
// - --keyboard-inset: cuánto tapa el teclado, para subir los drawers.
// - --visual-viewport-height: lo que de verdad se ve, para que un drawer
//   nunca sea más alto (100dvh no cambia con el teclado en iOS, y el
//   drawer se salía por arriba).
// En Android, con resizes-content, la página ya se encoge: inset 0.
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    let previousInset = 0;

    function update() {
      // Con zoom de pellizco también baja la altura visible: no es el teclado.
      const zoomed = viewport!.scale > 1.01;
      const covered =
        window.innerHeight - viewport!.height - viewport!.offsetTop;
      const inset = zoomed ? 0 : Math.max(0, Math.round(covered));
      const visible = zoomed ? window.innerHeight : viewport!.height;
      root.style.setProperty("--keyboard-inset", `${inset}px`);
      root.style.setProperty(
        "--visual-viewport-height",
        `${Math.round(visible)}px`,
      );

      // Al abrirse (o cambiar) el teclado, el campo activo de un drawer
      // queda a la vista dentro de su zona desplazable.
      if (inset > 0 && inset !== previousInset) {
        requestAnimationFrame(() => {
          const active = document.activeElement;
          if (active?.closest("[data-slot=drawer-content]")) {
            active.scrollIntoView({ block: "nearest" });
          }
        });
      }
      previousInset = inset;
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--visual-viewport-height");
    };
  }, []);

  return null;
}
