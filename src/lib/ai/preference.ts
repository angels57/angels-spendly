"use client";

import { useSyncExternalStore } from "react";

// Preferencia "IA en el dispositivo": por dispositivo (no por cuenta),
// porque depende del celular y de cuánto quiere descargar el usuario.
// Desactivada por defecto.

const KEY = "spendly:on-device-ai";
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Otra pestaña cambió el ajuste.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setOnDeviceAIEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "1" : "0");
  } catch {
    // Sin almacenamiento el ajuste dura hasta recargar.
  }
  listeners.forEach((listener) => listener());
}

/** En el servidor siempre es false: la IA solo se activa tras hidratar. */
export function useOnDeviceAIEnabled() {
  return useSyncExternalStore(subscribe, read, () => false);
}
