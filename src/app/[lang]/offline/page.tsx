import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { APP_SHORT_NAME } from "@/lib/brand";
import { getDictionary, getLocalHref } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.offline };
}

// Página estática: el service worker la guarda al instalarse y la muestra
// cuando una navegación falla por falta de red.
export default async function OfflinePage() {
  const [to, t] = await Promise.all([getLocalHref(), getDictionary()]);
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="text-5xl">📡</span>
      <h1 className="text-2xl font-extrabold tracking-tight">
        {t.offline.title}
      </h1>
      <p className="text-muted-foreground">{t.offline.body(APP_SHORT_NAME)}</p>
      {/* Recarga completa (no el router del cliente): el service worker sirve
          esta página en lugar de otra que no pudo cargarse. */}
      <a
        href={to("/")}
        className={buttonVariants({ size: "lg", className: "h-11" })}
      >
        {t.offline.retry}
      </a>
    </main>
  );
}
