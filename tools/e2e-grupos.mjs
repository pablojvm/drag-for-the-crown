// Girl Groups por grupos: el jurado llama a cada grupo por el nombre de su banda (en las críticas y en el veredicto),
// y durante el episodio no se ve ninguna nota. Juega el capítulo 1 con el Girl Groups como reto.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-grupos.mjs [http://localhost:4173/]
import { chromium } from "playwright";
import { seeded, deadline } from "./e2e-util.mjs";

const URL = process.argv[2] || "http://localhost:4173/";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await seeded(page);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
await page.goto(new globalThis.URL("clasico.html", URL).href);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(800);
await page.click("#btn-story");
await page.locator(".franchise-card").nth(0).click();
await page.locator(".season-card").nth(0).click();
await page.locator("#queen-grid > *").nth(0).click();
await page.click("#btn-start");
// En cuanto se guarda la temporada, el primer reto pasa a ser el Girl Groups
for (let i = 0; i < 200; i++) {
  if (await page.evaluate(() => { try { return !!JSON.parse(localStorage.getItem("dftc-story-save") || "null"); } catch { return false; } })) break;
  await page.locator(".dlg").click().catch(() => {});
  await page.waitForTimeout(150);
}
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem("dftc-story-save"));
  d.order = ["equipos", ...d.order.filter((t) => t !== "equipos")];
  localStorage.setItem("dftc-story-save", JSON.stringify(d));
});
await page.reload();
await page.waitForTimeout(800);
await page.click("#btn-story");
await page.click("#story-continue");
const said = new Set();
let verdict = "", leaks = [];
const time = deadline(12);
for (let i = 0; time() && !verdict; i++) {
  await page.waitForTimeout(40);
  const seen = await page.evaluate(() => ({
    t: [...document.querySelectorAll(".dlg-text, .story-card h3, .story-card p")].map((e) => e.textContent).join(" | "),
    v: document.querySelector(".verdict") ? document.querySelector(".story-card.call").innerText : "",
    llamada: !!document.querySelector(".verdict"),
  }));
  seen.t.split(" | ").forEach((x) => x && said.add(x));
  if (seen.v) verdict = seen.v;
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
    const who = q(".story-card .hub-q[data-id]");
    if (who) who.click();
    return "";
  });
}
await browser.close();
const all = [...said].join("\n");
const groupCrit = [...said].filter((x) => /^«[^»]+»: /.test(x));
const ok = /Gana «[^»]+»/.test(verdict) && groupCrit.length > 0 && !/\b\d{1,3} ?\/ ?100\b/.test(all) && !errors.length;
console.log(`Veredicto: ${verdict.split("\n").find((l) => /Gana|Grupo ganador/.test(l)) || "no"} · críticas de grupo: ${groupCrit.length} (${groupCrit.slice(0, 2).join(" / ")}) · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
