// Cortes: se va la conexión de una (wifi, móvil bloqueado) y vuelve sola; otra recarga la página y vuelve con «Volver a la sala».
// (Basado en la prueba de pausar.), con clics: dos jugadoras empiezan, la anfitriona propone la pausa, las dos aceptan,
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
const bId = await B.evaluate(() => window.__mpRoom.me);
// 1) B se queda sin conexión 6 s
await B.context().setOffline(true);
await A.waitForTimeout(6000);
await B.context().setOffline(false);
let back = false;
for (let i = 0; i < 40 && !back; i++) { await B.waitForTimeout(500); back = await B.evaluate(() => window.__mpRoom.online); }
await A.evaluate(() => window.__mpRoom.submit({ ready: true }));
await B.evaluate(() => window.__mpRoom.submit({ ready: true }));
await A.waitForTimeout(1500);
const s1 = await st(B);
const ok1 = back && s1 && s1.code === code && s1.me === bId && s1.ph !== "maletas";
console.log(`${ok1 ? "✓" : "❌"} corte de red: vuelve sola ${back} · ${JSON.stringify(s1)}`);
// 2) B recarga la página y vuelve desde la entrada
await B.reload(); await B.waitForTimeout(1200);
await toMp(B);
const hasLive = await B.evaluate(() => !!document.querySelector("#mp-live"));
if (hasLive) await B.click("#mp-live");
await B.waitForTimeout(3000);
const s2 = await st(B), a2 = await st(A);
const alive = await B.evaluate(() => { const s = window.__mpRoom.state; return s?.players.find((p) => p.id === window.__mpRoom.me)?.alive; });
const ok2 = hasLive && s2 && s2.code === code && s2.me === bId && alive && a2.players === 2 && s2.ep === a2.ep;
console.log(`${ok2 ? "✓" : "❌"} recargar y «Volver a la sala»: botón ${hasLive} · ${JSON.stringify(s2)} · jugadoras ${a2.players} · viva ${alive}`);
await browser.close();
errors.forEach((e) => console.log("  ✖", e));
process.exit(ok1 && ok2 && !errors.length ? 0 : 1);
