"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { EMOJI_GROUPS, isSingleEmoji } from "@/lib/emoji";

/**
 * Cuadrícula de emojis por temas, con el sugerido para el nombre arriba y
 * un campo para cualquier otro. Los que ya usan otras categorías se ven
 * atenuados (se pueden elegir igual).
 */
export function EmojiPicker({
  value,
  onSelect,
  suggestion,
  used,
}: {
  value: string;
  onSelect: (emoji: string) => void;
  suggestion: string | null;
  used: ReadonlySet<string>;
}) {
  const initialGroup = Math.max(
    0,
    EMOJI_GROUPS.findIndex((g) =>
      (g.emojis as readonly string[]).includes(value),
    ),
  );
  const [groupIndex, setGroupIndex] = useState(initialGroup);
  const [custom, setCustom] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  // La pestaña activa puede quedar fuera de la fila deslizable (p. ej. al
  // abrir con 🐶, que está en "Salud y cuidado"): se desplaza hasta ella.
  useEffect(() => {
    const tabs = tabsRef.current;
    const active = tabs?.children[groupIndex] as HTMLElement | undefined;
    if (!tabs || !active) return;
    const left = active.offsetLeft - tabs.offsetLeft;
    if (
      left < tabs.scrollLeft ||
      left + active.offsetWidth > tabs.scrollLeft + tabs.clientWidth
    ) {
      tabs.scrollTo({ left: left - 12, behavior: "smooth" });
    }
  }, [groupIndex]);
  const group = EMOJI_GROUPS[groupIndex];
  const customInvalid = custom.trim() !== "" && !isSingleEmoji(custom);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-3">
      {suggestion && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sugerido:</span>
          <EmojiButton
            emoji={suggestion}
            selected={value === suggestion}
            used={used.has(suggestion)}
            onSelect={onSelect}
          />
        </div>
      )}

      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Temas"
        // Fila deslizable en horizontal; -mx/px para que llegue al borde.
        className="-mx-3 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-3 pb-1"
      >
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            type="button"
            role="tab"
            aria-selected={i === groupIndex}
            onClick={() => setGroupIndex(i)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors",
              i === groupIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden>{g.emojis[0]}</span>
            {g.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        aria-label={group.label}
        className="grid grid-cols-7 gap-1"
      >
        {group.emojis.map((emoji) => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            selected={value === emoji}
            used={used.has(emoji)}
            onSelect={onSelect}
          />
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">
          ¿Otro? Escríbelo o pégalo
        </span>
        <Input
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            if (isSingleEmoji(e.target.value)) onSelect(e.target.value.trim());
          }}
          maxLength={16}
          placeholder="Por ejemplo 🦜"
          aria-invalid={customInvalid || undefined}
          className="h-11"
        />
        {customInvalid && (
          <span className="text-xs text-destructive">Solo un emoji.</span>
        )}
      </label>
    </div>
  );
}

function EmojiButton({
  emoji,
  selected,
  used,
  onSelect,
}: {
  emoji: string;
  selected: boolean;
  used: boolean;
  onSelect: (emoji: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={emoji}
      aria-pressed={selected}
      title={used ? "Ya lo usa otra categoría" : undefined}
      onClick={() => onSelect(emoji)}
      className={cn(
        "flex aspect-square min-h-11 items-center justify-center rounded-xl text-2xl transition-colors hover:bg-muted",
        selected && "bg-primary/15 ring-2 ring-primary",
        used && !selected && "opacity-40",
      )}
    >
      {emoji}
    </button>
  );
}
