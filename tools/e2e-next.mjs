// Prueba del motor nuevo (Phaser 4 + React): carga, menú, eliges reina, juegas el arcade un rato
// (moviéndote y lanzando tacones) y comprueba que el marcador cambia y no hay errores.
//   node tools/e2e-next.mjs [http://localhost:4173/] [carpeta-capturas]
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4173/";
const SHOTS = process.argv[3] || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.goto(new URL("next.html", BASE).href);
await page.waitForSelector(".nx-queens button", { timeout: 30000 });
await page.waitForTimeout(1200);
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-menu.png` });
await page.locator(".nx-queens button").nth(4).click();
await page.click(".nx-btn");
await page.waitForSelector(".nx-hud", { timeout: 10000 });
await page.waitForTimeout(1500);
// Jugar 12 segundos: moverse a izquierda y derecha lanzando tacones
await page.keyboard.down("Space");
for (let i = 0; i < 12; i++) {
  if (i === 4 && SHOTS) await page.screenshot({ path: `${SHOTS}/next-hud.png` });
  await page.keyboard.down(i % 2 ? "ArrowLeft" : "ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up(i % 2 ? "ArrowLeft" : "ArrowRight");
  await page.waitForTimeout(500);
}
await page.keyboard.up("Space");
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-arcade.png` });
const score = await page.evaluate(() => window.__dftcNext.getState().score);
const onScreen = await page.evaluate(() => !!document.querySelector(".nx-hud, .nx-panel"));
// Pausa (si sigue jugando) o resultado (si la han eliminado): las dos dejan la capa oscura
if (await page.$(".nx-hud")) await page.keyboard.press("p");
await page.waitForTimeout(300);
const paused = await page.evaluate(() => !!document.querySelector(".nx-dim"));
await browser.close();
const ok = score > 0 && onScreen && paused && !errors.length;
console.log(`Motor nuevo · puntos tras jugar: ${score} · pausa o resultado: ${paused ? "sí" : "no"} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
