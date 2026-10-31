// Prueba del motor nuevo (Phaser 4 + React): carga, menú, eliges reina, juegas el arcade un rato
// (moviéndote, lanzando tacones y usando el poder) y juega un lip sync y una pasarela enteros. Falla si hay errores.
//   node tools/e2e-next.mjs [http://localhost:4173/] [carpeta-capturas]
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4173/";
const SHOTS = process.argv[3] || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
// Sin servidor: la pasarela sale clásica (la de concepto se prueba luego con un jurado de prueba)
await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
await page.goto(new URL("next.html", BASE).href);
await page.waitForSelector(".nx-queens button", { timeout: 30000 });
await page.waitForTimeout(1200);
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-menu.png` });
await page.locator(".nx-queens button").nth(4).click();
await page.click(".nx-btn");
await page.waitForSelector(".nx-hud", { timeout: 10000 });
await page.waitForTimeout(1500);
// Jugar 12 segundos: moverse a izquierda y derecha lanzando tacones
let powered = null;
await page.keyboard.down("Space");
for (let i = 0; i < 12; i++) {
  if (i === 2) {
    // Con la barra llena, E lanza el poder de la reina (Plastique: triple tacón)
    await page.evaluate(() => window.__dftcNext.setState({ special: 1 }));
    await page.keyboard.press("e");
    await page.waitForTimeout(200);
    powered = await page.evaluate(() => window.__dftcNext.getState().activePower);
  }
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
// Volver al menú y jugar un lip sync entero (seis movimientos)
await page.getByRole("button", { name: "Menú" }).click();
await page.waitForSelector(".nx-queens button", { timeout: 10000 });
await page.getByRole("button", { name: /Lip sync/ }).click();
await page.waitForSelector(".nx-opt", { timeout: 10000 });
for (let k = 0; k < 6; k++) {
  await page.locator(".nx-opt").nth([1, 2, 1, 2, 0, 1][k]).click();
  await page.waitForTimeout(450);
  if (k === 2 && SHOTS) await page.screenshot({ path: `${SHOTS}/next-lipsync.png` });
}
const lsEnd = (await page.locator(".nx-ls-panel h2").textContent({ timeout: 5000 }).catch(() => "")) || "";
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-lipsync-end.png` });
// Y una pasarela entera (look, paso, momento final y voz en off)
await page.getByRole("button", { name: "Menú" }).click();
await page.waitForSelector(".nx-queens button", { timeout: 10000 });
await page.getByRole("button", { name: /Pasarela/ }).click();
for (let k = 0; k < 4; k++) {
  await page.waitForSelector(".nx-opt", { timeout: 10000 });
  await page.locator(".nx-opt").first().click();
  await page.waitForTimeout(1100);
  if (k === 2 && SHOTS) await page.screenshot({ path: `${SHOTS}/next-runway.png` });
}
const rwScore = (await page.locator(".nx-score").textContent({ timeout: 5000 }).catch(() => "")) || "";
// Y la pasarela con concepto, con un jurado de prueba en lugar del servidor
await page.evaluate(() => {
  window.__dftcNextAsk = async (system) => {
    await new Promise((r) => setTimeout(r, 300));
    if (/coreógrafa/.test(system)) return { entrada: ["Salgo enredada en la red", "Paso firme", "Bailando"], detalle: ["Suelto la red y enseño las escamas", "Giro", "Peluca"], final: ["Pose de sirena varada", "Guiño", "Drama"], pregunta: "¿Por qué esa red?", respuestas: [{ t: "Es nailon reciclado, cae como el agua", calidad: "buena" }, { t: "Me representa", calidad: "regular" }, { t: "Estaba en casa", calidad: "mala" }] };
    return { concepto: 88, coherencia: 84, desfile: 80, supreme: "Has venido a por todas", ana: "La red está muy bien resuelta" };
  };
});
await page.getByRole("button", { name: "Otra pasarela" }).click();
await page.waitForSelector(".nx-opt", { timeout: 10000 });
await page.locator(".nx-opt").first().click();
await page.fill("#nx-concept", "Una sirena atrapada en una red de pesca de lujo");
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-concept.png` });
await page.getByRole("button", { name: "Salir a la pasarela" }).click();
for (let k = 0; k < 4; k++) {
  await page.waitForSelector(".nx-opt", { timeout: 10000 });
  await page.locator(".nx-opt").first().click();
  await page.waitForTimeout(700);
  if (k === 3 && SHOTS) await page.screenshot({ path: `${SHOTS}/next-ana.png` });
}
const ccScore = (await page.locator(".nx-score").textContent({ timeout: 8000 }).catch(() => "")) || "";
const ccJury = await page.locator(".nx-jury").count();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/next-concept-end.png` });
await browser.close();
const ok = score > 0 && onScreen && paused && powered === "triple" && /Shantay|Sashay/.test(lsEnd) && /\/ 100/.test(rwScore) && /\/ 100/.test(ccScore) && ccJury === 2 && !errors.length;
console.log(`Motor nuevo · puntos tras jugar: ${score} · poder: ${powered || "no"} · pausa o resultado: ${paused ? "sí" : "no"} · lip sync: «${lsEnd.trim()}» · pasarela: ${rwScore.trim() || "no"} · con concepto: ${ccScore.trim() || "no"} (${ccJury} frases del jurado) · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
