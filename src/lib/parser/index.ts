import * as chrono from "chrono-node";
import type { CurrencyCode } from "@/lib/money";

// Parser local (sin IA) de frases como "comida 12 ayer" o
// "súper 45,50 el viernes pasado" → monto, fecha, categoría y nota.

export type ParserCategory = {
  id: string;
  name: string;
  keywords: string[];
};

export type ParsedExpense = {
  amountCents: number | null;
  /** Moneda escrita ("usd", "€"…); null = la de la lista ("$", "pesos"). */
  currency: CurrencyCode | null;
  /** Fecha local en formato YYYY-MM-DD. */
  date: string;
  categoryId: string | null;
  note: string;
};

type Span = { start: number; end: number };

const CURRENCY_BEFORE = String.raw`(?:(?:us\$|[$€£])\s?)`;
const CURRENCY_AFTER = String.raw`(?:\s?(?:de\s+)?(?:us\$|[€$£]|(?:usd|cop|mxn|eur(?:os?)?|d[oó]lar(?:es)?|pesos?|libras?)\b))`;
// 1.234,56 · 1,234.56 · 45,50 · 45.50 · 12
const NUMBER = String.raw`\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
// "25 mil", "25k", "1,5 millones": habituales en pesos.
const MULTIPLIER = String.raw`(?:\s?(?:k|mil|mill[oó]n(?:es)?)\b)`;
const AMOUNT_RE = new RegExp(
  String.raw`(?<![\d/.,])(${CURRENCY_BEFORE})?(${NUMBER})(${MULTIPLIER})?(${CURRENCY_AFTER})?(?![\d/]|[.,]\d)`,
  "gi",
);

const MONTHS =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december";
// Números que forman parte de una fecha o de "hace N días", no de un monto.
const NOT_AMOUNT_AFTER = new RegExp(
  String.raw`^\s*(?:de\s+(?:${MONTHS})|(?:${MONTHS})\b|d[ií]as?\b|days?\b|semanas?\b|weeks?\b)`,
  "i",
);
const NOT_AMOUNT_BEFORE = /\b(?:hace|el|the)\s*$/i;

export function parseExpense(
  input: string,
  categories: ParserCategory[],
  now: Date = new Date(),
  history?: CategoryHistory,
): ParsedExpense {
  const text = input.trim();
  const amount = findAmount(text);
  const masked = amount ? mask(text, amount.span) : text;
  const date = findDate(masked, now);
  let rest = date ? mask(masked, date.span) : masked;
  rest = cleanNote(rest);

  return {
    amountCents: amount?.cents ?? null,
    currency: amount?.currency ?? null,
    date: toISODate(date?.date ?? now),
    categoryId: findCategory(rest, categories, history),
    note: capitalize(rest),
  };
}

// Monto ---------------------------------------------------------------------

/** Solo el monto, para campos de formulario ("45,50" → 4550). */
export function parseAmount(text: string): number | null {
  return findAmount(text.trim())?.cents ?? null;
}

type Amount = { cents: number; span: Span; currency: CurrencyCode | null };

function findAmount(text: string): Amount | null {
  const candidates: (Amount & { marked: boolean })[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    const marked = Boolean(m[1] || m[3] || m[4]);
    if (
      !marked &&
      (NOT_AMOUNT_AFTER.test(text.slice(end)) ||
        NOT_AMOUNT_BEFORE.test(text.slice(0, start)))
    ) {
      continue;
    }
    const cents = toCents(m[2]) * multiplier(m[3]);
    const currency = currencyOf(`${m[1] ?? ""} ${m[4] ?? ""}`);
    if (cents > 0) {
      candidates.push({ cents, span: { start, end }, currency, marked });
    }
  }
  if (candidates.length === 0) return null;
  // Prioridad: el que lleva símbolo de moneda; si no, el mayor
  // ("2 cafés 8" → 8).
  const marked = candidates.find((c) => c.marked);
  return marked ?? candidates.reduce((a, b) => (b.cents > a.cents ? b : a));
}

function multiplier(word: string | undefined) {
  if (!word) return 1;
  return /mill/i.test(word) ? 1_000_000 : 1000;
}

// "$" y "pesos" no fijan moneda: valen la de la lista.
function currencyOf(marker: string): CurrencyCode | null {
  const m = normalize(marker);
  if (/€|eur/.test(m)) return "EUR";
  if (/us\$|usd|dolar/.test(m)) return "USD";
  if (/£|libra/.test(m)) return "GBP";
  if (/cop/.test(m)) return "COP";
  if (/mxn/.test(m)) return "MXN";
  return null;
}

function toCents(raw: string): number {
  const lastSep = Math.max(raw.lastIndexOf("."), raw.lastIndexOf(","));
  const decimals = lastSep === -1 ? 0 : raw.length - lastSep - 1;
  // Un separador seguido de 1-2 dígitos es decimal; con 3 es de miles.
  const normalized =
    decimals > 0 && decimals <= 2
      ? raw.slice(0, lastSep).replace(/[.,]/g, "") +
        "." +
        raw.slice(lastSep + 1)
      : raw.replace(/[.,]/g, "");
  return Math.round(Number(normalized) * 100);
}

// Fecha ---------------------------------------------------------------------

const RELATIVE_DAYS: [RegExp, number][] = [
  // "ante ayer" separado es como lo escribe el dictado por voz.
  [/\b(?:ante ?ayer|antier|antes de ayer|day before yesterday)\b/i, -2],
  [/\b(?:ayer|yesterday)\b/i, -1],
  [/\b(?:hoy|today)\b/i, 0],
];
const DAYS_AGO = /\b(?:hace\s+(\d+)\s+d[ií]as?|(\d+)\s+days?\s+ago)\b/i;

function findDate(text: string, now: Date): { date: Date; span: Span } | null {
  const ago = DAYS_AGO.exec(text);
  if (ago) {
    const days = Number(ago[1] ?? ago[2]);
    return { date: addDays(now, -days), span: spanOf(ago) };
  }
  for (const [re, offset] of RELATIVE_DAYS) {
    const m = re.exec(text);
    if (m) return { date: addDays(now, offset), span: spanOf(m) };
  }

  const result = chrono.es.parse(text, now)[0] ?? chrono.en.parse(text, now)[0];
  if (!result) return null;

  let date = result.start.date();
  // Un gasto casi nunca es futuro: "viernes" un miércoles es el pasado
  // y "3 de diciembre" en octubre es del año anterior.
  if (startOfDay(date) > startOfDay(now)) {
    if (!result.start.isCertain("day")) date = addDays(date, -7);
    else if (!result.start.isCertain("year")) {
      date = new Date(date);
      date.setFullYear(date.getFullYear() - 1);
    }
  }

  const span = { start: result.index, end: result.index + result.text.length };
  // Incluye "pasado" en "el viernes pasado".
  const after = /^\s+(?:pasad[oa])\b/i.exec(text.slice(span.end));
  if (after) span.end += after[0].length;
  return { date, span };
}

// Categoría -----------------------------------------------------------------

// Orden: la misma nota ya guardada (respeta las correcciones del usuario),
// luego nombre y palabras clave, y por último palabras del historial.
function findCategory(
  note: string,
  categories: ParserCategory[],
  history?: CategoryHistory,
): string | null {
  const known = new Set(categories.map((c) => c.id));
  const learned = (key: string) => {
    const id =
      history && Object.hasOwn(history.words, key) ? history.words[key] : null;
    return id && known.has(id) ? id : null;
  };

  const noteKey = normalize(note).trim();
  if (history && Object.hasOwn(history.notes, noteKey)) {
    const id = history.notes[noteKey]!;
    if (known.has(id)) return id;
  }

  const words = wordsOf(note);
  // En orden de aparición: la primera palabra reconocida manda.
  for (const word of words) {
    for (const category of categories) {
      const terms = [category.name, ...category.keywords].map(normalize);
      if (terms.some((term) => sameWord(word, term))) return category.id;
    }
  }
  for (const word of words) {
    for (const form of forms(word)) {
      const id = learned(form);
      if (id) return id;
    }
  }
  return null;
}

// Historial -----------------------------------------------------------------

/**
 * Categorías aprendidas de los movimientos guardados: por nota completa
 * ("tinto" → Café) y por palabra ("sushi con Ana" → Comida por "sushi").
 * Objetos simples para poder pasarlos de un Server Component al cliente.
 */
export type CategoryHistory = {
  notes: Record<string, string>;
  words: Record<string, string>;
};

export type HistoryEntry = { note: string; categoryId: string };

// Palabras que no dicen nada de la categoría.
const STOPWORDS = new Set(
  "a al con de del el en la las lo los mi mis para por un una y the and of for with".split(
    " ",
  ),
);

/**
 * `entries` de la más reciente a la más antigua. Gana la categoría más
 * usada; si empatan, la más reciente. Una palabra solo se aprende si más
 * de la mitad de las veces fue a la misma categoría: "Ana" en "almuerzo
 * con Ana" y "regalo para Ana" no debe decidir nada.
 */
export function learnCategories(entries: HistoryEntry[]): CategoryHistory {
  const notes = new Map<string, Map<string, number>>();
  const words = new Map<string, Map<string, number>>();
  const vote = (
    table: Map<string, Map<string, number>>,
    key: string,
    categoryId: string,
  ) => {
    const counts = table.get(key) ?? new Map<string, number>();
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    table.set(key, counts);
  };

  for (const { note, categoryId } of entries) {
    const noteKey = normalize(note).trim();
    if (!noteKey) continue;
    vote(notes, noteKey, categoryId);
    const keys = new Set(
      wordsOf(note).flatMap((word) =>
        STOPWORDS.has(word) || /^\d+$/.test(word) ? [] : forms(word),
      ),
    );
    for (const key of keys) {
      // forms("es") incluye "e" y "": no sirven como palabra.
      if (key.length >= 2) vote(words, key, categoryId);
    }
  }

  return {
    notes: winners(notes, false),
    words: winners(words, true),
  };
}

function winners(
  table: Map<string, Map<string, number>>,
  needMajority: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, counts] of table) {
    let best: string | null = null;
    let bestCount = 0;
    let total = 0;
    // Map conserva el orden de inserción: el primero es el más reciente,
    // así que con ">" estricto gana en los empates.
    for (const [categoryId, count] of counts) {
      total += count;
      if (count > bestCount) {
        best = categoryId;
        bestCount = count;
      }
    }
    if (best && (!needMajority || bestCount * 2 > total)) result[key] = best;
  }
  return result;
}

function wordsOf(text: string) {
  return normalize(text)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
}

function sameWord(word: string, term: string) {
  const termForms = forms(term);
  return forms(word).some((form) => termForms.includes(form));
}

// Plurales simples: cafés → cafe, tacos → taco, pasteles → pastel.
function forms(word: string) {
  return [word, word.replace(/s$/, ""), word.replace(/es$/, "")];
}

// Utilidades ----------------------------------------------------------------

function cleanNote(text: string) {
  return text
    .replace(/\b(?:el|la|los|las|de|del|on|the|last)\s*$/i, "")
    .replace(/^\s*(?:el|la|de|on|the)\b/i, "")
    .replace(/\b(?:el|la|de)\s+(?=\s|$)/gi, "")
    .replace(/[,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mask(text: string, span: Span) {
  return text.slice(0, span.start) + " " + text.slice(span.end);
}

function spanOf(m: RegExpExecArray): Span {
  return { start: m.index, end: m.index + m[0].length };
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
