// Pantallas de la temporada en directo (dentro de la pantalla del modo historia, con su propio flujo)
import { Room } from "./room";
import { DURACION, topeEpisodio, alivePlayers, aliveKeys, isP, idOf, pkey, type RoomState, type Engine, type Ritmo } from "./model";

const W = window as any;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const api = () => W.Story.mp;
const Q = (id: string) => api().queen(id) || { id, name: id, photo: "", sprite: "" };

const engine = (): Engine => ({
  retos: () => api().retos(),
  categorias: () => api().categorias(),
  rivalScore: (q, t) => api().rivalScore(q, t),
  simLS: (a, b) => api().simLS(a, b),
  critique: (t, l, n) => api().critique(t, l, n),
  queenName: (id) => Q(id).name,
  rnd: Math.random,
});
const seasons = () => (W.allSeasons() as any[]).filter((s) => !s.special && s.cast && s.cast.length >= 5 && /^es/.test(s.id));
const castOf = (id: string) => (W.seasonById(id)?.cast || []) as string[];

// Solo pruebas: ?mpfast acorta todos los tiempos
if (new URLSearchParams(location.search).has("mpfast")) Object.values(DURACION).forEach((d: Record<string, number>) => Object.keys(d).forEach((k) => (d[k] = Math.max(4, Math.round(d[k] / 4)))));
const room = new Room(engine, castOf);
let chatLog: { name: string; text: string; me?: boolean }[] = [];
let playing: { ep: number; phase: string } | null = null;
let begun = false;
let timer = 0;
const myName = () => room.state?.players.find((p) => p.id === room.me)?.name || (W.store?.get("dftc-name", "") || "").trim() || "Reina";

function shell(on: boolean) {
  $("#screen-story")!.classList.toggle("mp", on);
  if (on) $("#story-exit")!.innerHTML = "<i>←</i><span>Salir de la sala</span>";
  if (on) W.UI.show("story");
}
const body = () => $("#story-body")!;
const keyName = (s: RoomState, k: string) => {
  if (!isP(k)) return Q(idOf(k)).name;
  const p = s.players.find((x) => x.id === idOf(k));
  return p ? `${Q(p.queen || "").name}` : "?";
};
const keyPlayer = (s: RoomState, k: string) => (isP(k) ? s.players.find((x) => x.id === idOf(k))?.name : null);
const keyQueen = (s: RoomState, k: string) => (isP(k) ? s.players.find((x) => x.id === idOf(k))?.queen || "" : idOf(k));
const face = (s: RoomState, k: string, cls = "") => `<span class="mp-face ${cls} ${k === pkey(room.me) ? "me" : ""}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><b>${esc(keyName(s, k))}</b>${keyPlayer(s, k) ? `<small>${esc(keyPlayer(s, k))}</small>` : ""}</span>`;

function header(s: RoomState | null) {
  const se = s ? W.seasonById(s.season) : null;
  $("#story-season")!.textContent = s ? `👯 Temporada en directo · ${se ? se.name : ""} · Sala ${s.code}` : "👯 Temporada en directo";
  const title: Record<string, string> = { lobby: "Sala de espera", anuncio: `Episodio ${s?.ep}`, reto: s?.reto?.titulo || "El reto", pasarela: "Pasarela", resultados: "Las críticas", untucked: "Untucked", veredicto: "El veredicto", lipsync: "Lip sync for your life", track: "Track record", final: "Gran final", corona: "¡Tenemos ganadora!" };
  $("#story-ep")!.innerHTML = `${esc(s ? title[s.phase] : "Multijugador")} <span class="mp-timer" id="mp-timer"></span>`;
}
function tickTimer() {
  const s = room.state, el = $("#mp-timer");
  if (!el) return;
  if (!s || !s.deadline || s.phase === "lobby" || s.phase === "corona") { el.textContent = ""; return; }
  const left = Math.max(0, Math.ceil((s.deadline - room.now()) / 1000));
  el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  el.classList.toggle("hurry", left <= 15);
}

// ---------------------------------- Sin sala: crear o unirse ----------------------------------
function entry() {
  shell(true);
  header(null);
  const online = !!(W.DFTC_NET && W.DFTC_NET.enabled);
  body().innerHTML = `
    <div class="story-card mp-entry">
      <p class="eyebrow">👯 Temporada en directo</p>
      <h3>Una temporada con tus amigas, a la vez</h3>
      <p class="muted">Cada una es una reina; el resto del reparto lo juega el juego. Cada fase tiene tiempo tope: si alguien no entrega, la temporada sigue sin esperar.${online ? "" : " <b>Sin servidor:</b> de momento solo funciona entre pestañas de este navegador."}</p>
      <label class="mp-field">Tu nombre <input id="mp-name" maxlength="12" value="${esc(myName())}"></label>
      <div class="mp-cols">
        <div class="mp-col">
          <h4>Crear sala</h4>
          <label class="mp-field">Temporada <select id="mp-season">${seasons().map((s) => `<option value="${s.id}">${esc(s.name)} · ${s.cast.length} reinas</option>`).join("")}</select></label>
          <label class="mp-field">Ritmo <select id="mp-ritmo"><option value="normal">Normal · ${Math.round(topeEpisodio("normal") / 60)} min por episodio</option><option value="rapido">Rápido · ${Math.round(topeEpisodio("rapido") / 60)} min por episodio</option></select></label>
          <button class="btn btn-primary" id="mp-create">Crear sala</button>
        </div>
        <div class="mp-col">
          <h4>Unirse</h4>
          <label class="mp-field">Código de la sala <input id="mp-code" maxlength="5" placeholder="ABCDE" autocapitalize="characters"></label>
          <button class="btn btn-primary" id="mp-join">Unirse</button>
        </div>
      </div>
      <button class="btn btn-ghost" id="mp-back">Volver</button>
    </div>`;
  const nm = () => { const v = ($("#mp-name") as HTMLInputElement).value.trim().slice(0, 12) || "Reina"; W.store?.set("dftc-name", v); return v; };
  $("#mp-create")!.onclick = () => { room.create(nm(), ($("#mp-season") as HTMLSelectElement).value, ($("#mp-ritmo") as HTMLSelectElement).value as Ritmo); };
  $("#mp-join")!.onclick = () => { const c = ($("#mp-code") as HTMLInputElement).value.trim().toUpperCase(); if (c.length === 5) { room.join(c, nm()); body().innerHTML = `<div class="story-card"><h3>Entrando en la sala ${esc(c)}...</h3></div>`; } };
  $("#mp-back")!.onclick = exit;
}

// ---------------------------------- Con sala ----------------------------------
function render(s: RoomState) {
  header(s);
  const mine = s.players.find((p) => p.id === room.me);
  // Cambió la fase: si estaba jugando algo de otra fase, se corta
  if (playing && (playing.ep !== s.ep || playing.phase !== s.phase)) { api().abort(); playing = null; }
  if (s.phase !== "lobby" && !begun) {
    const q = mine?.queen || castOf(s.season)[0];
    api().begin(q, s.season, castOf(s.season).filter((x) => x !== q));
    begun = true;
  }
  if (begun) api().setEp(s.ep, aliveKeys(s).map((k) => keyQueen(s, k)).filter((x) => x && x !== mine?.queen));
  const me = mine && mine.alive && mine.queen ? mine : null;
  const sub = s.subs[room.me] || {};
  if (s.phase === "lobby") return lobby(s);
  if (s.phase === "anuncio") return info(`<p class="eyebrow">Episodio ${s.ep}</p><h3>${esc(s.reto!.titulo)}</h3><p>${esc(s.reto!.desc)}</p>${s.reto!.cat ? `<p class="twist-note">👠 Pasarela de la semana: <b>«${esc(s.reto!.cat.n)}»</b>. ${esc(s.reto!.cat.d)}</p>` : ""}<p class="muted">Quedan ${aliveKeys(s).length} reinas. Tope de este episodio: ${Math.round(topeEpisodio(s.ritmo) / 60)} minutos.</p>`);
  if (s.phase === "reto") {
    if (me && sub.reto == null && sub.final == null) return play(s, "reto", (el) => api().play(s.reto!.tipo, s.reto!.titulo, el, (raw: number) => {
      const data = s.reto!.noRunway ? { reto: raw, final: api().finalScore(s.reto!.tipo, raw, null) } : { reto: raw };
      playing = null; room.submit(data);
    }));
    return waiting(s, "reto");
  }
  if (s.phase === "pasarela") {
    if (me && sub.final == null) return play(s, "pasarela", (el) => api().runway(el, s.reto!.cat!.n, (walk: number) => {
      const raw = (room.state!.subs[room.me] || {}).reto ?? 30;
      playing = null; room.submit({ final: api().finalScore(s.reto!.tipo, raw, walk) });
    }));
    return waiting(s, "pasarela");
  }
  if (s.phase === "resultados") return info(`<p class="eyebrow">Supremme tiene algo que deciros</p><div class="mp-crit">${(s.crit || []).map((c) => `<div class="mp-crit-row">${face(s, c.key)}<div>${c.lines.map(([who, t]) => `<p><b>${esc(who)}:</b> ${esc(t)}</p>`).join("")}</div></div>`).join("")}</div>`);
  if (s.phase === "untucked") return untucked(s);
  if (s.phase === "veredicto") {
    const rows = s.rows || [];
    const grp = (labs: string[], t: string, cls: string) => { const r = rows.filter((x) => labs.includes(x.label)); return r.length ? `<div class="v-row ${cls}"><b>${t}</b><div class="call-faces">${r.map((x) => face(s, x.key)).join("")}</div></div>` : ""; };
    return info(`<p class="eyebrow">Las decisiones del jurado</p><div class="verdict">${grp(["WIN"], "👑 Ganadora del reto", "win")}${grp(["HIGH"], "✨ Buen trabajo, estáis a salvo", "high")}${grp(["SAFE"], "🙂 A salvo", "high")}${grp(["LOW"], "😬 A salvo... por los pelos", "low")}${grp(["BTM2"], "💔 Bottom: lip sync for your life", "btm")}</div>`);
  }
  if (s.phase === "lipsync" || s.phase === "final") return lipsync(s, me ? pkey(me.id) : null);
  if (s.phase === "track") return info(`${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}${track(s)}`);
  if (s.phase === "corona") return info(`<p class="eyebrow">Gran final</p><h3>👑 ${esc(keyName(s, s.champion!))}${keyPlayer(s, s.champion!) ? ` (${esc(keyPlayer(s, s.champion!))})` : ""}, ¡eres la ganadora!</h3>${track(s)}<button class="btn btn-primary" id="mp-exit2">Salir</button>`, () => { $("#mp-exit2")!.onclick = exit; });
}

function info(html: string, after?: () => void) {
  body().innerHTML = `<div class="story-card mp-card">${html}</div>`;
  after && after();
}
function waiting(s: RoomState, phase: "reto" | "pasarela") {
  const ps = alivePlayers(s);
  const done = ps.filter((p) => (phase === "reto" ? s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null : s.subs[p.id]?.final != null));
  const mine = s.players.find((p) => p.id === room.me);
  info(`<p class="eyebrow">${phase === "reto" ? esc(s.reto!.titulo) : `Pasarela: «${esc(s.reto!.cat?.n)}»`}</p><h3>${mine && mine.alive ? "Entregado. Esperando a las demás..." : "Estás viendo la temporada"}</h3><p>${done.length}/${ps.length} han terminado. Si alguna no llega a tiempo, se sigue sin ella.</p><div class="call-faces">${ps.map((p) => face(s, pkey(p.id), done.includes(p) ? "ok" : "wait")).join("")}</div>`);
}
function play(s: RoomState, phase: string, start: (el: HTMLElement) => void) {
  if (playing && playing.ep === s.ep && playing.phase === phase && $("#mp-play")) return; // ya en marcha: no se toca
  body().innerHTML = `<div id="mp-play"></div>`;
  playing = { ep: s.ep, phase };
  start($("#mp-play")!);
}
function untucked(s: RoomState) {
  info(`<p class="eyebrow">Mientras el jurado delibera...</p><div class="mp-chat" id="mp-chat"></div><form id="mp-chat-f" class="mp-chat-f"><input id="mp-chat-i" maxlength="200" placeholder="Di algo en el Untucked..." autocomplete="off"><button class="btn btn-primary">Enviar</button></form>`, () => {
    drawChat();
    $("#mp-chat-f")!.onsubmit = (e) => { e.preventDefault(); const i = $("#mp-chat-i") as HTMLInputElement; const t = i.value.trim(); if (t) { room.chat(myName(), t); i.value = ""; } };
    ($("#mp-chat-i") as HTMLInputElement).focus();
  });
}
function drawChat() {
  const box = $("#mp-chat");
  if (!box) return;
  box.innerHTML = chatLog.slice(-40).map((m) => `<p class="${m.me ? "me" : ""}"><b>${esc(m.name)}:</b> ${esc(m.text)}</p>`).join("") || `<p class="muted">Nadie ha dicho nada todavía.</p>`;
  box.scrollTop = box.scrollHeight;
}
function lipsync(s: RoomState, myKey: string | null) {
  const pairs = s.pairs || [];
  const mine = myKey ? pairs.find((p) => (p.a === myKey || p.b === myKey) && !p.winner) : null;
  if (mine && !(s.subs[room.me] || {}).ls) {
    const rivalKey = mine.a === myKey ? mine.b : mine.a;
    return play(s, s.phase, (el) => api().lipsync(el, keyQueen(s, rivalKey), (won: boolean, score: number) => { playing = null; room.submit({ ls: { won, score } }); }));
  }
  info(`<p class="eyebrow">${s.phase === "final" ? (s.finalStage === 2 ? "👑 Lip sync por la corona" : "Gran final · semifinales") : "Lip sync for your life"}</p>${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}${pairs.map((p) => `<div class="mp-vs">${face(s, p.a)}<span>VS</span>${face(s, p.b)}</div>`).join("")}<p class="muted">${pairs.some((p) => isP(p.a) || isP(p.b)) ? "Las jugadoras del lip sync están bailando..." : "Las reinas lo dan todo en el escenario..."}</p>`);
}
function track(s: RoomState) {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const all = [...aliveKeys(s), ...s.out.slice().reverse().map((o) => o.key)];
  const cls = (l: string) => ({ WIN: "t-win", WINNER: "t-win", HIGH: "t-high", SAFE: "t-safe", LOW: "t-low", BTM2: "t-btm", ELIM: "t-elim", "RUNNER-UP": "t-runner", "3ª": "t-third" } as Record<string, string>)[l] || "t-none";
  const lab = (l: string) => ({ WINNER: "GANADORA", "RUNNER-UP": "FINALISTA", ELIM: "ELIM" } as Record<string, string>)[l] || l;
  const place = (k: string, i: number) => s.out.find((o) => o.key === k)?.place || (s.champion === k ? "1º" : `${i + 1}º`);
  return `<div class="track-wrap"><table class="track"><thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(s.epNames[e])}</small></th>`).join("")}</tr></thead><tbody>${all
    .map((k, i) => `<tr class="${k === pkey(room.me) ? "me" : ""} ${s.out.some((o) => o.key === k) ? "out" : ""}"><td class="rk">${esc(place(k, i))}</td><td class="qn"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(keyName(s, k))}${keyPlayer(s, k) ? ` <b>(${esc(keyPlayer(s, k))})</b>` : ""}</span></td>${eps.map((e) => { const l = (s.track[k] || {})[e]; return `<td class="${l ? cls(l) : "t-none"}">${l ? lab(l) : ""}</td>`; }).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}
function lobby(s: RoomState) {
  const se = W.seasonById(s.season);
  const cast = castOf(s.season);
  const taken = new Map(s.players.filter((p) => p.queen).map((p) => [p.queen!, p]));
  const mine = s.players.find((p) => p.id === room.me);
  const ready = s.players.length >= 1 && s.players.every((p) => p.queen);
  info(`
    <p class="eyebrow">Sala ${esc(s.code)} · ${esc(se?.name || "")} · ritmo ${s.ritmo === "rapido" ? "rápido" : "normal"}</p>
    <h3>Código de la sala: <span class="mp-code">${esc(s.code)}</span></h3>
    <p class="muted">Pásaselo a tus amigas. Cada una elige una reina; las que no cojáis las juega el juego. Tope por episodio: ${Math.round(topeEpisodio(s.ritmo) / 60)} minutos (reto ${Math.round(DURACION[s.ritmo].reto / 60)} min, pasarela ${Math.round(DURACION[s.ritmo].pasarela / 60)} min, lip sync ${DURACION[s.ritmo].lipsync} s).</p>
    <div class="mp-players">${s.players.map((p) => `<span class="mp-face ${p.id === room.me ? "me" : ""}"><i style="background-image:url('${p.queen ? Q(p.queen).photo : ""}')"></i><b>${esc(p.name)}${p.id === s.host ? " 👑" : ""}</b><small>${p.queen ? esc(Q(p.queen).name) : "eligiendo..."}</small></span>`).join("")}</div>
    <h4>${mine?.queen ? "Tu reina: " + esc(Q(mine.queen).name) : "Elige tu reina"}</h4>
    <div class="mp-cast">${cast.map((id) => { const t = taken.get(id); return `<button class="mp-q ${t ? (t.id === room.me ? "mine" : "taken") : ""}" data-q="${id}" ${t && t.id !== room.me ? "disabled" : ""}><i style="background-image:url('${Q(id).photo}')"></i><span>${esc(Q(id).name)}</span>${t ? `<small>${esc(t.name)}</small>` : ""}</button>`; }).join("")}</div>
    <div class="row">
      <button class="btn btn-ghost" id="mp-exit">Salir</button>
      ${room.isHost ? `<button class="btn btn-primary" id="mp-start" ${ready ? "" : "disabled"}>${ready ? "¡Empezar la temporada!" : "Esperando a que todas elijan"}</button>` : `<p class="muted">La anfitriona empezará cuando estéis todas.</p>`}
    </div>`, () => {
    document.querySelectorAll<HTMLButtonElement>(".mp-q").forEach((b) => (b.onclick = () => room.pick(b.dataset.q!)));
    $("#mp-exit")!.onclick = exit;
    const st = $("#mp-start");
    if (st) st.onclick = () => room.start();
  });
}

function exit() {
  if (playing) api().abort();
  playing = null;
  room.leave();
  if (begun) api().end();
  begun = false;
  chatLog = [];
  clearInterval(timer);
  shell(false);
  $("#screen-story")!.classList.remove("mp");
  W.UI.show("menu");
}

room.onChange = (s) => render(s);
(window as any).__mpRoom = room; // para depurar desde la consola
room.onChat = (m) => { chatLog.push({ name: m.name, text: m.text, me: m.from === room.me }); drawChat(); };

export function openMultiplayer() {
  clearInterval(timer);
  timer = window.setInterval(tickTimer, 250);
  if (room.state) return render(room.state);
  entry();
}
// El botón «Guardar y salir» del modo historia, en la temporada en directo, sale de la sala
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest?.("#story-exit");
  if (b && $("#screen-story")?.classList.contains("mp")) { e.stopImmediatePropagation(); e.preventDefault(); if (confirm("¿Salir de la temporada en directo?")) exit(); }
}, true);
document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest?.("#btn-mp")) openMultiplayer();
});
