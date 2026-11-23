// Pausar y seguir otro día, con clics: dos jugadoras empiezan, la anfitriona propone la pausa, las dos aceptan,
// salen, recargan la página y pulsan «Continuar» en la partida pausada (en los dos órdenes posibles).
// Tienen que acabar juntas en la misma sala y en el mismo punto de la temporada.
//   node tools/e2e-mp-pausa.mjs [http://localhost:4173/] [ws://localhost:2599]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const WS = process.argv[3] || "ws://localhost:2599";
const ORDEN = process.env.ORDEN || "AB"; // quién pulsa antes «Continuar»
const GAP = Number(process.env.GAP || 1500); // cuánto tarda la segunda
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];
const page = async (who) => {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 850 } });
  await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
  return p;
};
const toMp = async (p) => {
  await p.goto(new globalThis.URL(`clasico.html?mpserver=${encodeURIComponent(WS)}`, URL).href);
  await p.waitForTimeout(1500);
  for (let i = 0; i < 8 && !(await p.$("#mp-code")); i++) { await p.evaluate(() => document.querySelector("#btn-mp")?.click()); await p.waitForTimeout(900); }
};
const st = (p) => p.evaluate(() => { const s = window.__mpRoom.state; return s ? { code: s.code, ph: s.phase, ep: s.ep, paused: !!s.paused, host: s.host, me: window.__mpRoom.me, players: s.players.length } : null; });
const yes = (p) => p.evaluate(() => { const b = document.querySelector(".app-ask-card [data-v='1']"); b && b.click(); return !!b; });
const A = await page("Ana"), B = await page("Bea");
await toMp(A); await toMp(B);
const code = await A.evaluate(() => window.__mpRoom.create("Ana", "es1", "libre", { fmt: "normal", ia: false }));
await B.fill("#mp-code", code); await B.click("#mp-join"); await B.waitForTimeout(1200);
const cast = await A.evaluate(() => window.seasonById("es1").cast);
await A.evaluate((q) => window.__mpRoom.pick(q), cast[0]);
await B.evaluate((q) => window.__mpRoom.pick(q), cast[1]);
await A.waitForTimeout(600);
await A.evaluate(() => window.__mpRoom.start());
await A.waitForTimeout(800);
for (const p of [A, B]) await p.evaluate(() => window.__mpRoom.submit({ ready: true }));
await A.waitForTimeout(1200);
const before = await st(A);
// Pausa con el botón y las dos dicen que sí
await A.evaluate(() => document.querySelector("#mp-pause").click());
await A.waitForTimeout(400); await yes(A);
await B.waitForTimeout(1200); await yes(B); await A.waitForTimeout(400); await yes(A);
await A.waitForTimeout(1500);
const paused = await st(A);
if (!paused?.paused) { console.error("❌ no se ha pausado", paused, before); process.exit(1); }
// Las dos salen y vuelven otro día (recargan)
for (const p of [A, B]) { await p.evaluate(() => document.querySelector("#mp-exit3")?.click()); }
await A.waitForTimeout(1500);
await toMp(A); await toMp(B);
const rows = await Promise.all([A, B].map((p) => p.evaluate(() => [...document.querySelectorAll(".mp-saved-row button")].map((b) => b.textContent.trim()))));
console.log("botones:", JSON.stringify(rows));
const [P1, P2] = ORDEN === "AB" ? [A, B] : [B, A];
await P1.evaluate(() => document.querySelector("[data-resume]").click());
await P1.waitForTimeout(GAP);
await P2.evaluate(() => document.querySelector("[data-resume]").click());
await A.waitForTimeout(4000);
const sa = await st(A), sb = await st(B);
const txt = await Promise.all([A, B].map((p) => p.evaluate(() => (document.querySelector(".screen.active")?.innerText || "").replace(/\s+/g, " ").slice(0, 200))));
await browser.close();
const ok = sa && sb && sa.code === code && sb.code === code && !sa.paused && !sb.paused && sa.ep === before.ep && sa.ph === sb.ph && sa.players === 2;
console.log(`${ok ? "✓" : "❌"} orden ${ORDEN} gap ${GAP}: antes ${before.ph}/${before.ep} · A ${JSON.stringify(sa)} · B ${JSON.stringify(sb)} · errores ${errors.length}`);
if (!ok) console.log("  pantallas:", JSON.stringify(txt));
errors.forEach((e) => console.log("  ✖", e));
process.exit(ok && !errors.length ? 0 : 1);
