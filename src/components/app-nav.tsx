"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { splitLocale } from "@/i18n/config";
import { useLocalHref, useT } from "@/i18n/provider";

const LINKS = [
  { href: "/", label: "home", also: [] },
  { href: "/transactions", label: "transactions", also: ["/recurring"] },
  { href: "/categories", label: "categories", also: [] },
] as const;

export function AppNav() {
  const t = useT();
  const localHref = useLocalHref();
  // La ruta sin el prefijo del idioma: "/es/transactions" → "/transactions".
  const { path } = splitLocale(usePathname());
  return (
    <nav
      aria-label={t.nav.label}
      className="flex gap-1 rounded-2xl bg-muted p-1"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? path === "/"
            : [link.href, ...link.also].some((href) => path.startsWith(href));
        return (
          <Link
            key={link.href}
            href={localHref(link.href)}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.nav[link.label]}
          </Link>
        );
      })}
    </nav>
  );
}
