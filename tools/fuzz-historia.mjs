// Busca atascos en el modo historia: juega temporadas enteras con varias semillas y, si la pantalla no cambia
// durante un rato, dice en cuál se ha quedado (texto y botones a la vista).
//   npm run build && npm run preview   (en otra terminal)
//   SEEDS=1,2,3 FR=0 SE=0 SCORE=60 node tools/fuzz-historia.mjs [http://localhost:4173/]
import { chromium } from "playwright";
import { seeded, deadline } from "./e2e-util.mjs";

const URL = process.argv[2] || "http://localhost:4173/";
const SEEDS = (process.env.SEEDS || "1,2,3").split(",").map(Number);
const FR = Number(process.env.FR || 0), SE = process.env.SE || "0", SCORE = process.env.SCORE || "60", MIN = Number(process.env.MIN || 12);
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let bad = 0;
for (const seed of SEEDS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await seeded(ctx, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const cons = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") { cons.push(m.text().slice(0, 200)); if (cons.length > 12) cons.shift(); } });
  await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
  await page.goto(new globalThis.URL("clasico.html", URL).href);
  await page.waitForTimeout(600);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("dftc-story-wins", JSON.stringify(["es1", "es2", "es3", "es4", "es5", "es6", "esas1", "esas2"]));
    // Para el All Winners hace falta haber ganado con alguna reina
    try { const C = {}; TEMPORADAS_ES.filter((t) => t.cast && t.cast.length > 3).slice(0, 3).forEach((t) => (C[t.id] = { queen: t.cast[t.cast.length - 1], runner: t.cast[t.cast.length - 2] })); localStorage.setItem("dftc-story-crowns", JSON.stringify(C)); } catch { /* sin datos */ }
  });
  await page.reload();
  await page.waitForTimeout(600);
  await page.click("#btn-story");
  await page.locator(".franchise-card").nth(FR).click();
  if (/^\d+$/.test(SE)) await page.locator(".season-card").nth(Number(SE)).click(); else await page.locator(".season-card", { hasText: SE }).click();
  // DUO=1/0 antes de empezar: la final (y si la corona es doble) se decide al empezar la temporada
  await page.evaluate((duo) => { if (duo) window.__pjDuo = duo === "1"; }, process.env.DUO || "");
  if (await page.locator(".cc-q").first().isVisible().catch(() => false)) {
    await page.locator(".cc-q").first().click();
    if (await page.locator("#cc-me").isVisible().catch(() => false)) await page.locator("#cc-me").click();
    await page.locator("#cc-rnd").click();
    if (await page.locator("#cc-ok").isVisible().catch(() => false)) await page.locator("#cc-ok").click();
  }
  else if (/Winners/.test(SE)) await page.locator("#queen-grid > *:not(.locked)").first().click();
  else await page.locator("#queen-grid > *").nth(seed % 5).click();
  await page.evaluate(([sc, duo]) => { if (sc !== "libre") window.__forceScore = Number(sc); if (duo) window.__pjDuo = duo === "1"; }, [SCORE, process.env.DUO || ""]); // DUO=1/0: fuerza la corona doble o individual en parejas
  if (await page.locator("#btn-start").isVisible().catch(() => false)) await page.click("#btn-start");
  const time = deadline(MIN);
  let last = "", since = Date.now(), end = false, stuck = null, lentos = 0;
  while (time() && !end) {
    await page.waitForTimeout(40);
    const st = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const sig = (document.querySelector(".screen.active")?.id || "") + "|" + (document.querySelector(".screen.active")?.innerText || "").slice(0, 1500);
      if (q(".story-card.end #story-share")) return { end: true, sig };
      if (q("#story-skip")) { q("#story-skip").click(); return { sig }; }
      const cp = q("#rw-cp");
      if (cp && !cp.value) { cp.value = "Una sirena en una red de pesca de lujo"; cp.form.requestSubmit(); return { sig }; }
      // Retos escritos: casi siempre con opciones; si toca escribir, una frase cualquiera
      if (q("#ia-classic")) { q("#ia-classic").click(); return { sig }; }
      const lv = q("#lv-in, .ft-form input, .story-card textarea");
      if (lv && !lv.value) { lv.value = "Vengo de un pueblo tan pequeño que el semáforo era yo con un abanico"; (lv.form || lv.closest("form"))?.requestSubmit(); return { sig }; }
      const gg = q("#gg-n"); if (gg && !gg.value) { const n = q("[data-n]"); if (n) { n.click(); return { sig }; } }
      const nx = q("#ls-next");
      if (nx && !nx.disabled) { nx.click(); return { sig }; }
      const falta = q(".ls-sel li:not(.ok)");
      if (falta) { falta.click(); q("#ls-loan").click(); return { sig }; }
      if (q("#screen-game.active") && window.Game && Game._debug) { Game._debug().win(); return { sig }; }
      const mem = [...document.querySelectorAll(".mem-card:not(.open):not(.done)")];
      if (mem.length) { mem[Math.floor(Math.random() * mem.length)].click(); return { sig }; }
      for (const s of ["#lf-classic", "#dr-go", "#story-ls", "#rw-done", "#ut-skip", ".dlg-choices button[data-k]", ".dlg", ".siren-card #story-go", "#story-go", "#story-next", "#track-next", "#hub-skip", "[data-o]", "[data-st]", "[data-p]", ".dc-opt:not(.picked):not(.dim)", ".es-opt", "#pa-go", ".mq-c", ".sg-opt", ".rw-opt", "[data-j]", "[data-qa]", "#lv-done", "#mini-btn.go", "#pz-btn", ".bl-pad"]) {
        const e = q(s);
        if (e) { e.click(); return { sig }; }
      }
      const b = [...document.querySelectorAll(".story-card .btn-primary, .mg .btn-primary")].find((x) => x.offsetParent && !x.disabled);
      if (b) { b.click(); return { sig }; }
      // Lo que quede por pulsar en la pantalla (menos la barra de arriba)
      const any = [...document.querySelectorAll(".screen.active button")].filter((x) => x.offsetParent && !x.disabled && !x.closest(".hud, .story-hud") && !/hud-btn|dlg-skip/.test(x.className));
      if (any.length) any[Math.floor(Math.random() * any.length)].click();
      return { sig };
    });
    if (st.end) { end = true; break; }
    if (st.sig !== last) { last = st.sig; since = Date.now(); }
    else if (Date.now() - since > 45000) {
      // Antes de darlo por atasco: ¿va lento el equipo? (una cadena de 30 temporizadores de 50 ms debería tardar 1,5 s)
      const ms = await page.evaluate(() => new Promise((res) => { const t0 = performance.now(); let n = 0; const f = () => (++n < 30 ? setTimeout(f, 50) : res(Math.round(performance.now() - t0))); f(); }));
      await page.waitForTimeout(30000);
      const now = await page.evaluate(() => (document.querySelector(".screen.active")?.id || "") + "|" + (document.querySelector(".screen.active")?.innerText || "").slice(0, 1500));
      if (now !== st.sig) { lentos++; since = Date.now(); last = now; continue; }
      if (ms > 6000) { lentos++; since = Date.now(); continue; }
      stuck = st.sig; break;
    }
  }
  const info = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("dftc-story-save") || "null"); return d ? `ep ${d.ep} · quedan ${d.rivals.length} · fuera ${d.meOut ? "sí" : "no"} · reto ${(d.phase || {}).stage || "-"}` : "sin partida"; });
  if (stuck || errors.length || !end) {
    bad++;
    console.log(`✖ semilla ${seed}: ${stuck ? "ATASCO" : end ? "errores" : "sin acabar a tiempo"} · ${info}`);
    if (stuck || !end) {
      console.log("  pantalla: " + (stuck || last).replace(/\s+/g, " ").slice(0, 700));
      console.log("  botones: " + (await page.evaluate(() => [...document.querySelectorAll(".screen.active button, .screen.active [data-k], .screen.active input")].filter((x) => x.offsetParent).map((x) => `${x.tagName.toLowerCase()}${x.id ? "#" + x.id : ""}.${x.className}${x.disabled ? "[disabled]" : ""}`).slice(0, 25).join(" | "))));
      cons.forEach((c) => console.log("  consola: " + c));
      await page.screenshot({ path: `${process.env.OUT || "."}/fuzz-${FR}-${SE}-${seed}.png` }).catch(() => {});
    }
    errors.slice(0, 5).forEach((e) => console.log("  ✖ " + e));
  } else {
    // TABLA=1: enseña cómo queda la clasificación final (puesto, reina y última casilla)
    if (process.env.TABLA) console.log(await page.evaluate(() => { const b = JSON.parse(localStorage.getItem("dftc-story-board") || "[]")[0]; const c = JSON.parse(localStorage.getItem("dftc-story-crowns") || "{}"); return (b && b.trackData ? b.trackData.rows.slice(0, 5).map((r) => `  ${r.place} ${r.name} · ${(r.cells[r.cells.length - 1] || {}).t || "-"}`).join("\n") : "  sin tabla") + "\n  coronas: " + JSON.stringify(c[b && b.season] || null) + " · All Winners: " + allSeasons().find((x) => x.id === "esaw").cast.length + " reinas"; }));
    console.log(`✔ semilla ${seed}${lentos ? ` (${lentos} pantallas lentas: más de 45 s sin cambiar)` : ""}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
