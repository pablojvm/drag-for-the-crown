// Prueba del servidor de salas (Colyseus) con tres jugadoras bot: crean y entran en la sala, eligen reina,
// juegan una temporada entera (la anfitriona pasa pantallas y no espera) y comprueban que se llega a la corona.
// También prueba el relevo: a mitad de temporada la anfitriona se desconecta y otra coge el mando.
//   cd server && npm run build && PORT=2599 node dist/index.js   (en otra terminal)
//   node tools/e2e-mp-server.mjs [ws://localhost:2599]
import { Client } from "../server/node_modules/@colyseus/sdk/build/index.mjs";

const URL = process.argv[2] || "ws://localhost:2599";
const FMT = process.env.FMT || "normal";
const SEASON = process.env.SEASON || "es1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);
const WATCH = ["anuncio", "resultados", "untucked", "veredicto", "sorpresa", "pintalabios", "track", "corona"];
const fail = (m) => { console.error("❌", m); process.exit(1); };

function bot(name) {
  const b = { name, id: rid(), secret: rid() + rid(), s: null, room: null, chats: 0 };
  b.on = (room) => {
    b.room = room;
    room.onMessage("state", ({ s }) => { if (!b.s || s.v > b.s.v) b.s = s; });
    room.onMessage("chat", () => b.chats++);
  };
  b.op = (op) => b.room.send("op", op);
  return b;
}
const c = new Client(URL);
const A = bot("Ana"), B = bot("Bea"), C = bot("Cris");
A.on(await c.create("dftc", { id: A.id, secret: A.secret, name: A.name, create: { season: SEASON, ritmo: "libre", fmt: FMT, content: { names: { x: "y" } } } }));
await sleep(300);
const code = A.room.roomId;
if (!/^[A-Z]{5}$/.test(code)) fail("código de sala raro: " + code);
for (const b of [B, C]) b.on(await new Client(URL).joinById(code, { id: b.id, secret: b.secret, name: b.name }));
// Nadie puede hacerse pasar por otra jugadora
try { await new Client(URL).joinById(code, { id: B.id, secret: "otrosecreto", name: "Falsa" }); fail("se ha colado una jugadora con el id de otra"); } catch { /* bien */ }
await sleep(500);
if (A.s.players.length !== 3) fail("no están las tres en la sala: " + A.s.players.length);
const cast = ["pupi", "carmenfarala", "killerqueen", "sagaz", "hugaceo", "dovima", "arantxa", "inti", "macarena", "drag-sethlas"];
[A, B, C].forEach((b, i) => b.op({ t: "pick", queen: cast[i] }));
// Solo la anfitriona empieza
B.op({ t: "start", cast }); await sleep(300);
if (A.s.phase !== "lobby") fail("una invitada ha podido empezar la temporada");
A.op({ t: "start", cast, names: { pupi: "Pupi Poisson" } });
await sleep(500);
if (A.s.phase === "lobby") fail("la temporada no empieza");
A.room.send("chat", { name: "Ana", text: "¡Hola!" });

let host = A, dropped = false, phases = new Set(), lastV = 0, still = 0;
for (let i = 0; i < 3000; i++) {
  const bots = [A, B, C].filter((b) => b.room);
  const s = bots.find((b) => b.id === (bots[0].s?.host))?.s || bots[0].s;
  if (!s) { await sleep(50); continue; }
  phases.add(s.phase);
  if (s.phase === "corona") break;
  host = bots.find((b) => b.id === s.host) || host;
  // Relevo: a mitad de temporada se va la anfitriona (cierra sin avisar)
  if (!dropped && s.ep >= 3 && host === A) {
    dropped = true;
    A.room.connection.close(4000); A.room = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 25000 && B.s.host === A.id) await sleep(200);
    if (B.s.host === A.id) fail("nadie coge el relevo de la anfitriona");
    console.log("✓ relevo de anfitriona en", Math.round((Date.now() - t0) / 1000), "s ->", B.s.host === B.id ? "Bea" : "Cris");
    continue;
  }
  if (WATCH.includes(s.phase)) host.op({ t: "next" });
  else {
    for (const b of bots) {
      const me = s.players.find((p) => p.id === b.id);
      const t = s.twist, opt = t?.options?.find((k) => k !== "p:" + b.id) || t?.options?.[0];
      const data = { mini: 40 + Math.floor(Math.random() * 60), reto: 50 + Math.floor(Math.random() * 40), final: 50 + Math.floor(Math.random() * 40), ready: true, ls: { won: Math.random() < 0.5, score: 60 }, box: [A, B, C].indexOf(b) };
      if (opt) data.pick = t.need ? t.options.slice(0, t.need - (t.sure?.length || 0)).join(",") : opt;
      const top = s.top || s.duel?.top;
      if (top) data.elim = (s.rows || []).map((r) => r.key).filter((k) => !top.includes?.(k)).pop();
      if (me) b.op({ t: "submit", ep: s.ep, phase: s.phase, data });
    }
    await sleep(40);
    host.op({ t: "skip" });
  }
  await sleep(40);
  if (s.v === lastV) { if (++still > 200) fail("la sala se ha atascado en " + s.phase + " (ep " + s.ep + ")"); } else { still = 0; lastV = s.v; }
}
const s = B.s;
if (s.phase !== "corona") fail("no se ha llegado a la corona: " + s.phase + " ep " + s.ep);
if (!s.champion) fail("no hay ganadora");
if (B.chats < 1) fail("el chat no llega");
console.log(`✓ ${FMT}: temporada completa en ${s.ep} episodios; ganadora ${s.champion}; fases: ${[...phases].join(", ")}`);
[B, C].forEach((b) => b.room?.leave());
process.exit(0);
