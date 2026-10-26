// Genera los iconos PNG de la PWA en public/icons: "S" con halo dorado
// sobre un degradado violeta diagonal.
// Uso: npm run icons
import { writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

// #6a60d6 arriba a la izquierda → #2b2470 abajo a la derecha.
const BACKGROUND = "linear-gradient(135deg, #6a60d6 0%, #2b2470 100%)";
const HALO = "#ffd27a";

// maskable: Android recorta el icono (círculo, squircle…), así que el
// dibujo se reduce para quedar dentro de la "zona segura" central (~80 %).
function icon(size, { maskable = false, rounded = true } = {}) {
  const scale = maskable ? 0.72 : 1;
  const unit = (n) => n * (size / 220) * scale;
  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          borderRadius: rounded && !maskable ? size * 0.22 : 0,
        },
      },
      // Halo
      h("div", {
        style: {
          display: "flex",
          width: unit(110),
          height: unit(34),
          borderRadius: unit(55),
          border: `${unit(9)}px solid ${HALO}`,
          marginBottom: unit(12),
        },
      }),
      h(
        "div",
        {
          style: {
            display: "flex",
            color: "white",
            fontSize: unit(130),
            lineHeight: 1,
          },
        },
        "S",
      ),
    ),
    { width: size, height: size },
  );
}

const outputs = [
  ["icon-192.png", icon(192)],
  ["icon-512.png", icon(512)],
  ["icon-maskable-512.png", icon(512, { maskable: true })],
  // iOS redondea por su cuenta y no admite transparencia: cuadrado completo.
  ["apple-touch-icon.png", icon(180, { rounded: false })],
];

for (const [name, response] of outputs) {
  await writeFile(
    new URL(`../public/icons/${name}`, import.meta.url),
    Buffer.from(await response.arrayBuffer()),
  );
  console.log("✓", name);
}
