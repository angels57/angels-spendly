"use client";

import { useState } from "react";
import { Plus, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";
import { normalizeKeyword, parseKeywords } from "@/lib/keywords";

const MAX_KEYWORDS = 50;

/**
 * Palabras clave como chips: se añaden con Enter o coma (o al salir del
 * campo), se quitan tocando el chip. Debajo, sugerencias tocables y aviso
 * si una palabra ya la usa otra categoría.
 */
export function KeywordsInput({
  value,
  onChange,
  suggestions,
  usedBy,
}: {
  value: string[];
  onChange: (keywords: string[]) => void;
  suggestions: string[];
  /** Palabra normalizada → categoría que ya la usa ("🚗 Transporte"). */
  usedBy: ReadonlyMap<string, string>;
}) {
  const [draft, setDraft] = useState("");

  function add(words: string[]) {
    const have = new Set(value.map(normalizeKeyword));
    const next = [...value];
    for (const word of words) {
      const key = normalizeKeyword(word);
      if (!key || have.has(key) || next.length >= MAX_KEYWORDS) continue;
      have.add(key);
      next.push(word);
    }
    if (next.length !== value.length) onChange(next);
  }

  function commit(text: string) {
    add(parseKeywords(text));
    setDraft("");
  }

  const conflicts = value
    .map((k) => [k, usedBy.get(normalizeKeyword(k))] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.map((keyword) => {
          const conflict = usedBy.has(normalizeKeyword(keyword));
          return (
            <button
              key={keyword}
              type="button"
              aria-label={`Quitar ${keyword}`}
              onClick={() => onChange(value.filter((k) => k !== keyword))}
              className={cn(
                "flex h-9 items-center gap-1 rounded-full pr-2 pl-3 text-sm font-semibold transition-colors",
                conflict
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                  : "bg-muted hover:bg-muted/70",
              )}
            >
              {conflict && <TriangleAlert className="size-3.5" />}
              {keyword}
              <X className="size-3.5 opacity-60" />
            </button>
          );
        })}
        <input
          id="keywords"
          value={draft}
          onChange={(e) => {
            // La coma cierra la palabra (los teclados del móvil no siempre
            // avisan de la tecla, pero sí del texto).
            if (e.target.value.includes(",")) commit(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // no enviar el formulario
              commit(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          maxLength={30}
          enterKeyHint="done"
          autoCapitalize="none"
          autoComplete="off"
          placeholder={value.length ? "Añadir otra…" : "veterinario, croquetas"}
          className="h-9 min-w-28 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      {conflicts.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-amber-700 dark:text-amber-300">
          {conflicts.map(([keyword, category]) => (
            <li key={keyword}>
              «{keyword}» ya está en {category}: el quick add elegirá la que
              encuentre primero.
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Sugerencias:</span>
          {suggestions.map((keyword) => (
            <button
              key={keyword}
              type="button"
              aria-label={`Añadir ${keyword}`}
              onClick={() => add([keyword])}
              className="flex h-9 items-center gap-0.5 rounded-full border border-dashed pr-3 pl-2 text-sm text-muted-foreground transition-colors hover:border-solid hover:text-foreground"
            >
              <Plus className="size-3.5" />
              {keyword}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
