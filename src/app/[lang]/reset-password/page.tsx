import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";
import { NewPasswordForm } from "./new-password-form";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.newPassword };
}

// Se llega desde el enlace de "¿La olvidaste?" (o desde la app, para poner
// contraseña a una cuenta que entraba con enlace). El proxy exige sesión.
export default async function ResetPasswordPage() {
  const t = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t.resetPassword.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.resetPassword.subtitle(APP_NAME)}
        </p>
      </div>
      <NewPasswordForm />
    </main>
  );
}
