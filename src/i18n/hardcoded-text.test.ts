import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";

// Los textos de la interfaz viven en los diccionarios. Este test busca
// texto en español escrito a mano en pantallas y componentes: acentos,
// eñes o «¿¡» fuera de los comentarios.

const ROOT = join(__dirname, "..");
const SCANNED = ["app", "components"];
const SKIPPED = [
  "components/ui/", // shadcn, sin textos propios
  // Fase 2 (formatos): cabeceras y valores del CSV.
  "app/[lang]/(app)/settings/export/route.ts",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

function withoutComments(code: string) {
  return code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // {/* JSX */}
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

describe("textos de la interfaz", () => {
  it("no quedan textos en español fuera de los diccionarios", () => {
    const offenders = SCANNED.flatMap((dir) => sourceFiles(join(ROOT, dir)))
      .filter(
        (file) => !SKIPPED.some((s) => relative(ROOT, file).startsWith(s)),
      )
      .flatMap((file) =>
        withoutComments(readFileSync(file, "utf8"))
          .split("\n")
          .filter((line) => /[áéíóúñÁÉÍÓÚÑ¿¡«»]/.test(line))
          .map((line) => `${relative(ROOT, file)}: ${line.trim()}`),
      );
    expect(offenders).toEqual([]);
  });

  it("inglés y español tienen las mismas claves", () => {
    const keys = (value: object, prefix = ""): string[] =>
      Object.entries(value).flatMap(([key, v]) =>
        v && typeof v === "object"
          ? keys(v, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      );
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });
});
