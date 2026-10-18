// vite.config.ts
import { defineConfig } from "file:///sessions/rcw-01dfruwu7fcbd1gj8xm2czzt/mnt/drag-for-the-crown/node_modules/vite/dist/node/index.js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
var LEGACY = ["reinas", "config", "audio", "extras", "effects", "entities", "game", "ui", "dialogos", "doll", "atelier3d", "ia"];
var HISTORIA_DIR = "js/historia";
var EXPOSE = ["Story", "UI", "IA", "Game", "store", "Closet", "allSeasons", "seasonById", "FRANCHISES", "TEMPORADAS_ES"];
function legacy() {
  const ID = "virtual:legacy";
  const files = () => [
    ...LEGACY.map((n) => `js/${n}.js`),
    ...readdirSync(HISTORIA_DIR).filter((f) => f.endsWith(".js")).sort().map((f) => `${HISTORIA_DIR}/${f}`)
  ];
  return {
    name: "dftc-legacy",
    resolveId: (id) => id === ID ? "\0" + ID : null,
    load(id) {
      if (id !== "\0" + ID) return null;
      const list = files();
      list.forEach((f) => this.addWatchFile(resolve(f)));
      const body = list.map((f) => `// ===== ${f} =====
${readFileSync(f, "utf8")}`).join("\n");
      return `import * as DFTC from "/src/core/index.ts";
window.DFTC = DFTC;
${body}
;${EXPOSE.map((n) => `if (typeof ${n} !== "undefined") window.${n} = ${n};`).join("\n")}
`;
    }
  };
}
function cacheBust() {
  const v = Date.now().toString(36);
  return { name: "dftc-cache-bust", apply: "build", transformIndexHtml: (html) => html.replace(/(href|src)="(\.?\/(?:styles\/style\.css|js\/claves\.js))"/g, `$1="$2?v=${v}"`) };
}
var vite_config_default = defineConfig({
  // GitHub Pages sirve el juego en /drag-for-the-crown/; rutas relativas para que funcione en cualquier sitio
  base: "./",
  plugins: [legacy(), cacheBust()],
  build: { outDir: "dist", sourcemap: true, chunkSizeWarningLimit: 2e3 },
  server: { port: 8e3 },
  test: { include: ["tests/**/*.test.ts"] }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvcmN3LTAxZGZydXd1N2ZjYmQxZ2o4eG0yY3p6dC9tbnQvZHJhZy1mb3ItdGhlLWNyb3duXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvcmN3LTAxZGZydXd1N2ZjYmQxZ2o4eG0yY3p6dC9tbnQvZHJhZy1mb3ItdGhlLWNyb3duL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9yY3ctMDFkZnJ1d3U3ZmNiZDFnajh4bTJjenp0L21udC9kcmFnLWZvci10aGUtY3Jvd24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIHR5cGUgUGx1Z2luIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgcmVhZGRpclN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcblxuLy8gQ1x1MDBGM2RpZ28gaGVyZWRhZG8gKGpzLyk6IHNjcmlwdHMgY2xcdTAwRTFzaWNvcyBxdWUgY29tcGFydGVuIHZhcmlhYmxlcyBnbG9iYWxlcy5cbi8vIFNlIGNvbmNhdGVuYW4gZW4gdW4gXHUwMEZBbmljbyBtXHUwMEYzZHVsbyAoYXNcdTAwRUQgc2lndWVuIHZpXHUwMEU5bmRvc2UgZW50cmUgc1x1MDBFRCksIGNvbiBhY2Nlc28gYWwgblx1MDBGQWNsZW8gZW4gVHlwZVNjcmlwdCAoREZUQykuXG5jb25zdCBMRUdBQ1kgPSBbXCJyZWluYXNcIiwgXCJjb25maWdcIiwgXCJhdWRpb1wiLCBcImV4dHJhc1wiLCBcImVmZmVjdHNcIiwgXCJlbnRpdGllc1wiLCBcImdhbWVcIiwgXCJ1aVwiLCBcImRpYWxvZ29zXCIsIFwiZG9sbFwiLCBcImF0ZWxpZXIzZFwiLCBcImlhXCJdO1xuY29uc3QgSElTVE9SSUFfRElSID0gXCJqcy9oaXN0b3JpYVwiO1xuLy8gTG8gcXVlIHNlIGRlamEgZW4gd2luZG93IHBhcmEgbGEgY29uc29sYSB5IGxhcyBwcnVlYmFzIGF1dG9tXHUwMEUxdGljYXNcbmNvbnN0IEVYUE9TRSA9IFtcIlN0b3J5XCIsIFwiVUlcIiwgXCJJQVwiLCBcIkdhbWVcIiwgXCJzdG9yZVwiLCBcIkNsb3NldFwiLCBcImFsbFNlYXNvbnNcIiwgXCJzZWFzb25CeUlkXCIsIFwiRlJBTkNISVNFU1wiLCBcIlRFTVBPUkFEQVNfRVNcIl07XG5cbmZ1bmN0aW9uIGxlZ2FjeSgpOiBQbHVnaW4ge1xuICBjb25zdCBJRCA9IFwidmlydHVhbDpsZWdhY3lcIjtcbiAgY29uc3QgZmlsZXMgPSAoKSA9PiBbXG4gICAgLi4uTEVHQUNZLm1hcCgobikgPT4gYGpzLyR7bn0uanNgKSxcbiAgICAuLi5yZWFkZGlyU3luYyhISVNUT1JJQV9ESVIpLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5qc1wiKSkuc29ydCgpLm1hcCgoZikgPT4gYCR7SElTVE9SSUFfRElSfS8ke2Z9YCksXG4gIF07XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJkZnRjLWxlZ2FjeVwiLFxuICAgIHJlc29sdmVJZDogKGlkKSA9PiAoaWQgPT09IElEID8gXCJcXDBcIiArIElEIDogbnVsbCksXG4gICAgbG9hZChpZCkge1xuICAgICAgaWYgKGlkICE9PSBcIlxcMFwiICsgSUQpIHJldHVybiBudWxsO1xuICAgICAgY29uc3QgbGlzdCA9IGZpbGVzKCk7XG4gICAgICBsaXN0LmZvckVhY2goKGYpID0+IHRoaXMuYWRkV2F0Y2hGaWxlKHJlc29sdmUoZikpKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBsaXN0Lm1hcCgoZikgPT4gYC8vID09PT09ICR7Zn0gPT09PT1cXG4ke3JlYWRGaWxlU3luYyhmLCBcInV0ZjhcIil9YCkuam9pbihcIlxcblwiKTtcbiAgICAgIHJldHVybiBgaW1wb3J0ICogYXMgREZUQyBmcm9tIFwiL3NyYy9jb3JlL2luZGV4LnRzXCI7XFxud2luZG93LkRGVEMgPSBERlRDO1xcbiR7Ym9keX1cXG47JHtFWFBPU0UubWFwKChuKSA9PiBgaWYgKHR5cGVvZiAke259ICE9PSBcInVuZGVmaW5lZFwiKSB3aW5kb3cuJHtufSA9ICR7bn07YCkuam9pbihcIlxcblwiKX1cXG5gO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIExhIGhvamEgZGUgZXN0aWxvcyB5IGxhcyBjbGF2ZXMgbG9jYWxlcyB2aXZlbiBlbiBwdWJsaWMvOiBlbiBjYWRhIGJ1aWxkIGxsZXZhbiB1bmEgbWFyY2EgcGFyYSBzYWx0YXJzZSBsYSBjYWNoXHUwMEU5XG5mdW5jdGlvbiBjYWNoZUJ1c3QoKTogUGx1Z2luIHtcbiAgY29uc3QgdiA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpO1xuICByZXR1cm4geyBuYW1lOiBcImRmdGMtY2FjaGUtYnVzdFwiLCBhcHBseTogXCJidWlsZFwiLCB0cmFuc2Zvcm1JbmRleEh0bWw6IChodG1sKSA9PiBodG1sLnJlcGxhY2UoLyhocmVmfHNyYyk9XCIoXFwuP1xcLyg/OnN0eWxlc1xcL3N0eWxlXFwuY3NzfGpzXFwvY2xhdmVzXFwuanMpKVwiL2csIGAkMT1cIiQyP3Y9JHt2fVwiYCkgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgLy8gR2l0SHViIFBhZ2VzIHNpcnZlIGVsIGp1ZWdvIGVuIC9kcmFnLWZvci10aGUtY3Jvd24vOyBydXRhcyByZWxhdGl2YXMgcGFyYSBxdWUgZnVuY2lvbmUgZW4gY3VhbHF1aWVyIHNpdGlvXG4gIGJhc2U6IFwiLi9cIixcbiAgcGx1Z2luczogW2xlZ2FjeSgpLCBjYWNoZUJ1c3QoKV0sXG4gIGJ1aWxkOiB7IG91dERpcjogXCJkaXN0XCIsIHNvdXJjZW1hcDogdHJ1ZSwgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDAwIH0sXG4gIHNlcnZlcjogeyBwb3J0OiA4MDAwIH0sXG4gIHRlc3Q6IHsgaW5jbHVkZTogW1widGVzdHMvKiovKi50ZXN0LnRzXCJdIH0sXG59IGFzIGFueSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlXLFNBQVMsb0JBQWlDO0FBQ25aLFNBQVMsY0FBYyxtQkFBbUI7QUFDMUMsU0FBUyxlQUFlO0FBSXhCLElBQU0sU0FBUyxDQUFDLFVBQVUsVUFBVSxTQUFTLFVBQVUsV0FBVyxZQUFZLFFBQVEsTUFBTSxZQUFZLFFBQVEsYUFBYSxJQUFJO0FBQ2pJLElBQU0sZUFBZTtBQUVyQixJQUFNLFNBQVMsQ0FBQyxTQUFTLE1BQU0sTUFBTSxRQUFRLFNBQVMsVUFBVSxjQUFjLGNBQWMsY0FBYyxlQUFlO0FBRXpILFNBQVMsU0FBaUI7QUFDeEIsUUFBTSxLQUFLO0FBQ1gsUUFBTSxRQUFRLE1BQU07QUFBQSxJQUNsQixHQUFHLE9BQU8sSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLEtBQUs7QUFBQSxJQUNqQyxHQUFHLFlBQVksWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFZLElBQUksQ0FBQyxFQUFFO0FBQUEsRUFDeEc7QUFDQSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixXQUFXLENBQUMsT0FBUSxPQUFPLEtBQUssT0FBTyxLQUFLO0FBQUEsSUFDNUMsS0FBSyxJQUFJO0FBQ1AsVUFBSSxPQUFPLE9BQU8sR0FBSSxRQUFPO0FBQzdCLFlBQU0sT0FBTyxNQUFNO0FBQ25CLFdBQUssUUFBUSxDQUFDLE1BQU0sS0FBSyxhQUFhLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDakQsWUFBTSxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sWUFBWSxDQUFDO0FBQUEsRUFBVyxhQUFhLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLElBQUk7QUFDekYsYUFBTztBQUFBO0FBQUEsRUFBcUUsSUFBSTtBQUFBLEdBQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxjQUFjLENBQUMsNEJBQTRCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksQ0FBQztBQUFBO0FBQUEsSUFDNUs7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxTQUFTLFlBQW9CO0FBQzNCLFFBQU0sSUFBSSxLQUFLLElBQUksRUFBRSxTQUFTLEVBQUU7QUFDaEMsU0FBTyxFQUFFLE1BQU0sbUJBQW1CLE9BQU8sU0FBUyxvQkFBb0IsQ0FBQyxTQUFTLEtBQUssUUFBUSw4REFBOEQsWUFBWSxDQUFDLEdBQUcsRUFBRTtBQUMvSztBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUIsTUFBTTtBQUFBLEVBQ04sU0FBUyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7QUFBQSxFQUMvQixPQUFPLEVBQUUsUUFBUSxRQUFRLFdBQVcsTUFBTSx1QkFBdUIsSUFBSztBQUFBLEVBQ3RFLFFBQVEsRUFBRSxNQUFNLElBQUs7QUFBQSxFQUNyQixNQUFNLEVBQUUsU0FBUyxDQUFDLG9CQUFvQixFQUFFO0FBQzFDLENBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
