"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-primary" />
        <p className="font-semibold">Revisa tu correo</p>
        <p className="text-sm text-muted-foreground">
          Enviamos un enlace a <strong>{state.email}</strong>. Ábrelo en este
          mismo navegador para entrar.
        </p>
      </div>
    );
  }

  const message =
    state.status === "error"
      ? state.message
      : linkError
        ? "El enlace no es válido o ya caducó. Pide uno nuevo."
        : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-semibold">
        Correo electrónico
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        className="h-11"
      />
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Enviarme un enlace
      </Button>
    </form>
  );
}
