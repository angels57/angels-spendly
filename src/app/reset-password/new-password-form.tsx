"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword, type PasswordState } from "@/app/login/actions";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    updatePassword,
    { status: "idle" },
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-semibold">
        Contraseña nueva
      </label>
      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        maxLength={72}
        required
        className="h-11"
      />
      <label htmlFor="confirm" className="text-sm font-semibold">
        Repítela
      </label>
      <Input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        className="h-11"
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Guardar y entrar
      </Button>
    </form>
  );
}
