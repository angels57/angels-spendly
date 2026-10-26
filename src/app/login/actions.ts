"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ErrorState = { status: "error"; message: string };

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string; reason: "link" | "signup" | "reset" }
  | ErrorState;

const emailSchema = z.email();
// Supabase (bcrypt) ignora lo que pase de 72 bytes.
const passwordSchema = z.string().min(8).max(72);

const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const INVALID_EMAIL: ErrorState = {
  status: "error",
  message: "Escribe un correo válido.",
};
const INVALID_PASSWORD: ErrorState = {
  status: "error",
  message: "La contraseña debe tener entre 8 y 72 caracteres.",
};

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function authError(error: AuthError, fallback: string): ErrorState {
  const message =
    error.status === 429
      ? "Demasiados intentos. Espera un momento y vuelve a probar."
      : error.code === "invalid_credentials"
        ? "Correo o contraseña incorrectos."
        : error.code === "email_not_confirmed"
          ? "Confirma tu correo antes de entrar: revisa tu bandeja de entrada."
          : error.code === "weak_password"
            ? "Esa contraseña es demasiado débil. Prueba con otra más larga."
            : error.code === "same_password"
              ? "La nueva contraseña debe ser distinta de la anterior."
              : fallback;
  return { status: "error", message };
}

async function callbackUrl(next?: string) {
  const origin = (await headers()).get("origin");
  const url = `${origin}/auth/callback`;
  return next ? `${url}?next=${encodeURIComponent(next)}` : url;
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return INVALID_EMAIL;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: await callbackUrl() },
  });

  if (error)
    return authError(error, "No pudimos enviar el enlace. Inténtalo de nuevo.");
  return { status: "sent", email: parsed.data, reason: "link" };
}

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { status: "error", message: "Correo o contraseña incorrectos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return authError(error, "No pudimos iniciar sesión. Inténtalo de nuevo.");
  redirect("/");
}

export async function signUp(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.path[0] === "email"
      ? INVALID_EMAIL
      : INVALID_PASSWORD;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await callbackUrl() },
  });
  if (error)
    return authError(error, "No pudimos crear la cuenta. Inténtalo de nuevo.");

  // Sin confirmación por correo, Supabase devuelve la sesión al momento.
  if (data.session) redirect("/");
  // Con confirmación (y también si el correo ya existía, para no revelarlo)
  // toca revisar el correo.
  return { status: "sent", email: parsed.data.email, reason: "signup" };
}

export async function requestPasswordReset(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return INVALID_EMAIL;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: await callbackUrl("/reset-password"),
  });
  if (error)
    return authError(error, "No pudimos enviar el correo. Inténtalo de nuevo.");
  return { status: "sent", email: parsed.data, reason: "reset" };
}

export type PasswordState = { status: "idle" } | ErrorState;

export async function updatePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return INVALID_PASSWORD;
  if (password.data !== formData.get("confirm")) {
    return { status: "error", message: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error)
    return authError(
      error,
      "No pudimos guardar la contraseña. Inténtalo de nuevo.",
    );
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
