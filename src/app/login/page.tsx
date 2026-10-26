import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import Image from "next/image";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={64}
          height={64}
          priority
          className="rounded-2xl shadow-lg"
        />
        <h1 className="text-3xl font-extrabold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">{APP_TAGLINE}</p>
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
