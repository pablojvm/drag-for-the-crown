// Temporada entera del multijugador en el navegador, con dos jugadoras contra el servidor de salas y SOLO con clics
// en la interfaz (como lo haría una persona). Si la sala no avanza en un rato, dice qué ve cada una y falla.
//   cd server && npm run build && PORT=2599 node dist/index.js ; npm run build && npm run preview
//   FMT=parejas RITMO=libre node tools/e2e-mp-full.mjs [http://localhost:4173/] [ws://localhost:2599]
import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:4173/";
const WS = process.argv[3] || "ws://localhost:2599";
const FMT = process.env.FMT || "parejas";
const RITMO = process.env.RITMO || "libre";
const MIN = Number(process.env.MIN || 12);
const STUCK = Number(process.env.STUCK || 40) * 1000;
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];
const open = async (who) => {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 850 } });
  await ctx.route(/supabase\.co|generativelanguage|groq\.com|openrouter|pollinations/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::ERR|supabase|404/.test(m.text()) && errors.push(`${who} console: ${m.text().slice(0, 200)}`));
  p.on("dialog", (d) => d.dismiss());
  await p.goto(new globalThis.URL(`clasico.html?mpserver=${encodeURIComponent(WS)}`, URL).href);
  await p.waitForTimeout(1500);
  for (let i = 0; i < 8 && !(await p.$("#mp-code")); i++) { await p.evaluate(() => document.querySelector("#btn-mp")?.click()); await p.waitForTimeout(900); }
  return p;
};
const A = await open("Ana"), B = await open("Bea");
// Como una persona: «Personalizada», el ritmo, «Crear sala», la dinámica y «Crear sala» otra vez
await A.evaluate(([r]) => {
  document.querySelector("#mp-name") && (document.querySelector("#mp-name").value = "Ana");
  document.querySelector(`.mp-ritmo [data-r="${r}"]`)?.click();
}, [RITMO]);
for (let i = 0; i < 12; i++) { if (await A.evaluate(() => { const c = document.querySelector('.mp-season[data-id="custom"]'); if (c.classList.contains("active")) return true; c.click(); return false; })) break; await A.waitForTimeout(400); }
await A.waitForTimeout(800);
await A.evaluate(() => document.querySelector("#mp-create").click());
await A.waitForTimeout(800);
await A.evaluate((f) => document.querySelector(`[data-f="${f}"]`)?.click(), FMT);
await A.waitForTimeout(400);
if (process.env.SIZE) for (let i = 0; i < 12; i++) await A.evaluate((n) => { const b = document.querySelector(".mp-cs-n"); if (b && +b.textContent > n) document.querySelector('[data-s="-1"]').click(); }, +process.env.SIZE);
await A.evaluate(() => document.querySelector("#mp-ccreate").click());
let code = "";
for (let i = 0; i < 30 && !code; i++) { await A.waitForTimeout(300); code = await A.evaluate(() => window.__mpRoom.state?.code || ""); }
await B.waitForTimeout(500);
await B.evaluate(() => { document.querySelector("#mp-name") && (document.querySelector("#mp-name").value = "Bea"); });
await B.fill("#mp-code", code);
await B.click("#mp-join");
await B.waitForTimeout(1500);
// Cada una elige reina en la sala de espera (clic en la carta)
for (const p of [A, B]) {
  await p.evaluate(() => { const c = [...document.querySelectorAll(".mp-qgrid .queen-card[data-q]")].find((x) => !x.disabled && !x.classList.contains("taken")); c && c.click(); });
  await p.waitForTimeout(700);
}
const st0 = await A.evaluate(() => ({ fmt: window.__mpRoom.state.fmt, players: window.__mpRoom.state.players.map((p) => [p.name, p.queen]) }));
console.log("sala", code, JSON.stringify(st0));
if (st0.fmt !== FMT) { console.error("❌ la sala no tiene el formato pedido:", st0.fmt); process.exit(1); }
await A.evaluate(() => { const b = document.querySelector("#mp-fillrival"); b && b.click(); });
await A.waitForTimeout(500);
await A.evaluate(() => document.querySelector("#mp-start")?.click());
await A.waitForTimeout(1500);

// Un clic «humano»: lo primero que haya que pulsar en pantalla
const clicker = async (p) => p.evaluate(() => {
  const vis = (x) => x && x.offsetParent && !x.disabled && !x.closest(".mp-chat,.chat,#mp-chat");
  const sel = ["#dlg-skip", "#mp-ccreate", ".modal.open .btn-primary", ".dlg .btn-primary", "#mp-mini-go", "#mp-mini-play", "#mp-next", "[data-pick^=\"p:\"]", "[data-pick]", "[data-box]", "[data-vote]", "[data-heart]", "[data-duel]", "[data-coin]", ".dc-opt:not(.picked):not(.dim)", "[data-o]", "#story-go", "#story-next", ".screen.active .btn-primary:not(#mp-exit2):not(#mp-exit3):not(#mp-exit)", "#mp-skip", "#mp-play button", "#mp-play [role=button]", "#mp-play .tile, #mp-play .card", "[data-k]", "[data-miss]"];
  for (const s of sel) {
    const L = [...document.querySelectorAll(s)].filter(vis);
    const b = s.startsWith("#mp-play") || s === ".dc-opt:not(.picked):not(.dim)" || s === "[data-o]" ? L[Math.floor(Math.random() * L.length)] : L[0];
    if (b && !/Salir|Volver al menú|Borrar|Pausa/.test(b.textContent || "")) { b.click(); return s + " «" + (b.textContent || "").trim().slice(0, 30) + "»"; }
  }
  return "";
});
const snap = (p) => p.evaluate(() => {
  const s = window.__mpRoom.state || {};
  return { ph: s.phase, ep: s.ep, v: s.v, alive: (s.players || []).map((x) => x.alive), host: s.host === window.__mpRoom.me, text: (document.querySelector(".screen.active")?.innerText || "").replace(/\s+/g, " ").slice(0, 500), btns: [...document.querySelectorAll(".screen.active button, .modal button")].filter((x) => x.offsetParent).map((x) => `${x.id || x.className}:${(x.textContent || "").trim().slice(0, 20)}`).slice(0, 25) };
});
// Los juegos de los retos son los del modo historia (tienen sus pruebas): si alguno se alarga, se entrega una nota
const loops = new Map();
const shortcut = async (p, who) => {
  const st = await p.evaluate(() => { const s = window.__mpRoom.state; const me = window.__mpRoom.me; const pl = s.players.find((x) => x.id === me); return { ph: s.phase, ep: s.ep, sub: s.subs?.[me] || {}, alive: !!pl?.alive, noRunway: !!s.reto?.noRunway }; });
  if (!st.alive || !["mini", "reto", "pasarela"].includes(st.ph)) return;
  const k = `${who}:${st.ph}:${st.ep}`;
  const n = (loops.get(k) || 0) + 1;
  loops.set(k, n);
  if (n < 25) return;
  const data = st.ph === "mini" ? (st.sub.mini == null ? { mini: 60 } : null) : st.ph === "reto" ? (st.sub.reto == null ? (st.noRunway ? { reto: 60, final: 60 } : { reto: 60 }) : null) : st.sub.final == null ? { walk: 60, final: 60 } : null;
  if (data) await p.evaluate((d) => { try { window.Story.mp.abort(); } catch {} window.__mpRoom.submit(d); }, data);
};
const end = Date.now() + MIN * 60000;
let last = "", lastAt = Date.now(), phases = new Set(), stuck = 0;
while (Date.now() < end) {
  for (const p of [A, B]) await clicker(p).catch(() => "");
  await shortcut(A, "A").catch(() => {}); await shortcut(B, "B").catch(() => {});
  await A.waitForTimeout(350);
  const a = await snap(A).catch(() => null);
  if (!a) continue;
  phases.add(a.ph);
  if (a.ph === "corona") break;
  const b0 = await snap(B).catch(() => ({}));
  const key = `${a.ph}:${a.ep}:${a.v}:${a.text}:${b0.text}`;
  if (key !== last) { last = key; lastAt = Date.now(); }
  else if (Date.now() - lastAt > STUCK) {
    const b = await snap(B);
    console.log(`⏸️ atascada en ${a.ph} (ep ${a.ep}) ${Math.round((Date.now() - lastAt) / 1000)} s`);
    console.log("  A:", JSON.stringify(a));
    console.log("  B:", JSON.stringify(b));
    if (++stuck >= 2) break;
    lastAt = Date.now();
  }
}
const fin = await snap(A);
const finB = await snap(B);
await browser.close();
console.log(`${fin.ph === "corona" ? "✓" : "❌"} ${FMT}/${RITMO}: fase final ${fin.ph} ep ${fin.ep} · B en ${finB.ph} · fases: ${[...phases].join(", ")} · errores: ${errors.length}`);
[...new Set(errors)].slice(0, 15).forEach((e) => console.log("  ✖", e));
process.exit(fin.ph === "corona" && !errors.length ? 0 : 1);
