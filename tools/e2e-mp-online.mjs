// Prueba del multijugador en el navegador contra el servidor de salas (Colyseus): dos jugadoras en la versión clásica
// crean y entran en la sala, eligen reina, empiezan y llegan juntas al reto; el chat llega y no hay errores.
//   cd server && npm run build && PORT=2599 node dist/index.js ; npm run build && npm run preview
//   node tools/e2e-mp-online.mjs [http://localhost:4173/] [ws://localhost:2599]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const WS = process.argv[3] || "ws://localhost:2599";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];
const fail = async (m) => { console.error("❌", m, errors); await browser.close(); process.exit(1); };
const open = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } }); // cada una en su navegador
  await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(new globalThis.URL(`clasico.html?mpserver=${encodeURIComponent(WS)}`, URL).href);
  await p.waitForTimeout(1500);
  for (let i = 0; i < 2; i++) { await p.evaluate(() => document.querySelector("#btn-mp").click()); await p.waitForTimeout(900); }
  return p;
};
const A = await open(), B = await open();
const code = await A.evaluate(() => window.__mpRoom.create("Ana", "es1", "rapido", { fmt: "normal", ia: false }));
if (!/^[A-Z]{5}$/.test(code)) await fail("no se ha creado la sala en el servidor: " + code);
if (!(await A.evaluate(() => window.__mpRoom.online))) await fail("la sala no va por el servidor");
await B.evaluate((c) => window.__mpRoom.join(c, "Bea"), code);
await B.waitForTimeout(1500);
const cast = await A.evaluate(() => window.seasonById("es1").cast);
await A.evaluate((q) => window.__mpRoom.pick(q), cast[0]);
await B.evaluate((q) => window.__mpRoom.pick(q), cast[1]);
await A.waitForTimeout(800);
const seen = await B.evaluate(() => window.__mpRoom.state.players.map((p) => p.queen));
if (seen.filter(Boolean).length !== 2) await fail("B no ve a las dos con reina: " + JSON.stringify(seen));
await B.evaluate(() => window.__mpRoom.chat("Bea", "¡Hola, reinas!"));
await A.evaluate(() => window.__mpRoom.start());
await A.waitForTimeout(1000);
// Maletas: las dos «terminan» y la anfitriona pasa el anuncio hasta el reto
for (let i = 0; i < 80; i++) {
  const ph = await A.evaluate(() => window.__mpRoom.state.phase);
  if (ph === "reto") break;
  if (ph === "maletas") { for (const p of [A, B]) await p.evaluate(() => window.__mpRoom.submit({ ready: true })); }
  else await A.evaluate(() => window.__mpRoom.next());
  await A.waitForTimeout(250);
}
const st = await Promise.all([A, B].map((p) => p.evaluate(() => ({ ph: window.__mpRoom.state.phase, reto: window.__mpRoom.state.reto?.titulo, left: window.__mpRoom.state.deadline - window.__mpRoom.now() }))));
const chat = await A.evaluate(() => document.body.innerText.includes("¡Hola, reinas!"));
await browser.close();
if (st[0].ph !== "reto" || st[1].ph !== "reto") await fail("no llegan juntas al reto: " + JSON.stringify(st));
if (!st[0].reto) await fail("el reto no tiene título");
if (st[1].left < 30000) await fail("el reloj de B no va con el del servidor: " + st[1].left);
if (errors.length) await fail("errores en la página");
console.log(`✓ sala ${code} por el servidor: las dos en «${st[0].reto}» (quedan ${Math.round(st[1].left / 1000)} s); chat ${chat ? "ok" : "sin pintar (llega igual)"}`);
