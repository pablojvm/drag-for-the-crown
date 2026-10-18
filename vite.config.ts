import { defineConfig, type Plugin } from "vite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Código heredado (js/): scripts clásicos que comparten variables globales.
// Se concatenan en un único módulo (así siguen viéndose entre sí), con acceso al núcleo en TypeScript (DFTC).
const LEGACY = ["reinas", "config", "audio", "extras", "effects", "entities", "game", "ui", "dialogos", "doll", "atelier3d", "ia"];
const HISTORIA_DIR = "js/historia";
// Lo que se deja en window para la consola y las pruebas automáticas
const EXPOSE = ["Story", "UI", "IA", "Game", "store", "Closet", "allSeasons", "seasonById", "FRANCHISES", "TEMPORADAS_ES", "PORTADAS"];

function legacy(): Plugin {
  const ID = "virtual:legacy";
  const files = () => [
    ...LEGACY.map((n) => `js/${n}.js`),
    ...readdirSync(HISTORIA_DIR).filter((f) => f.endsWith(".js")).sort().map((f) => `${HISTORIA_DIR}/${f}`),
  ];
  return {
    name: "dftc-legacy",
    resolveId: (id) => (id === ID ? "\0" + ID : null),
    load(id) {
      if (id !== "\0" + ID) return null;
      const list = files();
      list.forEach((f) => this.addWatchFile(resolve(f)));
      const body = list.map((f) => `// ===== ${f} =====\n${readFileSync(f, "utf8")}`).join("\n");
      return `import * as DFTC from "/src/core/index.ts";\nwindow.DFTC = DFTC;\n${body}\n;${EXPOSE.map((n) => `if (typeof ${n} !== "undefined") window.${n} = ${n};`).join("\n")}\n`;
    },
  };
}

// La hoja de estilos y las claves locales viven en public/: en cada build llevan una marca para saltarse la caché
function cacheBust(): Plugin {
  const v = Date.now().toString(36);
  return { name: "dftc-cache-bust", apply: "build", transformIndexHtml: (html) => html.replace(/(href|src)="(\.?\/(?:styles\/style\.css|js\/claves\.js))"/g, `$1="$2?v=${v}"`) };
}

export default defineConfig({
  // GitHub Pages sirve el juego en /drag-for-the-crown/; rutas relativas para que funcione en cualquier sitio
  base: "./",
  plugins: [legacy(), cacheBust()],
  build: { outDir: "dist", sourcemap: true, chunkSizeWarningLimit: 2000 },
  server: { port: 8000 },
  test: { include: ["tests/**/*.test.ts"] },
} as any);
