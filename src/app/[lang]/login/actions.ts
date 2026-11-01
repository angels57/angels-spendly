"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthError } from "@supabase/supabase-js";
import { hasLocale, localizePath } from "@/i18n/config";
import type { ErrorCode } from "@/i18n/errors";
import { getRequestLocale, setLocaleCookie } from "@/i18n/request";
import { createClient } from "@/lib/supabase/server";

/** Ruta en el idioma que se está viendo (las acciones no tienen root params). */
async function localized(path: string) {
  return localizePath(await getRequestLocale(), path);
}

/**
 * Tras entrar: el idioma guardado en la cuenta manda sobre el de la URL y
 * el del navegador (se eligió en Ajustes, quizá en otro dispositivo).
 */
async function homeInAccountLocale(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data } = await supabase.from("profiles").select("locale").single();
  const locale = hasLocale(data?.locale)
    ? data.locale
    : await getRequestLocale();
  await setLocaleCookie(locale);
  return localizePath(locale, "/");
}

type ErrorState = { status: "error"; error: ErrorCode };

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
  error: "invalid_email",
};
const INVALID_PASSWORD: ErrorState = {
  status: "error",
  error: "password_length",
};

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function authError(error: AuthError, fallback: ErrorCode): ErrorState {
  const code: ErrorCode =
    error.status === 429
      ? "too_many_attempts"
      : error.code === "invalid_credentials"
        ? "invalid_credentials"
        : error.code === "email_not_confirmed"
          ? "email_not_confirmed"
          : error.code === "weak_password"
            ? "weak_password"
            : error.code === "same_password"
              ? "same_password"
              : error.code === "user_already_exists"
                ? "user_already_exists"
                : fallback;
  return { status: "error", error: code };
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
    // Si el correo es nuevo, crea la cuenta: con el idioma de la app.
    options: {
      emailRedirectTo: await callbackUrl(),
      data: { locale: await getRequestLocale() },
    },
  });

  if (error) return authError(error, "link_send_failed");
  return { status: "sent", email: parsed.data, reason: "link" };
}

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { status: "error", error: "invalid_credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return authError(error, "sign_in_failed");
  redirect(await homeInAccountLocale(supabase));
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
    // El trigger handle_new_user crea el perfil y las categorías en este idioma.
    options: {
      emailRedirectTo: await callbackUrl(),
      data: { locale: await getRequestLocale() },
    },
  });
  if (error) return authError(error, "sign_up_failed");

  // Sin confirmación por correo (lo configurado): sesión al momento.
  if (data.session) redirect(await homeInAccountLocale(supabase));
  // Solo si se activa "Confirm email" en Supabase: toca revisar el correo.
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
    redirectTo: await callbackUrl(await localized("/reset-password")),
  });
  if (error) return authError(error, "email_send_failed");
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
    return { status: "error", error: "passwords_mismatch" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return authError(error, "password_save_failed");
  redirect(await homeInAccountLocale(supabase));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(await localized("/login"));
}
