// Prueba de humo: abre el juego, empieza una temporada, prepara los looks y llega a la primera pasarela
// sin errores; además corre el simulador de equilibrio. Requiere Playwright:
//   npx playwright install chromium   (la primera vez)
//   npm run build && npm run preview   (en otra terminal)
//   node tools/smoke-test.mjs [http://localhost:8000]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// Sin servidor ni IA: la prueba juega siempre igual (en CI hay claves de Supabase y la IA cambiaría los retos)
await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
await page.goto(URL);
await page.waitForTimeout(800);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(800);
await page.click("#btn-story");
await page.locator(".franchise-card").nth(0).click();
await page.locator(".season-card").first().click();
await page.locator("#queen-grid > *").nth(0).click();
await page.click("#btn-start");

let looks = 0, review = false;
for (let i = 0; i < 5000 && !review; i++) {
  await page.waitForTimeout(40);
  review = !!(await page.$(".at-edit"));
  const r = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nx = q("#ls-next");
    if (nx && !nx.disabled) { nx.click(); return "look"; }
    const falta = q(".ls-sel li:not(.ok)");
    if (falta) { falta.click(); q("#ls-loan").click(); return ""; }
    if (document.querySelector("#screen-game.active") && window.Game && Game._debug) { Game._debug().win(); return ""; }
    const mem = [...document.querySelectorAll(".mem-card:not(.open):not(.done)")];
    if (mem.length) { mem[Math.floor(Math.random() * mem.length)].click(); return ""; }
    for (const s of [".dlg-choices button[data-k]", ".dlg", ".siren-card #story-go", "#story-go", "#story-next", "#track-next", "#hub-skip", "[data-o]", "[data-st]", "[data-p]", ".dc-opt:not(.picked):not(.dim)", ".es-opt", "#pa-go", ".mq-c", ".sg-opt", ".rw-opt", "#rw-done", "#lv-done", "#mini-btn.go", "#pz-btn", ".bl-pad"]) {
      const e = q(s);
      if (e) { e.click(); return ""; }
    }
    const b = [...document.querySelectorAll(".story-card .btn-primary, .mg .btn-primary")].find((x) => x.offsetParent && !x.disabled);
    if (b) b.click();
    return "";
  });
  if (r === "look") looks++;
}
const sim = await page.evaluate(() => (window.DFTC_SIM ? Story.simulate("es1", 100).length : 0));
await browser.close();

const ok = looks > 0 && review && sim > 0 && !errors.length;
console.log(`Looks preparados: ${looks} · llega a la pasarela: ${review ? "sí" : "no"} · simulador: ${sim} reinas · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
