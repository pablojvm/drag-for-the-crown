// El modo historia son trozos de un mismo módulo (00 lo abre y 09 lo cierra): se revisa unido, como lo monta Vite.
import { readFileSync, readdirSync } from "node:fs";
import { ESLint } from "eslint";

const dir = "js/historia";
const files = readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
let code = "", map = [];
for (const f of files) {
  const src = readFileSync(`${dir}/${f}`, "utf8");
  map.push({ f, from: code.split("\n").length, lines: src.split("\n").length });
  code += src + "\n";
}
const eslint = new ESLint();
const [res] = await eslint.lintText(code, { filePath: "js/legacy-historia.js" });
const where = (line) => { const m = map.filter((x) => x.from <= line).at(-1); return `${m.f}:${line - m.from + 1}`; };
for (const m of res.messages) console.log(`${where(m.line)}  ${m.severity === 2 ? "error" : "aviso"}  ${m.message}  (${m.ruleId || "sintaxis"})`);
console.log(`${res.errorCount} errores, ${res.warningCount} avisos en el modo historia`);
process.exit(res.errorCount ? 1 : 0);
