"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { speechModel } from "@/lib/ai/models";
import { useOnDeviceAIEnabled } from "@/lib/ai/preference";
import { cleanTranscript } from "@/lib/ai/transcript";
import { useModelState, useOnDeviceSupport } from "@/lib/ai/use-on-device-ai";
import { useLocale, useT } from "@/i18n/provider";

// Un gasto se dicta en pocos segundos; más que esto es casi siempre un
// micrófono olvidado.
const MAX_SECONDS = 15;

const noopSubscribe = () => () => {};
const canRecord = () =>
  typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices;

/**
 * Micrófono del quick add: graba, transcribe en el dispositivo (Whisper vía
 * runonweb) y entrega el texto para que el parser lo lea. Solo aparece con
 * "IA en el dispositivo" activada y un navegador que pueda grabar.
 */
export function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const t = useT();
  // Whisper transcribe en el idioma de la interfaz.
  const locale = useLocale();
  const enabled = useOnDeviceAIEnabled();
  const support = useOnDeviceSupport();
  const recordable = useSyncExternalStore(
    noopSubscribe,
    canRecord,
    () => false,
  );
  const model = useModelState(speechModel);
  const [phase, setPhase] = useState<"idle" | "recording" | "transcribing">(
    "idle",
  );
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Si el componente desaparece grabando, se suelta el micrófono.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );

  const usable = support === "webgpu" || support === "wasm";
  if (!enabled || !usable || !recordable) return null;

  function download() {
    speechModel.get().then(
      () => toast.success(t.voice.downloaded),
      () =>
        toast.error(t.voice.downloadFailed, {
          description: t.voice.checkConnection,
        }),
    );
  }

  async function start() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error(t.voice.noMic, { description: t.voice.noMicHint });
      return;
    }
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (event) => chunks.push(event.data);
    rec.onstop = async () => {
      clearTimeout(timer.current);
      stream.getTracks().forEach((track) => track.stop());
      setPhase("transcribing");
      try {
        const stt = await speechModel.get();
        const audio = new Blob(chunks, { type: rec.mimeType });
        const { text } = await stt.transcribe(audio, { language: locale });
        const cleaned = cleanTranscript(text, locale);
        if (cleaned) onText(cleaned);
        else toast(t.voice.nothingHeard, { description: t.voice.tryAgain });
      } catch {
        toast.error(t.voice.transcribeFailed);
      } finally {
        setPhase("idle");
      }
    };
    recorder.current = rec;
    rec.start();
    setPhase("recording");
    timer.current = setTimeout(() => rec.stop(), MAX_SECONDS * 1000);
  }

  async function click() {
    if (phase === "recording") {
      recorder.current?.stop();
      return;
    }
    if (model.status !== "ready") {
      // Descargado en otra visita: se carga de la caché y se graba.
      if (await speechModel.isDownloaded()) {
        try {
          await speechModel.get();
        } catch {
          toast.error(t.voice.loadFailed);
          return;
        }
        void start();
        return;
      }
      // La primera vez se pide permiso para la descarga.
      toast(t.voice.downloadTitle, {
        description: t.voice.downloadPrompt(speechModel.approxMB),
        action: { label: t.voice.download, onClick: download },
      });
      return;
    }
    void start();
  }

  const loading = model.status === "loading";
  const busy = loading || phase === "transcribing";
  const label =
    phase === "recording"
      ? t.voice.stop
      : loading
        ? t.voice.downloading(model.progress ?? 0)
        : phase === "transcribing"
          ? t.voice.transcribing
          : t.voice.dictate;

  return (
    <Button
      type="button"
      size="icon"
      variant={phase === "recording" ? "destructive" : "ghost"}
      aria-label={label}
      title={label}
      onClick={click}
      disabled={busy}
      className="relative size-11 shrink-0 rounded-2xl"
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : phase === "recording" ? (
        <Square className="fill-current" />
      ) : (
        <Mic />
      )}
      {loading && model.progress !== null && (
        <span className="absolute -bottom-1 text-[10px] font-bold">
          {model.progress}%
        </span>
      )}
    </Button>
  );
}
