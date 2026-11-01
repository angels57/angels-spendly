import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

// Se llega desde el enlace de "¿La olvidaste?" (o desde la app, para poner
// contraseña a una cuenta que entraba con enlace). El proxy exige sesión.
export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Elige una contraseña nueva
        </h1>
        <p className="text-sm text-muted-foreground">
          La usarás para entrar en {APP_NAME}.
        </p>
      </div>
      <NewPasswordForm />
    </main>
  );
}
