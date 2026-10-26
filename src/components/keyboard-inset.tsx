"use client";

import { useEffect } from "react";

// iOS no encoge la página al abrir el teclado (ignora interactive-widget):
// el teclado tapa la parte de abajo. Aquí se publica cuánto tapa en
// --keyboard-inset para que los drawers suban por encima. En Android,
// con resizes-content, la página ya se encoge y el valor queda en 0.
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    function update() {
      const covered =
        window.innerHeight - viewport!.height - viewport!.offsetTop;
      // Con zoom de pellizco también baja la altura visible: no es el teclado.
      const inset = viewport!.scale > 1.01 ? 0 : Math.max(0, covered);
      root.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return null;
}
