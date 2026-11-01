import type { ProgressInfo } from "runonweb/core";

// Modelos de IA que corren en el navegador (runonweb). Cada uno se importa
// con import() dinámico y se carga una sola vez por pestaña, solo cuando
// algo lo pide. Nunca usar desde código de servidor: depende de
// navigator.gpu, Cache Storage y WebAssembly.

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export type ModelState = {
  status: ModelStatus;
  /** 0–100 mientras descarga; null si no se sabe. */
  progress: number | null;
  device: "webgpu" | "wasm" | null;
};

type Loadable = {
  load(): Promise<void>;
  readonly device: "webgpu" | "wasm" | null;
};

export type OnDeviceModel<T> = {
  id: string;
  label: string;
  /** Descarga aproximada en MB, para avisar antes de bajarlo. */
  approxMB: number;
  /** Carga el modelo (la primera vez lo descarga) y devuelve la instancia. */
  get(): Promise<T>;
  /** Ya está en la caché del navegador: cargarlo no descarga nada. */
  isDownloaded(): Promise<boolean>;
  getState(): ModelState;
  subscribe(onChange: () => void): () => void;
  /** Olvida la instancia, por ejemplo tras borrar los modelos descargados. */
  reset(): void;
};

export const IDLE_STATE: ModelState = {
  status: "idle",
  progress: null,
  device: null,
};

function defineModel<T extends Loadable>(config: {
  id: string;
  label: string;
  approxMB: number;
  /** Repositorio de Hugging Face, para saber si ya está en caché. */
  repo: string;
  create: (onProgress: (info: ProgressInfo) => void) => Promise<T>;
}): OnDeviceModel<T> {
  let state = IDLE_STATE;
  let instance: Promise<T> | null = null;
  const listeners = new Set<() => void>();

  function set(next: Partial<ModelState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  function onProgress(info: ProgressInfo) {
    // Transformers.js informa por archivo y, además, del total
    // (progress_total). El total es el único que no retrocede.
    if (info.status === "progress_total" && info.progress != null) {
      set({ progress: Math.round(info.progress) });
    }
  }

  return {
    id: config.id,
    label: config.label,
    approxMB: config.approxMB,
    get() {
      instance ??= (async () => {
        set({ status: "loading", progress: 0 });
        try {
          const model = await config.create(onProgress);
          await model.load();
          set({ status: "ready", progress: 100, device: model.device });
          return model;
        } catch (error) {
          // Se puede reintentar: la próxima llamada vuelve a cargar.
          instance = null;
          set({ status: "error", progress: null });
          throw error;
        }
      })();
      return instance;
    },
    async isDownloaded() {
      const { listCachedModels } = await import("runonweb/core");
      const cached = await listCachedModels().catch(() => []);
      return cached.some((model) => model.id === config.repo);
    },
    getState: () => state,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    reset() {
      instance = null;
      set(IDLE_STATE);
    },
  };
}

/**
 * Voz → texto con Whisper base multilingüe (Apache-2.0). El de runonweb por
 * defecto (tiny.en) solo entiende inglés, y tiny en español inventa texto.
 * Siempre en WASM: así baja la versión q8 (~78 MB); en WebGPU runonweb usa
 * fp32, unas cuatro veces más pesada.
 */
export const speechModel = defineModel({
  id: "speech",
  label: "Dictar gastos por voz",
  approxMB: 80,
  repo: "onnx-community/whisper-base",
  create: async (onProgress) => {
    const { SpeechToText } = await import("runonweb/stt");
    return new SpeechToText({
      model: "onnx-community/whisper-base",
      language: "es",
      device: "wasm",
      onProgress,
    });
  },
});

export const ON_DEVICE_MODELS = [speechModel];
