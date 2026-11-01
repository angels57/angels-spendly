"use client";

import { useActionState, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/provider";
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
    password?: "current-password" | "new-password";
  }
> = {
  password: { action: signInWithPassword, password: "current-password" },
  signup: { action: signUp, password: "new-password" },
  reset: { action: requestPasswordReset },
  link: { action: sendMagicLink },
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
  const t = useT();
  const { action: modeAction, password } = MODES[mode];
  const [state, action, pending] = useActionState<LoginState, FormData>(
    modeAction,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-primary" />
        <p className="font-semibold">{t.auth.sent.title}</p>
        <p className="text-sm text-muted-foreground">
          {t.auth.sent.intro} <strong>{state.email}</strong>.{" "}
          {t.auth.sent[state.reason]}
        </p>
        <Button
          variant="link"
          className="h-11"
          onClick={() => onModeChange("password")}
        >
          {t.auth.backToPassword}
        </Button>
      </div>
    );
  }

  const message =
    state.status === "error"
      ? t.errors[state.error]
      : linkError && mode === "password"
        ? t.auth.linkExpired
        : null;

  return (
    <div className="flex flex-col gap-4">
      {mode === "signup" && (
        <p className="text-center font-semibold">{t.auth.signupTitle}</p>
      )}
      {mode === "reset" && (
        <p className="text-center text-sm text-muted-foreground">
          {t.auth.resetHint}
        </p>
      )}
      <form action={action} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-semibold">
          {t.auth.email}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="h-11"
        />
        {password && (
          <>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="text-sm font-semibold">
                {t.auth.password}
              </label>
              {mode === "password" && (
                <button
                  type="button"
                  onClick={() => onModeChange("reset")}
                  className="-my-3 py-3 pl-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t.auth.forgot}
                </button>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={password}
              placeholder={
                mode === "signup" ? t.auth.passwordPlaceholder : undefined
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
          {t.auth.submit[mode]}
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
              {t.auth.noAccount}
            </Button>
            <Button
              variant="link"
              className="h-11 text-muted-foreground"
              onClick={() => onModeChange("link")}
            >
              {t.auth.magicLink}
            </Button>
          </>
        ) : (
          <Button
            variant="link"
            className="h-11"
            onClick={() => onModeChange("password")}
          >
            {mode === "signup" ? t.auth.haveAccount : t.auth.backToPassword}
          </Button>
        )}
      </div>
    </div>
  );
}
