"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IDLE_STATE, type OnDeviceModel } from "@/lib/ai/models";

export type OnDeviceSupport = "checking" | "webgpu" | "wasm" | "unsupported";

let supportPromise: Promise<Exclude<OnDeviceSupport, "checking">> | null = null;

/** WebGPU va rápido; WASM funciona en casi todo, pero más lento. */
function detectSupport() {
  supportPromise ??= (async () => {
    // Cache Storage (donde quedan los modelos) solo existe con HTTPS o
    // localhost.
    if (
      !window.isSecureContext ||
      typeof WebAssembly === "undefined" ||
      !("caches" in window)
    ) {
      return "unsupported";
    }
    const { isWebGPUAvailable } = await import("runonweb/core");
    return (await isWebGPUAvailable()) ? "webgpu" : "wasm";
  })().catch(() => "unsupported" as const);
  return supportPromise;
}

export function useOnDeviceSupport() {
  const [support, setSupport] = useState<OnDeviceSupport>("checking");
  useEffect(() => {
    let active = true;
    detectSupport().then((result) => {
      if (active) setSupport(result);
    });
    return () => {
      active = false;
    };
  }, []);
  return support;
}

/** Estado de carga de un modelo (idle, loading con progreso, ready, error). */
export function useModelState<T>(model: OnDeviceModel<T>) {
  return useSyncExternalStore(
    model.subscribe,
    model.getState,
    () => IDLE_STATE,
  );
}
