import * as chrono from "chrono-node";

// Parser local (sin IA) de frases como "comida 12 ayer" o
// "súper 45,50 el viernes pasado" → monto, fecha, categoría y nota.

export type ParserCategory = {
  id: string;
  name: string;
  keywords: string[];
};

export type ParsedExpense = {
  amountCents: number | null;
  /** Fecha local en formato YYYY-MM-DD. */
  date: string;
  categoryId: string | null;
  note: string;
};

type Span = { start: number; end: number };

const CURRENCY_BEFORE = String.raw`(?:[$€£]\s?)`;
const CURRENCY_AFTER = String.raw`(?:\s?(?:[€$£]|(?:eur(?:os?)?|usd|d[oó]lares|pesos|mxn)\b))`;
// 1.234,56 · 1,234.56 · 45,50 · 45.50 · 12
const NUMBER = String.raw`\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const AMOUNT_RE = new RegExp(
  String.raw`(?<![\d/.,])(${CURRENCY_BEFORE})?(${NUMBER})(${CURRENCY_AFTER})?(?![\d/]|[.,]\d)`,
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
): ParsedExpense {
  const text = input.trim();
  const amount = findAmount(text);
  const masked = amount ? mask(text, amount.span) : text;
  const date = findDate(masked, now);
  let rest = date ? mask(masked, date.span) : masked;
  rest = cleanNote(rest);

  return {
    amountCents: amount?.cents ?? null,
    date: toISODate(date?.date ?? now),
    categoryId: findCategory(rest, categories),
    note: capitalize(rest),
  };
}

// Monto ---------------------------------------------------------------------

function findAmount(text: string): { cents: number; span: Span } | null {
  const candidates: { cents: number; span: Span; marked: boolean }[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    const marked = Boolean(m[1] || m[3]);
    if (
      !marked &&
      (NOT_AMOUNT_AFTER.test(text.slice(end)) ||
        NOT_AMOUNT_BEFORE.test(text.slice(0, start)))
    ) {
      continue;
    }
    const cents = toCents(m[2]);
    if (cents > 0) candidates.push({ cents, span: { start, end }, marked });
  }
  if (candidates.length === 0) return null;
  // Prioridad: el que lleva símbolo de moneda; si no, el mayor
  // ("2 cafés 8" → 8).
  const marked = candidates.find((c) => c.marked);
  return marked ?? candidates.reduce((a, b) => (b.cents > a.cents ? b : a));
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
  [/\b(?:anteayer|antier|antes de ayer|day before yesterday)\b/i, -2],
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

function findCategory(
  note: string,
  categories: ParserCategory[],
): string | null {
  const words = normalize(note)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
  // En orden de aparición: la primera palabra reconocida manda.
  for (const word of words) {
    for (const category of categories) {
      const terms = [category.name, ...category.keywords].map(normalize);
      if (terms.some((term) => sameWord(word, term))) return category.id;
    }
  }
  return null;
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
