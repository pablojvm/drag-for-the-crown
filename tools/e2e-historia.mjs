// Prueba de un capítulo entero del modo historia: maletas, reto, pasarela, críticas, veredicto y lip sync,
// hasta que el capítulo 1 queda apuntado en el track record (con etiquetas válidas). Requiere Playwright:
//   npx playwright install chromium   (la primera vez)
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-historia.mjs [http://localhost:4173/]
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

const VALID = /^(WIN|TOP2|BTOP|HIGH|SAFE|LOW|BTM2|BTM3|ELIM|BWIN)$/;
let looks = 0, done = null;
for (let i = 0; i < 9000 && !done; i++) {
  await page.waitForTimeout(40);
  done = await page.evaluate(() => {
    try {
      const d = JSON.parse(localStorage.getItem("dftc-story-save") || "null");
      if (!d || d.ep < 2) return null;
      const labs = Object.values(d.track || {}).map((t) => t[1]).filter(Boolean);
      return labs.length ? labs : null;
    } catch { return null; }
  });
  const r = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nx = q("#ls-next");
    if (nx && !nx.disabled) { nx.click(); return "look"; }
    const falta = q(".ls-sel li:not(.ok)");
    if (falta) { falta.click(); q("#ls-loan").click(); return ""; }
    if (document.querySelector("#screen-game.active") && window.Game && Game._debug) { Game._debug().win(); return ""; }
    const mem = [...document.querySelectorAll(".mem-card:not(.open):not(.done)")];
    if (mem.length) { mem[Math.floor(Math.random() * mem.length)].click(); return ""; }
    for (const s of ["#dr-go", "#story-ls", "#rw-done", "#ut-skip", ".dlg-choices button[data-k]", ".dlg", ".siren-card #story-go", "#story-go", "#story-next", "#track-next", "#hub-skip", "[data-o]", "[data-st]", "[data-p]", ".dc-opt:not(.picked):not(.dim)", ".es-opt", "#pa-go", ".mq-c", ".sg-opt", ".rw-opt", "#rw-done", "#lv-done", "#mini-btn.go", "#pz-btn", ".bl-pad"]) {
      const e = q(s);
      if (e) { e.click(); return ""; }
    }
    const b = [...document.querySelectorAll(".story-card .btn-primary, .mg .btn-primary")].find((x) => x.offsetParent && !x.disabled);
    if (b) b.click();
    return "";
  });
  if (r === "look") looks++;
  if (process.env.SHOTS && i % 600 === 0) await page.screenshot({ path: `/tmp/eh-${i}.png` });
}
await browser.close();
const labs = done || [];
const bad = labs.filter((l) => !VALID.test(l));
const ok = looks > 0 && labs.length > 3 && labs.filter((l) => /^(WIN|TOP2)$/.test(l)).length >= 1 && !bad.length && !errors.length;
console.log(`Looks: ${looks} · capítulo 1 en el track record: ${labs.length ? labs.join(" ") : "no"} · etiquetas raras: ${bad.length} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
