// Palabras clave de categorías: sugerencias según el nombre (pensadas para
// Colombia) y detección de palabras repetidas entre categorías.

// `names`: palabras del nombre de la categoría que activan el tema.
// `keywords`: lo que se sugiere. Una sola palabra cada una, porque el
// parser compara palabra por palabra.
const TOPICS: { names: string[]; keywords: string[] }[] = [
  {
    names: ["comida", "restaurante", "alimentacion", "almuerzo", "domicilio"],
    keywords: [
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
  },
  {
    names: ["super", "supermercado", "mercado", "despensa", "viveres"],
    keywords: [
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
  },
  {
    names: ["cafe", "cafeteria", "panaderia"],
    keywords: [
      "tinto",
      "cafe",
      "starbucks",
      "valdez",
      "oma",
      "panaderia",
      "pan",
    ],
  },
  {
    names: ["transporte", "movilidad", "carro", "moto", "vehiculo"],
    keywords: [
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
  },
  {
    names: ["casa", "hogar", "vivienda", "arriendo", "alquiler", "servicio"],
    keywords: [
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
  },
  {
    names: ["ocio", "entretenimiento", "diversion", "salida", "suscripcion"],
    keywords: [
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
  },
  {
    names: ["compra", "shopping", "ropa", "tienda"],
    keywords: [
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
  },
  {
    names: ["salud", "medico", "farmacia", "drogueria", "medicina"],
    keywords: [
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
  },
  {
    names: ["mascota", "perro", "gato", "veterinario"],
    keywords: [
      "veterinario",
      "croquetas",
      "concentrado",
      "arena",
      "vacuna",
      "guarderia",
    ],
  },
  {
    names: ["educacion", "estudio", "universidad", "colegio", "curso"],
    keywords: [
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
  },
  {
    names: ["sueldo", "salario", "nomina", "ingreso", "trabajo"],
    keywords: [
      "sueldo",
      "salario",
      "nomina",
      "quincena",
      "prima",
      "honorarios",
      "pago",
    ],
  },
  {
    names: ["deuda", "tarjeta", "credito", "prestamo", "banco"],
    keywords: ["tarjeta", "cuota", "credito", "prestamo", "intereses", "banco"],
  },
  {
    names: ["viaje", "vacacion", "turismo"],
    keywords: [
      "vuelo",
      "hotel",
      "airbnb",
      "avianca",
      "latam",
      "tiquete",
      "maleta",
    ],
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
    for (const keyword of topic.keywords) {
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
