import { Suspense } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const sampleBars = [
  { emoji: "🥑", label: "Súper", pct: 92, color: "#e1f295" },
  { emoji: "🍔", label: "Comida", pct: 118, color: "#ffd6cc" },
  { emoji: "🚗", label: "Transporte", pct: 64, color: "#cbe7ff" },
  { emoji: "🎮", label: "Ocio", pct: 41, color: "#e5d4ff" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-2xl">
          💰
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">MonAi</h1>
          <p className="text-sm text-muted-foreground">
            Fase 0 · entorno listo
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Gastado este mes</CardDescription>
          <CardTitle className="text-4xl font-extrabold">729,27 €</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 items-end justify-between gap-3">
            {sampleBars.map((bar) => (
              <div
                key={bar.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="flex w-full flex-col items-center justify-end rounded-2xl pb-2"
                  style={{
                    // 120 % del presupuesto ocupa toda la altura disponible.
                    height: `${(Math.min(bar.pct, 120) / 120) * 85}%`,
                    background: bar.color,
                  }}
                >
                  <span className="text-lg">{bar.emoji}</span>
                  <span className="text-xs font-bold">{bar.pct}%</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Datos de ejemplo: el dashboard real llega en la Fase 1.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado del entorno</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <StatusRow ok label="Next.js 16 + Tailwind + shadcn/ui" />
          <Suspense
            fallback={
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Conectando con Supabase…
              </div>
            }
          >
            <SupabaseStatus />
          </Suspense>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" disabled>
        Añadir gasto (Fase 1)
      </Button>
    </main>
  );
}

async function checkSupabase(): Promise<string | null> {
  try {
    const supabase = await createClient();
    // Sin sesión, RLS devuelve 0 filas: si no hay error, la base y el
    // esquema responden.
    const { error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });
    return error ? error.message : null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

async function SupabaseStatus() {
  const error = await checkSupabase();
  return error ? (
    <StatusRow ok={false} label="Supabase no responde" detail={error} />
  ) : (
    <StatusRow
      ok
      label="Supabase conectado"
      detail={process.env.NEXT_PUBLIC_SUPABASE_URL}
    />
  );
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-start gap-2">
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${ok ? "text-emerald-600" : "text-destructive"}`}
      />
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{label}</span>
        {detail && (
          <Badge variant="secondary" className="max-w-full font-mono">
            <span className="truncate">{detail}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
