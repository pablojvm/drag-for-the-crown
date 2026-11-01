// Prueba en navegador del modo temporada del motor nuevo: una temporada entera, de elegir reina a la corona.
// Uso: node tools/e2e-temporada.mjs http://localhost:4173/ [carpeta-capturas]
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4173/";
const SHOTS = process.argv[3] || "";
const LOSE = !!process.env.LOSE;
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
await page.goto(new URL("./", BASE).href);
await page.waitForSelector(".nx-queens button", { timeout: 30000 });
// La prueba fija tu nota de la semana (la mejor, o con LOSE=1 la peor) para que el recorrido no dependa del azar
// Los minijuegos se juegan de verdad en la primera temporada (TS=0); en las demás se dan por jugados, para ir más rápido
const AUTO = !!process.env.TS && process.env.TS !== "0";
const setTiming = () => page.evaluate(([lose, auto]) => { const t = window.__dftcTemporada.timing; t.next = 60; t.myScore = lose ? 1 : 99; t.autoGame = auto ? 70 : null; }, [LOSE, AUTO]);
await page.evaluate(() => { localStorage.removeItem("dftc-next-temporada"); localStorage.removeItem("dftc-closet"); localStorage.removeItem("dftc-story-board"); localStorage.removeItem("dftc-achievements"); });
await setTiming();
// AI=1: con un jurado de prueba en lugar del servidor (retos escritos en directo, pasarela con concepto y críticas)
const AI = !!process.env.AI;
const fakeJury = () => page.evaluate(() => {
  window.__dftcNextAsk = async (system) => {
    if (/guionista de los retos/.test(system)) { window.__aiRetos = (window.__aiRetos || 0) + 1; const paso = { q: "Supremme entra en el taller sin avisar", opciones: [{ t: "Le hago una reverencia de diva", calidad: "buena", attr: "carisma" }, { t: "Sigo a lo mío", calidad: "regular" }, { t: "Se me cae todo al suelo", calidad: "mala" }] }; return { pasos: [paso, paso, paso, paso] }; }
    if (/coreógrafa/.test(system)) return { entrada: ["Salgo despacio", "Paso firme", "Bailando"], detalle: ["Giro", "Peluca", "Abanico"], final: ["Pose", "Guiño", "Drama"], pregunta: "¿Por qué ese tejido?", respuestas: [{ t: "Porque cae como el agua", calidad: "buena" }, { t: "Me gusta", calidad: "regular" }, { t: "No sé", calidad: "mala" }] };
    if (/valorando una pasarela/.test(system)) return { concepto: 80, coherencia: 80, desfile: 80, supreme: "Muy bien", ana: "Bien construido" };
    if (/Das críticas/.test(system)) return { supreme: "Me has hecho reír", ana: "La construcción, impecable" };
    if (/Hablas SOLO como/.test(system)) { window.__chats = (window.__chats || 0) + 1; return { respuesta: "Ay, qué bien me caes. Vamos a por todas.", relacion: 1 }; }
    return null;
  };
});
if (AI) await fakeJury();
await page.getByRole("button", { name: /Modo historia/ }).click();
// TS=número de temporada en la lista (0 = la primera); TS=all no hace falta: el CI prueba varias
// CUSTOM=1: el All Stars a tu gusto (reparto al azar)
if (process.env.CUSTOM) {
  await page.locator(".nx-ts-season", { hasText: "All Stars a tu gusto" }).click();
  await page.getByRole("button", { name: /Al azar/ }).click();
  await page.getByRole("button", { name: "Seguir" }).click();
} else await page.locator(".nx-ts-season").nth(Number(process.env.TS || 0)).click();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/ts-reina.png` });
await page.getByRole("button", { name: "Empezar la temporada" }).click();

const seen = new Set();
let resumed = false;
for (let i = 0; i < 4000; i++) {
  const st = await page.evaluate(() => { const s = window.__dftcTemporada.current(); return s ? { phase: s.phase, ep: s.ep } : null; });
  if (st) {
    if (!seen.has(st.phase) && SHOTS) await page.screenshot({ path: `${SHOTS}/ts-${st.phase}.png` });
    seen.add(st.phase);
    if (st.phase === "fin") break;
    // A mitad de temporada se recarga la página para comprobar que la partida se guarda y se retoma
    if (!resumed && st.ep === 2 && (st.phase === "anuncio" || st.phase === "fuera")) {
      resumed = true;
      await page.reload();
      await page.waitForSelector(".nx-queens button", { timeout: 30000 });
      await setTiming();
      if (AI) await fakeJury();
      await page.getByRole("button", { name: "Seguir mi temporada" }).click();
      continue;
    }
  }
  if (SHOTS) {
    const d = await page.evaluate(() => (document.querySelector(".nx-dlg-choices") ? "choices" : document.querySelector(".nx-dlg.fixed") ? "charla" : document.querySelector(".nx-dlg") ? "dlg" : ""));
    if (d && !seen.has("shot-" + d)) { seen.add("shot-" + d); await page.waitForTimeout(700); await page.screenshot({ path: `${SHOTS}/ts-${d}.png` }); }
  }
  const clicked = await page.evaluate((lose) => {
    // Para llegar a la final, la prueba gana siempre sus lip syncs (con LOSE=1 los pierde y sigue la temporada desde casa)
    const store = window.__dftcNext, ls = store.getState().ls;
    if (ls && ls.done && store.getState().back) {
      if (lose && ls.mine >= ls.rival) store.setState({ ls: { ...ls, mine: 0 } });
      if (!lose && ls.mine < ls.rival + 1) store.setState({ ls: { ...ls, mine: ls.rival + 1 } });
    }
    const vis = (e) => e && e.offsetParent !== null && !e.disabled;
    const q = (s) => [...document.querySelectorAll(s)].find(vis);
    const concept = document.querySelector("#nx-concept");
    if (concept && !concept.value) return "concept";
    // Charla libre (con el jurado de prueba): una frase y se termina
    const ft = document.querySelector("#nx-ft");
    if (ft && !ft.disabled && !window.__said) { window.__said = true; return "chat"; }
    const endChat = [...document.querySelectorAll(".nx-btn.ghost")].find((b) => /Terminar la conversación/.test(b.textContent));
    if (endChat && window.__said) { window.__said = false; endChat.click(); return "ok"; }
    // Conversaciones: se elige la primera respuesta o se salta lo que queda
    const choice = q(".nx-dlg-choices button");
    if (choice) { choice.click(); return "dlg"; }
    const skip = q(".nx-dlg-skip");
    if (skip) { skip.click(); return "dlg"; }
    const face = q(".nx-face");
    if (face && window.__dftcNextAsk && !window.__facedEp?.[document.querySelector(".nx-ts-head span")?.textContent]) { window.__facedEp = { ...(window.__facedEp || {}), [document.querySelector(".nx-ts-head span")?.textContent]: 1 }; face.click(); return "ok"; }
    // Minijuegos: se pulsa sin parar (terminan solos)
    const hit = q("[data-game-hit]");
    if (hit) { hit.click(); return "ok"; }
    const lane = [...document.querySelectorAll("[data-game-lane]")];
    if (lane.length) { lane[Math.floor(Math.random() * 4)].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); return "ok"; }
    const shopItem = q(".nx-item.shop");
    if (shopItem) { shopItem.click(); return "ok"; }
    const b = q(".nx-maxi .nx-opt") || q(".nx-ls-panel .nx-panel.small .nx-btn") || q(".nx-ls-opts .nx-opt") || q(".nx-ts-panel .nx-maxi-opts .nx-opt") || q(".nx-ts-panel > .nx-btn, .nx-ts-panel .nx-row .nx-btn:not(.ghost)");
    if (b) { b.click(); return "ok"; }
    return "";
  }, LOSE);
  if (clicked === "concept") { await page.fill("#nx-concept", "Una reina de la verbena"); await page.keyboard.press("Enter"); }
  if (clicked === "chat") { await page.fill("#nx-ft", "Hoy estás guapísima, de verdad"); await page.keyboard.press("Enter"); await page.waitForTimeout(150); }
  await page.waitForTimeout(clicked ? 120 : 200);
}
const aiRetos = AI ? await page.evaluate(() => window.__aiRetos || 0) : null;
const chats = AI ? await page.evaluate(() => window.__chats || 0) : null;
const board = await page.evaluate(() => JSON.parse(localStorage.getItem("dftc-story-board") || "[]").length);
const logros = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("dftc-achievements") || "{}")).length);
const end = await page.evaluate(() => { const s = window.__dftcTemporada.current(); return s && { phase: s.phase, place: s.place, ep: s.ep, track: (s.track.me || []).join(" ") }; });
if (SHOTS) await page.screenshot({ path: `${SHOTS}/ts-fin.png` });
await browser.close();
const ok = end && end.phase === "fin" && end.place >= 1 && (LOSE ? end.place > 2 && seen.has("fuera") : end.place <= 2 && seen.has("untucked")) && (!AI || (aiRetos > 0 && chats > 0)) && board > 0 && logros > 0 && resumed && seen.has("reto") && (AUTO || seen.has("mini")) && seen.has("taller") && seen.has("probador") && seen.has("final") && (LOSE || seen.has("lalaparuza")) && (process.env.TS === "8" || seen.has("reencuentro")) && seen.has("resultados") && !errors.length;
console.log(`Temporada ${process.env.TS || 0} · fases: ${[...seen].join(", ")} · puesto: ${end ? end.place : "no"} · episodios: ${end ? end.ep : 0} · tu track: ${end ? end.track : ""} · Hall of Fame: ${board} · logros: ${logros} · retomada: ${resumed ? "sí" : "no"}${AI ? ` · retos escritos en directo: ${aiRetos} · charlas libres: ${chats}` : ""} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
