import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sin conexión · MonAi" };

// Página estática: el service worker la guarda al instalarse y la muestra
// cuando una navegación falla por falta de red.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="text-5xl">📡</span>
      <h1 className="text-2xl font-extrabold tracking-tight">Sin conexión</h1>
      <p className="text-muted-foreground">
        No pudimos cargar MonAi. Revisa tu conexión y vuelve a intentarlo.
      </p>
      {/* Recarga completa (no el router del cliente): el service worker sirve
          esta página en lugar de otra que no pudo cargarse. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={buttonVariants({ size: "lg", className: "h-11" })}>
        Reintentar
      </a>
    </main>
  );
}
