// Prueba del multijugador con dos jugadoras en el mismo navegador (sin servidor: BroadcastChannel).
// Crea sala, entra la segunda, empieza la temporada, llega al primer lip sync y juega un duelo entre las dos
// paso a paso. Falla si hay errores en la página o si el duelo no se resuelve.
//   npm run build && npm run preview   (en otra terminal)
//   node tools/e2e-mp.mjs [http://localhost:4173/]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
// Sin servidor: la sala va por BroadcastChannel entre pestañas
await ctx.addInitScript(() => {
  Object.defineProperty(window, "DFTC_NET", { configurable: true, set(v) { this._n = v; if (v) Object.defineProperty(v, "enabled", { value: false, configurable: true }); }, get() { return this._n; } });
});
const errors = [];
const open = async () => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(URL);
  await p.waitForTimeout(1500);
  // Abrir la pantalla del multijugador (el primer clic centra la tarjeta en el carrusel, el segundo entra)
  for (let i = 0; i < 2; i++) { await p.evaluate(() => document.querySelector("#btn-mp").click()); await p.waitForTimeout(900); }
  return p;
};
const A = await open(), B = await open();
const sid = await A.evaluate(() => {
  const a = typeof window.allSeasons === "function" ? window.allSeasons() : window.allSeasons;
  return (Array.isArray(a) ? a : Object.values(a)).map((s) => s.id).find((id) => window.Story.mp.formato(id) === "normal" && window.seasonById(id).cast.length >= 8);
});
const code = await A.evaluate((sid) => window.__mpRoom.create("Ana", sid, "rapido", { fmt: "normal", ia: false }), sid);
await B.evaluate((c) => window.__mpRoom.join(c, "Bea"), code);
await B.waitForTimeout(3000);
const cast = await A.evaluate(() => window.seasonById(window.__mpRoom.state.season).cast);
await A.evaluate((q) => window.__mpRoom.pick(q), cast[0]);
await B.evaluate((q) => window.__mpRoom.pick(q), cast[1]);
await A.waitForTimeout(1500);
const joined = await A.evaluate(() => window.__mpRoom.state.players.filter((p) => p.queen).length);
await A.evaluate(() => window.__mpRoom.start());
for (let i = 0; i < 600; i++) {
  if ((await A.evaluate(() => window.__mpRoom.state.phase)) === "lipsync") break;
  await A.evaluate(() => { const r = window.__mpRoom, s = r.state; if (["anuncio", "resultados", "untucked", "veredicto", "sorpresa", "pintalabios", "track", "cajas"].includes(s.phase)) r.next(); else r.hostDo((x) => ({ ...x, deadline: 1, v: x.v + 1 })); });
  await A.waitForTimeout(60);
}
// El lip sync de esta semana lo bailan las dos jugadoras
const ids = { a: await A.evaluate(() => window.__mpRoom.me), b: await B.evaluate(() => window.__mpRoom.me) };
await A.evaluate((ids) => window.__mpRoom.hostDo((x) => ({ ...x, pairs: [{ a: "p:" + ids.a, b: "p:" + ids.b }], players: x.players.map((p) => ({ ...p, alive: true })), subs: {}, deadline: Date.now() + 90000, v: x.v + 1 })), ids);
await A.waitForTimeout(1200);
let lockstep = true;
for (let k = 0; k < 6; k++) {
  await A.click("[data-duel]", { timeout: 10000 });
  await A.waitForTimeout(500);
  // A no puede adelantarse: hasta que B elija, A espera
  if (await A.$("[data-duel]:not([disabled])")) lockstep = false;
  await B.click("[data-duel]", { timeout: 10000 });
  await A.waitForTimeout(700);
}
await A.waitForTimeout(1500);
const st = await A.evaluate(() => ({ phase: window.__mpRoom.state.phase, note: window.__mpRoom.state.note || "" }));
await browser.close();
const ok = joined === 2 && lockstep && st.phase !== "lipsync" && /se va a casa/.test(st.note) && !errors.length;
console.log(`Jugadoras: ${joined} · paso a paso: ${lockstep ? "sí" : "no"} · tras el duelo: ${st.phase} «${st.note}» · errores: ${errors.length}`);
errors.forEach((e) => console.log("  ✖ " + e));
process.exit(ok ? 0 : 1);
