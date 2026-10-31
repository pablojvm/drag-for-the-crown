// Prueba en navegador del modo temporada del motor nuevo: una temporada entera, de elegir reina a la corona.
// Uso: node tools/e2e-temporada.mjs http://localhost:4173/ [carpeta-capturas]
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4173/";
const SHOTS = process.argv[3] || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
await page.goto(new URL("next.html", BASE).href);
await page.waitForSelector(".nx-queens button", { timeout: 30000 });
await page.evaluate(() => { localStorage.removeItem("dftc-next-temporada"); window.__dftcTemporada.timing.next = 60; });
await page.getByRole("button", { name: /Modo temporada/ }).click();
await page.locator(".nx-ts-season").first().click();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/ts-reina.png` });
await page.getByRole("button", { name: "Empezar la temporada" }).click();

const seen = new Set();
let resumed = false;
for (let i = 0; i < 1500; i++) {
  const st = await page.evaluate(() => { const s = window.__dftcTemporada.current(); return s ? { phase: s.phase, ep: s.ep } : null; });
  if (st) {
    if (!seen.has(st.phase) && SHOTS) await page.screenshot({ path: `${SHOTS}/ts-${st.phase}.png` });
    seen.add(st.phase);
    if (st.phase === "fin") break;
    // A mitad de temporada se recarga la página para comprobar que la partida se guarda y se retoma
    if (!resumed && st.ep === 2 && st.phase === "anuncio") {
      resumed = true;
      await page.reload();
      await page.waitForSelector(".nx-queens button", { timeout: 30000 });
      await page.evaluate(() => { window.__dftcTemporada.timing.next = 60; });
      await page.getByRole("button", { name: "Seguir la temporada" }).click();
      continue;
    }
  }
  const clicked = await page.evaluate(() => {
    // Para llegar a la final, la prueba gana siempre sus lip syncs
    const store = window.__dftcNext, ls = store.getState().ls;
    if (ls && ls.done && ls.mine < ls.rival + 1 && store.getState().back) store.setState({ ls: { ...ls, mine: ls.rival + 1 } });
    const vis = (e) => e && e.offsetParent !== null && !e.disabled;
    const q = (s) => [...document.querySelectorAll(s)].find(vis);
    const concept = document.querySelector("#nx-concept");
    if (concept && !concept.value) return "concept";
    const b = q(".nx-maxi .nx-opt") || q(".nx-ls-panel .nx-panel.small .nx-btn") || q(".nx-ls-opts .nx-opt") || q(".nx-ts-panel > .nx-btn, .nx-ts-panel .nx-row .nx-btn:not(.ghost)");
    if (b) { b.click(); return "ok"; }
    return "";
  });
  if (clicked === "concept") { await page.fill("#nx-concept", "Una reina de la verbena"); await page.keyboard.press("Enter"); }
  await page.waitForTimeout(clicked ? 120 : 200);
}
const end = await page.evaluate(() => { const s = window.__dftcTemporada.current(); return s && { phase: s.phase, place: s.place, ep: s.ep, track: (s.track.me || []).join(" ") }; });
if (SHOTS) await page.screenshot({ path: `${SHOTS}/ts-fin.png` });
await browser.close();
const ok = end && end.phase === "fin" && end.place >= 1 && end.place <= 2 && resumed && seen.has("reto") && seen.has("final") && seen.has("resultados") && !errors.length;
console.log(`Temporada · fases: ${[...seen].join(", ")} · puesto: ${end ? end.place : "no"} · episodios: ${end ? end.ep : 0} · tu track: ${end ? end.track : ""} · retomada: ${resumed ? "sí" : "no"} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
