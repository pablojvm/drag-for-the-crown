// Une las partes de js/historia/ en js/historia.js (el archivo que carga el juego).
// Uso: node tools/build-historia.mjs   (o con --check para comprobar que está al día)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "js", "historia");
const out = join(root, "js", "historia.js");
const HEADER = "// ARCHIVO GENERADO: edita las partes de js/historia/ y ejecuta `node tools/build-historia.mjs`.\n";

const parts = readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
const code = HEADER + parts.map((f) => readFileSync(join(dir, f), "utf8")).join("");

if (process.argv.includes("--check")) {
  const cur = readFileSync(out, "utf8");
  if (cur !== code) { console.error("js/historia.js no está al día: ejecuta node tools/build-historia.mjs"); process.exit(1); }
  console.log("js/historia.js al día ✔");
} else {
  writeFileSync(out, code);
  console.log(`js/historia.js generado a partir de ${parts.length} partes (${code.split("\n").length} líneas)`);
}
