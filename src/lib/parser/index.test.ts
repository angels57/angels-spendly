import { describe, expect, it } from "vitest";
import {
  learnCategories,
  parseExpense,
  type HistoryEntry,
  type ParserCategory,
} from "./index";

// Domingo 25 de octubre de 2026, mediodía (hora local).
const NOW = new Date(2026, 9, 25, 12, 0, 0);

const categories: ParserCategory[] = [
  {
    id: "comida",
    name: "Comida",
    keywords: ["almuerzo", "cena", "lunch", "tacos"],
  },
  { id: "super", name: "Súper", keywords: ["supermercado", "groceries"] },
  { id: "cafe", name: "Café", keywords: ["coffee", "starbucks"] },
  { id: "transporte", name: "Transporte", keywords: ["uber", "taxi"] },
  { id: "casa", name: "Casa", keywords: ["renta", "luz"] },
  { id: "ocio", name: "Ocio", keywords: ["netflix", "cine"] },
];

const parse = (text: string) => parseExpense(text, categories, NOW);

describe("parseExpense: monto", () => {
  it.each([
    ["comida 12", 1200],
    ["súper 45,50", 4550],
    ["groceries 45.50", 4550],
    ["$12 lunch", 1200],
    ["cena 30€", 3000],
    ["cena 30 euros", 3000],
    ["renta 1.234,56", 123456],
    ["rent 1,234.56", 123456],
    ["renta 1.200", 120000],
    ["café 2.5", 250],
  ])("%s → %i centavos", (text, cents) => {
    expect(parse(text).amountCents).toBe(cents);
  });

  it.each([
    ["almuerzo 25 mil", 2_500_000],
    ["almuerzo 25mil", 2_500_000],
    ["taxi 12k", 1_200_000],
    ["arriendo 1,5 millones", 150_000_000],
    ["moto 2 millones de pesos", 200_000_000],
    ["mercado 120.000", 12_000_000],
    ["mercado $120.000", 12_000_000],
  ])("pesos: %s → %i centavos", (text, cents) => {
    expect(parse(text).amountCents).toBe(cents);
  });

  it.each([
    ["comida 12", null],
    ["mercado $120.000", null],
    ["almuerzo 20 mil pesos", null],
    ["netflix 15 usd", "USD"],
    ["netflix US$15", "USD"],
    ["hotel 80 dólares", "USD"],
    ["cena 30€", "EUR"],
    ["cena 30 euros", "EUR"],
    ["taxi 9000 cop", "COP"],
    ["libro 10 libras", "GBP"],
  ])("moneda: %s → %s", (text, currency) => {
    expect(parse(text).currency).toBe(currency);
  });

  it("la moneda no queda en la nota", () => {
    expect(parse("netflix 15 usd").note).toBe("Netflix");
    expect(parse("moto 2 millones de pesos").note).toBe("Moto");
  });

  it("sin número no hay monto", () => {
    expect(parse("comida").amountCents).toBeNull();
  });

  it("prefiere el número con símbolo de moneda", () => {
    expect(parse("2 cafés $8").amountCents).toBe(800);
  });

  it("sin símbolo, elige el mayor", () => {
    expect(parse("2 cafés 8").amountCents).toBe(800);
  });

  it("no confunde el día de una fecha con el monto", () => {
    const r = parse("cena 30 el 3 de octubre");
    expect(r.amountCents).toBe(3000);
    expect(r.date).toBe("2026-10-03");
  });

  it("no confunde 'hace 2 días' con el monto", () => {
    const r = parse("taxi 9 hace 2 días");
    expect(r.amountCents).toBe(900);
    expect(r.date).toBe("2026-10-23");
  });
});

describe("parseExpense: fecha", () => {
  it.each([
    ["comida 12", "2026-10-25"],
    ["comida 12 hoy", "2026-10-25"],
    ["comida 12 ayer", "2026-10-24"],
    ["uber 15 anteayer", "2026-10-23"],
    ["cine con amigos 20.000 ante ayer", "2026-10-23"],
    ["lunch 12 yesterday", "2026-10-24"],
    ["súper 45,50 el viernes pasado", "2026-10-23"],
    ["groceries 45.50 last friday", "2026-10-23"],
    ["renta 800 15/10", "2026-10-15"],
    ["taxi 3 5 days ago", "2026-10-20"],
  ])("%s → %s", (text, date) => {
    expect(parse(text).date).toBe(date);
  });

  it("un día de la semana sin 'pasado' se interpreta en el pasado", () => {
    // 21 de octubre de 2026 es miércoles: "viernes" = 16 de octubre.
    const wednesday = new Date(2026, 9, 21, 12);
    expect(parseExpense("cine 9 viernes", categories, wednesday).date).toBe(
      "2026-10-16",
    );
  });

  it("una fecha futura sin año es del año anterior", () => {
    expect(parse("cena 40 el 3 de diciembre").date).toBe("2025-12-03");
  });
});

describe("parseExpense: categoría y nota", () => {
  it.each([
    ["comida 12 ayer", "comida"],
    ["Uber 15", "transporte"],
    ["almuerzo con Ana 18", "comida"],
    ["cafés 6", "cafe"],
    ["cafe 3", "cafe"],
    ["supermercado 80", "super"],
    ["netflix 12", "ocio"],
    ["tacos 9", "comida"],
  ])("%s → %s", (text, categoryId) => {
    expect(parse(text).categoryId).toBe(categoryId);
  });

  it("sin coincidencia devuelve null", () => {
    expect(parse("zapatos 60").categoryId).toBeNull();
  });

  it("la nota es el texto sin monto ni fecha", () => {
    expect(parse("almuerzo con Ana 18 ayer").note).toBe("Almuerzo con Ana");
    expect(parse("súper 45,50 el viernes pasado").note).toBe("Súper");
    expect(parse("cena 30€ el 3 de octubre").note).toBe("Cena");
    expect(parse("$12").note).toBe("");
  });
});

describe("parseExpense: inglés", () => {
  it.each([
    ["lunch 12k", 1_200_000],
    ["concert 2 thousand", 200_000],
    ["car 3 grand", 300_000],
    ["rent 1.5 million", 150_000_000],
    ["laptop 2 millions", 200_000_000],
    ["groceries 1,234.56", 123_456],
    ["coffee 4.50", 450],
  ])("%s → %i centavos", (text, cents) => {
    expect(parse(text).amountCents).toBe(cents);
  });

  it.each([
    ["dinner 30 dollars", "USD"],
    ["taxi 20 bucks", "USD"],
    ["book 10 pounds", "GBP"],
    ["hotel 80 euros", "EUR"],
    ["lunch 12", null],
  ])("moneda: %s → %s", (text, currency) => {
    expect(parse(text).currency).toBe(currency);
  });

  it("la moneda y el multiplicador no quedan en la nota", () => {
    expect(parse("taxi 20 bucks yesterday").note).toBe("Taxi");
    expect(parse("concert 2 thousand").note).toBe("Concert");
  });
});

describe("parseExpense: categoría aprendida del historial", () => {
  // De la más reciente a la más antigua, como las devuelve la base.
  const entries: HistoryEntry[] = [
    { note: "Tinto", categoryId: "cafe" },
    { note: "Sushi con Ana", categoryId: "comida" },
    { note: "Regalo para Ana", categoryId: "ocio" },
    { note: "Peajes", categoryId: "transporte" },
    { note: "Uber al aeropuerto", categoryId: "casa" },
    { note: "D1", categoryId: "super" },
    { note: "Tinto", categoryId: "comida" },
    { note: "Zapatos", categoryId: "borrada" },
  ];
  const history = learnCategories(entries);
  const parseWith = (text: string) =>
    parseExpense(text, categories, NOW, history).categoryId;

  it.each([
    ["tinto 3 mil", "cafe"],
    ["sushi 40 mil", "comida"],
    ["d1 25 mil", "super"],
    ["peaje 12 mil", "transporte"],
    ["peajes de la semana 30 mil", "transporte"],
  ])("%s → %s", (text, categoryId) => {
    expect(parseWith(text)).toBe(categoryId);
  });

  it("la nota idéntica respeta la corrección del usuario", () => {
    expect(parseWith("uber al aeropuerto 50 mil")).toBe("casa");
  });

  it("las palabras clave ganan a una palabra suelta del historial", () => {
    expect(parseWith("uber 15")).toBe("transporte");
  });

  it("una palabra repartida entre categorías no decide", () => {
    expect(parseWith("ana 20")).toBeNull();
  });

  it("ignora categorías que ya no existen", () => {
    expect(parseWith("zapatos 60")).toBeNull();
  });

  it("sin historial se comporta como antes", () => {
    expect(parse("tinto 3 mil").categoryId).toBeNull();
  });
});

describe("learnCategories", () => {
  it("en un empate gana la más reciente", () => {
    const history = learnCategories([
      { note: "Tinto", categoryId: "cafe" },
      { note: "Tinto", categoryId: "comida" },
    ]);
    expect(history.notes.tinto).toBe("cafe");
  });

  it("gana la categoría más usada", () => {
    const history = learnCategories([
      { note: "Tinto", categoryId: "cafe" },
      { note: "Tinto", categoryId: "comida" },
      { note: "Tinto", categoryId: "comida" },
    ]);
    expect(history.notes.tinto).toBe("comida");
  });

  it("no aprende palabras vacías, números ni notas vacías", () => {
    const history = learnCategories([
      { note: "Almuerzo de la 2", categoryId: "comida" },
      { note: "", categoryId: "ocio" },
    ]);
    expect(Object.keys(history.words).sort()).toEqual(["almuerzo"]);
    expect(Object.keys(history.notes)).toEqual(["almuerzo de la 2"]);
  });
});
