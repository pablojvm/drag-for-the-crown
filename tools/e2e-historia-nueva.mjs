// El modo historia desde la portada nueva: se abre el de siempre en un marco, sin pasar por el menú clásico,
// se empieza una temporada (Javis, maletas) y al salir se vuelve a la portada nueva.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-historia-nueva.mjs [http://localhost:4173/]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const SHOT = process.env.SHOT || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 820 } });
await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
const errors = [];
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const fail = async (m) => { console.error("FALLA EN:", m, errors); if (SHOT) await page.screenshot({ path: `${SHOT}/hn-fallo.png` }); await browser.close(); process.exit(1); };
await page.goto(URL);
await page.waitForSelector(".nx-mode.s-story", { timeout: 30000 });
for (let i = 0; i < 6 && !(await page.$(".nx-historia")); i++) { await page.click(".nx-mode.s-story .ms-cta").catch(() => {}); await page.waitForTimeout(600); }
if (!(await page.$(".nx-historia"))) await fail("abrir el modo historia");
await page.waitForSelector(".nx-historia iframe.on", { timeout: 30000 }).catch(() => fail("cargar la historia"));
const f = page.frameLocator(".nx-historia iframe");
const fr = page.frames().find((x) => x.url().includes("clasico.html"));
fr.on?.("pageerror", (e) => errors.push(e.message));
// Directo a elegir franquicia: el menú clásico no se ve
if (await fr.evaluate(() => document.querySelector("#screen-menu.active") !== null)) await fail("se ve el menú clásico");
await f.locator("#franchise-grid > *").first().click();
await page.waitForTimeout(500);
await f.locator("#season-grid > *:not([disabled]):not(.locked)").first().click();
await page.waitForTimeout(500);
await f.locator("#queen-grid > *").first().click();
await page.waitForTimeout(300);
const startBtn = f.locator("#btn-start");
if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
// Llaman los Javis
await f.locator("#story-body").waitFor({ timeout: 15000 }).catch(() => fail("empezar la temporada"));
let javis = false;
for (let i = 0; i < 40; i++) {
  const t = await f.locator("#screen-story").innerText().catch(() => "");
  if (/Javis/.test(t)) { javis = true; break; }
  await page.waitForTimeout(250);
}
if (SHOT) await page.screenshot({ path: `${SHOT}/hn-javis.png` });
if (!javis) await fail("la llamada de los Javis");
// Salir: vuelve a la portada nueva
await f.locator("#story-exit").click();
await page.waitForSelector(".nx-historia", { state: "detached", timeout: 10000 }).catch(() => fail("volver a la portada"));
await page.waitForSelector(".nx-mode.s-story", { timeout: 10000 }).catch(() => fail("ver la portada"));
const seguir = await page.$(".nx-mode.s-story .ms-cta.alt");
await browser.close();
if (errors.length) { console.error("Errores en la página:", errors); process.exit(1); }
console.log("OK modo historia en la portada nueva", seguir ? "(con «Seguir mi temporada»)" : "");
