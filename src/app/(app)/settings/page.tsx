import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, LogOut, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencySettings } from "@/components/currency-settings";
import { InstallRow, ThemeSelect } from "@/components/settings";
import { signOut } from "@/app/login/actions";
import { getActiveList, getCurrentUser } from "@/lib/data";
import { APP_SHORT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const [user, list] = await Promise.all([getCurrentUser(), getActiveList()]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <h2 className="text-2xl font-extrabold tracking-tight">Ajustes</h2>

      <Section title="Cuenta">
        <div className="flex items-center gap-3 p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary uppercase">
            {user.email.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.email}</p>
            <p className="text-sm text-muted-foreground">Lista «{list.name}»</p>
          </div>
        </div>
      </Section>

      <Section title="Preferencias">
        <div className="p-4">
          <CurrencySettings
            // Si la moneda cambia en otro sitio, el selector se reinicia.
            key={list.currency}
            currency={list.currency}
          />
        </div>
        <div className="flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold">Tema</span>
          <ThemeSelect />
        </div>
        <RowLink href="/recurring" icon={<Repeat className="size-5" />}>
          Movimientos recurrentes
        </RowLink>
      </Section>

      <Section title="Datos">
        <a
          href="/settings/export"
          download
          className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
        >
          <Download className="size-5 text-muted-foreground" />
          <span className="flex flex-1 flex-col">
            <span className="font-semibold">Exportar movimientos</span>
            <span className="text-xs text-muted-foreground">
              Archivo CSV para Excel o Google Sheets.
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
        <div className="flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold">
            Instalar {APP_SHORT_NAME}
          </span>
          <InstallRow />
        </div>
      </Section>

      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
        {children}
      </div>
    </section>
  );
}

function RowLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 px-4 py-3 font-semibold transition-colors hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
