// Fuente de verdad de los textos. es.ts debe tener exactamente las mismas
// claves (lo comprueba el tipo Dictionary). Las frases con variables o
// plurales serán funciones.

export const en = {
  nav: {
    label: "Sections",
    home: "Home",
    transactions: "Transactions",
    categories: "Categories",
  },
  common: {
    settings: "Settings",
  },
};

export type Dictionary = typeof en;
