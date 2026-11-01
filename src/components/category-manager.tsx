"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus } from "lucide-react";
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
import { FormFooter } from "@/components/form-footer";
import { KeywordsInput } from "@/components/keywords-input";
import { SwipeRow } from "@/components/swipe-row";
import {
  createCategory,
  deleteCategory,
  restoreCategory,
  updateCategory,
} from "@/app/[lang]/(app)/categories/actions";
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
import { useT } from "@/i18n/provider";
import { toErrorCode } from "@/i18n/errors";
import type { Dictionary } from "@/i18n/dictionaries";

type Editing = { mode: "new" } | { mode: "edit"; category: CategoryWithCount };

export function CategoryManager({
  categories,
  currency,
}: {
  categories: CategoryWithCount[];
  currency: CurrencyCode;
}) {
  const t = useT();
  const [editing, setEditing] = useState<Editing | null>(null);
  // Solo una fila deslizada (abierta) a la vez.
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const close = () => setEditing(null);

  const sections = [
    {
      title: t.common.expenses,
      items: categories.filter((c) => c.kind === "expense"),
    },
    {
      title: t.common.incomes,
      items: categories.filter((c) => c.kind === "income"),
    },
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
        {t.categories.newButton}
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
                    <SwipeRow
                      open={swipedId === c.id}
                      onOpenChange={(open) => setSwipedId(open ? c.id : null)}
                      onEdit={() => {
                        setSwipedId(null);
                        setEditing({ mode: "edit", category: c });
                      }}
                      onDelete={async () => {
                        const error = await deleteWithUndo(c, t);
                        if (error) toast.error(error);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({ mode: "edit", category: c })
                        }
                        className="flex w-full items-center gap-3 rounded-2xl bg-background px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
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
                              t.categories.perMonth(
                                formatMoney(c.budgetCents, currency),
                              )}
                            {c.keywords.length > 0
                              ? c.keywords.join(", ")
                              : t.categories.noKeywords}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {t.categories.transactionCount(c.transactionCount)}
                        </span>
                      </button>
                    </SwipeRow>
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
                ? t.categories.editTitle
                : t.categories.newTitle}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pt-4">
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
  const t = useT();
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
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const budgetCents = budget.trim() ? parseAmount(budget) : null;
    if (budget.trim() && budgetCents === null) {
      setError(t.categories.invalidBudget);
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
      setError(t.errors[toErrorCode(parsed.error.issues[0]?.message)]);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, parsed.data)
        : await createCategory(parsed.data);
      if (!result.ok) {
        setError(t.errors[result.error]);
        return;
      }
      toast.success(category ? t.categories.saved : t.categories.created);
      onDone();
    });
  }

  function remove() {
    if (!category) return;
    startTransition(async () => {
      const error = await deleteWithUndo(category, t);
      if (error) setError(error);
      else onDone();
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
          aria-label={t.categories.changeEmoji(shownEmoji)}
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
            {name.trim() || t.categories.namePlaceholderPreview}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {kind === "income"
              ? t.categories.income
              : budgetPreview !== null &&
                t.categories.perMonth(formatMoney(budgetPreview, currency))}
            {kind === "expense" &&
              (keywords.length > 0
                ? keywords.join(", ")
                : t.categories.noKeywords)}
          </span>
          {!emoji && suggestion && (
            <span className="text-xs text-primary">
              {t.categories.emojiSuggested}
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
        <span className="text-sm font-semibold">{t.categories.name}</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={t.categories.namePlaceholder}
          className="h-11"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">
          {t.categories.type}
        </legend>
        <div className="flex gap-1 rounded-2xl bg-muted p-1">
          {(
            [
              ["expense", t.categories.expense],
              ["income", t.categories.income],
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
        <legend className="mb-1.5 text-sm font-semibold">
          {t.categories.color}
        </legend>
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
                aria-label={t.categories.colorLabel(c)}
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
            {t.categories.budget(currency)}
          </span>
          <AmountInput
            value={budget}
            onChange={setBudget}
            currency={currency}
            placeholder={t.categories.noBudget}
            className="h-11"
          />
          <span className="text-xs text-muted-foreground">
            {t.categories.budgetHint}
          </span>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="keywords" className="text-sm font-semibold">
          {t.categories.keywords}
        </label>
        <span className="-mt-1 text-xs text-muted-foreground">
          {t.categories.keywordsHint}
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

      <FormFooter
        submitLabel={category ? t.common.saveChanges : t.categories.create}
        pending={pending}
        deleteLabel={t.categories.delete}
        onDelete={category ? remove : undefined}
      />
    </form>
  );
}

/**
 * Borra la categoría y ofrece deshacer (vuelve con su presupuesto y sus
 * movimientos). Devuelve el mensaje de error, o null si se borró.
 */
async function deleteWithUndo(
  category: CategoryWithCount,
  t: Dictionary,
): Promise<string | null> {
  const result = await deleteCategory(category.id);
  if (!result.ok) return t.errors[result.error];
  const { transactionCount: count } = category;
  toast(t.categories.deleted(category.emoji, category.name), {
    description: count > 0 ? t.categories.leftUncategorized(count) : undefined,
    duration: 8000,
    action: {
      label: t.common.undo,
      onClick: async () => {
        const restored = await restoreCategory(result.data);
        if (!restored.ok) toast.error(t.errors[restored.error]);
      },
    },
  });
  return null;
}
