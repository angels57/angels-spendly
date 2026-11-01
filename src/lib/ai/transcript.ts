// Whisper escribe frases con puntuación ("Tinto 3000.", "¡Cine con amigos
// 20.000 ante ayer!") y a veces los montos en letras ("tinto tres mil").
// El parser espera algo como "tinto 3000": se quitan los signos (pero no
// el punto de miles de "19.900") y los números en letras pasan a cifras.
// La conversión de números solo existe en español: en inglés Whisper ya
// escribe cifras, y el parser entiende "2 thousand" o "12k".

import type { Locale } from "@/i18n/config";

export function cleanTranscript(text: string, locale: Locale) {
  const plain = text
    .replace(/[¡!¿?"«»]/g, " ")
    .replace(/(?<!\d)[.,;:]|[.,;:](?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return locale === "es" ? spelledNumbersToDigits(plain) : plain;
}

const UNITS: Record<string, number> = {
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21,
  veintiun: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
};
const TENS: Record<string, number> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
};
const HUNDREDS: Record<string, number> = {
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
};
// "un café" no es un monto; "un millón" o "una mil" sí.
const ONE = new Set(["un", "una"]);
const SCALE = new Set(["mil", "millon", "millones"]);

const key = (word: string) =>
  word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function valueOf(word: string): number | null {
  const k = key(word);
  return UNITS[k] ?? TENS[k] ?? HUNDREDS[k] ?? null;
}

/** "doce mil quinientos" → "12500", "un millón doscientos mil" → "1200000". */
export function spelledNumbersToDigits(text: string) {
  const words = text.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    const start = i;
    let total = 0;
    let current = 0;
    let used = false;
    while (i < words.length) {
      const k = key(words[i]!);
      const next = words[i + 1] ? key(words[i + 1]!) : "";
      const value = valueOf(words[i]!);
      if (value !== null) {
        current += value;
      } else if (ONE.has(k) && SCALE.has(next)) {
        current += 1;
      } else if (k === "mil" && used) {
        total += (current || 1) * 1000;
        current = 0;
      } else if ((k === "millon" || k === "millones") && used) {
        total = (total + (current || 1)) * 1_000_000;
        current = 0;
      } else if (
        // "ochenta y cinco": la "y" solo une decenas con unidades.
        k === "y" &&
        used &&
        current % 100 >= 30 &&
        current % 10 === 0 &&
        (UNITS[next] ?? 10) < 10
      ) {
        // se salta la "y"
      } else {
        break;
      }
      used = true;
      i++;
    }
    if (used) {
      out.push(String(total + current));
    } else {
      out.push(words[start]!);
      i = start + 1;
    }
  }
  return out.join(" ");
}
