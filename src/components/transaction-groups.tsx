"use client";

import { useRef, useState } from "react";
import { Loader2, Pencil, Repeat, Trash2 } from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import {
  deleteTransaction,
  restoreTransaction,
  updateTransaction,
} from "@/app/(app)/actions";
import type { Category, TransactionRow } from "@/lib/data";
import { NO_CATEGORY_COLOR } from "@/lib/schemas";
import { formatMoney, type CurrencyCode } from "@/lib/money";

export type TransactionGroup = {
  day: string;
  label: string;
  items: TransactionRow[];
};

export function TransactionGroups({
  groups,
  categories,
  currency,
}: {
  groups: TransactionGroup[];
  categories: Category[];
  currency: CurrencyCode;
}) {
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  // Solo una fila deslizada (abierta) a la vez.
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const close = () => setEditing(null);

  async function remove(transaction: TransactionRow) {
    const result = await deleteTransaction(transaction.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    close();
    toast(
      `${formatMoney(transaction.amountCents, transaction.currency)} borrado`,
      {
        // Más que los 4 s por defecto: da tiempo a pulsar "Deshacer".
        duration: 8000,
        action: {
          label: "Deshacer",
          onClick: async () => {
            const restored = await restoreTransaction(result.data);
            if (!restored.ok) toast.error(restored.message);
          },
        },
      },
    );
  }

  return (
    <>
      <section aria-label="Movimientos" className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-1">
            <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </h2>
            <ul className="flex flex-col">
              {group.items.map((t) => (
                <li key={t.id}>
                  {t.pending ? (
                    <TransactionItem transaction={t} />
                  ) : (
                    <SwipeRow
                      open={swipedId === t.id}
                      onOpenChange={(open) => setSwipedId(open ? t.id : null)}
                      onEdit={() => {
                        setSwipedId(null);
                        setEditing(t);
                      }}
                      onDelete={() => remove(t)}
                    >
                      <TransactionItem
                        transaction={t}
                        onSelect={() => setEditing(t)}
                      />
                    </SwipeRow>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <Drawer open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              Editar movimiento
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pt-4">
            {editing && (
              <TransactionForm
                // Clave por id: al abrir otro movimiento el formulario se reinicia.
                key={editing.id}
                initial={{
                  amountCents: editing.amountCents,
                  currency: editing.currency,
                  date: editing.occurredOn,
                  categoryId: editing.categoryId,
                  note: editing.note,
                }}
                categories={categories}
                currency={currency}
                onSubmit={async (input) => {
                  const result = await updateTransaction(editing.id, input);
                  if (result.ok) {
                    close();
                    toast.success("Cambios guardados");
                  }
                  return result;
                }}
                onDelete={() => remove(editing)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function TransactionItem({
  transaction: t,
  onSelect,
}: {
  transaction: TransactionRow;
  /** Sin él (movimiento aún guardándose) la fila no se puede tocar. */
  onSelect?: () => void;
}) {
  const income = t.category?.kind === "income";
  const title = t.note || t.category?.name || "Sin categoría";
  const showCategory =
    t.note &&
    t.category &&
    t.note.toLocaleLowerCase() !== t.category.name.toLocaleLowerCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      aria-busy={t.pending || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-background px-1 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        t.pending && "bg-primary/5 hover:bg-primary/5",
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
        style={{ background: t.category?.color ?? NO_CATEGORY_COLOR }}
      >
        {t.category?.emoji ?? "💸"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 truncate font-semibold">
          <span className="truncate">{title}</span>
          {t.recurring && (
            <Repeat
              aria-label="Recurrente"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
        </span>
        {t.pending ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Guardando…
          </span>
        ) : (
          showCategory && (
            <span className="text-xs text-muted-foreground">
              {t.category?.name}
            </span>
          )
        )}
      </span>
      <span
        className={`font-bold tabular-nums ${income ? "text-emerald-600" : ""}`}
      >
        {income ? "+" : "−"}
        {formatMoney(t.amountCents, t.currency)}
      </span>
    </button>
  );
}

const ACTION_WIDTH = 72; // cada botón (Editar, Borrar)
const ACTIONS_WIDTH = ACTION_WIDTH * 2;
// Deslizar más allá de esta fracción del ancho borra directamente. Alta
// a propósito: con la fila ya abierta (-144 px) aún faltan ~140 px.
const FULL_SWIPE = 0.75;

/**
 * Fila que se desliza a la izquierda para mostrar Editar y Borrar (como en
 * Mail de iOS); hasta el fondo, borra directamente (con deshacer). Solo se
 * mueve en horizontal: touch-action pan-y deja el desplazamiento vertical
 * al navegador, y deslizar a la derecha (gesto "atrás") no hace nada.
 */
function SwipeRow({
  open,
  onOpenChange,
  onEdit,
  onDelete,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  children: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    base: number;
    width: number;
    mode: "pending" | "drag" | "scroll";
  } | null>(null);
  // Tras arrastrar, el click que dispara el navegador no debe abrir la fila.
  const suppressClick = useRef(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ancho de la fila, medido al empezar el gesto (no se lee el ref al pintar).
  const [rowWidth, setRowWidth] = useState(0);

  const offset = deleting
    ? -(rowWidth || 400)
    : (dragOffset ?? (open ? -ACTIONS_WIDTH : 0));
  const fullSwipe = rowWidth > 0 && -offset > rowWidth * FULL_SWIPE;

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Tras un arrastre el navegador no siempre dispara click: si no, el
    // aviso de "ignorar el próximo click" se comería el siguiente toque.
    suppressClick.current = false;
    const width = rowRef.current?.offsetWidth ?? 0;
    setRowWidth(width);
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      base: open ? -ACTIONS_WIDTH : 0,
      width,
      mode: "pending",
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || g.mode === "scroll") return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === "pending") {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        g.mode = "scroll";
        return;
      }
      if (Math.abs(dx) < 8) return;
      g.mode = "drag";
      try {
        // Sigue recibiendo el gesto aunque el dedo salga de la fila.
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // El puntero ya no está activo: se sigue sin captura.
      }
    }
    setDragOffset(Math.min(0, Math.max(-g.width, g.base + dx)));
  }

  async function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.mode !== "drag" || dragOffset === null) return;
    suppressClick.current = true;
    const moved = -dragOffset;
    setDragOffset(null);
    if (g.width > 0 && moved > g.width * FULL_SWIPE) {
      setDeleting(true);
      onOpenChange(false);
      await onDelete();
      // Si el borrado falla, la fila vuelve a su sitio.
      setDeleting(false);
    } else {
      onOpenChange(moved > ACTIONS_WIDTH / 2);
    }
  }

  return (
    <div ref={rowRef} className="relative overflow-hidden rounded-2xl">
      {/* Solo mientras se desliza o está abierta: cerrada, se colaría por
          las esquinas redondeadas como un borde de color. */}
      {offset < 0 && (
        <div
          aria-hidden={!open}
          className="absolute inset-y-0 right-0 flex"
          style={{ width: Math.max(ACTIONS_WIDTH, -offset) }}
        >
          {!fullSwipe && (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={onEdit}
              className="flex w-18 shrink-0 flex-col items-center justify-center gap-0.5 bg-primary/15 text-xs font-semibold text-primary"
            >
              <Pencil className="size-4" />
              Editar
            </button>
          )}
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={async () => {
              onOpenChange(false);
              await onDelete();
            }}
            className={cn(
              "flex min-w-18 flex-1 flex-col justify-center gap-0.5 bg-destructive text-xs font-semibold text-white",
              fullSwipe ? "items-end pr-6" : "items-center",
            )}
          >
            <Trash2 className="size-4" />
            {fullSwipe ? "Suelta para borrar" : "Borrar"}
          </button>
        </div>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null;
          setDragOffset(null);
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          } else if (open) {
            // Tocar una fila abierta la cierra en vez de editarla.
            e.preventDefault();
            e.stopPropagation();
            onOpenChange(false);
          }
        }}
        className={cn(
          "relative touch-pan-y bg-background select-none",
          dragOffset === null && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
