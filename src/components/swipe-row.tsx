"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "cn";

const ACTION_WIDTH = 72; // cada botón (Editar, Borrar)
const ACTIONS_WIDTH = ACTION_WIDTH * 2;
// Deslizar más allá de esta fracción del ancho borra directamente. Alta
// a propósito: con la fila ya abierta (-144 px) aún faltan ~140 px.
const FULL_SWIPE = 0.75;

/**
 * Fila que se desliza a la izquierda para mostrar Editar y Borrar (como en
 * Mail de iOS); hasta el fondo, borra directamente (quien la usa ofrece
 * deshacer). Se usa en movimientos y categorías. Solo se
 * mueve en horizontal: touch-action pan-y deja el desplazamiento vertical
 * al navegador, y deslizar a la derecha (gesto "atrás") no hace nada.
 */
export function SwipeRow({
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
