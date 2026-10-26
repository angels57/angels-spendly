// Genera los iconos PNG de la PWA en public/icons.
// Uso: node scripts/generate-icons.mjs
import { writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const CORAL = "#f05b53";

// maskable: Android recorta el icono (círculo, squircle…), así que el logo
// va dentro de la "zona segura" central (~80 %).
function icon(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : size * 0.22;
  const fontSize = size * (maskable ? 0.42 : 0.56);
  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CORAL,
          borderRadius: radius,
          color: "white",
          fontSize,
          fontWeight: 800,
          letterSpacing: -fontSize * 0.04,
        },
      },
      "M",
    ),
    { width: size, height: size },
  );
}

const outputs = [
  ["icon-192.png", icon(192)],
  ["icon-512.png", icon(512)],
  ["icon-maskable-512.png", icon(512, { maskable: true })],
  // iOS ignora la transparencia: cuadrado completo, él redondea.
  ["apple-touch-icon.png", icon(180, { maskable: true })],
];

for (const [name, response] of outputs) {
  await writeFile(
    new URL(`../public/icons/${name}`, import.meta.url),
    Buffer.from(await response.arrayBuffer()),
  );
  console.log("✓", name);
}
