// El modo historia desde la portada nueva: el de siempre en un marco, sobre el plató del motor nuevo, con la pasarela
// y el lip sync en las escenas del motor nuevo. Se juega el primer capítulo entero hasta que queda en el track record,
// se sale y se vuelve a la portada nueva.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-historia-nueva.mjs [http://localhost:4173/]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const SHOT = process.env.SHOT || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
const errors = [];
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const fail = async (m) => { console.error("FALLA EN:", m, errors); if (SHOT) await page.screenshot({ path: `${SHOT}/hn-fallo.png` }); await browser.close(); process.exit(1); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector(".nx-mode.s-story", { timeout: 30000 });
for (let i = 0; i < 6 && !(await page.$(".nx-historia")); i++) { await page.click(".nx-mode.s-story .ms-cta").catch(() => {}); await page.waitForTimeout(600); }
if (!(await page.$(".nx-historia"))) await fail("abrir el modo historia");
await page.waitForSelector(".nx-historia iframe.on", { timeout: 30000 }).catch(() => fail("cargar la historia"));
const fr = page.frames().find((x) => x.url().includes("clasico.html"));
if (await fr.evaluate(() => document.querySelector("#screen-menu.active") !== null)) await fail("se ve el menú clásico");
await fr.locator("#franchise-grid > *").first().click();
await fr.locator("#season-grid > *").first().click();
await fr.locator("#queen-grid > *").first().click();
await fr.locator("#btn-start").click();
const state = () => page.evaluate(() => { const s = window.__dftcNext.getState(); return { screen: s.screen, scene: s.hist.scene, back: s.back }; });
const VALID = /^(WIN|TOP2|BTOP|HIGH|SAFE|LOW|BTM2|BTM3|ELIM|BWIN)$/;
let looks = 0, done = null, javis = false, phaser = { runway: 0, lipsync: 0 }, shotRw = false, shotLs = false;
for (let i = 0; i < 9000 && !done; i++) {
  await page.waitForTimeout(40);
  const st = await state();
  if (st.scene) {
    // La pasarela o el lip sync, en la escena del motor nuevo
    if (st.scene === "runway" && !shotRw && SHOT) { shotRw = true; await page.waitForTimeout(600); await page.screenshot({ path: `${SHOT}/hn-runway.png` }); }
    if (st.scene === "lipsync" && !shotLs && SHOT) { shotLs = true; await page.waitForTimeout(600); await page.screenshot({ path: `${SHOT}/hn-lipsync.png` }); }
    const back = page.getByRole("button", { name: "Volver a la historia" });
    if (await back.isVisible().catch(() => false)) { phaser[st.scene]++; await back.click(); continue; }
    const o = page.locator(".nx-opt:not([disabled])").first();
    if (await o.isVisible().catch(() => false)) { await o.click().catch(() => {}); await page.waitForTimeout(st.scene === "runway" ? 900 : 400); }
    continue;
  }
  if (!javis) javis = /Javis/.test(await fr.locator("#screen-story").innerText().catch(() => ""));
  done = await fr.evaluate(() => {
    try {
      const d = JSON.parse(localStorage.getItem("dftc-story-save") || "null");
      if (!d || d.ep < 2) return null;
      const labs = Object.values(d.track || {}).map((t) => t[1]).filter(Boolean);
      return labs.length ? labs : null;
    } catch { return null; }
  });
  const r = await fr.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cp = q("#rw-cp");
    if (cp && !cp.value) { cp.value = "Una sirena en una red de pesca de lujo"; cp.form.requestSubmit(); return ""; }
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
  if (r === "look") looks++;
}
if (SHOT) await page.screenshot({ path: `${SHOT}/hn-fin.png` });
// Salir: vuelve a la portada nueva
await fr.locator("#story-exit").click();
await page.waitForSelector(".nx-historia", { state: "detached", timeout: 10000 }).catch(() => fail("volver a la portada"));
const seguir = !!(await page.$(".nx-mode.s-story .ms-cta.alt"));
await browser.close();
const labs = done || [];
const bad = labs.filter((l) => !VALID.test(l));
console.log(`Javis: ${javis ? "sí" : "no"} · looks: ${looks} · pasarelas en el motor nuevo: ${phaser.runway} · lip syncs: ${phaser.lipsync} · capítulo 1: ${labs.join(" ") || "no"} · «Seguir mi temporada»: ${seguir ? "sí" : "no"} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(javis && looks > 0 && labs.length > 3 && !bad.length && phaser.runway + phaser.lipsync > 0 && seguir && !errors.length ? 0 : 1);
