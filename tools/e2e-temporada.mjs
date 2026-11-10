// Temporada entera del modo historia (versión clásica): de la primera semana a la corona, comprobando lo que
// no cubren las demás pruebas: los retos y minirretos nuevos, la tarjeta para compartir y, perdiendo a propósito,
// el botón de saltar al reencuentro.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-temporada.mjs [http://localhost:4173/]
import { chromium } from "playwright";
import { seeded, deadline } from "./e2e-util.mjs";

const URL = process.argv[2] || "http://localhost:4173/";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];

async function season({ lose }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  await seeded(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
  await page.goto(new globalThis.URL("clasico.html", URL).href);
  await page.waitForTimeout(800);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(800);
  await page.click("#btn-story");
  await page.locator(".franchise-card").nth(0).click();
  await page.locator(".season-card").nth(0).click();
  await page.locator("#queen-grid > *").nth(0).click();
  // Ganando: notas altas en todo. Perdiendo: notas bajas y el primer lip sync perdido
  await page.evaluate((lose) => { window.__forceScore = lose ? 5 : 97; if (lose) window.__forceLose = "once"; }, lose);
  await page.click("#btn-start");
  const seen = new Set();
  let skipped = false, end = false, looks = 0;
  const time = deadline(25);
  for (let i = 0; time() && !end; i++) {
    await page.waitForTimeout(40);
    const st = await page.evaluate(() => ({ t: (document.querySelector("#screen-story")?.innerText || "").slice(0, 4000), end: !!document.querySelector(".story-card.end #story-share"), skip: !!document.querySelector("#story-skip") }));
    for (const k of ["Talk show", "Branding", "marionetas", "quién es esa reina", "Tacones imposibles", "Lo que ha pasado"]) if (st.t.includes(k)) seen.add(k);
    if (st.end) { end = true; break; }
    if (st.skip) { skipped = true; await page.click("#story-skip"); continue; }
    // Minirreto ¿quién es esa reina?: se elige la primera
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const cp = q("#rw-cp");
      if (cp && !cp.value) { cp.value = "Una sirena en una red de pesca de lujo"; cp.form.requestSubmit(); return ""; }
    // Girl Groups: la banda necesita nombre antes del estilo (se elige una sugerencia)
    const gg = q("#gg-n"); if (gg && !gg.value) { const n = q("[data-n]"); if (n) { n.click(); return ""; } }
      const nx = q("#ls-next");
      if (nx && !nx.disabled) { nx.click(); return "look"; }
      const falta = q(".ls-sel li:not(.ok)");
      if (falta) { falta.click(); q("#ls-loan").click(); return ""; }
      if (document.querySelector("#screen-game.active") && window.Game && Game._debug) { Game._debug().win(); return ""; }
      const mem = [...document.querySelectorAll(".mem-card:not(.open):not(.done)")];
      if (mem.length) { mem[Math.floor(Math.random() * mem.length)].click(); return ""; }
      for (const s of ["#lf-classic", "#dr-go", "#story-ls", "#rw-done", "#ut-skip", ".dlg-choices button[data-k]", ".dlg", ".siren-card #story-go", "#story-go", "#story-next", "#track-next", "#hub-skip", "[data-o]", "[data-st]", "[data-p]", ".dc-opt:not(.picked):not(.dim)", ".es-opt", "#pa-go", ".mq-c", ".sg-opt", ".rw-opt", "#rw-done", "[data-j]", "[data-qa]", "#lv-done", "#mini-btn.go", "#pz-btn", ".bl-pad"]) {
        const e = q(s);
        if (e) {
          if (s === "#dr-go") window.__rwOn = true;
          if (s === "#rw-done") window.__rwOn = false;
          e.click();
          return "";
        }
      }
      const b = [...document.querySelectorAll(".story-card .btn-primary, .mg .btn-primary")].find((x) => x.offsetParent && !x.disabled);
      if (b) { b.click(); return ""; }
      // Votar (la moneda) o elegir a alguien cuando no queda otra cosa que pulsar
      const who = q(".story-card .hub-q[data-id], .story-card .hub-q[data-v]");
      if (who) who.click();
      return "";
    });
    if (r === "look") looks++;
  }
  let share = null;
  if (end) {
    const dl = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
    await page.click("#story-share");
    const d = await dl;
    share = d ? d.suggestedFilename() : null;
  }
  const hof = await page.evaluate(() => { const b = JSON.parse(localStorage.getItem("dftc-story-board") || "[]"); return b.length && b[0].trackData ? b[0].trackData.rows.length : 0; });
  await ctx.close();
  return { seen: [...seen], skipped, end, share, hof, looks };
}

const win = await season({ lose: false });
const out = await season({ lose: true });
await browser.close();
console.log(`Ganando: final ${win.end ? "sí" : "no"} · tarjeta: ${win.share || "no"} · Hall of Fame con tabla: ${win.hof} reinas · visto: ${win.seen.join(", ") || "nada"}`);
console.log(`Perdiendo: saltar al reencuentro ${out.skipped ? "sí" : "no"} · final ${out.end ? "sí" : "no"} · tarjeta: ${out.share || "no"}`);
errors.forEach((e) => console.log("  ✖ " + e));
const ok = win.end && win.share === "mi-temporada.png" && win.hof > 3 && out.skipped && out.end && !errors.length;
process.exit(ok ? 0 : 1);
