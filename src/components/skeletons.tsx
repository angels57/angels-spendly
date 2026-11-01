import { Skeleton } from "@/components/ui/skeleton";

// Esqueletos con la forma de lo que va a cargar (en vez de un bloque gris):
// al llegar los datos, nada salta de sitio.

/** Filas como las de movimientos, categorías y recurrentes. */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-2">
          <Skeleton className="size-10 shrink-0 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-1.5">
            {/* Anchos distintos: parece texto, no una tabla. */}
            <Skeleton
              className="h-4"
              style={{ width: `${[55, 40, 65, 45, 50][i % 5]}%` }}
            />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Título de grupo ("Hoy", "Gastos") + filas. */
function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="mx-1 h-3 w-16" />
      <RowsSkeleton rows={rows} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      {/* Resumen del mes: mes, total y barras por categoría. */}
      <div className="flex flex-col gap-4 rounded-xl border p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-44" />
        <div className="flex h-44 items-end justify-center gap-3">
          {[85, 60, 45, 30].map((height) => (
            <Skeleton
              key={height}
              className="max-w-20 flex-1 rounded-2xl"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <GroupSkeleton rows={4} />
    </>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-11 rounded-lg" />
      <GroupSkeleton rows={3} />
      <GroupSkeleton rows={2} />
    </div>
  );
}

/** Botón "Nueva…" + lista: categorías y recurrentes. */
export function ManagerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-11 rounded-lg" />
      <GroupSkeleton rows={rows} />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[3, 2, 2].map((rows, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="mx-1 h-3 w-20" />
          <div className="flex flex-col divide-y rounded-xl border">
            {Array.from({ length: rows }, (_, j) => (
              <div key={j} className="flex items-center gap-3 p-3">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
