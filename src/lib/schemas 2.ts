import { z } from "zod";

// Validación compartida por formularios (cliente) y Server Actions (servidor).

export const transactionInputSchema = z.object({
  amountCents: z.int().positive().max(9_999_999_999),
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
  emoji: z.string().trim().min(1, "Elige un emoji.").max(16),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  kind: z.enum(["expense", "income"]),
  keywords: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(50),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

/** "uber, taxi,  Metro" → ["uber", "taxi", "metro"] sin duplicados. */
export function splitKeywords(text: string) {
  return [
    ...new Set(
      text
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
