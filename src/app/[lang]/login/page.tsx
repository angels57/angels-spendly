import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/brand";
import Image from "next/image";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.signIn };
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/[lang]/login">) {
  const t = await getDictionary();
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
        <p className="text-muted-foreground">{t.meta.tagline}</p>
      </div>
      <Suspense>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
}: Pick<PageProps<"/[lang]/login">, "searchParams">) {
  const { error } = await searchParams;
  return <LoginForm linkError={error === "link"} />;
}
