// Pantallas de la temporada en directo (dentro de la pantalla del modo historia, con su propio flujo)
import { Room } from "./room";
import { carousel } from "../ui/carousel";
import { ask } from "../ui/confirm";
import { DURACION, IA_EXTRA, topeEpisodio, alivePlayers, aliveKeys, standings, ppeOf, planCats, isWatch, isP, idOf, pkey, type RoomState, type Engine, type Ritmo } from "./model";

const W = window as any;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const api = () => W.Story.mp;
// Cada reina con el look de la temporada de la sala (en All Stars, sus fotos de All Stars)
const Q = (id: string, season?: string) => api().queen(id, season || room?.state?.season) || { id, name: id, photo: "", sprite: "" };

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
if (new URLSearchParams(location.search).has("mpfast")) Object.values(DURACION).forEach((d: Record<string, number>) => Object.keys(d).forEach((k) => (d[k] = d[k] > 0 ? Math.max(4, Math.round(d[k] / 4)) : 0)));
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
  const ex = $("#story-exit");
  if (ex && $("#screen-story")?.classList.contains("mp")) ex.innerHTML = s && !s.paused ? "<i>←</i><span>Salir de la sala</span>" : "<i>←</i><span>Volver</span>";
  const se = s ? W.seasonById(s.season) : null;
  $("#story-season")!.textContent = s ? `👯 Temporada en directo · ${se ? se.name : ""} · Sala ${s.code}` : "👯 Temporada en directo";
  const title: Record<string, string> = { lobby: "Sala de espera", maletas: "Maletas", anuncio: `Episodio ${s?.ep}`, reto: s?.reto?.titulo || "El reto", pasarela: "Pasarela", resultados: "Las críticas", untucked: "Untucked", veredicto: "El veredicto", lipsync: s && s.fmt === "allstars" ? "Lip sync por el poder" : "Lip sync for your life", decision: "Los pintalabios", pintalabios: "El pintalabios", track: "Track record", final: "Gran final", corona: "¡Tenemos ganadora!" };
  $("#story-ep")!.innerHTML = `${esc(s ? (s.paused ? "Pausada" : title[s.phase]) : "Multijugador")} <span class="mp-timer" id="mp-timer"></span>`;
  // Pausa (con acuerdo de todas): solo con la temporada en marcha
  let pb = $("#mp-pause");
  const canPause = !!s && !["lobby", "corona"].includes(s.phase) && !s.paused;
  if (!pb && canPause) { pb = document.createElement("button"); pb.id = "mp-pause"; pb.className = "hud-btn"; pb.innerHTML = "<i>⏸️</i><span>Pausar</span>"; $("#story-exit")?.before(pb); }
  if (pb) { pb.hidden = !canPause; pb.toggleAttribute("disabled", !!s?.pause); pb.title = s?.pause ? "Votando la pausa..." : "Proponer pausar y guardar"; }
  if (s?.pause) $("#story-ep")!.innerHTML += ` <span class="mp-timer">⏸️ Votando pausa (${Object.keys(s.pause.votes).length}/${s.players.length})</span>`;
}
function tickTimer() {
  const s = room.state, el = $("#mp-timer");
  if (!el) return;
  if (s && !s.deadline && s.ritmo === "libre" && !["lobby", "corona"].includes(s.phase)) { el.textContent = "∞ sin límite"; el.classList.remove("hurry"); return; }
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
  const iaOk = !!api().iaReady();
  body().innerHTML = `
    <div class="story-card mp-entry">
      <h3>Una temporada con tus amigas, a la vez</h3>
      <p class="muted">Cada una es una reina; el resto del reparto lo juega el juego.${online ? "" : " <b>Sin servidor:</b> de momento solo funciona entre pestañas de este navegador."}</p>
      <div class="mp-toprow">
        <label class="mp-field">Tu nombre <input id="mp-name" maxlength="12" value="${esc(myName())}"></label>
        <div class="mp-join">
          <span class="mp-lbl">¿Tienes un código?</span>
          <div class="mp-join-row"><input id="mp-code" maxlength="5" placeholder="ABCDE" autocapitalize="characters" aria-label="Código de la sala"><button class="btn btn-primary" id="mp-join">Unirse</button></div>
        </div>
      </div>
      ${savedHTML()}
      <div class="mp-create">
        <h4>O crea una sala: elige temporada</h4>
        <div class="car mp-car" id="mp-seasons" aria-roledescription="carrusel" aria-label="Temporadas">
          <button type="button" class="mode-arrow car-prev prev" aria-label="Temporada anterior">‹</button>
          <div class="car-track mp-track">${seasons().map((se) => { const cover = (W.PORTADAS || {})[se.id]; return `<button type="button" class="mp-season" data-id="${se.id}" aria-label="${esc(se.name)}" style="${cover ? `background-image:url('${cover}')` : ""}"><span class="mps-top"><b>${esc(se.name)}</b><small>${api().formato(se.id) === "allstars" ? "" : se.year || ""}</small></span><span class="mps-faces">${(se.cast as string[]).slice(0, 7).map((id) => `<i style="background-image:url('${Q(id, se.id).photo}')"></i>`).join("")}</span><span class="mps-cast">${se.cast.length} reinas</span></button>`; }).join("")}</div>
          <button type="button" class="mode-arrow car-next next" aria-label="Temporada siguiente">›</button>
          <div class="car-dots modes-dots" role="tablist"></div>
        </div>
        <div class="mp-createrow">
  <div class="mp-ritmo" role="radiogroup" aria-label="Ritmo">
          <button type="button" role="radio" data-r="normal"><b>Normal</b><small>${Math.round(topeEpisodio("normal") / 60)} min por episodio</small></button>
          <button type="button" role="radio" data-r="rapido"><b>Rápido</b><small>${Math.round(topeEpisodio("rapido") / 60)} min por episodio</small></button>
          <button type="button" role="radio" data-r="libre"><b>Sin límite</b><small>Se espera a todas</small></button>
        </div>
          ${iaOk ? `<label class="mp-ia"><input type="checkbox" id="mp-ia" ${W.store?.get("dftc-mp-ia", true) ? "checked" : ""}><span><b>✍️ Retos con IA</b><small>Cada una puede escribir sus frases (el reto dura más)</small></span></label>` : ""}
          <button class="btn btn-primary" id="mp-create">Crear sala</button>
        </div>
      </div>
    </div>`;
  const nm = () => { const v = ($("#mp-name") as HTMLInputElement).value.trim().slice(0, 12) || "Reina"; W.store?.set("dftc-name", v); return v; };
  const car = carousel($("#mp-seasons")!, { storageKey: "dftc-mp-season", keys: () => !!$("#mp-seasons") });
  let ritmo: Ritmo = (W.store?.get("dftc-mp-ritmo", "normal") as Ritmo) || "normal";
  const pickRitmo = (r: Ritmo) => { ritmo = r; W.store?.set("dftc-mp-ritmo", r); document.querySelectorAll<HTMLElement>(".mp-ritmo [data-r]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.r === r))); };
  pickRitmo(["normal", "rapido", "libre"].includes(ritmo) ? ritmo : "normal");
  document.querySelectorAll<HTMLElement>(".mp-ritmo [data-r]").forEach((b) => (b.onclick = () => pickRitmo(b.dataset.r as Ritmo)));
  const seasonEls = document.querySelectorAll<HTMLElement>(".mp-season");
  $("#mp-create")!.onclick = () => {
    const id = seasonEls[Math.max(0, car.active)].dataset.id!;
    const ia = iaOk && !!($("#mp-ia") as HTMLInputElement | null)?.checked;
    W.store?.set("dftc-mp-ia", ia);
    room.create(nm(), id, ritmo, { fmt: api().formato(id), ia });
  };
  $("#mp-join")!.onclick = () => { const c = ($("#mp-code") as HTMLInputElement).value.trim().toUpperCase(); if (c.length === 5) { room.join(c, nm()); body().innerHTML = `<div class="story-card"><h3>Entrando en la sala ${esc(c)}...</h3></div>`; } };
  const back = $("#mp-back"); if (back) back.onclick = exit;
  // Partidas pausadas: la reabre una (lleva la sala) y las demás vuelven a entrar con el código
  document.querySelectorAll<HTMLElement>("[data-resume]").forEach((b) => (b.onclick = () => {
    const sv = savedAll()[b.dataset.resume!];
    if (!sv) return;
    pendingLocal = sv.local;
    room.resume(sv.state, sv.me);
  }));
  document.querySelectorAll<HTMLElement>("[data-rejoin]").forEach((b) => (b.onclick = () => {
    const sv = savedAll()[b.dataset.rejoin!];
    if (!sv) return;
    pendingLocal = sv.local;
    room.rejoin(sv.state.code, sv.name, sv.me);
    body().innerHTML = `<div class="story-card"><h3>Entrando en la sala ${esc(sv.state.code)}...</h3><p class="muted">Si nadie la ha reabierto todavía, ábrela tú con «Reabrir».</p></div>`;
  }));
  document.querySelectorAll<HTMLElement>("[data-forget]").forEach((b) => (b.onclick = () => ask("La partida guardada se borrará de este dispositivo.", { title: "¿Borrar la partida guardada?", ok: "Borrar", icon: "🗑️", danger: true }).then((y) => { if (y) { savedPut(b.dataset.forget!, null); entry(); } })));
}
function savedHTML() {
  const list = Object.values(savedAll()).sort((a, b) => b.date - a.date);
  if (!list.length) return "";
  return `<div class="mp-saved"><h4>⏸️ Partidas pausadas</h4>${list.map((sv) => { const se = W.seasonById(sv.state.season); const mine = sv.state.players.find((p) => p.id === sv.me); return `<div class="mp-saved-row"><span><b>${esc(se?.name || sv.state.season)}</b> · sala ${esc(sv.state.code)} · episodio ${sv.state.ep} · ${esc(sv.name)}<small>${esc(sv.state.players.map((p) => p.name).join(", "))}${mine?.queen ? ` · tú: ${esc(Q(mine.queen, sv.state.season).name)}` : ""}</small></span><span class="mp-saved-btns"><button class="btn btn-primary" data-resume="${esc(sv.state.code)}:${esc(sv.me)}">Reabrir</button><button class="btn btn-ghost" data-rejoin="${esc(sv.state.code)}:${esc(sv.me)}">Volver a entrar</button><button class="btn btn-ghost small-btn" data-forget="${esc(sv.state.code)}:${esc(sv.me)}" aria-label="Borrar">🗑️</button></span></div>`; }).join("")}</div>`;
}

// ---------------------------------- Con sala ----------------------------------
const AS = (s: RoomState) => s.fmt === "allstars";
const names = (s: RoomState, ks: string[]) => ks.map((k) => keyName(s, k)).join(", ").replace(/, ([^,]*)$/, " y $1");
const SPEAKER: Record<string, string> = { Supremme: "host", "Supremme de Luxe": "host", "Ana Locking": "judge", "Javier Ambrossi": "ambrossi", "Javier Calvo": "calvo" };
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const hostName = (s: RoomState) => s.players.find((p) => p.id === s.host)?.name || "la anfitriona";
/** Rellena los huecos de los textos de siempre ({reto}, {temporada}...) para que todas lean lo mismo. */
const fillTxt = (s: RoomState, t: string) => t.replace(/\{reto\}/g, s.reto?.titulo || "").replace(/\{temporada\}/g, W.seasonById(s.season)?.name || "").replace(/\{yo\}/g, "reinas").replace(/\{r\d\}/g, "reina");

// ------------------------------ Guardar y reanudar ------------------------------
const SAVED_KEY = "dftc-mp-saved";
type Saved = { state: RoomState; me: string; name: string; local: any; date: number };
// Una clave por partida y jugadora (así dos pestañas o dos guardados a la vez no se pisan)
const savedAll = (): Record<string, Saved> => {
  const out: Record<string, Saved> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (!k.startsWith(SAVED_KEY + ":")) continue;
      const v = JSON.parse(localStorage.getItem(k) || "null");
      if (v && v.state) out[k.slice(SAVED_KEY.length + 1)] = v;
    }
  } catch { /* almacenamiento no disponible */ }
  return out;
};
const savedPut = (id: string, v: Saved | null) => { try { if (v) localStorage.setItem(`${SAVED_KEY}:${id}`, JSON.stringify(v)); else localStorage.removeItem(`${SAVED_KEY}:${id}`); } catch { /* sin espacio */ } };
// Las maletas de cada una viven en su navegador: se guardan al prepararlas por si se recarga la página
const localKey = (code: string) => `dftc-mp-local-${code}-${room.me}`;
const saveLocal = (code: string) => { try { localStorage.setItem(localKey(code), JSON.stringify(api().local())); } catch { /* sin espacio */ } };
const loadLocal = (code: string) => { try { return JSON.parse(localStorage.getItem(localKey(code)) || "null"); } catch { return null; } };

// ------------------------------ Pantallas que lleva la anfitriona ------------------------------
// La anfitriona pasa cada línea y cada tarjeta; las demás ven exactamente lo mismo que ella.
let typedKey = "";
function watch(s: RoomState, set: string, build: () => [string, string][], card: () => string, after?: () => void) {
  api().scene(set);
  const key = `${s.ep}:${s.phase}:${s.finalStage || 0}`;
  if (!s.script || s.script.key !== key) {
    if (room.isHost) { room.script(key, build().map(([w, t]) => [w, fillTxt(s, t)] as [string, string])); return; }
    return info(`<p class="muted">${esc(hostName(s))} está preparando la siguiente pantalla...</p>`);
  }
  const { lines, i } = s.script;
  const ctl = room.isHost
    ? `<button class="btn btn-primary mp-next" id="mp-next">${i < lines.length ? "Seguir ▸" : "Continuar ▸"}</button>`
    : `<p class="mp-follow">👑 ${esc(hostName(s))} lleva el ritmo</p>`;
  if (i < lines.length) {
    const [who, txt] = lines[i];
    const w = api().speaker(who);
    const lineKey = `${key}:${i}`;
    body().innerHTML = `
      <div class="dlg mp-dlg">
        ${w.img ? `<img class="dlg-char ${w.side}" src="${esc(w.img)}" alt="">` : ""}
        <div class="dlg-box">
          <p class="dlg-name">${esc(w.name)} <small>${esc(w.role)}</small></p>
          <p class="dlg-text"></p>
          <div class="mp-dlg-foot"><span class="mp-dlg-count">${i + 1}/${lines.length}</span>${ctl}</div>
        </div>
      </div>`;
    const el = body().querySelector<HTMLElement>(".dlg-text")!;
    if (typedKey === lineKey) el.textContent = txt;
    else { typedKey = lineKey; typeText(el, txt); }
    if (room.isHost) body().querySelector(".dlg")!.addEventListener("click", hostStep);
    return;
  }
  info(`${card()}<div class="mp-hostbar">${ctl}</div>`, after);
}
let typing = 0;
function typeText(el: HTMLElement, full: string) {
  clearInterval(typing);
  let n = 0;
  typing = window.setInterval(() => { n += 2; el.textContent = full.slice(0, n); if (n >= full.length) clearInterval(typing); }, 20);
}
function hostStep(e?: Event) {
  if (e && (e.target as HTMLElement).closest?.("input, textarea, form, .mp-chat")) return;
  if (room.isHost && room.state && isWatch(room.state.phase)) room.next();
}
document.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest?.("#mp-next")) { e.stopPropagation(); hostStep(); } }, true);
document.addEventListener("keydown", (e) => {
  if (!room.state || !room.isHost || !$("#screen-story")?.classList.contains("mp") || document.querySelector(".app-ask")) return;
  if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
  if ((e.code === "Space" || e.code === "Enter") && isWatch(room.state.phase) && (document.querySelector(".mp-dlg") || document.querySelector("#mp-next"))) { e.preventDefault(); hostStep(); }
});

function render(s: RoomState) {
  header(s);
  const mine = s.players.find((p) => p.id === room.me);
  // Pausa: con el sí de todas se guarda y se sale
  if (s.paused) return pausedOut(s);
  if (s.pause) askPause(s);
  // Cambió la fase: si estaba jugando algo de otra fase, se corta
  if (playing && (playing.ep !== s.ep || playing.phase !== s.phase)) { api().abort(); playing = null; }
  if (s.phase !== "lobby" && !begun) {
    const q = mine?.queen || castOf(s.season)[0];
    api().begin(q, s.season, castOf(s.season).filter((x) => x !== q), { ia: !!s.ia, local: pendingLocal || loadLocal(s.code) });
    pendingLocal = null;
    begun = true;
  }
  if (begun) api().setEp(s.ep, aliveKeys(s).map((k) => keyQueen(s, k)).filter((x) => x && x !== mine?.queen));
  const me = mine && mine.alive && mine.queen ? mine : null;
  const sub = s.subs[room.me] || {};
  if (s.phase === "lobby") { api().scene("werkroom"); return lobby(s); }
  if (s.phase === "maletas") return maletas(s, me);
  if (s.phase === "anuncio") {
    const rv = revealOf(s);
    return watch(s, "werkroom", () => {
      const lines: [string, string][] = [...(rv ? [["host", `Antes de empezar... ${keyName(s, rv.by)}, ¿a quién habías elegido tú la semana pasada?`] as [string, string]] : []), ...api().announceLines(s.ep, s.season)];
      if (s.reto!.cat) lines.push(["judge", `Y en la pasarela quiero veros con «${s.reto!.cat.n}». ${s.reto!.cat.d || ""}`.trim()]);
      if (AS(s) && s.ep === 1) lines.push(["host", "Recordad: esto es un All Stars. Las dos mejores de cada semana harán un lip sync por el poder, y antes cada una elegirá en secreto su pintalabios."]);
      return lines;
    }, () => `${revealHTML(s)}<p class="eyebrow">Episodio ${s.ep}${AS(s) ? " · All Stars" : ""}</p><h3>${esc(s.reto!.titulo)}</h3><p>${esc(s.reto!.desc)}</p>${s.reto!.cat ? `<p class="twist-note">👠 Pasarela de la semana: <b>«${esc(s.reto!.cat.n)}»</b>. ${esc(s.reto!.cat.d)}${me ? " Tu look ya está en la maleta." : ""}</p>` : ""}${s.ia ? `<p class="muted">✍️ Con IA: puedes hacerlo en directo, escribiendo tus frases.</p>` : ""}<p class="muted">Quedan ${aliveKeys(s).length} reinas. ${s.ritmo === "libre" ? "Sin límite de tiempo: se espera a que entreguéis todas." : `Para jugar el reto tenéis ${Math.round(((DURACION[s.ritmo].reto * (s.ia ? IA_EXTRA : 1)) / 60))} minutos.`}</p>`);
  }
  if (s.phase === "reto") {
    api().scene("werkroom");
    if (me && sub.reto == null && sub.final == null) return play(s, "reto", (el) => api().play(s.reto!.tipo, s.reto!.titulo, el, (raw: number, jury: string) => {
      const data = s.reto!.noRunway ? { reto: raw, jury, final: api().finalScore(s.reto!.tipo, raw, null, !!jury) } : { reto: raw, jury };
      playing = null; room.submit(data);
    }));
    return waiting(s, "reto");
  }
  if (s.phase === "pasarela") {
    api().scene("stage");
    if (me && sub.final == null) return play(s, "pasarela", (el) => api().runway(el, s.reto!.cat!.n, (walk: number) => {
      const mineSub = room.state!.subs[room.me] || {};
      const raw = mineSub.reto ?? 30;
      playing = null; saveLocal(s.code); room.submit({ final: api().finalScore(s.reto!.tipo, raw, walk, !!mineSub.jury) });
    }));
    return waiting(s, "pasarela");
  }
  if (s.phase === "resultados") {
    return watch(s, "panel", () => {
      const lines: [string, string][] = [["host", pick(["Reinas, ha llegado el momento de las críticas.", "Vamos con las valoraciones del jurado.", "Señoritas, el jurado tiene mucho que decir."])]];
      (s.crit || []).forEach((c) => c.lines.forEach(([who, t]) => lines.push([SPEAKER[who] || "host", t])));
      return lines;
    }, () => `<p class="eyebrow">Las críticas del jurado</p><div class="mp-crit">${(s.crit || []).map((c) => `<div class="mp-crit-row">${face(s, c.key)}<div>${c.lines.map(([who, t]) => `<p><b>${esc(who)}:</b> ${esc(t)}</p>`).join("")}</div></div>`).join("")}</div>`);
  }
  if (s.phase === "untucked") return untucked(s);
  if (s.phase === "veredicto") {
    const rows = s.rows || [];
    const of = (l: string) => rows.filter((x) => x.label === l).map((x) => x.key);
    const grp = (labs: string[], t: string, cls: string) => { const r = rows.filter((x) => labs.includes(x.label)); return r.length ? `<div class="v-row ${cls}"><b>${t}</b><div class="call-faces">${r.map((x) => face(s, x.key)).join("")}</div></div>` : ""; };
    return watch(s, "panel", () => AS(s)
      ? [["host", "Reinas, he tomado algunas decisiones."], ["host", `${names(s, of("TOP2"))}: sois las dos mejores de la semana. ¡Os vais a jugar el poder en un lip sync!`], ["host", `${names(s, of("BTM2"))}: lo siento, estáis en el bottom. Una de vosotras se irá a casa.`]]
      : [["host", "Reinas, he tomado algunas decisiones."], ["host", `${names(s, of("WIN"))}, ¡enhorabuena, has ganado el reto!`], ["host", `${names(s, of("BTM2"))}: es la hora de que hagáis el lip sync for your life.`]],
    () => `<p class="eyebrow">Las decisiones del jurado</p><div class="verdict">${AS(s) ? grp(["TOP2"], "💄 Top 2: lip sync por el poder", "win") : grp(["WIN"], "👑 Ganadora del reto", "win")}${grp(["HIGH"], "✨ Buen trabajo, estáis a salvo", "high")}${grp(["SAFE"], "🙂 A salvo", "high")}${grp(["LOW"], "😬 A salvo... por los pelos", "low")}${grp(["BTM2"], AS(s) ? "💔 Bottom: una se irá con el pintalabios" : "💔 Bottom: lip sync for your life", "btm")}</div>`);
  }
  if (s.phase === "lipsync" || s.phase === "final") { api().scene("stage"); return lipsync(s, me ? pkey(me.id) : null); }
  if (s.phase === "decision") { api().scene("panel"); return decision(s); }
  if (s.phase === "pintalabios") return lipstickReveal(s);
  if (s.phase === "track") return watch(s, "werkroom", () => [], () => `${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}<h3>Track record</h3>${track(s)}`);
  if (s.phase === "corona") {
    savedPut(`${s.code}:${room.me}`, null);
    const champ = keyName(s, s.champion!);
    return watch(s, "stage", () => [["host", "Reinas, ha llegado el momento."], ["host", `La ganadora de esta temporada en directo es... ¡${champ}!`], ["judge", "Larga vida a la reina."]],
      () => `<p class="eyebrow">Gran final</p><h3>👑 ${esc(champ)}${keyPlayer(s, s.champion!) ? ` (${esc(keyPlayer(s, s.champion!))})` : ""}, ¡eres la ganadora!</h3>${track(s)}<button class="btn btn-primary" id="mp-exit2">Salir</button>`,
      () => { $("#mp-exit2")!.onclick = exit; if (!crownShown) { crownShown = true; W.Confetti?.burst?.(2500); } });
  }
}
let crownShown = false;
let pendingLocal: any = null;

// Antes del episodio 1: cada una prepara sus maletas con el presupuesto de la sala
function maletas(s: RoomState, me: { id: string } | null) {
  api().scene("lounge");
  const sub = s.subs[room.me] || {};
  if (me && !sub.ready) {
    const cats = planCats(s);
    return play(s, "maletas", (el) => api().maletas(el, cats, api().budget(cats), () => { playing = null; saveLocal(s.code); room.submit({ ready: true }); }));
  }
  const ps = alivePlayers(s);
  const done = ps.filter((p) => s.subs[p.id]?.ready);
  info(`<p class="eyebrow">🧳 Maletas</p><h3>${me ? "¡Maletas hechas! Esperando a las demás..." : "Las reinas preparan sus looks"}</h3><p>${done.length}/${ps.length} han terminado. ${s.ritmo === "libre" ? "Sin límite: se espera a todas." : "Si alguna no termina a tiempo, entra con lo que tenga."}</p><div class="call-faces">${ps.map((p) => face(s, pkey(p.id), done.includes(p) ? "ok" : "wait")).join("")}</div>${room.isHost && done.length < ps.length ? `<button class="btn btn-ghost" id="mp-skip">Empezar sin esperar</button>` : ""}`);
}

// ------------------------------ Pausa ------------------------------
let pauseAsked = "";
function askPause(s: RoomState) {
  const p = s.pause!;
  const key = `${p.by}:${p.at}`;
  if (p.votes[room.me] || pauseAsked === key) return;
  pauseAsked = key;
  const by = s.players.find((x) => x.id === p.by)?.name || "Alguien";
  ask(`${by} propone parar aquí. Se guarda la partida en el dispositivo de cada una y la podéis seguir otro día con el mismo código. Hace falta que digáis que sí todas.`, { title: "¿Pausar y guardar la temporada?", ok: "Sí, pausar", cancel: "No, seguimos", icon: "⏸️" }).then((y) => room.vote(y));
}
function pausedOut(s: RoomState) {
  const mine = s.players.find((p) => p.id === room.me);
  savedPut(`${s.code}:${room.me}`, { state: s, me: room.me, name: mine?.name || myName(), local: api().local(), date: Date.now() });
  saveLocal(s.code);
  const code = s.code;
  info(`<p class="eyebrow">⏸️ Partida pausada</p><h3>Temporada guardada</h3><p>Para seguir, una de vosotras la reabre desde Multijugador y las demás entran con el código <b class="mp-code">${esc(code)}</b>.</p><button class="btn btn-primary" id="mp-exit3">Volver al menú</button>`, () => { $("#mp-exit3")!.onclick = exit; });
}
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest?.("#mp-pause")) return;
  const s = room.state;
  if (!s || s.pause || s.paused) return;
  ask("Se pedirá su acuerdo a todas. Si todas dicen que sí, la partida se guarda y se sigue otro día.", { title: "¿Proponer una pausa?", ok: "Proponer", icon: "⏸️" }).then((y) => { if (y) room.pause(); });
});

// All Stars: pintalabios (tubo negro con el nombre de la elegida)
const lipstick = (name: string, cls = "") => `<div class="lipstick ${cls}" role="img" aria-label="Pintalabios: ${esc(name)}"><span class="ls-cap"></span><span class="ls-band"></span><span class="ls-body"><b class="${name.length > 15 ? "xlong" : name.length > 10 ? "long" : ""}">${esc(name)}</b></span></div>`;
// Antes del lip sync: las dos del top eligen en secreto (cada una ve su propia pantalla)
function decision(s: RoomState) {
  const d = s.decision!;
  const mineKey = pkey(room.me);
  const sc = (k: string) => (s.rows || []).find((r) => r.key === k)?.score ?? 0;
  const ppeTxt = (k: string) => ppeOf(s, k).toFixed(2).replace(".", ",");
  const worst = d.options.slice().sort((a, b) => sc(a) - sc(b))[0];
  const mePick = d.top.includes(mineKey) && !(s.subs[room.me] || {}).elim;
  if (mePick) {
    if (playing && playing.phase === "decision" && playing.ep === s.ep) return;
    playing = { ep: s.ep, phase: "decision" };
    return info(`<p class="eyebrow">💄 Elige tu pintalabios</p><h3>Si ganas el lip sync, ¿a quién mandas a casa?</h3><p>Tu rival también elige el suyo en secreto. Puedes mirar la semana, la temporada... o hacer la jugarreta.</p>
      <div class="ls-pick">${d.options.map((k, i) => `<button class="ls-choice" style="--i:${i}" data-k="${esc(k)}">${lipstick(keyName(s, k))}<span class="ls-face"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i>${keyPlayer(s, k) ? esc(keyPlayer(s, k)) : ""}</span><em class="as-tag ${k === worst ? "worst" : "ok"}">${k === worst ? "📉 La peor esta semana" : "Mejor esta semana"}</em><em class="as-tag ok">📈 PPE ${ppeTxt(k)}</em></button>`).join("")}</div>
      <details class="mp-track-peek"><summary>📊 Ver track record</summary>${track(s)}</details>`, () => {
      document.querySelectorAll<HTMLElement>(".ls-choice[data-k]").forEach((b) => (b.onclick = () => { playing = null; room.submit({ elim: b.dataset.k! }); info(`<p class="eyebrow">💄 Pintalabios guardado</p><h3>Si ganas, se va ${esc(keyName(s, b.dataset.k!))}</h3><p class="muted">Esperando a que tu rival elija el suyo...</p>`); }));
    });
  }
  if (d.top.includes(mineKey)) return info(`<p class="eyebrow">💄 Pintalabios guardado</p><h3>Si ganas, se va ${esc(keyName(s, (s.subs[room.me] || {}).elim || ""))}</h3><p class="muted">Esperando a que tu rival elija el suyo...</p>`);
  const done = d.top.filter((k) => !isP(k) || (s.subs[idOf(k)] || {}).elim != null);
  info(`<p class="eyebrow">💄 Los pintalabios</p><h3>${esc(names(s, d.top))} eligen en secreto</h3><p>Cada una tiene dos pintalabios: uno con el nombre de ${esc(keyName(s, d.options[0]))} y otro con el de ${esc(keyName(s, d.options[1] || d.options[0]))}. La que gane el lip sync sacará el suyo.</p><div class="ls-pair">${d.options.map((k) => lipstick(keyName(s, k), "closed")).join("")}</div><div class="call-faces">${d.top.map((k) => face(s, k, done.includes(k) ? "ok" : "wait")).join("")}</div>${d.top.some(isP) ? skipBtn(s) : ""}`);
}
// Después del lip sync: la ganadora saca su pintalabios (lo lleva la anfitriona)
function lipstickReveal(s: RoomState) {
  const d = s.decision!;
  if (!d.by || !d.go) return info(`<p class="muted">...</p>`);
  const go: string = d.go, by: string = d.by;
  const stay = d.options.find((k) => k !== go) || go;
  const ppeTxt = (k: string) => ppeOf(s, k).toFixed(2).replace(".", ",");
  const why = d.kind === "semana" ? "Ha mandado a casa a la peor de la semana." : d.kind === "trayectoria" ? `Ha mirado toda la temporada: ${keyName(s, stay)} (PPE ${ppeTxt(stay)}) iba mejor que ${keyName(s, go)} (PPE ${ppeTxt(go)}).` : `😈 Jugarreta: ${keyName(s, go)} lo hizo mejor esta semana y lleva igual o mejor temporada.`;
  return watch(s, "panel", () => [["host", `${keyName(s, by)}, has ganado el lip sync y el reto.`], ["host", "Ha llegado el momento... Saca tu pintalabios."]],
    () => `<p class="eyebrow">💄 El pintalabios de ${esc(keyName(s, by))}</p><div class="ls-reveal">${lipstick(keyName(s, go), "reveal")}</div><p class="ls-name">${esc(keyName(s, go))}, sashay away</p><div class="mp-vs">${face(s, stay)}<span>💄</span>${face(s, go, "gone")}</div><p class="${d.kind === "jugarreta" ? "twist-note" : "muted"}">${esc(why)}</p>`);
}
// Al empezar el episodio siguiente: el pintalabios de la que perdió el lip sync
const revealOf = (s: RoomState) => (s.reveal && s.reveal.ep === s.ep - 1 ? s.reveal : null);
const revealHTML = (s: RoomState) => {
  const r = revealOf(s);
  if (!r) return "";
  const me = r.by === pkey(room.me);
  const same = r.go === r.went;
  return `<div class="mp-reveal"><p class="eyebrow">💄 Lo que no se vio</p><div class="ls-reveal">${lipstick(keyName(s, r.go), "reveal")}</div><p>${me ? "Tu pintalabios" : `El pintalabios de <b>${esc(keyName(s, r.by))}</b>`} decía <b>«${esc(keyName(s, r.go))}»</b>. ${same ? "Las dos habían elegido a la misma reina." : `Si ${me ? "hubieras" : "hubiera"} ganado, se habría ido ${esc(keyName(s, r.go))} en lugar de ${esc(keyName(s, r.went))}.`}</p></div>`;
};

// Sin límite: solo la anfitriona puede seguir sin las que faltan (por si alguien se ha ido)
const skipBtn = (s: RoomState) => (room.isHost && (s.ritmo === "libre" || s.phase === "maletas") ? `<button class="btn btn-ghost" id="mp-skip">Seguir sin las que faltan</button>` : "");
document.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest?.("#mp-skip")) ask("Las que no hayan entregado sacan la nota mínima (o entran con lo que tengan).", { title: "¿Seguir sin esperar?", ok: "Seguir", icon: "⏭️" }).then((y) => { if (y) room.skip(); }); });
function info(html: string, after?: () => void, cls = "") {
  body().innerHTML = `<div class="story-card mp-card ${cls}">${html}</div>`;
  after && after();
}
function waiting(s: RoomState, phase: "reto" | "pasarela") {
  const ps = alivePlayers(s);
  const done = ps.filter((p) => (phase === "reto" ? s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null : s.subs[p.id]?.final != null));
  const mine = s.players.find((p) => p.id === room.me);
  info(`<p class="eyebrow">${phase === "reto" ? esc(s.reto!.titulo) : `Pasarela: «${esc(s.reto!.cat?.n)}»`}</p><h3>${mine && mine.alive ? "Entregado. Esperando a las demás..." : "Estás viendo la temporada"}</h3><p>${done.length}/${ps.length} han terminado. ${s.ritmo === "libre" ? "Sin límite de tiempo: se espera a todas." : "Si alguna no llega a tiempo, se sigue sin ella."}</p><div class="call-faces">${ps.map((p) => face(s, pkey(p.id), done.includes(p) ? "ok" : "wait")).join("")}</div>${skipBtn(s)}`);
}
function play(s: RoomState, phase: string, start: (el: HTMLElement) => void) {
  // Ya en marcha: no se toca (las maletas cambian de pantalla por dentro, así que basta con saber que se empezaron)
  if (playing && playing.ep === s.ep && playing.phase === phase && (phase === "maletas" || $("#mp-play"))) return;
  body().innerHTML = `<div id="mp-play"></div>`;
  playing = { ep: s.ep, phase };
  start($("#mp-play")!);
}
// Untucked: lo que comentan las reinas (lo lleva la anfitriona) y luego el chat de la sala
const UNT = {
  top: ["¡Qué semana! Todavía me tiemblan las piernas.", "No me lo esperaba... bueno, un poco sí.", "Hoy he venido a ganar y se ha notado."],
  low: ["No pienso irme a casa todavía.", "Ha sido una semana horrible, pero el lip sync es mío.", "Si me toca bailar, que se preparen."],
  mid: ["Yo a salvo y calladita. Por ahora.", "¿Alguien más tiene la peluca hecha un desastre?", "A ver quién se pone nerviosa ahora..."],
};
function untucked(s: RoomState) {
  const rows = s.rows || [];
  const npc = (labs: RegExp) => rows.filter((r) => !isP(r.key) && labs.test(r.label)).map((r) => r.key);
  return watch(s, "lounge", () => {
    const lines: [string, string][] = [["host", "Reinas, podéis ir al Untucked mientras deliberamos."]];
    const t = npc(/WIN|TOP2|HIGH/)[0], l = npc(/BTM|LOW/)[0], m = npc(/SAFE/)[0];
    if (t) lines.push([`q:${idOf(t)}`, pick(UNT.top)]);
    if (m) lines.push([`q:${idOf(m)}`, pick(UNT.mid)]);
    if (l) lines.push([`q:${idOf(l)}`, pick(UNT.low)]);
    if (Math.random() < 0.35) lines.push(["calvo", "(Entrando en el Untucked) Solo venimos a por hielo, seguid a lo vuestro."]);
    return lines;
  }, () => `<p class="eyebrow">Mientras el jurado delibera...</p><div class="mp-chat" id="mp-chat"></div><form id="mp-chat-f" class="mp-chat-f"><input id="mp-chat-i" maxlength="200" placeholder="Di algo en el Untucked..." autocomplete="off"><button class="btn btn-primary">Enviar</button></form>`,
  () => {
    drawChat();
    $("#mp-chat-f")!.onsubmit = (e) => { e.preventDefault(); const i = $("#mp-chat-i") as HTMLInputElement; const t = i.value.trim(); if (t) { room.chat(myName(), t); i.value = ""; } };
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
    const o = s.phase === "final"
      ? { eyebrow: s.finalStage === 2 ? "👑 Lip sync por la corona" : "Gran final · semifinal", curtain: s.finalStage === 2 ? "LIP SYNC POR LA CORONA" : "LIP SYNC", note: "" }
      : AS(s) ? { eyebrow: "💄 Lip sync por el poder", curtain: "LIP SYNC POR EL PODER", note: "La que gane se lleva el reto y saca su pintalabios." }
      : { eyebrow: "💔 Lip sync for your life", curtain: "LIP SYNC FOR YOUR LIFE", note: "La que pierda se va a casa." };
    return play(s, s.phase, (el) => api().lipsyncShow(el, keyQueen(s, rivalKey), o, (won: boolean, score: number) => { playing = null; room.submit({ ls: { won, score } }); }));
  }
  if (myKey && pairs.some((p) => p.a === myKey || p.b === myKey) && (s.subs[room.me] || {}).ls) return info(`<p class="eyebrow">💄 Lip sync</p><h3>¡Hecho! Esperando el veredicto...</h3>`);
  info(`${s.phase === "final" && s.finalStage === 1 ? revealHTML(s) : ""}<p class="eyebrow">${s.phase === "final" ? (s.finalStage === 2 ? "👑 Lip sync por la corona" : "Gran final · semifinales") : AS(s) ? "💄 Lip sync por el poder" : "Lip sync for your life"}</p>${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}${pairs.map((p) => `<div class="mp-vs">${face(s, p.a)}<span>VS</span>${face(s, p.b)}</div>`).join("")}<p class="muted">${pairs.some((p) => isP(p.a) || isP(p.b)) ? "Las jugadoras del lip sync están bailando..." : "Las reinas lo dan todo en el escenario..."}</p>${pairs.some((p) => isP(p.a) || isP(p.b)) ? skipBtn(s) : ""}`);
}
function track(s: RoomState) {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const rows = standings(s);
  const cls = (l: string) => ({ WIN: "t-win", WINNER: "t-win", TOP2: "t-top2", HIGH: "t-high", SAFE: "t-safe", LOW: "t-low", BTM2: "t-btm", ELIM: "t-elim", "RUNNER-UP": "t-runner", "3ª": "t-third" } as Record<string, string>)[l] || "t-none";
  const lab = (l: string) => ({ WINNER: "GANADORA", "RUNNER-UP": "FINALISTA", "3ª": "3ª/4ª" } as Record<string, string>)[l] || l;
  const lastEp = (k: string) => Math.max(0, ...eps.filter((e) => (s.track[k] || {})[e]));
  return `<div class="track-wrap"><table class="track"><thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(s.epNames[e])}</small></th>`).join("")}<th>PPE</th></tr></thead><tbody>${rows
    .map((r, i) => { const k = r.key; return `<tr class="${k === pkey(room.me) ? "me" : ""} ${r.out ? "out" : ""}" style="--i:${i}"><td class="rk">${esc(r.place)}</td><td class="qn"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(keyName(s, k))}${keyPlayer(s, k) ? ` <b>(${esc(keyPlayer(s, k))})</b>` : ""}</span></td>${eps.map((e) => { const l = (s.track[k] || {})[e]; return `<td class="${l ? cls(l) : r.out && e > lastEp(k) ? "t-gone" : "t-none"}">${l ? lab(l) : ""}</td>`; }).join("")}<td class="ppe">${Object.keys(s.track[k] || {}).length ? ppeOf(s, k).toFixed(2) : "–"}</td></tr>`; })
    .join("")}</tbody></table></div>`;
}
// Ficha de la reina como en el modo normal: retrato, frase, atributos de historia, carácter y fortaleza
let lobbyFocus = "";
function queenDetails(s: RoomState, id: string) {
  const q = Q(id);
  const P = api().preview(id);
  const taken = s.players.find((p) => p.queen === id);
  const stats = P ? Object.entries(P.attrs as Record<string, number>).map(([k, v]) => `
    <div class="stat-row story-stat"><span>${esc(P.names[k])}</span><span class="pips ten">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</span><b class="stat-n">${v}</b></div>`).join("") : "";
  return `<div class="details-inner">
      <span class="details-portrait" style="background-image:url('${q.photo}')"></span>
      <div class="details-main">
        <h3>${esc(q.name)}</h3>
        <p class="det-place">${taken ? `🎮 La juega <b>${esc(taken.name)}</b>${taken.id === room.me ? " (tú)" : ""}` : "🤖 Si nadie la coge, la juega el juego"}</p>
        ${q.quote ? `<p class="det-quote">“${esc(q.quote)}”</p>` : ""}
        <div class="mp-stats">${stats}${P && P.fort ? `<p class="wallet-line">${P.fort.icon} Fortaleza: <b>${esc(P.fort.n)}</b> · ${esc(P.fort.d)}</p>` : ""}</div>
      </div>
      ${P && P.car ? `<div class="details-power"><span class="power-label">🎭 Su carácter</span><strong class="mp-power">${esc(P.car.n)}</strong><p>${esc(P.car.d)}</p></div>` : ""}
    </div>`;
}
function lobby(s: RoomState) {
  const se = W.seasonById(s.season);
  const cast = castOf(s.season);
  const taken = new Map(s.players.filter((p) => p.queen).map((p) => [p.queen!, p]));
  const mine = s.players.find((p) => p.id === room.me);
  const ready = s.players.length >= 1 && s.players.every((p) => p.queen);
  if (!lobbyFocus || !cast.includes(lobbyFocus)) lobbyFocus = mine?.queen || cast[0];
  const compact = cast.length > 8;
  info(`
    <p class="eyebrow">Sala ${esc(s.code)} · ${esc(se?.name || "")}${s.fmt === "allstars" ? " · formato All Stars" : ""} · ritmo ${s.ritmo === "rapido" ? "rápido" : s.ritmo === "libre" ? "sin límite" : "normal"}${s.ia ? " · ✍️ con IA" : ""}</p>
    <h3>Código de la sala: <span class="mp-code">${esc(s.code)}</span></h3>
    <p class="muted">Pásaselo a tus amigas. Cada una elige una reina; las que no cojáis las juega el juego. ${s.ritmo === "libre" ? "Sin límite de tiempo: cada fase espera a que entreguéis todas (la anfitriona puede seguir sin las que falten)." : `Tope por episodio: ${Math.round(topeEpisodio(s.ritmo) / 60)} minutos.`}</p>
    <div class="mp-players">${s.players.map((p) => `<span class="mp-face ${p.id === room.me ? "me" : ""}"><i style="background-image:url('${p.queen ? Q(p.queen).photo : ""}')"></i><b>${esc(p.name)}${p.id === s.host ? " 👑" : ""}</b><small>${p.queen ? esc(Q(p.queen).name) : "eligiendo..."}</small></span>`).join("")}</div>
    <h4>${mine?.queen ? "Tu reina: " + esc(Q(mine.queen).name) : "Elige tu reina"}</h4>
    <div class="mp-select">
      <div class="mp-qgrid ${compact ? "compact" : ""}">${cast.map((id) => { const t = taken.get(id); const other = t && t.id !== room.me; return `<button class="queen-card ${t && t.id === room.me ? "selected" : ""} ${other ? "taken" : ""} ${id === lobbyFocus ? "active" : ""}" data-q="${id}"><span class="portrait" style="background-image:url('${Q(id).photo}')"></span><span class="name">${esc(Q(id).name)}</span><span class="check" aria-hidden="true">✓</span>${other ? `<span class="mp-taken">🎮 ${esc(t!.name)}</span>` : ""}</button>`; }).join("")}</div>
      <div class="mp-qdet" aria-live="polite">${queenDetails(s, lobbyFocus)}</div>
    </div>
    <div class="row">
      <button class="btn btn-ghost" id="mp-exit">Salir</button>
      ${room.isHost ? `<button class="btn btn-primary" id="mp-start" ${ready ? "" : "disabled"}>${ready ? "¡Empezar la temporada!" : "Esperando a que todas elijan"}</button>` : `<p class="muted">La anfitriona empezará cuando estéis todas.</p>`}
    </div>`, () => {
    // Clic: ver su ficha y, si está libre, elegirla (como en el modo normal)
    document.querySelectorAll<HTMLButtonElement>(".mp-qgrid .queen-card").forEach((b) => (b.onclick = () => {
      const id = b.dataset.q!;
      lobbyFocus = id;
      const t = taken.get(id);
      if (!t || t.id === room.me) room.pick(id);
      const st = room.state;
      if (st) lobby(st);
    }));
    $("#mp-exit")!.onclick = exit;
    const st = $("#mp-start");
    if (st) st.onclick = () => room.start();
  }, "mp-lobby");
}

function exit() {
  if (playing) api().abort();
  playing = null;
  room.leave();
  if (begun) api().end();
  begun = false;
  chatLog = [];
  crownShown = false;
  typedKey = "";
  pauseAsked = "";
  api().scene(null);
  clearInterval(timer);
  shell(false);
  $("#mp-pause")?.remove();
  $("#screen-story")!.classList.remove("mp");
  W.UI.show("menu");
}

room.onChange = (s) => render(s);
// El modo historia, mientras dura la sala, deja que la cabecera la pinte la sala
W.__mpHeader = () => header(room.state);
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
  if (b && $("#screen-story")?.classList.contains("mp")) { e.stopImmediatePropagation(); e.preventDefault(); if (!room.state || room.state.paused) return exit(); ask("Si sales, la sala sigue sin ti.", { title: "¿Salir de la temporada en directo?", ok: "Salir", cancel: "Quedarme", icon: "🚪", danger: true }).then((y) => { if (y) exit(); }); }
}, true);
document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest?.("#btn-mp")) openMultiplayer();
});
