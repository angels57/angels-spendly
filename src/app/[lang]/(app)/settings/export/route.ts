import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/parser";

// Descarga de todos los movimientos de la lista en CSV, en el idioma de la
// URL y con el formato que espera Excel en ese idioma: en español ";" y coma
// decimal; en inglés "," y punto. Con BOM para que respete las tildes. RLS
// limita la consulta a las listas del usuario.

const PAGE = 1000; // máximo de filas por consulta en Supabase

const FORMAT: Record<Locale, { separator: string; decimal: string }> = {
  en: { separator: ",", decimal: "." },
  es: { separator: ";", decimal: "," },
};

// Los Route Handlers no tienen root params: el idioma llega en `params`.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[lang]/settings/export">,
) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = DICTIONARIES[locale].csv;
  const { separator, decimal } = FORMAT[locale];
  const uncategorized = DICTIONARIES[locale].common.uncategorized;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id")
    .order("created_at")
    .limit(1)
    .single();
  if (listError) {
    return NextResponse.json({ error: "no_list" }, { status: 404 });
  }

  const rows: string[][] = [
    [t.date, t.note, t.category, t.type, t.amount, t.currency, t.source],
  ];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "occurred_on, note, amount, currency, source, category:categories!transactions_category_same_list_fkey(name, kind)",
      )
      .eq("list_id", list.id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      return NextResponse.json({ error: "export_failed" }, { status: 500 });
    }
    for (const tx of data) {
      const income = tx.category?.kind === "income";
      rows.push([
        tx.occurred_on,
        tx.note,
        tx.category?.name ?? uncategorized,
        income ? t.income : t.expense,
        // Gastos en negativo: así una suma da el balance.
        (income ? tx.amount : -tx.amount).toFixed(2).replace(".", decimal),
        tx.currency,
        t.sources[tx.source] ?? tx.source,
      ]);
    }
    if (data.length < PAGE) break;
  }

  const csv =
    "\uFEFF" +
    rows
      .map((r) => r.map((cell) => csvCell(cell, separator)).join(separator))
      .join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendly-${toISODate(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

// Comillas si lleva separador, comillas o saltos de línea. Un "=", "+",
// "-" o "@" al inicio de un texto se neutraliza para que Excel no lo
// ejecute como fórmula.
function csvCell(value: string, separator: string) {
  let text = value;
  if (/^[=+\-@]/.test(text) && !/^-?\d/.test(text)) text = `'${text}`;
  const needsQuotes = text.includes(separator) || /["\r\n]/.test(text);
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}
