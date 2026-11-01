// Emojis para categorías: grupos curados para finanzas personales (los
// nombres de los grupos, por idioma, en los diccionarios: emoji.groups),
// sugerencia según el nombre y validación de "un solo emoji".

export const EMOJI_GROUPS = [
  {
    id: "food",
    emojis: [
      "🍔",
      "🍕",
      "🌮",
      "🍣",
      "🥗",
      "☕",
      "🍺",
      "🍷",
      "🧁",
      "🥐",
      "🍦",
      "🥑",
      "🛒",
      "🍽️",
    ],
  },
  {
    id: "transport",
    emojis: [
      "🚗",
      "🚕",
      "🚌",
      "🚇",
      "🛵",
      "🚲",
      "⛽",
      "🅿️",
      "✈️",
      "🚆",
      "🔩",
      "🧳",
      "🗺️",
      "🚢",
    ],
  },
  {
    id: "home",
    emojis: [
      "🏠",
      "💡",
      "💧",
      "🔥",
      "📶",
      "📱",
      "🧹",
      "🛋️",
      "🔧",
      "🧺",
      "🪴",
      "🏢",
      "🔑",
      "📦",
    ],
  },
  {
    id: "shopping",
    emojis: [
      "🛍️",
      "👕",
      "👟",
      "👗",
      "💄",
      "🎁",
      "💻",
      "🎧",
      "📚",
      "⌚",
      "🕶️",
      "🧸",
      "🛠️",
      "✏️",
    ],
  },
  {
    id: "fun",
    emojis: [
      "🎮",
      "🎬",
      "🎵",
      "🎉",
      "⚽",
      "🎨",
      "🎭",
      "🏖️",
      "🍿",
      "🎟️",
      "📺",
      "🎲",
      "🏕️",
      "🎤",
    ],
  },
  {
    id: "health",
    emojis: [
      "💊",
      "🏥",
      "🦷",
      "🏋️",
      "🧘",
      "💇",
      "💅",
      "👓",
      "🐶",
      "🐱",
      "👶",
      "🧴",
      "🩺",
      "❤️",
    ],
  },
  {
    id: "money",
    emojis: [
      "💰",
      "💵",
      "💳",
      "🏦",
      "📈",
      "💼",
      "🧾",
      "🪙",
      "💸",
      "🎓",
      "🛡️",
      "📄",
      "🤝",
      "💎",
    ],
  },
] as const;

/** Si no se elige ninguno ni hay sugerencia. */
export const DEFAULT_EMOJI = "🏷️";

// Palabras (en minúsculas y sin tildes, en español e inglés) que sugieren
// cada emoji. El orden
// importa: gana el primero que coincida.
const SUGGESTIONS: [emoji: string, words: string[]][] = [
  [
    "🐶",
    [
      "mascota",
      "perro",
      "veterinario",
      "veterinaria",
      "croqueta",
      "pet",
      "pets",
      "dog",
      "vet",
      "petfood",
    ],
  ],
  ["🐱", ["gato", "cat"]],
  [
    "👶",
    [
      "bebe",
      "hijo",
      "hija",
      "nino",
      "nina",
      "guarderia",
      "panal",
      "baby",
      "kid",
      "kids",
      "child",
      "daycare",
      "diaper",
    ],
  ],
  ["🍕", ["pizza"]],
  ["☕", ["cafe", "cafeteria", "coffee", "latte"]],
  [
    "🍺",
    [
      "cerveza",
      "bar",
      "trago",
      "licor",
      "rumba",
      "beer",
      "drink",
      "drinks",
      "pub",
      "liquor",
    ],
  ],
  [
    "🛒",
    [
      "mercado",
      "supermercado",
      "super",
      "despensa",
      "viveres",
      "grocery",
      "groceries",
      "supermarket",
      "market",
    ],
  ],
  [
    "🍔",
    [
      "comida",
      "restaurante",
      "almuerzo",
      "cena",
      "desayuno",
      "domicilio",
      "hamburguesa",
      "food",
      "restaurant",
      "lunch",
      "dinner",
      "breakfast",
      "takeout",
      "delivery",
      "burger",
    ],
  ],
  ["⛽", ["gasolina", "combustible", "tanqueo", "fuel", "gasoline"]],
  ["🅿️", ["parqueadero", "parking", "estacionamiento", "peaje", "toll"]],
  ["🚕", ["taxi", "uber", "didi", "cabify", "lyft", "cab", "rideshare"]],
  [
    "🚌",
    [
      "bus",
      "transmilenio",
      "metro",
      "pasaje",
      "sitp",
      "subway",
      "train",
      "transit",
      "fare",
    ],
  ],
  [
    "🚗",
    [
      "carro",
      "auto",
      "coche",
      "vehiculo",
      "transporte",
      "moto",
      "car",
      "vehicle",
      "transport",
      "transportation",
      "motorcycle",
    ],
  ],
  [
    "✈️",
    [
      "viaje",
      "vuelo",
      "vacacion",
      "turismo",
      "hotel",
      "travel",
      "trip",
      "flight",
      "vacation",
      "holiday",
    ],
  ],
  [
    "💡",
    [
      "luz",
      "energia",
      "electricidad",
      "servicio",
      "electricity",
      "power",
      "utilities",
      "utility",
      "energy",
    ],
  ],
  ["💧", ["agua", "acueducto", "water"]],
  ["🔥", ["gas"]],
  ["📶", ["internet", "wifi", "broadband"]],
  [
    "📱",
    ["celular", "telefono", "movil", "plan", "phone", "mobile", "cellphone"],
  ],
  ["🧹", ["aseo", "limpieza", "empleada", "cleaning", "housekeeping"]],
  [
    "🔧",
    [
      "reparacion",
      "mantenimiento",
      "arreglo",
      "repair",
      "repairs",
      "maintenance",
    ],
  ],
  [
    "🏠",
    [
      "casa",
      "hogar",
      "arriendo",
      "alquiler",
      "renta",
      "vivienda",
      "administracion",
      "home",
      "house",
      "rent",
      "housing",
      "mortgage",
    ],
  ],
  ["👕", ["ropa", "vestuario", "clothes", "clothing", "apparel"]],
  ["👟", ["zapato", "calzado", "tenis", "shoes", "sneakers"]],
  [
    "💄",
    ["maquillaje", "belleza", "cosmetico", "makeup", "beauty", "cosmetics"],
  ],
  [
    "🎁",
    [
      "regalo",
      "cumpleanos",
      "navidad",
      "gift",
      "gifts",
      "birthday",
      "christmas",
    ],
  ],
  [
    "💻",
    [
      "tecnologia",
      "computador",
      "electronica",
      "software",
      "tech",
      "technology",
      "computer",
      "electronics",
    ],
  ],
  [
    "🎓",
    [
      "universidad",
      "colegio",
      "matricula",
      "educacion",
      "curso",
      "estudio",
      "school",
      "college",
      "university",
      "tuition",
      "education",
      "course",
    ],
  ],
  ["📚", ["libro", "libreria", "book", "books", "bookstore"]],
  ["🛍️", ["compra", "shopping", "tienda", "store"]],
  [
    "📺",
    [
      "netflix",
      "streaming",
      "suscripcion",
      "television",
      "disney",
      "hbo",
      "subscription",
      "subscriptions",
      "tv",
    ],
  ],
  ["🎵", ["musica", "spotify", "concierto", "music", "concert", "concerts"]],
  ["🎬", ["cine", "pelicula", "movies", "movie", "cinema"]],
  [
    "🎉",
    [
      "fiesta",
      "salida",
      "evento",
      "party",
      "parties",
      "event",
      "events",
      "nightlife",
    ],
  ],
  [
    "⚽",
    ["deporte", "futbol", "partido", "sport", "sports", "soccer", "football"],
  ],
  ["🏋️", ["gimnasio", "gym", "entrenamiento", "fitness", "workout"]],
  [
    "🎮",
    [
      "ocio",
      "juego",
      "videojuego",
      "entretenimiento",
      "fun",
      "games",
      "gaming",
      "entertainment",
      "leisure",
    ],
  ],
  ["🦷", ["dentista", "odontologo", "odontologia", "dentist", "dental"]],
  [
    "🏥",
    [
      "medico",
      "doctor",
      "hospital",
      "clinica",
      "eps",
      "cita",
      "clinic",
      "medical",
    ],
  ],
  [
    "💊",
    [
      "salud",
      "farmacia",
      "drogueria",
      "medicina",
      "medicamento",
      "health",
      "pharmacy",
      "medicine",
      "drugstore",
    ],
  ],
  ["💇", ["peluqueria", "barberia", "corte", "haircut", "barber", "salon"]],
  ["🛡️", ["seguro", "poliza", "insurance"]],
  [
    "🧾",
    [
      "impuesto",
      "factura",
      "recibo",
      "dian",
      "tax",
      "taxes",
      "bill",
      "bills",
      "invoice",
    ],
  ],
  [
    "💳",
    [
      "tarjeta",
      "credito",
      "deuda",
      "prestamo",
      "cuota",
      "card",
      "credit",
      "debt",
      "loan",
      "installment",
    ],
  ],
  ["🏦", ["banco", "cuenta", "bank", "account"]],
  [
    "📈",
    [
      "inversion",
      "accion",
      "cripto",
      "investment",
      "investments",
      "stocks",
      "crypto",
    ],
  ],
  ["💰", ["ahorro", "savings", "saving"]],
  [
    "💵",
    [
      "sueldo",
      "salario",
      "nomina",
      "ingreso",
      "pago",
      "salary",
      "paycheck",
      "payroll",
      "wage",
      "income",
    ],
  ],
  [
    "💼",
    [
      "trabajo",
      "freelance",
      "negocio",
      "oficina",
      "cliente",
      "work",
      "job",
      "business",
      "office",
      "client",
    ],
  ],
  ["🤝", ["donacion", "caridad", "diezmo", "donation", "donations", "charity"]],
];

/** "Mascotas" → "🐶"; null si ninguna palabra coincide. */
export function suggestEmoji(name: string): string | null {
  const words = normalize(name)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
  for (const word of words) {
    const wordForms = forms(word);
    for (const [emoji, keys] of SUGGESTIONS) {
      if (keys.some((key) => wordForms.includes(key))) return emoji;
    }
  }
  return null;
}

const graphemes = new Intl.Segmenter("es", { granularity: "grapheme" });
// Pictogramas, banderas (indicadores regionales) y teclas como 1️⃣.
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;

/** Exactamente un emoji (incluye 👩‍👧, 🇨🇴 o 👍🏽, que son uno solo). */
export function isSingleEmoji(text: string) {
  const value = text.trim();
  const segments = [...graphemes.segment(value)];
  return segments.length === 1 && EMOJI_RE.test(value);
}

// Plurales simples: mascotas → mascota, servicios → servicio, vacaciones → vacacion.
function forms(word: string) {
  return [word, word.replace(/s$/, ""), word.replace(/es$/, "")];
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
