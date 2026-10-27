import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/parser";

// Descarga de todos los movimientos de la lista en CSV, pensado para Excel
// en español: separador ";" y coma decimal, con BOM para que respete las
// tildes. RLS limita la consulta a las listas del usuario.

const PAGE = 1000; // máximo de filas por consulta en Supabase

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id")
    .order("created_at")
    .limit(1)
    .single();
  if (listError) {
    return NextResponse.json({ error: "Sin lista" }, { status: 404 });
  }

  const rows: string[][] = [
    ["Fecha", "Nota", "Categoría", "Tipo", "Monto", "Moneda", "Origen"],
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
      return NextResponse.json(
        { error: "No se pudo exportar" },
        { status: 500 },
      );
    }
    for (const t of data) {
      const income = t.category?.kind === "income";
      rows.push([
        t.occurred_on,
        t.note,
        t.category?.name ?? "Sin categoría",
        income ? "Ingreso" : "Gasto",
        // Gastos en negativo: así una suma da el balance.
        formatAmount(income ? t.amount : -t.amount),
        t.currency,
        SOURCE_LABELS[t.source] ?? t.source,
      ]);
    }
    if (data.length < PAGE) break;
  }

  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendly-${toISODate(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  text: "Quick add",
  voice: "Voz",
  ai: "IA",
  recurring: "Recurrente",
};

function formatAmount(value: number) {
  return value.toFixed(2).replace(".", ",");
}

// Comillas si lleva separador, comillas o saltos de línea. Un "=", "+",
// "-" o "@" al inicio de un texto se neutraliza para que Excel no lo
// ejecute como fórmula.
function csvCell(value: string) {
  let text = value;
  if (/^[=+\-@]/.test(text) && !/^-?\d/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
