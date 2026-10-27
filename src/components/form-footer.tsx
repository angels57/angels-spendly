import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pie de los formularios de los drawers: "Guardar" a lo ancho y fijo abajo
 * (a la vista aunque el formulario sea largo o esté el teclado abierto) y,
 * al editar, "Eliminar" como texto rojo debajo, lejos del pulgar. Borrar no
 * pide confirmación: el aviso que sale después permite deshacer.
 *
 * Va al final del <form>, dentro de la zona desplazable del drawer (que no
 * debe tener padding abajo: el pie pone el suyo con el área segura).
 */
export function FormFooter({
  submitLabel,
  pending,
  deleteLabel,
  onDelete,
}: {
  submitLabel: string;
  pending: boolean;
  /** Solo al editar. */
  deleteLabel?: string;
  onDelete?: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col border-t bg-popover px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full"
      >
        {pending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onDelete}
          className="mt-1 h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
