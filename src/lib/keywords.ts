// Palabras clave de categorías: sugerencias según el nombre y el idioma de
// la app, y detección de palabras repetidas entre categorías.

import type { Locale } from "@/i18n/config";

// `names`: palabras del nombre de la categoría (en cualquiera de los dos
// idiomas) que activan el tema.
// `keywords`: lo que se sugiere, por idioma de la app (en español, pensado
// para Colombia). Una sola palabra cada una, porque el
// parser compara palabra por palabra.
const TOPICS: {
  names: string[];
  keywords: Record<Locale, string[]>;
}[] = [
  {
    names: [
      "comida",
      "restaurante",
      "alimentacion",
      "almuerzo",
      "domicilio",
      "food",
      "restaurant",
      "restaurants",
      "dining",
      "lunch",
      "takeout",
    ],
    keywords: {
      es: [
        "almuerzo",
        "cena",
        "desayuno",
        "restaurante",
        "domicilio",
        "rappi",
        "corrientazo",
        "hamburguesa",
        "pizza",
        "empanada",
        "arepa",
      ],
      en: [
        "lunch",
        "dinner",
        "breakfast",
        "restaurant",
        "takeout",
        "delivery",
        "doordash",
        "ubereats",
        "pizza",
        "burger",
      ],
    },
  },
  {
    names: [
      "super",
      "supermercado",
      "mercado",
      "despensa",
      "viveres",
      "grocery",
      "groceries",
      "supermarket",
      "market",
    ],
    keywords: {
      es: [
        "mercado",
        "exito",
        "carulla",
        "d1",
        "ara",
        "olimpica",
        "jumbo",
        "tienda",
        "fruver",
        "plaza",
      ],
      en: [
        "groceries",
        "supermarket",
        "walmart",
        "costco",
        "target",
        "market",
        "grocery",
      ],
    },
  },
  {
    names: ["cafe", "cafeteria", "panaderia", "coffee", "bakery"],
    keywords: {
      es: ["tinto", "cafe", "starbucks", "valdez", "oma", "panaderia", "pan"],
      en: ["coffee", "starbucks", "latte", "bakery", "bagel"],
    },
  },
  {
    names: [
      "transporte",
      "movilidad",
      "carro",
      "moto",
      "vehiculo",
      "transport",
      "transportation",
      "car",
      "commute",
      "vehicle",
    ],
    keywords: {
      es: [
        "uber",
        "didi",
        "taxi",
        "cabify",
        "indriver",
        "sitp",
        "transmilenio",
        "metro",
        "bus",
        "gasolina",
        "peaje",
        "parqueadero",
      ],
      en: [
        "uber",
        "lyft",
        "taxi",
        "bus",
        "subway",
        "train",
        "gas",
        "fuel",
        "parking",
        "toll",
      ],
    },
  },
  {
    names: [
      "casa",
      "hogar",
      "vivienda",
      "arriendo",
      "alquiler",
      "servicio",
      "home",
      "house",
      "housing",
      "rent",
      "utilities",
      "bills",
    ],
    keywords: {
      es: [
        "arriendo",
        "administracion",
        "luz",
        "agua",
        "gas",
        "internet",
        "epm",
        "enel",
        "vanti",
        "claro",
        "movistar",
        "tigo",
      ],
      en: [
        "rent",
        "mortgage",
        "electricity",
        "water",
        "gas",
        "internet",
        "phone",
        "utilities",
      ],
    },
  },
  {
    names: [
      "ocio",
      "entretenimiento",
      "diversion",
      "salida",
      "suscripcion",
      "fun",
      "entertainment",
      "leisure",
      "subscriptions",
      "going",
    ],
    keywords: {
      es: [
        "cine",
        "netflix",
        "spotify",
        "disney",
        "hbo",
        "prime",
        "rumba",
        "concierto",
        "bar",
        "steam",
      ],
      en: [
        "movies",
        "netflix",
        "spotify",
        "disney",
        "hbo",
        "prime",
        "concert",
        "bar",
        "games",
        "steam",
      ],
    },
  },
  {
    names: [
      "compra",
      "shopping",
      "ropa",
      "tienda",
      "clothes",
      "clothing",
      "store",
    ],
    keywords: {
      es: [
        "ropa",
        "zapatos",
        "falabella",
        "amazon",
        "mercadolibre",
        "temu",
        "shein",
        "zara",
        "regalo",
      ],
      en: ["clothes", "shoes", "amazon", "target", "zara", "gift", "online"],
    },
  },
  {
    names: [
      "salud",
      "medico",
      "farmacia",
      "drogueria",
      "medicina",
      "health",
      "medical",
      "doctor",
      "pharmacy",
      "medicine",
    ],
    keywords: {
      es: [
        "drogueria",
        "farmacia",
        "eps",
        "medico",
        "cita",
        "odontologo",
        "examen",
        "gimnasio",
        "smartfit",
        "bodytech",
      ],
      en: [
        "pharmacy",
        "doctor",
        "dentist",
        "checkup",
        "medicine",
        "gym",
        "insurance",
      ],
    },
  },
  {
    names: [
      "mascota",
      "perro",
      "gato",
      "veterinario",
      "pet",
      "pets",
      "dog",
      "cat",
      "vet",
    ],
    keywords: {
      es: [
        "veterinario",
        "croquetas",
        "concentrado",
        "arena",
        "vacuna",
        "guarderia",
      ],
      en: ["vet", "petfood", "grooming", "litter", "vaccine", "daycare"],
    },
  },
  {
    names: [
      "educacion",
      "estudio",
      "universidad",
      "colegio",
      "curso",
      "education",
      "school",
      "college",
      "university",
      "course",
      "courses",
    ],
    keywords: {
      es: [
        "matricula",
        "pension",
        "libros",
        "curso",
        "platzi",
        "udemy",
        "universidad",
        "colegio",
        "utiles",
      ],
      en: [
        "tuition",
        "books",
        "course",
        "udemy",
        "coursera",
        "school",
        "supplies",
      ],
    },
  },
  {
    names: [
      "sueldo",
      "salario",
      "nomina",
      "ingreso",
      "trabajo",
      "salary",
      "income",
      "paycheck",
      "work",
      "job",
    ],
    keywords: {
      es: [
        "sueldo",
        "salario",
        "nomina",
        "quincena",
        "prima",
        "honorarios",
        "pago",
      ],
      en: ["salary", "paycheck", "payroll", "bonus", "freelance", "invoice"],
    },
  },
  {
    names: [
      "deuda",
      "tarjeta",
      "credito",
      "prestamo",
      "banco",
      "debt",
      "card",
      "credit",
      "loan",
      "bank",
    ],
    keywords: {
      es: ["tarjeta", "cuota", "credito", "prestamo", "intereses", "banco"],
      en: ["card", "payment", "credit", "loan", "interest", "bank"],
    },
  },
  {
    names: [
      "viaje",
      "vacacion",
      "turismo",
      "travel",
      "trip",
      "vacation",
      "holiday",
    ],
    keywords: {
      es: ["vuelo", "hotel", "airbnb", "avianca", "latam", "tiquete", "maleta"],
      en: ["flight", "hotel", "airbnb", "tickets", "luggage", "rental"],
    },
  },
];

/** Para comparar: minúsculas, sin tildes ni espacios sobrantes. */
export function normalizeKeyword(word: string) {
  return word.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Palabras sugeridas para una categoría según su nombre ("Transporte" →
 * uber, didi…), sin las que ya tiene (`current`) ni las de otras
 * categorías (`taken`), para no crear conflictos.
 */
export function suggestKeywords(
  name: string,
  current: string[],
  locale: Locale,
  taken: ReadonlySet<string> = new Set(),
  max = 8,
): string[] {
  const nameWords = normalizeKeyword(name)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean)
    .flatMap(forms);
  const have = new Set(current.map(normalizeKeyword));
  const result: string[] = [];
  for (const topic of TOPICS) {
    if (!topic.names.some((n) => nameWords.includes(n))) continue;
    for (const keyword of topic.keywords[locale]) {
      if (have.has(keyword) || taken.has(keyword) || result.includes(keyword))
        continue;
      result.push(keyword);
    }
  }
  return result.slice(0, max);
}

/** "uber, Taxi ,, metro" → ["uber", "taxi", "metro"] (cada una ≤ 30). */
export function parseKeywords(text: string): string[] {
  return text
    .split(",")
    .map((k) => k.trim().toLowerCase().slice(0, 30))
    .filter(Boolean);
}

// Plurales simples: servicios → servicio, vacaciones → vacacion.
function forms(word: string) {
  return [word, word.replace(/s$/, ""), word.replace(/es$/, "")];
}
