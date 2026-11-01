"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ON_DEVICE_MODELS, type OnDeviceModel } from "@/lib/ai/models";
import {
  setOnDeviceAIEnabled,
  useOnDeviceAIEnabled,
} from "@/lib/ai/preference";
import {
  useModelState,
  useOnDeviceSupport,
  type OnDeviceSupport,
} from "@/lib/ai/use-on-device-ai";
import { useLocale, useT } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";

type VoiceTexts = ReturnType<typeof useT>["voice"];

function supportText(support: OnDeviceSupport, t: VoiceTexts) {
  if (support === "checking") return t.checking;
  if (support === "unsupported") return t.unsupported;
  // La voz va siempre en CPU (WASM, ver speechModel): da igual tener WebGPU.
  return t.supported;
}

/**
 * Ajuste "IA en el dispositivo": modelos de runonweb que corren en el
 * navegador. Nada sale del celular, pero hay que descargarlos una vez.
 */
export function OnDeviceAISettings() {
  const t = useT().voice;
  const locale = useLocale();
  const enabled = useOnDeviceAIEnabled();
  const support = useOnDeviceSupport();
  const [cachedBytes, setCachedBytes] = useState<number | null>(null);
  const [clearing, startClearing] = useTransition();

  const usable = support === "webgpu" || support === "wasm";

  useEffect(() => {
    if (!usable) return;
    let active = true;
    cachedModelBytes().then((bytes) => {
      if (active) setCachedBytes(bytes);
    });
    return () => {
      active = false;
    };
  }, [usable]);

  async function refreshCached() {
    setCachedBytes(await cachedModelBytes());
  }

  function clear() {
    startClearing(async () => {
      const { clearAllModelCache } = await import("runonweb/core");
      await clearAllModelCache().catch(() => 0);
      ON_DEVICE_MODELS.forEach((model) => model.reset());
      await refreshCached();
      toast.success(t.deleted);
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor="on-device-ai" className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            {t.title}
          </span>
          <span className="text-xs text-muted-foreground">{t.description}</span>
        </label>
        <input
          id="on-device-ai"
          type="checkbox"
          role="switch"
          checked={enabled}
          disabled={!usable}
          onChange={(e) => setOnDeviceAIEnabled(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        />
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {supportText(support, t)}
      </p>

      {enabled && usable && (
        <>
          <ul className="flex flex-col gap-2">
            {ON_DEVICE_MODELS.map((model) => (
              <ModelRow key={model.id} model={model} onLoaded={refreshCached} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <span className="text-xs text-muted-foreground">
              {t.used(
                cachedBytes === null ? "…" : formatMB(cachedBytes, locale),
              )}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clear}
              disabled={clearing || !cachedBytes}
            >
              {clearing ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {t.delete}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ModelRow({
  model,
  onLoaded,
}: {
  model: OnDeviceModel<unknown>;
  onLoaded: () => Promise<void>;
}) {
  const t = useT().voice;
  const state = useModelState(model);
  const label = t.models[model.id as keyof VoiceTexts["models"]] ?? model.label;

  async function download() {
    try {
      await model.get();
      await onLoaded();
      toast.success(t.modelReady(label));
    } catch {
      toast.error(t.downloadFailed, { description: t.checkConnection });
    }
  }

  const status =
    state.status === "loading"
      ? `${state.progress ?? 0}%`
      : state.status === "ready"
        ? t.ready(state.device === "webgpu" ? "GPU" : "CPU")
        : state.status === "error"
          ? t.loadError
          : `~${model.approxMB} MB`;

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="flex flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{status}</span>
      </div>
      {state.status !== "ready" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={download}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" && <Loader2 className="animate-spin" />}
          {t.download}
        </Button>
      )}
    </li>
  );
}

async function cachedModelBytes() {
  const { listCachedModels } = await import("runonweb/core");
  const models = await listCachedModels().catch(() => []);
  return models.reduce((sum, model) => sum + model.bytes, 0);
}

function formatMB(bytes: number, locale: Locale) {
  return (bytes / 1024 / 1024).toLocaleString(
    locale === "en" ? "en-US" : "es-CO",
    {
      maximumFractionDigits: 1,
    },
  );
}
