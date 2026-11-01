import { en } from "@/i18n/dictionaries/en";

// Las Server Actions devuelven un código de error y la pantalla lo traduce
// (las acciones no conocen el idioma de la URL). Los códigos son las claves
// de `errors` en los diccionarios: uno sin traducción no compila.

export type ErrorCode = keyof typeof en.errors;

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && Object.hasOwn(en.errors, value);
}

/** Para los mensajes de Zod, que son códigos: uno desconocido → `fallback`. */
export function toErrorCode(
  value: string | undefined,
  fallback: ErrorCode = "check_data",
): ErrorCode {
  return isErrorCode(value) ? value : fallback;
}
