import { useState } from "react";

// Animaciones de la app: las clases están en globals.css (animate-row-in,
// animate-row-confirmed, pressable, skeleton-shimmer). Con "reducir
// movimiento" el CSS las acorta a nada y pause() no espera.

/** Lo que tarda una fila en deslizarse y cerrarse al borrarla. */
export const ROW_EXIT_MS = 320;
/** Lo que se ve el ✓ de "Guardado" antes de cerrar el formulario. */
export const SAVED_FEEDBACK_MS = 450;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Espera a que termine una animación (nada, con "reducir movimiento"). */
export function pause(ms: number) {
  if (prefersReducedMotion()) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type Item = { id: string; pending?: boolean };

export type Arrivals = {
  /** Filas que acaban de aparecer: entran animadas. */
  fresh: Set<string>;
  /** Filas reales que reemplazan a una optimista: solo se apaga el resaltado. */
  confirmed: Set<string>;
};

/**
 * Qué filas son nuevas respecto al render anterior. Si a la vez desaparece
 * una fila pendiente (guardado instantáneo), las nuevas reales son esa misma
 * fila ya confirmada: no vuelven a "caer".
 */
export function arrivals(
  previous: { ids: Set<string>; pending: number },
  items: Item[],
): Arrivals {
  const pending = items.filter((item) => item.pending).length;
  const confirming = pending < previous.pending;
  const fresh = new Set<string>();
  const confirmed = new Set<string>();
  for (const item of items) {
    if (previous.ids.has(item.id)) continue;
    if (confirming && !item.pending) confirmed.add(item.id);
    else fresh.add(item.id);
  }
  return { fresh, confirmed };
}

/**
 * arrivals() entre renders. Lo que ya estaba al montar no se anima: así la
 * carga de una página no hace bailar la lista entera.
 */
export function useArrivals(items: Item[]): Arrivals {
  const key = items.map((i) => (i.pending ? `~${i.id}` : i.id)).join(",");
  const [state, setState] = useState(() => ({
    key,
    ids: new Set(items.map((i) => i.id)),
    pending: items.filter((i) => i.pending).length,
    fresh: new Set<string>(),
    confirmed: new Set<string>(),
  }));
  if (state.key === key) return state;
  // Ajuste de estado durante el render (patrón de React para derivar del
  // render anterior): React repinta enseguida con el nuevo valor.
  const next = {
    key,
    ids: new Set(items.map((i) => i.id)),
    pending: items.filter((i) => i.pending).length,
    ...arrivals(state, items),
  };
  setState(next);
  return next;
}
