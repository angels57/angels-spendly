"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(app)/categories/actions";
import type { CategoryWithCount } from "@/lib/data";
import {
  CATEGORY_COLORS,
  categoryInputSchema,
  splitKeywords,
  type CategoryInput,
} from "@/lib/schemas";

type Editing = { mode: "new" } | { mode: "edit"; category: CategoryWithCount };

export function CategoryManager({
  categories,
}: {
  categories: CategoryWithCount[];
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
                          {c.keywords.length > 0
                            ? c.keywords.join(", ")
                            : "Sin palabras clave"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.transactionCount}
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
  onDone,
}: {
  category: CategoryWithCount | null;
  onDone: () => void;
}) {
  const [emoji, setEmoji] = useState(category?.emoji ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryInput["kind"]>(
    category?.kind ?? "expense",
  );
  const [color, setColor] = useState<string>(
    category?.color ?? CATEGORY_COLORS[0],
  );
  const [keywords, setKeywords] = useState(category?.keywords.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = categoryInputSchema.safeParse({
      emoji,
      name,
      kind,
      color,
      keywords: splitKeywords(keywords),
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
      <div className="flex gap-3">
        <label className="flex w-20 flex-col gap-1.5">
          <span className="text-sm font-semibold">Emoji</span>
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={16}
            placeholder="🍕"
            className="h-11 text-center text-xl"
            style={{ background: color }}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
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
      </div>

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
              className={`flex-1 cursor-pointer rounded-xl py-1.5 text-center text-sm font-semibold has-focus-visible:ring-2 has-focus-visible:ring-ring ${
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
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border has-focus-visible:ring-2 has-focus-visible:ring-ring"
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
              {color === c && <Check className="size-4" />}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Palabras clave</span>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="veterinario, croquetas"
          className="h-11"
        />
        <span className="text-xs text-muted-foreground">
          Separadas por comas. Si escribes una de estas palabras en el quick
          add, se elige esta categoría.
        </span>
      </label>

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
              className="h-11 text-destructive"
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
