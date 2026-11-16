// Los retos del multijugador, uno a uno: la temporada abre con el talent show y cada reto de la sala se puede jugar
// de principio a fin con la interfaz de siempre (sin servidor: BroadcastChannel).
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-mp-retos.mjs [http://localhost:4173/]
import { chromium } from "playwright";
import { seeded } from "./e2e-util.mjs";

const URL = process.argv[2] || "http://localhost:4173/";
const SOLO = (process.env.RETOS || "talento,talkshow,branding").split(",");
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
await ctx.addInitScript(() => {
  Object.defineProperty(window, "DFTC_NET", { configurable: true, set(v) { this._n = v; if (v) Object.defineProperty(v, "enabled", { value: false, configurable: true }); }, get() { return this._n; } });
});
await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
const errors = [];
const p = await ctx.newPage();
await seeded(p);
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(new globalThis.URL("clasico.html?mpserver=", URL).href);
await p.waitForTimeout(1500);
for (let i = 0; i < 2; i++) { await p.evaluate(() => document.querySelector("#btn-mp").click()); await p.waitForTimeout(900); }
const sid = await p.evaluate(() => {
  const a = typeof window.allSeasons === "function" ? window.allSeasons() : window.allSeasons;
  return (Array.isArray(a) ? a : Object.values(a)).map((s) => s.id).find((id) => window.Story.mp.formato(id) === "normal" && window.seasonById(id).cast.length >= 8);
});
await p.evaluate((sid) => window.__mpRoom.create("Ana", sid, "rapido", { fmt: "normal", ia: false }), sid);
const cast = await p.evaluate(() => window.seasonById(window.__mpRoom.state.season).cast);
await p.evaluate((q) => window.__mpRoom.pick(q), cast[0]);
await p.waitForTimeout(800);
await p.evaluate(() => window.__mpRoom.start());
await p.waitForTimeout(1500);
const st = await p.evaluate(() => ({ plan: (window.__mpRoom.state.plan || []).map((x) => x.tipo), retos: window.Story.mp.retos().map((r) => r.tipo) }));
const abre = st.plan[0] === "talento" && st.plan.filter((t) => t === "talento").length === 1;
// Cada reto, jugado con clics hasta que devuelve la nota
const notas = {};
for (const tipo of SOLO) {
  await p.evaluate((tipo) => {
    window.__nota = null;
    const el = document.querySelector("#story-body") || document.querySelector(".screen.active");
    const r = window.Story.mp.retos().find((x) => x.tipo === tipo);
    window.Story.mp.play(tipo, r.titulo, el, (n) => (window.__nota = n));
  }, tipo);
  for (let i = 0; i < 400; i++) {
    const n = await p.evaluate(() => {
      if (window.__nota != null) return window.__nota;
      const b = [...document.querySelectorAll(".screen.active .dc-opt:not(.picked):not(.dim), .screen.active [data-o], .screen.active .btn-primary, .screen.active #story-go, .screen.active #story-next")].find((x) => x.offsetParent && !x.disabled);
      if (b) b.click();
      return null;
    });
    if (n != null) { notas[tipo] = n; break; }
    await p.waitForTimeout(60);
  }
  if (notas[tipo] == null) console.log(`  ${tipo}: ` + (await p.evaluate(() => (document.querySelector('.screen.active')?.id || '') + ' | ' + (document.querySelector('.screen.active')?.innerText || '').replace(/\s+/g, ' ').slice(0, 400) + ' | ' + [...document.querySelectorAll('.screen.active button')].filter((x) => x.offsetParent).map((x) => x.id + '.' + x.className).join(' , '))));
}
await browser.close();
const faltan = ["talento", "talkshow", "branding"].filter((t) => !st.retos.includes(t));
console.log(`Retos de la sala: ${st.retos.length} · abre con talent show: ${abre ? "sí" : "no"} (plan: ${st.plan.join(", ")}) · notas: ${SOLO.map((t) => `${t} ${notas[t] ?? "sin acabar"}`).join(", ")} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(abre && !faltan.length && SOLO.every((t) => typeof notas[t] === "number") && !errors.length ? 0 : 1);
