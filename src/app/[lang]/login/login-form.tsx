"use client";

import { useActionState, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestPasswordReset,
  sendMagicLink,
  signInWithPassword,
  signUp,
  type LoginState,
} from "./actions";

type Mode = "password" | "signup" | "reset" | "link";

const MODES: Record<
  Mode,
  {
    action: (prev: LoginState, formData: FormData) => Promise<LoginState>;
    submit: string;
    password?: "current-password" | "new-password";
  }
> = {
  password: {
    action: signInWithPassword,
    submit: "Entrar",
    password: "current-password",
  },
  signup: { action: signUp, submit: "Crear cuenta", password: "new-password" },
  reset: {
    action: requestPasswordReset,
    submit: "Enviarme un enlace para cambiarla",
  },
  link: { action: sendMagicLink, submit: "Enviarme un enlace" },
};

const SENT_MESSAGES: Record<
  Extract<LoginState, { status: "sent" }>["reason"],
  string
> = {
  link: "Ábrelo en este mismo navegador para entrar.",
  signup: "Ábrelo para confirmar tu cuenta y entrar.",
  reset: "Ábrelo en este mismo navegador para elegir una contraseña nueva.",
};

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [mode, setMode] = useState<Mode>("password");
  // El correo se conserva al cambiar de modo.
  const [email, setEmail] = useState("");

  return (
    <AuthForm
      // key: cada modo empieza con su propio estado limpio.
      key={mode}
      mode={mode}
      onModeChange={setMode}
      email={email}
      onEmailChange={setEmail}
      linkError={linkError}
    />
  );
}

function AuthForm({
  mode,
  onModeChange,
  email,
  onEmailChange,
  linkError,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  email: string;
  onEmailChange: (email: string) => void;
  linkError: boolean;
}) {
  const { action: modeAction, submit, password } = MODES[mode];
  const [state, action, pending] = useActionState<LoginState, FormData>(
    modeAction,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-primary" />
        <p className="font-semibold">Revisa tu correo</p>
        <p className="text-sm text-muted-foreground">
          Enviamos un enlace a <strong>{state.email}</strong>.{" "}
          {SENT_MESSAGES[state.reason]}
        </p>
        <Button
          variant="link"
          className="h-11"
          onClick={() => onModeChange("password")}
        >
          Volver a entrar con contraseña
        </Button>
      </div>
    );
  }

  const message =
    state.status === "error"
      ? state.message
      : linkError && mode === "password"
        ? "El enlace no es válido o ya caducó. Pide uno nuevo."
        : null;

  return (
    <div className="flex flex-col gap-4">
      {mode === "signup" && (
        <p className="text-center font-semibold">Crea tu cuenta</p>
      )}
      {mode === "reset" && (
        <p className="text-center text-sm text-muted-foreground">
          Te enviaremos un enlace para elegir una contraseña nueva.
        </p>
      )}
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
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="h-11"
        />
        {password && (
          <>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="text-sm font-semibold">
                Contraseña
              </label>
              {mode === "password" && (
                <button
                  type="button"
                  onClick={() => onModeChange("reset")}
                  className="-my-3 py-3 pl-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  ¿La olvidaste?
                </button>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={password}
              placeholder={
                mode === "signup" ? "Mínimo 8 caracteres" : undefined
              }
              minLength={mode === "signup" ? 8 : undefined}
              maxLength={72}
              required
              className="h-11"
            />
          </>
        )}
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submit}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-1 text-sm">
        {mode === "password" ? (
          <>
            <Button
              variant="link"
              className="h-11"
              onClick={() => onModeChange("signup")}
            >
              ¿No tienes cuenta? Crear una
            </Button>
            <Button
              variant="link"
              className="h-11 text-muted-foreground"
              onClick={() => onModeChange("link")}
            >
              Entrar sin contraseña, con un enlace al correo
            </Button>
          </>
        ) : (
          <Button
            variant="link"
            className="h-11"
            onClick={() => onModeChange("password")}
          >
            {mode === "signup"
              ? "¿Ya tienes cuenta? Entrar"
              : "Volver a entrar con contraseña"}
          </Button>
        )}
      </div>
    </div>
  );
}
