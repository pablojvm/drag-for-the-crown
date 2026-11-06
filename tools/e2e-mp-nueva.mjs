// El multijugador desde la portada nueva: el de siempre en un marco, sobre el plató del motor nuevo, sin pasar por el
// menú clásico. Dos jugadoras (sin servidor: BroadcastChannel), crean y entran en la sala, empiezan, y en el lip sync
// contra una reina del juego se baila en la escena del motor nuevo; el resultado llega a la sala. Al salir, a la portada.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-mp-nueva.mjs [http://localhost:4173/]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const SHOT = process.env.SHOT || "";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.addInitScript(() => {
  Object.defineProperty(window, "DFTC_NET", { configurable: true, set(v) { this._n = v; if (v) Object.defineProperty(v, "enabled", { value: false, configurable: true }); }, get() { return this._n; } });
});
await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
const errors = [];
const fail = async (m, p) => { console.error("FALLA EN:", m, errors); if (SHOT && p) await p.screenshot({ path: `${SHOT}/mpn-fallo.png` }); await browser.close(); process.exit(1); };
const open = async () => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(new globalThis.URL("?mpserver=", URL).href);
  await p.waitForSelector(".nx-mode.s-mp", { timeout: 30000 });
  for (let i = 0; i < 6 && !(await p.$(".nx-historia")); i++) { await p.click(".nx-mode.s-mp .ms-cta").catch(() => {}); await p.waitForTimeout(600); }
  if (!(await p.$(".nx-historia"))) await fail("abrir el multijugador", p);
  await p.waitForSelector(".nx-historia iframe.on", { timeout: 30000 }).catch(() => fail("cargar el multijugador", p));
  const fr = p.frames().find((x) => x.url().includes("clasico.html"));
  if (await fr.evaluate(() => document.querySelector("#screen-menu.active") !== null)) await fail("se ve el menú clásico", p);
  return { p, fr };
};
const A = await open(), B = await open();
if (SHOT) await A.p.screenshot({ path: `${SHOT}/mpn-entrada.png` });
const sid = await A.fr.evaluate(() => {
  const a = typeof window.allSeasons === "function" ? window.allSeasons() : window.allSeasons;
  return (Array.isArray(a) ? a : Object.values(a)).map((s) => s.id).find((id) => window.Story.mp.formato(id) === "normal" && window.seasonById(id).cast.length >= 8);
});
const code = await A.fr.evaluate((sid) => window.__mpRoom.create("Ana", sid, "rapido", { fmt: "normal", ia: false }), sid);
await B.fr.evaluate((c) => window.__mpRoom.join(c, "Bea"), code);
await B.p.waitForTimeout(3000);
const cast = await A.fr.evaluate(() => window.seasonById(window.__mpRoom.state.season).cast);
await A.fr.evaluate((q) => window.__mpRoom.pick(q), cast[0]);
await B.fr.evaluate((q) => window.__mpRoom.pick(q), cast[1]);
await A.p.waitForTimeout(1500);
const joined = await A.fr.evaluate(() => window.__mpRoom.state.players.filter((p) => p.queen).length);
if (SHOT) await A.p.screenshot({ path: `${SHOT}/mpn-sala.png` });
await A.fr.evaluate(() => window.__mpRoom.start());
for (let i = 0; i < 600; i++) {
  if ((await A.fr.evaluate(() => window.__mpRoom.state.phase)) === "lipsync") break;
  await A.fr.evaluate(() => { const r = window.__mpRoom, s = r.state; if (["anuncio", "resultados", "untucked", "veredicto", "sorpresa", "pintalabios", "track", "cajas"].includes(s.phase)) r.next(); else r.hostDo((x) => ({ ...x, deadline: 1, v: x.v + 1 })); });
  await A.p.waitForTimeout(60);
}
// El lip sync de Ana, contra una reina del juego
const meA = await A.fr.evaluate(() => window.__mpRoom.me);
await A.fr.evaluate((me) => window.__mpRoom.hostDo((x) => {
  const bot = x.track && Object.keys(x.track).find((k) => !k.startsWith("p:")) || x.players.length && x.cast?.find?.((q) => !x.players.some((p) => p.queen === q));
  return { ...x, pairs: [{ a: "p:" + me, b: bot }], players: x.players.map((p) => ({ ...p, alive: true })), subs: {}, deadline: Date.now() + 120000, v: x.v + 1 };
}), meA);
await A.p.waitForTimeout(1500);
await A.fr.locator("#mp-ls-go").click({ timeout: 10000 }).catch(() => fail("botón del lip sync", A.p));
// El lip sync se baila en la escena del motor nuevo
await A.p.waitForFunction(() => window.__dftcNext.getState().hist.scene === "lipsync", null, { timeout: 15000 }).catch(() => fail("lip sync en el motor nuevo", A.p));
for (let k = 0; k < 6; k++) { await A.p.locator(".nx-opt").nth([1, 2, 1, 2, 0, 1][k]).click({ timeout: 10000 }); await A.p.waitForTimeout(450); }
if (SHOT) await A.p.screenshot({ path: `${SHOT}/mpn-lipsync.png` });
await A.p.getByRole("button", { name: "Volver a la historia" }).click({ timeout: 10000 });
await A.p.waitForTimeout(1500);
const ls = await A.fr.evaluate((me) => window.__mpRoom.state.subs[me]?.ls || null, meA);
const back = await A.p.evaluate(() => window.__dftcNext.getState().screen);
if (SHOT) await A.p.screenshot({ path: `${SHOT}/mpn-tras.png` });
// Salir de la sala: a la portada nueva
await A.fr.evaluate(() => { window.__mpRoom.leave(); });
await A.fr.locator("#story-exit").click().catch(() => {});
await A.p.waitForSelector(".nx-historia", { state: "detached", timeout: 10000 }).catch(() => fail("volver a la portada", A.p));
await browser.close();
const ok = joined === 2 && ls && back === "historia" && !errors.length;
console.log(`Jugadoras: ${joined} · lip sync en el motor nuevo: ${ls ? (ls.won ? "ganado" : "perdido") + ` (${ls.score})` : "no"} · vuelta a la sala: ${back} · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
