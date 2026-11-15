import { chromium, devices } from "playwright";
const b = await chromium.launch();
for (const home of [false, true]) {
const ctx = await b.newContext({ ...devices["Desktop Chrome"] });
await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:4173/clasico.html"); await p.waitForTimeout(2000);
await p.evaluate(() => { document.querySelector('[data-mode="story"], #btn-story')?.click(); });
await p.waitForTimeout(400);
await p.locator("#franchise-grid > *").first().click().catch(()=>{}); await p.waitForTimeout(400);
await p.locator("#season-grid > *").first().click().catch(()=>{}); await p.waitForTimeout(600);
await p.locator("#queen-grid > *").nth(2).click().catch(()=>{}); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector("#btn-start").click()); await p.waitForTimeout(1500);
await p.evaluate((h) => window.Story._mkTest(h), home); await p.waitForTimeout(800);
const shots = [];
for (let i = 0; i < 120; i++) {
  const t = await p.evaluate(() => (document.querySelector("#story-body .eyebrow") || {}).textContent || "");
  if (!shots.includes(t) && /repesca|Lip sync|Has ganado|minirreto/i.test(t)) { shots.push(t); await p.screenshot({ path: `/tmp/claude-0/mk-${home ? "h" : "c"}${shots.length}.png` }); }
  if (/Siguiente episodio|Volver al taller/.test(await p.evaluate(() => (document.querySelector("#story-next") || {}).textContent || "")) || await p.$(".aftermath, #story-end")) break;
  await p.evaluate(() => { const bs = [...document.querySelectorAll("#story-play button, #story-body button, #story-play [data-k], #story-play .dc-opt, .dlg")].filter((x) => x.offsetParent && !x.disabled && !x.classList.contains("picked") && !x.classList.contains("dim") && !x.classList.contains("btn-ghost")); bs.length && bs[0].click(); });
  await p.waitForTimeout(300);
}
console.log(home ? "casa" : "compitiendo", shots, errs);
await p.screenshot({ path: `/tmp/claude-0/mk-${home ? "h" : "c"}-end.png` });
}
await b.close();
