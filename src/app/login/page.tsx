import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · MonAi" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-3xl bg-primary text-3xl">
          💰
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">MonAi</h1>
        <p className="text-muted-foreground">
          Tus gastos, claros y sin esfuerzo.
        </p>
      </div>
      <Suspense>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        Sin contraseñas: te enviamos un enlace para entrar.
      </p>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  return <LoginForm linkError={error === "link"} />;
}
