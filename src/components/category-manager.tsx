"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { EmojiPicker } from "@/components/emoji-picker";
import { KeywordsInput } from "@/components/keywords-input";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(app)/categories/actions";
import type { CategoryWithCount } from "@/lib/data";
import { DEFAULT_EMOJI, suggestEmoji } from "@/lib/emoji";
import { normalizeKeyword, suggestKeywords } from "@/lib/keywords";
import { formatAmountInput, formatMoney, type CurrencyCode } from "@/lib/money";
import { parseAmount } from "@/lib/parser";
import {
  CATEGORY_COLORS,
  categoryInputSchema,
  type CategoryInput,
} from "@/lib/schemas";

type Editing = { mode: "new" } | { mode: "edit"; category: CategoryWithCount };

export function CategoryManager({
  categories,
  currency,
}: {
  categories: CategoryWithCount[];
  currency: CurrencyCode;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const close = () => setEditing(null);

  const sections = [
    { title: "Gastos", items: categories.filter((c) => c.kind === "expense") },
    { title: "Ingresos", items: categories.filter((c) => c.kind === "income") },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Button
        size="lg"
        variant="outline"
        className="h-11"
        onClick={() => setEditing({ mode: "new" })}
      >
        <Plus />
        Nueva categoría
      </Button>

      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <section key={section.title} className="flex flex-col gap-1">
              <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {section.title}
              </h2>
              <ul>
                {section.items.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setEditing({ mode: "edit", category: c })}
                      className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                        style={{ background: c.color }}
                      >
                        {c.emoji}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold">{c.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {c.budgetCents !== null &&
                            `${formatMoney(c.budgetCents, currency)} al mes · `}
                          {c.keywords.length > 0
                            ? c.keywords.join(", ")
                            : "Sin palabras clave"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.transactionCount} mov.
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}

      <Drawer open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              {editing?.mode === "edit"
                ? "Editar categoría"
                : "Nueva categoría"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {editing && (
              <CategoryForm
                key={editing.mode === "edit" ? editing.category.id : "new"}
                category={editing.mode === "edit" ? editing.category : null}
                currency={currency}
                others={categories.filter(
                  (c) => editing.mode === "new" || c.id !== editing.category.id,
                )}
                onDone={close}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function CategoryForm({
  category,
  currency,
  others,
  onDone,
}: {
  category: CategoryWithCount | null;
  currency: CurrencyCode;
  /** Emojis de las demás categorías. */
  /** Las demás categorías: para no repetir emoji ni palabras clave. */
  others: CategoryWithCount[];
  onDone: () => void;
}) {
  // Vacío = aún no elegido: se usa el sugerido por el nombre.
  const [emoji, setEmoji] = useState(category?.emoji ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryInput["kind"]>(
    category?.kind ?? "expense",
  );
  const [color, setColor] = useState<string>(
    category?.color ?? CATEGORY_COLORS[0],
  );
  const [keywords, setKeywords] = useState(category?.keywords ?? []);
  const [budget, setBudget] = useState(
    category?.budgetCents
      ? formatAmountInput(category.budgetCents, currency)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const suggestion = suggestEmoji(name);
  const shownEmoji = emoji || suggestion || DEFAULT_EMOJI;
  const budgetPreview =
    kind === "expense" && budget.trim() ? parseAmount(budget) : null;
  const usedEmojis = new Set(others.map((c) => c.emoji));
  // El parser también elige por el nombre de la categoría: cuenta igual.
  const keywordOwners = new Map(
    others.flatMap((c) =>
      [c.name, ...c.keywords].map(
        (word) => [normalizeKeyword(word), `${c.emoji} ${c.name}`] as const,
      ),
    ),
  );
  const keywordSuggestions = suggestKeywords(
    name,
    keywords,
    new Set(keywordOwners.keys()),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const budgetCents = budget.trim() ? parseAmount(budget) : null;
    if (budget.trim() && budgetCents === null) {
      setError("El presupuesto debe ser un monto, por ejemplo 200.");
      return;
    }
    const parsed = categoryInputSchema.safeParse({
      budgetCents,
      emoji: shownEmoji,
      name,
      kind,
      color,
      keywords: keywords.map((k) => k.trim().toLowerCase()),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, parsed.data)
        : await createCategory(parsed.data);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(category ? "Categoría guardada" : "Categoría creada");
      onDone();
    });
  }

  function remove() {
    if (!category) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(`${category.emoji} ${category.name} eliminada`);
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Vista previa: así se verá en la lista. El emoji abre el selector. */}
      <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-expanded={pickerOpen}
          aria-label={`Emoji: ${shownEmoji}. Cambiar`}
          className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl ring-ring focus-visible:ring-2 focus-visible:outline-none"
          style={{ background: color }}
        >
          {shownEmoji}
          <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full border bg-background text-foreground shadow-sm">
            <Pencil className="size-3" />
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">
            {name.trim() || "Nombre de la categoría"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {kind === "income"
              ? "Ingreso"
              : budgetPreview !== null &&
                `${formatMoney(budgetPreview, currency)} al mes · `}
            {kind === "expense" &&
              (keywords.length > 0
                ? keywords.join(", ")
                : "Sin palabras clave")}
          </span>
          {!emoji && suggestion && (
            <span className="text-xs text-primary">
              Emoji sugerido por el nombre · toca para cambiarlo
            </span>
          )}
        </div>
      </div>

      {pickerOpen && (
        <EmojiPicker
          value={shownEmoji}
          onSelect={(next) => {
            setEmoji(next);
            setPickerOpen(false);
          }}
          suggestion={suggestion}
          used={usedEmojis}
        />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nombre</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Mascotas"
          autoFocus={!category}
          className="h-11"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Tipo</legend>
        <div className="flex gap-1 rounded-2xl bg-muted p-1">
          {(
            [
              ["expense", "Gasto"],
              ["income", "Ingreso"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex-1 cursor-pointer rounded-xl py-3 text-center text-sm font-semibold has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                kind === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Color</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <label
              key={c}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full border has-focus-visible:ring-2 has-focus-visible:ring-ring"
              style={{ background: c }}
            >
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="sr-only"
              />
              {color === c && <Check className="size-4 text-neutral-900" />}
            </label>
          ))}
        </div>
      </fieldset>

      {kind === "expense" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            Presupuesto mensual ({currency})
          </span>
          <AmountInput
            value={budget}
            onChange={setBudget}
            currency={currency}
            placeholder="Sin presupuesto"
            className="h-11"
          />
          <span className="text-xs text-muted-foreground">
            Opcional. Verás cuánto te queda cada mes en el inicio.
          </span>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="keywords" className="text-sm font-semibold">
          Palabras clave
        </label>
        <span className="-mt-1 text-xs text-muted-foreground">
          Si escribes una en el quick add, se elige esta categoría. Escribe y
          pulsa Enter o coma; toca una para quitarla.
        </span>
        <KeywordsInput
          value={keywords}
          onChange={setKeywords}
          suggestions={keywordSuggestions}
          usedBy={keywordOwners}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {confirmingDelete && category ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm">
            ¿Eliminar <strong>{category.name}</strong>?
            {category.transactionCount === 1 &&
              " Su movimiento quedará sin categoría."}
            {category.transactionCount > 1 &&
              ` Sus ${category.transactionCount} movimientos quedarán sin categoría.`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 flex-1"
              disabled={pending}
              onClick={remove}
            >
              {pending && <Loader2 className="animate-spin" />}
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {category && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label="Eliminar categoría"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
              className="size-11 text-destructive"
            >
              <Trash2 />
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-11 flex-1"
          >
            {pending && <Loader2 className="animate-spin" />}
            {category ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </div>
      )}
    </form>
  );
}
