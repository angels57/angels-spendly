"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/transactions", label: "Movimientos" },
  { href: "/categories", label: "Categorías" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className="flex gap-1 rounded-2xl bg-muted p-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-xl px-2 py-1.5 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
