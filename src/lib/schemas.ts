import { z } from "zod";
import { isSingleEmoji } from "@/lib/emoji";
import { CURRENCY_CODES } from "@/lib/money";

// Validación compartida por formularios (cliente) y Server Actions (servidor).

export const currencySchema = z.enum(CURRENCY_CODES);

export const transactionInputSchema = z.object({
  amountCents: z.int().positive().max(9_999_999_999),
  currency: currencySchema,
  date: z.iso.date(),
  categoryId: z.uuid().nullable(),
  note: z.string().trim().max(200),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const CATEGORY_COLORS = [
  "#ffd6cc",
  "#e1f295",
  "#fccc8e",
  "#cbe7ff",
  "#ffe8a3",
  "#e5d4ff",
  "#ffc8dd",
  "#c8f2e0",
  "#d4f5c8",
  "#f3f3f3",
] as const;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre.").max(40),
  emoji: z.string().trim().refine(isSingleEmoji, "Elige un solo emoji."),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  kind: z.enum(["expense", "income"]),
  keywords: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(50),
  /** Presupuesto mensual en centavos; null = sin presupuesto. */
  budgetCents: z.int().positive().max(9_999_999_999).nullable(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const FREQUENCIES = ["weekly", "monthly", "yearly"] as const;

export const recurringInputSchema = z
  .object({
    amountCents: z.int().positive().max(9_999_999_999),
    currency: currencySchema,
    categoryId: z.uuid().nullable(),
    note: z
      .string()
      .trim()
      .min(1, "Ponle un nombre, como «Alquiler».")
      .max(200),
    frequency: z.enum(FREQUENCIES),
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable(),
  })
  .refine((r) => !r.endDate || r.endDate >= r.startDate, {
    message: "La fecha de fin no puede ser anterior al inicio.",
    path: ["endDate"],
  });

export type RecurringInput = z.infer<typeof recurringInputSchema>;

/** Fondo de lo que no tiene categoría: pastel fijo (en oscuro también),
 * porque el texto encima siempre es oscuro. */
export const NO_CATEGORY_COLOR = "#f3f3f3";
