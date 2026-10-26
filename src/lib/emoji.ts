// Emojis para categorías: grupos curados para finanzas personales,
// sugerencia según el nombre y validación de "un solo emoji".

export const EMOJI_GROUPS = [
  {
    label: "Comida",
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
    label: "Transporte",
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
    label: "Hogar",
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
    label: "Compras",
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
    label: "Ocio",
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
    label: "Salud y cuidado",
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
    label: "Dinero y trabajo",
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

// Palabras (en minúsculas y sin tildes) que sugieren cada emoji. El orden
// importa: gana el primero que coincida.
const SUGGESTIONS: [emoji: string, words: string[]][] = [
  ["🐶", ["mascota", "perro", "veterinario", "veterinaria", "croqueta"]],
  ["🐱", ["gato"]],
  ["👶", ["bebe", "hijo", "hija", "nino", "nina", "guarderia", "panal"]],
  ["🍕", ["pizza"]],
  ["☕", ["cafe", "cafeteria"]],
  ["🍺", ["cerveza", "bar", "trago", "licor", "rumba"]],
  ["🛒", ["mercado", "supermercado", "super", "despensa", "viveres"]],
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
    ],
  ],
  ["⛽", ["gasolina", "combustible", "tanqueo"]],
  ["🅿️", ["parqueadero", "parking", "estacionamiento", "peaje"]],
  ["🚕", ["taxi", "uber", "didi", "cabify"]],
  ["🚌", ["bus", "transmilenio", "metro", "pasaje", "sitp"]],
  ["🚗", ["carro", "auto", "coche", "vehiculo", "transporte", "moto"]],
  ["✈️", ["viaje", "vuelo", "vacacion", "turismo", "hotel"]],
  ["💡", ["luz", "energia", "electricidad", "servicio"]],
  ["💧", ["agua", "acueducto"]],
  ["🔥", ["gas"]],
  ["📶", ["internet", "wifi"]],
  ["📱", ["celular", "telefono", "movil", "plan"]],
  ["🧹", ["aseo", "limpieza", "empleada"]],
  ["🔧", ["reparacion", "mantenimiento", "arreglo"]],
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
    ],
  ],
  ["👕", ["ropa", "vestuario"]],
  ["👟", ["zapato", "calzado", "tenis"]],
  ["💄", ["maquillaje", "belleza", "cosmetico"]],
  ["🎁", ["regalo", "cumpleanos", "navidad"]],
  ["💻", ["tecnologia", "computador", "electronica", "software"]],
  [
    "🎓",
    ["universidad", "colegio", "matricula", "educacion", "curso", "estudio"],
  ],
  ["📚", ["libro", "libreria"]],
  ["🛍️", ["compra", "shopping", "tienda"]],
  [
    "📺",
    ["netflix", "streaming", "suscripcion", "television", "disney", "hbo"],
  ],
  ["🎵", ["musica", "spotify", "concierto"]],
  ["🎬", ["cine", "pelicula"]],
  ["🎉", ["fiesta", "salida", "evento"]],
  ["⚽", ["deporte", "futbol", "partido"]],
  ["🏋️", ["gimnasio", "gym", "entrenamiento"]],
  ["🎮", ["ocio", "juego", "videojuego", "entretenimiento"]],
  ["🦷", ["dentista", "odontologo", "odontologia"]],
  ["🏥", ["medico", "doctor", "hospital", "clinica", "eps", "cita"]],
  ["💊", ["salud", "farmacia", "drogueria", "medicina", "medicamento"]],
  ["💇", ["peluqueria", "barberia", "corte"]],
  ["🛡️", ["seguro", "poliza"]],
  ["🧾", ["impuesto", "factura", "recibo", "dian"]],
  ["💳", ["tarjeta", "credito", "deuda", "prestamo", "cuota"]],
  ["🏦", ["banco", "cuenta"]],
  ["📈", ["inversion", "accion", "cripto"]],
  ["💰", ["ahorro"]],
  ["💵", ["sueldo", "salario", "nomina", "ingreso", "pago"]],
  ["💼", ["trabajo", "freelance", "negocio", "oficina", "cliente"]],
  ["🤝", ["donacion", "caridad", "diezmo"]],
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
