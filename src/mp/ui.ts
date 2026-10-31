// Pantallas de la temporada en directo (dentro de la pantalla del modo historia, con su propio flujo)
import { Room } from "./room";
import { carousel } from "../ui/carousel";
import { ask } from "../ui/confirm";
import { DURACION, IA_EXTRA, FORMATOS, topeEpisodio, alivePlayers, aliveKeys, standings, ppeOf, planCats, isWatch, isP, idOf, pkey, type RoomState, type Engine, type Ritmo, type Formato } from "./model";

const W = window as any;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const api = () => W.Story.mp;
// Cada reina con el look de la temporada de la sala (en All Stars, sus fotos de All Stars)
let homeOf: Map<string, string> | null = null;
const homeSeason = (id: string) => { if (!homeOf) homeOf = new Map((api().allQueens() as { id: string; season: string }[]).map((x) => [x.id, x.season])); return homeOf.get(id); };
const Q = (id: string, season?: string) => { const se = season || room?.state?.season; return api().queen(id, se === "custom" ? homeSeason(id) : se) || { id, name: id, photo: "", sprite: "" }; };

const engine = (): Engine => ({
  retos: () => api().retos(),
  categorias: () => api().categorias(),
  rivalScore: (q, t) => api().rivalScore(q, t),
  simLS: (a, b) => api().simLS(a, b),
  critique: (t, l, n) => api().critique(t, l, n),
  queenName: (id) => Q(id).name,
  rnd: Math.random,
  repesca: () => api().repescaReto(),
});
// Reparto de la sala: el de la temporada o, en la personalizada, las jugadoras + las rivales elegidas (o al azar al empezar)
const CUSTOM = "custom";
const castOfRoom = (s: RoomState): string[] => {
  if (s.cast) return s.cast;
  if (s.season !== CUSTOM) return castOf(s.season);
  const mine = s.players.map((p) => p.queen).filter(Boolean) as string[];
  return [...mine, ...(s.custom?.rivals || []).filter((q) => !mine.includes(q))];
};
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
  $("#story-season")!.textContent = s ? `👯 Temporada en directo · ${s.season === CUSTOM ? `Personalizada · ${FORMATOS[(s.fmt || "normal") as Formato].n}` : se ? se.name : ""} · Sala ${s.code}` : "👯 Temporada en directo";
  const title: Record<string, string> = { lobby: "Sala de espera", maletas: "Maletas", cajas: "La reina de la suerte", anuncio: `Episodio ${s?.ep}`, reto: s?.reto?.titulo || "El reto", pasarela: "Pasarela", resultados: "Las críticas", untucked: "Untucked", veredicto: "El veredicto", lipsync: s && (s.fmt === "allstars" || s.fmt === "winners") ? "Lip sync por el poder" : s?.triple ? "Lip sync a tres bandas" : "Lip sync for your life", decision: "Los pintalabios", pintalabios: "El pintalabios", comodin: s?.twist ? ({ suerte: "La reina de la suerte", corazon: "El corazón", moneda: "La moneda", bloqueo: "El bloqueo", corte: "El corte del top 4" } as Record<string, string>)[s.twist.kind] : "Momento clave", sorpresa: "¡Sorpresa!", track: "Track record", final: "Gran final", corona: "¡Tenemos ganadora!" };
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
          <div class="car-track mp-track">${seasons().map((se) => { const cover = (W.PORTADAS || {})[se.id]; return `<button type="button" class="mp-season" data-id="${se.id}" aria-label="${esc(se.name)}" style="${cover ? `background-image:url('${cover}')` : ""}"><span class="mps-top"><b>${esc(se.name)}</b><small>${api().formato(se.id) === "allstars" ? "" : se.year || ""}</small></span><span class="mps-faces">${(se.cast as string[]).slice(0, 7).map((id) => `<i style="background-image:url('${Q(id, se.id).photo}')"></i>`).join("")}</span><span class="mps-cast">${se.cast.length} reinas</span></button>`; }).join("")}<button type="button" class="mp-season mp-custom" data-id="${CUSTOM}" aria-label="Partida personalizada"><span class="mps-top"><b>Personalizada</b><small>Tú eliges</small></span><span class="mps-faces">${api().allQueens().slice(0, 7).map((x: any) => `<i style="background-image:url('${Q(x.id, x.season).photo}')"></i>`).join("")}</span><span class="mps-cast">Reinas de todas las temporadas · cualquier dinámica</span></button></div>
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
    if (id === CUSTOM) return customSetup(nm(), ritmo, ia);
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
// Partida personalizada: dinámica, cuántas reinas y cómo se eligen las rivales
function customSetup(name: string, ritmo: Ritmo, ia: boolean) {
  let fmt: Formato = (W.store?.get("dftc-mp-cfmt", "allstars") as Formato) || "allstars";
  let pick: "elegidas" | "azar" = W.store?.get("dftc-mp-cpick", "azar") === "elegidas" ? "elegidas" : "azar";
  let size = Math.max(6, Math.min(14, +(W.store?.get("dftc-mp-csize", 10) || 10)));
  const draw = () => {
    body().innerHTML = `
      <div class="story-card mp-entry mp-customset">
        <p class="eyebrow">✨ Partida personalizada</p>
        <h3>Elige la dinámica</h3>
        <div class="mp-fmts">${(Object.keys(FORMATOS) as Formato[]).map((k) => `<button type="button" class="mp-fmt ${k === fmt ? "on" : ""}" data-f="${k}" aria-pressed="${k === fmt}"><b>${FORMATOS[k].icon} ${esc(FORMATOS[k].n)}</b><small>${esc(FORMATOS[k].d)}</small></button>`).join("")}</div>
        <div class="mp-cfgrow">
          <div class="mp-ritmo" role="radiogroup" aria-label="Rivales">
            <button type="button" role="radio" data-p="azar" aria-checked="${pick === "azar"}"><b>🎲 Rivales al azar</b><small>Se sortean al empezar</small></button>
            <button type="button" role="radio" data-p="elegidas" aria-checked="${pick === "elegidas"}"><b>👑 Las elijo yo</b><small>En la sala, antes de empezar</small></button>
          </div>
          <label class="mp-size">Reinas en la temporada <span><button type="button" class="round-btn" data-s="-1" aria-label="Menos">−</button><b>${size}</b><button type="button" class="round-btn" data-s="1" aria-label="Más">+</button></span></label>
        </div>
        <div class="row"><button class="btn btn-ghost" id="mp-cback">Volver</button><button class="btn btn-primary" id="mp-ccreate">Crear sala</button></div>
      </div>`;
    document.querySelectorAll<HTMLElement>("[data-f]").forEach((b) => (b.onclick = () => { fmt = b.dataset.f as Formato; W.store?.set("dftc-mp-cfmt", fmt); draw(); }));
    document.querySelectorAll<HTMLElement>("[data-p]").forEach((b) => (b.onclick = () => { pick = b.dataset.p as any; W.store?.set("dftc-mp-cpick", pick); draw(); }));
    document.querySelectorAll<HTMLElement>("[data-s]").forEach((b) => (b.onclick = () => { size = Math.max(6, Math.min(14, size + +b.dataset.s!)); W.store?.set("dftc-mp-csize", size); draw(); }));
    $("#mp-cback")!.onclick = entry;
    $("#mp-ccreate")!.onclick = () => room.create(name, CUSTOM, ritmo, { fmt, ia, custom: { pick, size, rivals: [] } });
  };
  draw();
}
function savedHTML() {
  const list = Object.values(savedAll()).sort((a, b) => b.date - a.date);
  if (!list.length) return "";
  return `<div class="mp-saved"><h4>⏸️ Partidas pausadas</h4>${list.map((sv) => { const se = W.seasonById(sv.state.season); const mine = sv.state.players.find((p) => p.id === sv.me); return `<div class="mp-saved-row"><span><b>${esc(se?.name || sv.state.season)}</b> · sala ${esc(sv.state.code)} · episodio ${sv.state.ep} · ${esc(sv.name)}<small>${esc(sv.state.players.map((p) => p.name).join(", "))}${mine?.queen ? ` · tú: ${esc(Q(mine.queen, sv.state.season).name)}` : ""}</small></span><span class="mp-saved-btns"><button class="btn btn-primary" data-resume="${esc(sv.state.code)}:${esc(sv.me)}">Reabrir</button><button class="btn btn-ghost" data-rejoin="${esc(sv.state.code)}:${esc(sv.me)}">Volver a entrar</button><button class="btn btn-ghost small-btn" data-forget="${esc(sv.state.code)}:${esc(sv.me)}" aria-label="Borrar">🗑️</button></span></div>`; }).join("")}</div>`;
}

// ---------------------------------- Con sala ----------------------------------
const AS = (s: RoomState) => s.fmt === "allstars";
// Quién se salva antes de las críticas y quién las recibe (en orden alfabético de clave: que el orden no delate posiciones)
const callOf = (s: RoomState) => {
  const crit = new Set((s.crit || []).map((c) => c.key));
  const keys = (s.rows || []).map((r) => r.key).sort();
  const judged = keys.filter((k) => crit.has(k)), safe = keys.filter((k) => !crit.has(k));
  return { safe, judged, allCrit: !safe.length && s.fmt !== "winners" && keys.length <= 6 };
};
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
// Tarjetas que se intercalan entre las frases del guion (la línea lleva "@nombre" como hablante)
const SIREN = (ctl: string) => `<div class="story-card siren-card"><div class="siren-light">🚨</div><p class="siren-msg">📢 «¡Agárrate las bragas, marichocho!»</p><p class="muted">Suena la sirena del taller...</p>${ctl}</div>`;
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
    if (who.startsWith("@")) {
      if (who === "@call") {
        const { safe, judged } = callOf(s);
        const mine = pkey(room.me), alive = (s.rows || []).some((r) => r.key === mine);
        body().innerHTML = `<div class="story-card mp-card call"><p class="eyebrow">${esc(s.reto?.titulo || "")} · la pasarela ha terminado</p><h3>Supremme tiene algo que deciros...</h3>${judged.length ? `<p><b>${s.fmt === "winners" ? "Reciben las críticas del jurado" : safe.length ? "Las mejores y las peores de hoy" : "Todas recibís valoración"}</b></p><div class="call-faces">${judged.map((k) => face(s, k)).join("")}</div>` : ""}${safe.length ? `<p><b>Estáis a salvo</b></p><div class="call-faces safe">${safe.map((k) => face(s, k)).join("")}</div>` : ""}${alive ? `<p class="call-me">${safe.includes(mine) ? "✨ Estás a salvo esta semana." : "👀 Te toca escuchar al jurado."}</p>` : ""}<div class="mp-hostbar">${ctl}</div></div>`;
        return;
      }
      body().innerHTML = who === "@siren" ? SIREN(`<div class="mp-hostbar">${ctl}</div>`) : `<div class="story-card mp-card">${revealHTML(s)}<div class="mp-hostbar">${ctl}</div></div>`;
      if (who === "@siren" && typedKey !== `${key}:${i}`) { typedKey = `${key}:${i}`; const snd = (window as any).Sound; snd && snd.countdown && snd.countdown(true); }
      return;
    }
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
  // La corona es el final: ahí ya no hay «Continuar», solo «Salir»
  info(`${card()}${s.phase === "corona" ? "" : `<div class="mp-hostbar">${ctl}</div>`}`, after);
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

/** Lo que solo sabe cada una: la suerte, sus corazones, sus estrellas, si está bloqueada o su pareja de monólogo. */
function myStatus(s: RoomState) {
  const k = pkey(room.me);
  const out: string[] = [];
  if (s.fmt === "suerte" && s.luck === k) out.push("🍀 Tienes la reina de la suerte. Solo tú lo sabes: podrás usarla antes de un lip sync.");
  if (s.fmt === "corazon" && s.hearts?.[k]) out.push(`❤️ Tienes ${s.hearts[k] >= 2 ? "un corazón entero" : "medio corazón"}.`);
  if (s.fmt === "winners") { out.push(`⭐ Llevas ${s.stars?.[k] || 0} estrella${(s.stars?.[k] || 0) === 1 ? "" : "s"}. Semana ${s.ep} de ${s.weeks}.`); if (s.block && s.block.ep === s.ep && s.block.id === k) out.push(`🚫 ${keyName(s, s.block.by)} te ha bloqueado: esta semana no puedes ganar estrella.`); }
  const rp = s.rp && s.rp.ep === s.ep ? s.rp.pairs.find((p) => p.c === k || p.o === k) : undefined;
  if (rp) { const mate = rp.c === k ? rp.o : rp.c; out.push(mate ? `🎙️ Tu pareja de monólogo: ${keyName(s, mate)}${rp.o === k ? ". Si ganáis, ¡vuelves!" : ""}` : "🎙️ Haces el monólogo sola."); }
  return out.length ? `<div class="mp-status">${out.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : "";
}
function render(s: RoomState) {
  header(s);
  const mine = s.players.find((p) => p.id === room.me);
  // Pausa: con el sí de todas se guarda y se sale
  if (s.paused) return pausedOut(s);
  if (s.pause) askPause(s);
  // Cambió la fase: si estaba jugando algo de otra fase, se corta
  if (playing && (playing.ep !== s.ep || playing.phase !== s.phase)) { api().abort(); playing = null; }
  if (s.phase !== "lobby" && !begun) {
    const cast = castOfRoom(s);
    const q = mine?.queen || cast[0];
    api().begin(q, s.season, cast.filter((x) => x !== q), { ia: !!s.ia, local: pendingLocal || loadLocal(s.code) });
    pendingLocal = null;
    begun = true;
  }
  if (begun) api().setEp(s.ep, aliveKeys(s).map((k) => keyQueen(s, k)).filter((x) => x && x !== mine?.queen));
  const me = mine && mine.alive && mine.queen ? mine : null;
  const sub = s.subs[room.me] || {};
  if (s.phase === "lobby") { api().scene("werkroom"); return lobby(s); }
  if (s.phase === "maletas") return maletas(s, me);
  if (s.phase === "cajas") { api().scene("werkroom"); return cajas(s, me); }
  // La ganadora del capítulo anterior (reparte papeles en el Rusical): "me" si eres tú
  function prevWinner(s: RoomState): string | null {
    const k = Object.keys(s.track).find((k) => ["WIN", "BWIN"].includes((s.track[k] || {})[s.ep - 1]) && aliveKeys(s).includes(k));
    return !k ? null : k === pkey(room.me) ? "me" : keyQueen(s, k);
  }
  if (s.phase === "anuncio") {
    const rv = revealOf(s);
    return watch(s, "werkroom", () => {
      // Como en la historia: suena la sirena, entra Supremme y, en All Stars, pregunta por el pintalabios que no se vio
      const base: [string, string][] = api().announceLines(s.ep, s.season);
      const lines: [string, string][] = [["@siren", ""], ...base.slice(0, 1), ...(rv ? [["host", `Antes de nada... ${keyName(s, rv.by)}, la semana pasada no llegamos a verlo. ¿A quién habías elegido tú?`], ["@reveal", ""]] as [string, string][] : []), ...base.slice(1)];
      if (s.reto!.cat) lines.push(["judge", `Y en la pasarela quiero veros con «${s.reto!.cat.n}». ${s.reto!.cat.d || ""}`.trim()]);
      if (AS(s) && s.ep === 1) lines.push(["host", "Recordad: esto es un All Stars. Las dos mejores de cada semana harán un lip sync por el poder, y antes cada una elegirá en secreto su pintalabios."]);
      // Partida personalizada: se presenta la dinámica elegida
      if (s.season === CUSTOM && s.ep === 1) lines.splice(1, 0, ["host", `¡Bienvenidas a una temporada muy especial! Reinas de todas las ediciones... y la dinámica: ${FORMATOS[(s.fmt || "normal") as Formato].n}.`], ["judge", FORMATOS[(s.fmt || "normal") as Formato].d]);
      if (s.fmt === "suerte" && s.ep === 1) lines.push(["host", "Ya tenéis vuestras cajitas. Quien tenga la reina de la suerte podrá salvar a quien quiera del lip sync, una vez. Y es secreto: que nadie diga nada."]);
      if (s.rp && s.rp.ep === s.ep) lines.splice(1, 0, ["host", "Reinas, hoy no estáis solas. ¡Que pasen las eliminadas!"], ["host", "Cada una de vosotras hará un monólogo con una de ellas. La eliminada de la pareja ganadora... vuelve a la competición."]);
      return lines;
    }, () => `${heartChoice(s)}${myStatus(s)}<p class="eyebrow">Episodio ${s.ep}${s.fmt && s.fmt !== "normal" ? ` · ${FORMATOS[s.fmt as Formato].icon} ${FORMATOS[s.fmt as Formato].n}` : ""}</p><h3>${esc(s.reto!.titulo)}</h3><p>${esc(s.reto!.desc)}</p>${s.reto!.cat ? `<p class="twist-note">👠 Pasarela de la semana: <b>«${esc(s.reto!.cat.n)}»</b>. ${esc(s.reto!.cat.d)}${me ? " Tu look ya está en la maleta." : ""}</p>` : ""}${s.ia ? `<p class="muted">✍️ Con IA: puedes hacerlo en directo, escribiendo tus frases.</p>` : ""}<p class="muted">Quedan ${aliveKeys(s).length} reinas. ${s.ritmo === "libre" ? "Sin límite de tiempo: se espera a que entreguéis todas." : `Para jugar el reto tenéis ${Math.round(((DURACION[s.ritmo].reto * (s.ia ? IA_EXTRA : 1)) / 60))} minutos.`}</p>`);
  }
  if (s.phase === "reto") {
    api().scene("werkroom");
    // Segunda Oportunidrag: cada una con su pareja; las eliminadas también juegan su monólogo
    const rp = s.rp && s.rp.ep === s.ep ? s.rp.pairs.find((p) => p.c === pkey(room.me) || p.o === pkey(room.me)) : undefined;
    const outPlays = !!rp && rp.o === pkey(room.me);
    const partnerKey = rp ? (outPlays ? rp.c : rp.o) : null;
    if ((me || outPlays) && sub.reto == null && sub.final == null) return play(s, "reto", (el) => api().play(s.reto!.tipo, s.reto!.titulo, el, (raw: number, jury: string) => {
      const data = s.reto!.noRunway ? { reto: raw, jury, final: api().finalScore(s.reto!.tipo, raw, null, !!jury) } : { reto: raw, jury };
      playing = null; room.submit(data);
    }, { partner: partnerKey ? keyQueen(s, partnerKey) : null, out: outPlays, giver: prevWinner(s) }));
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
    // Como en la historia: primero se dice quién está a salvo y quiénes son las mejores y las peores; luego, sus críticas
    const { safe, judged, allCrit } = callOf(s);
    return watch(s, "panel", () => {
      const sh = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
      const n = (s.rows || []).length;
      const safeL: [string, string][] = safe.length ? [["host", `${names(s, sh(safe))}: estáis salvadas. Podéis volver al backstage.`]] : [];
      const judgedL: [string, string][] = [["host", allCrit ? `Quedáis ${n}: a partir de ahora ya no hay salvadas. ${names(s, sh(judged))}, todas recibís la valoración del jurado.` : s.fmt === "winners" ? `${names(s, sh(judged))}: esta semana recibís las críticas del jurado.` : `${names(s, sh(judged))}... sois las mejores y las peores del programa de hoy.`]];
      const lines: [string, string][] = [["host", "Reinas, la pasarela ha terminado. Tengo algo que deciros..."], ...(Math.random() < 0.5 ? [...safeL, ...judgedL] : [...judgedL, ...(safe.length ? [["host", `Las demás, ${names(s, sh(safe))}: estáis a salvo.`] as [string, string]] : [])]), ["@call", ""]];
      if (safe.length) lines.push(["host", "Reinas salvadas, al backstage. Jurado, es vuestro turno."]);
      (s.crit || []).forEach((c) => c.lines.forEach(([who, t]) => lines.push([SPEAKER[who] || "host", t])));
      return lines;
    }, () => `<p class="eyebrow">Las críticas del jurado</p><div class="mp-crit">${(s.crit || []).map((c) => `<div class="mp-crit-row">${face(s, c.key)}<div>${c.lines.map(([who, t]) => `<p><b>${esc(who)}:</b> ${esc(t)}</p>`).join("")}</div></div>`).join("")}</div>`);
  }
  if (s.phase === "untucked") return untucked(s);
  if (s.phase === "veredicto") {
    const rows = s.rows || [];
    const of = (l: string) => rows.filter((x) => x.label === l).map((x) => x.key);
    const grp = (labs: string[], t: string, cls: string) => { const r = rows.filter((x) => labs.includes(x.label)); return r.length ? `<div class="v-row ${cls}"><b>${t}</b><div class="call-faces">${r.map((x) => face(s, x.key)).join("")}</div></div>` : ""; };
    const AW = s.fmt === "winners";
    const btm = [...of("BTM2"), ...of("BTM3")];
    const triple = btm.length === 3;
    const block = s.block && s.block.ep === s.ep ? s.block : null;
    return watch(s, "panel", () => AW
      ? [["host", "Reinas, he tomado algunas decisiones."], ["host", `${names(s, [...of("TOP2"), ...of("BTOP")])}: sois las dos mejores de la semana. ¡Os jugáis la Legendary Legend Star en un lip sync!`], ...(of("BTOP").length ? [["host", `${names(s, of("BTOP"))}, estás bloqueada: esta semana no hay estrella para ti.`] as [string, string]] : []), ["host", "El resto, estáis a salvo. Aquí no se va nadie."]]
      : AS(s)
      ? [["host", "Reinas, he tomado algunas decisiones."], ["host", `${names(s, of("TOP2"))}: sois las dos mejores de la semana. ¡Os vais a jugar el poder en un lip sync!`], ["host", `${names(s, of("BTM2"))}: lo siento, estáis en el bottom. Una de vosotras se irá a casa.`]]
      : [["host", "Reinas, he tomado algunas decisiones."], ["host", `${names(s, of("WIN"))}, ¡enhorabuena, has ganado el reto!`], ["host", triple ? (s.fmt === "moneda" ? `${names(s, btm)}: sois el bottom de tres... y esta es la temporada de la moneda.` : `${names(s, btm)}: vais al lip sync a tres bandas. Se salva una y se van dos.`) : `${names(s, btm)}: es la hora de que hagáis el lip sync for your life.`]],
    () => `<p class="eyebrow">Las decisiones del jurado</p><div class="verdict">${AS(s) || AW ? grp(["TOP2", "BTOP"], AW ? "⭐ Top 2: lip sync por la estrella" : "💄 Top 2: lip sync por el poder", "win") : grp(["WIN"], "👑 Ganadora del reto", "win")}${grp(["HIGH"], "✨ Buen trabajo, estáis a salvo", "high")}${grp(["SAFE"], "🙂 A salvo", "high")}${grp(["LOW"], "😬 A salvo... por los pelos", "low")}${grp(["BTM2", "BTM3"], AS(s) ? "💔 Bottom: una se irá con el pintalabios" : triple ? (s.fmt === "moneda" ? "🪙 Bottom de tres: decide la moneda" : "💔 Lip sync a tres bandas") : "💔 Bottom: lip sync for your life", "btm")}</div>${block ? `<p class="muted">🚫 ${esc(keyName(s, block.id))} estaba bloqueada esta semana.</p>` : ""}${starsTable(s)}`);
  }
  if (s.phase === "lipsync" || s.phase === "final") { api().scene("stage"); return lipsync(s, me ? pkey(me.id) : null); }
  if (s.phase === "decision") { api().scene("panel"); return decision(s); }
  if (s.phase === "comodin") { api().scene("panel"); return comodin(s); }
  if (s.phase === "sorpresa") return sorpresa(s);
  if (s.phase === "pintalabios") return lipstickReveal(s);
  if (s.phase === "track") return watch(s, "werkroom", () => [], () => `${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}${heartNote(s)}${heartChoice(s)}<h3>Track record</h3>${track(s)}${s.fmt === "corazon" ? heartsTable(s) : ""}${s.fmt === "winners" && s.ep >= (s.weeks || 0) ? `<p class="twist-note">⭐ Se acabaron las semanas: las 4 con más estrellas van a la gran final.</p>` : ""}`);
  if (s.phase === "corona") {
    savedPut(`${s.code}:${room.me}`, null);
    payout(s);
    const champ = keyName(s, s.champion!);
    const qd = s.fmt === "winners" && s.awFinal?.qosd ? keyName(s, s.awFinal.qosd) : "";
    return watch(s, "stage", () => s.fmt === "winners"
      ? [["host", "Reinas, ha llegado el momento."], ...(qd ? [["host", `${qd}, tú ya eres la Queen of She Done Already Done Had Herses.`] as [string, string]] : []), ["host", `La corona de Reina de reinas es para... ¡${champ}!`], ["judge", "Larga vida a la reina de reinas."]]
      : [["host", "Reinas, ha llegado el momento."], ["host", `La ganadora de esta temporada en directo es... ¡${champ}!`], ["judge", "Larga vida a la reina."]],
      () => `<p class="eyebrow">Gran final${s.fmt === "winners" ? " · All Winners" : ""}</p>${qd ? `<p class="twist-note">💅 QoSDADHH: <b>${esc(qd)}</b></p>` : ""}<h3>👑 ${esc(champ)}${keyPlayer(s, s.champion!) ? ` (${esc(keyPlayer(s, s.champion!))})` : ""}, ¡eres la ganadora!</h3>${track(s)}${W.store?.get(`dftc-mp-paid:${s.code}:${room.me}`, 0) ? `<p class="twist-note">✨ Te llevas <b>${W.store.get(`dftc-mp-paid:${s.code}:${room.me}`, 0)}</b> lentejuelas para la tienda.</p>` : ""}<button class="btn btn-primary" id="mp-exit2">Salir</button>`,
      () => { $("#mp-exit2")!.onclick = exit; if (!crownShown) { crownShown = true; W.Confetti?.burst?.(2500); } });
  }
}
let crownShown = false;
let pendingLocal: any = null;

// Reina de la suerte: antes del episodio 1 cada una elige su cajita (solo ve lo que hay en la suya)
function cajas(s: RoomState, me: { id: string } | null) {
  const b = s.boxes!;
  const mine = s.subs[room.me]?.box;
  const ownerOf = (i: number) => s.players.find((p) => s.subs[p.id]?.box === i);
  const ps = alivePlayers(s);
  const done = ps.filter((p) => s.subs[p.id]?.box != null);
  const boxes = Array.from({ length: b.n }, (_, i) => {
    const o = ownerOf(i);
    if (mine === i) return `<button class="box open mine" disabled style="--i:${i}">${i === b.win ? "🍀" : "✖"}</button>`;
    if (o) return `<button class="box closed" disabled style="--i:${i}" title="${esc(o.name)}">🎁<small>${esc(o.name)}</small></button>`;
    return `<button class="box" data-box="${i}" ${me && mine == null ? "" : "disabled"} style="--i:${i}">🎁</button>`;
  }).join("");
  const res = mine == null ? "" : mine === b.win
    ? `<p class="twist-note">🍀 <b>¡Te ha tocado a TI!</b> Nadie lo sabe. Guárdala para el momento justo.</p>`
    : `<p class="muted">✖ Tu caja está vacía. Alguna compañera la tiene... pero nadie dice quién.</p>`;
  info(`<p class="eyebrow">🍀 La reina de la suerte</p><h3>${me && mine == null ? "Elige tu cajita" : "Las reinas eligen su cajita"}</h3><p>En una de ellas está la reina de la suerte: podrá usarla una vez para salvarse, o salvar a una compañera, del lip sync.</p><div class="boxes">${boxes}</div>${res}<p class="muted">${done.length}/${ps.length} han elegido. Las cajas que sobren se las quedan las demás reinas.</p>${room.isHost && done.length < ps.length ? `<button class="btn btn-ghost" id="mp-skip">Seguir sin esperar</button>` : ""}`, () =>
    document.querySelectorAll<HTMLElement>("[data-box]").forEach((x) => (x.onclick = () => { room.submit({ box: +x.dataset.box! }); })));
}
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

// ------------------------------ Giros: comodines (decide cada una en su pantalla) ------------------------------
const nameIs = (s: RoomState, k: string) => (k === pkey(room.me) ? "tú" : keyName(s, k));
function comodin(s: RoomState) {
  const t = s.twist!;
  const mineKey = pkey(room.me);
  const iDecide = t.by.includes(mineKey) && !(s.subs[room.me] || {}).pick;
  const done = t.by.filter((k) => !isP(k) || (s.subs[idOf(k)] || {}).pick != null);
  const opts = (keep: string | null, verb: (k: string) => string) => `<div class="hub-grid ${t.options.length === 2 ? "two" : ""}">${t.options.map((k, i) => `<button class="hub-q" style="--i:${i}" data-pick="${esc(k)}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(verb(k))}</span>${keyPlayer(s, k) ? `<small>${esc(keyPlayer(s, k))}</small>` : ""}${t.kind === "bloqueo" ? `<small>⭐ ${s.stars?.[k] || 0}</small>` : ""}</button>`).join("")}</div>${keep ? `<button class="btn btn-primary" data-pick="keep">${esc(keep)}</button>` : ""}`;
  const bind = () => document.querySelectorAll<HTMLElement>("[data-pick]").forEach((b) => (b.onclick = () => { playing = null; room.submit({ pick: b.dataset.pick! }); info(`<p class="eyebrow">✔ Decidido</p><h3>Esperando a las demás...</h3>`); }));
  const wait = (h: string) => info(`${h}<div class="call-faces">${t.by.filter(isP).map((k) => face(s, k, done.includes(k) ? "ok" : "wait")).join("")}</div>${trackPeek()}${skipBtn(s)}`);
  // All Winners: empate en el corte del top 4 (decide la que más estrellas tiene)
  if (t.kind === "corte") {
    const need = t.need || 1;
    const intro = `Empate a ${s.stars?.[t.options[0]] || 0} ⭐ entre ${esc(names(s, t.options))}.`;
    if (iDecide) {
      const chosen: string[] = [];
      return info(`<p class="eyebrow">👑 Gran final All Winners</p><h3>Empate en el corte: decides tú</h3><p>Tienes más estrellas que nadie. ${intro} Elige ${need === 1 ? "quién pasa" : `a las ${need} que pasan`} a la final por la corona.</p><div class="hub-grid">${t.options.map((k, i) => `<button class="hub-q" style="--i:${i}" data-cut="${esc(k)}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(keyName(s, k))}</span><small>PPE ${ppeOf(s, k).toFixed(2).replace(".", ",")}</small></button>`).join("")}</div>${starsTable(s)}`, () =>
        document.querySelectorAll<HTMLButtonElement>("[data-cut]").forEach((b) => (b.onclick = () => {
          chosen.push(b.dataset.cut!); b.disabled = true;
          if (chosen.length === need) { playing = null; room.submit({ pick: chosen.join(",") }); info(`<p class="eyebrow">✔ Decidido</p><h3>Esperando...</h3>`); }
        })));
    }
    return wait(`<p class="eyebrow">👑 Gran final All Winners</p><h3>Empate en el corte del top 4</h3><p>${intro} Decide <b>${esc(keyName(s, t.by[0]))}</b>, la que más estrellas tiene.</p>${starsTable(s)}`);
  }
  const bottomTxt = t.options.map((k) => `<b>${esc(nameIs(s, k))}</b>`).join(" y ");
  if (t.kind === "suerte") {
    if (iDecide) return info(`<p class="eyebrow">🍀 Solo tú sabes que la tienes</p><h3>¿Sacas la reina de la suerte?</h3><p>En el bottom: ${bottomTxt}. Si salvas a alguien, entra la siguiente con peor nota. Solo se usa una vez.</p>${opts("Me la guardo (silencio...)", (k) => (k === mineKey ? "🍀 Salvarme" : `🍀 Salvar a ${keyName(s, k)}`))}${trackPeek()}`, bind);
    return info(`<p class="eyebrow">🍀 La reina de la suerte</p><h3>Supremme pregunta...</h3><p>«Reinas, antes del lip sync: si alguna tiene la reina de la suerte y quiere usarla, que la saque AHORA.»</p><p class="muted">Silencio en el escenario...</p>`);
  }
  if (t.kind === "corazon") {
    if (iDecide) return info(`<p class="eyebrow">❤️ ¡Tienes un corazón entero!</p><h3>¿Lo usas ahora?</h3><p>Solo puedes usarlo en este momento: si no lo usas, <b>se pierde</b>. En el bottom: ${bottomTxt}.</p>${opts("No usarlo (se pierde)", (k) => (k === mineKey ? "❤️ Salvarme" : `❤️ Salvar a ${keyName(s, k)}`))}${trackPeek()}`, bind);
    return wait(`<p class="eyebrow">❤️ El corazón</p><h3>${esc(names(s, t.by))} ${t.by.length > 1 ? "tienen" : "tiene"} un corazón entero</h3><p>En el bottom: ${bottomTxt}. ¿Lo usará?</p>`);
  }
  if (t.kind === "moneda") {
    const verb = t.cara ? "SALVAR" : "CONDENAR al lip sync";
    // La moneda gira una sola vez: si la pantalla se repinta (otra vota), sigue por donde iba
    const ck = `${s.code}:${s.ep}:${s.stage}`;
    if (!coinAt[ck]) coinAt[ck] = Date.now();
    const el = Date.now() - coinAt[ck];
    const coin = `<div class="coin-wrap"><div class="coin ${t.cara ? "cara" : "cruz"}" style="animation-delay:-${el}ms"><b>CARA</b><b>CRUZ</b></div></div><p class="coin-res" style="animation-delay:${1500 - el}ms">¡Ha salido <b>${t.cara ? "CARA" : "CRUZ"}</b>!</p><p>${t.cara ? "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>SALVAR</b>." : "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>CONDENAR</b> al lip sync."}</p>`;
    if (iDecide) return info(`<p class="eyebrow">🪙 La moneda · tu voto es público</p>${coin}<h3>¿A quién quieres ${verb}?</h3><p class="muted">Todas verán lo que votas.</p>${opts(null, (k) => keyName(s, k))}${trackPeek()}`, bind);
    if (t.options.includes(mineKey)) return wait(`<p class="eyebrow">🪙 La moneda</p>${coin}<h3>Las salvadas votan a quién ${t.cara ? "salvar" : "condenar"}...</h3><p>Estás en el bottom de tres: ${bottomTxt}.</p>`);
    return wait(`<p class="eyebrow">🪙 La moneda</p>${coin}<h3>Las salvadas votan a quién ${t.cara ? "salvar" : "condenar"}</h3><p>En el bottom de tres: ${bottomTxt}.</p>`);
  }
  // All Winners: el bloqueo
  if (iDecide) return info(`<p class="eyebrow">⭐ Has ganado el lip sync</p><h3>¿A quién bloqueas?</h3><p>La semana que viene no podrá ganar estrella, aunque llegue al top.</p>${opts(null, (k) => keyName(s, k))}${starsTable(s)}${trackPeek()}`, bind);
  return wait(`<p class="eyebrow">⭐ El bloqueo</p><h3>${esc(keyName(s, t.by[0]))} elige a quién bloquear</h3><p class="muted">La bloqueada no podrá ganar estrella la semana que viene.</p>${starsTable(s)}`);
}
// Ver el track record sin salir de la pantalla (como en la historia)
const coinAt: Record<string, number> = {};
const trackPeek = () => `<button class="btn btn-ghost small-btn mp-track-peek" type="button">📊 Ver track record</button>`;
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest?.(".mp-track-peek") || !room.state) return;
  e.stopPropagation();
  const m = document.createElement("div");
  m.className = "track-modal";
  m.innerHTML = `<div class="story-card track-card"><h3>Track record</h3>${track(room.state)}${room.state.fmt === "corazon" ? heartsTable(room.state) : ""}${starsTable(room.state)}<button class="btn btn-primary" id="tm-close">Cerrar</button></div>`;
  document.body.append(m);
  m.querySelector("#tm-close")!.addEventListener("click", () => m.remove());
  m.addEventListener("click", (ev) => { if (ev.target === m) m.remove(); });
}, true);
// All Winners: tabla de estrellas
const starsTable = (s: RoomState) => {
  if (s.fmt !== "winners") return "";
  const list = aliveKeys(s).sort((a, b) => (s.stars?.[b] || 0) - (s.stars?.[a] || 0));
  return `<div class="lala-table mp-stars"><b>⭐ Estrellas</b>${list.map((k) => `<span class="${k === pkey(room.me) ? "me" : ""}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i>${esc(keyName(s, k))}<em>${s.stars?.[k] || 0} ⭐</em></span>`).join("")}</div>`;
};
// ------------------------------ Giros: lo que pasó (lo lleva la anfitriona) ------------------------------
function sorpresa(s: RoomState) {
  const r = s.twistResult!;
  const nm = (k: string) => keyName(s, k);
  const swap = (sv: string, en: string, icon: string) => `<div class="mp-vs">${face(s, sv)}<span>${icon}</span>${face(s, en, "gone")}</div><p><b>${esc(nm(sv))}</b> se salva del lip sync y <b>${esc(nm(en))}</b> entra en su lugar.</p>`;
  if (r.kind === "repesca") {
    const back = r.back;
    return watch(s, "panel", () => [["host", "Reinas, el jurado ha valorado los monólogos por parejas."], ...(back ? [["host", `La pareja ganadora es la de ${nm((r.pairs || [])[0]?.c || "")} y ${nm(back)}...`], ["host", `${nm(back)}, te has ganado tu SEGUNDA OPORTUNIDRAG. ¡Vuelves a la competición!`]] as [string, string][] : [])],
      () => `<p class="eyebrow">🔁 Segunda Oportunidrag · ranking por parejas</p>${back ? `<h3>¡${esc(nm(back))} vuelve a la competición!</h3>` : "<h3>Nadie vuelve esta vez</h3>"}<ol class="rp-rank">${(r.pairs || []).map((p, k) => `<li class="${k === 0 ? "win" : ""}" style="--i:${k}"><b class="rp-pos">${k + 1}º</b><span class="rp-q"><i style="background-image:url('${Q(keyQueen(s, p.c)).photo}')"></i><em>${esc(nm(p.c))}</em></span><span class="rp-plus">+</span><span class="rp-q">${p.o ? `<i style="background-image:url('${Q(keyQueen(s, p.o)).photo}')"></i><em>${esc(nm(p.o))}</em>` : `<i class="none"></i><em>sola</em>`}</span><span class="rp-res">${k === 0 && p.o ? "🔁 vuelve" : ""}</span></li>`).join("")}</ol><p class="muted">Las tres peores parejas van al lip sync a tres bandas: se salva una y se van dos.</p>`);
  }
  if (r.kind === "corazones") {
    // Como en la historia: la grabación de cada eliminada destapa a quién dejó su medio corazón
    return watch(s, "panel", () => {
      const lines: [string, string][] = [["host", "Pero antes del lip sync... esta es la temporada del corazón."]];
      (r.gifts || []).forEach((g) => {
        const vid: [string, string][] = api().heartVideo(g.chosen || Math.random() < 0.5);
        vid.forEach(([w, t]) => lines.push([w === "r1" ? `q:${keyQueen(s, g.from)}` : w, t.replace(/\{dest\}/g, nm(g.to)).replace(/\{r1\}/g, nm(g.from))]));
        lines.push(["host", `💔 Medio corazón para ${nm(g.to)}.`]);
      });
      if (r.full?.length) lines.push(["host", `${names(s, r.full)}: ${r.full.length > 1 ? "tenéis" : "tienes"} un corazón entero. Solo vale ahora: si no se usa, se pierde.`]);
      return lines;
    },
      () => `<p class="eyebrow">❤️ Los medios corazones</p><div class="mp-gifts">${(r.gifts || []).map((g) => `<div class="mp-vs">${face(s, g.from, "gone")}<span>💔→</span>${face(s, g.to)}</div>`).join("")}</div>${heartsTable(s)}${r.full?.length ? `<p class="twist-note">❤️ ${esc(names(s, r.full))} ${r.full.length > 1 ? "tienen" : "tiene"} un corazón entero: puede salvar a alguien del bottom ahora.</p>` : ""}`);
  }
  if (r.kind === "suerte") {
    const used = r.saved && r.saved.length;
    return watch(s, "panel", () => used ? [["host", "¿Alguien tiene la reina de la suerte?"], ["host", `¡Sorpresa, sorpresa! ${nm(r.by!)} saca la reina de la suerte.`]] : [["host", "¿Alguien tiene la reina de la suerte?"], ["host", "Silencio... Nadie. Vale, seguimos."]],
      () => used ? `<p class="eyebrow">🍀 La reina de la suerte</p><h3>¡${esc(nm(r.by!))} la usa!</h3>${swap(r.saved![0], r.entered![0], "🍀")}` : `<p class="eyebrow">🍀 La reina de la suerte</p><h3>Nadie la ha sacado</h3><p class="muted">Sigue escondida... ¿quién la tendrá?</p>`);
  }
  if (r.kind === "corazon") {
    const used = r.saved && r.saved.length;
    return watch(s, "panel", () => used ? [["host", `${nm(r.by!)} usa su corazón entero.`]] : [["host", "El corazón no se ha usado... y se pierde. Así son las reglas."]],
      () => used ? `<p class="eyebrow">❤️ El corazón</p><h3>¡${esc(nm(r.by!))} usa su corazón!</h3>${r.saved!.map((sv, i) => swap(sv, r.entered![i], "❤️")).join("")}` : `<p class="eyebrow">❤️ El corazón</p><h3>Corazón perdido</h3>`);
  }
  if (r.kind === "moneda") {
    const ch = r.chosen!;
    return watch(s, "panel", () => [["host", r.cara ? "Ha salido CARA: votos para salvar." : "Ha salido CRUZ: votos para condenar."], ["host", r.cara ? `${nm(ch)} se salva.` : `${nm(ch)} va directa al lip sync.`]],
      () => `<p class="eyebrow">🪙 ${r.cara ? "Cara: votos para salvar" : "Cruz: votos para condenar"}</p><h3>${esc(r.cara ? `${nm(ch)} se salva` : `${nm(ch)} va directa al lip sync`)}</h3>${r.tie ? `<p class="twist-note">⚖️ Hubo empate: desempata con su voto la ganadora de la semana${s.rows?.[0] ? `, <b>${esc(nm(s.rows[0].key))}</b>` : ""}: ${r.cara ? "salva a" : "condena a"} <b>${esc(nm(ch))}</b>.</p>` : ""}<div class="votes">${Object.entries(r.votes || {}).map(([k, vs]) => `<div class="vote-col ${k === ch ? "top" : ""}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><b>${esc(nm(k))}</b><span>${vs.length} voto${vs.length === 1 ? "" : "s"}</span><div class="voters">${vs.map((v) => `<img src="${Q(keyQueen(s, v)).photo}" title="${esc(nm(v))}">`).join("")}</div></div>`).join("")}</div><p>Al lip sync: <b>${(s.bottom || []).map((k) => esc(nm(k))).join("</b> y <b>")}</b>.</p>`);
  }
  // All Winners: estrellas y bloqueo
  return watch(s, "panel", () => [["host", `${(r.stars || []).length ? `${names(s, r.stars || [])}: ${(r.stars || []).length > 1 ? "os lleváis" : "te llevas"} la Legendary Legend Star.` : "Esta semana no hay estrella para la bloqueada."}`], ...(r.target ? [["host", `${nm(r.by!)} bloquea a ${nm(r.target)}: la semana que viene no podrá ganar estrella.`] as [string, string]] : [])],
    () => `<p class="eyebrow">⭐ All Winners</p><div class="ll-award"><img class="ll-star" src="./images/legendary-star.png?v=2" alt="Legendary Legend Star"><div><p class="ll-title">Legendary Legend Star</p><div class="call-faces">${(r.stars || []).map((k) => face(s, k)).join("")}</div></div></div>${r.target ? `<div class="mp-vs">${face(s, r.by!)}<span>🚫</span>${face(s, r.target, "gone")}</div><p>${esc(nm(r.target))} no podrá ganar estrella la semana que viene.</p>` : ""}${starsTable(s)}`);
}
const heartsTable = (s: RoomState) => {
  const list = aliveKeys(s).filter((k) => s.hearts?.[k]);
  return list.length ? `<p class="muted">${list.map((k) => `${esc(keyName(s, k))}: ${"❤️".repeat(Math.floor((s.hearts![k]) / 2))}${s.hearts![k] % 2 ? "💔" : ""}`).join(" · ")}</p>` : "";
};

// Temporada del corazón: la que se va deja medio corazón (se sabrá la semana que viene con su grabación)
const heartNote = (s: RoomState) => {
  if (s.fmt !== "corazon") return "";
  const gone = (s.pendingHearts || []).filter((g) => g.ep === s.ep && g.from !== pkey(room.me));
  return gone.map((g) => `<p class="twist-note">💔 ${esc(keyName(s, g.from))} deja su medio corazón a alguien... Lo sabréis la semana que viene.</p>`).join("");
};
// Si la eliminada eres tú, eliges a quién se lo dejas (hasta que se destape)
const heartChoice = (s: RoomState) => {
  if (s.fmt !== "corazon") return "";
  const g = (s.pendingHearts || []).find((x) => x.from === pkey(room.me));
  if (!g) return "";
  if (g.chosen) return `<p class="twist-note">📼 Has grabado tu mensaje: tu medio corazón es para <b>${esc(keyName(s, g.to))}</b>. Se destapará la semana que viene.</p>`;
  return `<div class="mp-heart-pick"><p class="eyebrow">📼 Tu grabación</p><h4>¿A quién dejas tu medio corazón?</h4><p class="muted">Nadie lo sabrá hasta que pongan tu vídeo la semana que viene. Si no eliges, se elige al azar.</p><div class="hub-grid">${aliveKeys(s).map((k, i) => `<button class="hub-q" style="--i:${i}" data-heart="${esc(k)}"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(keyName(s, k))}</span>${keyPlayer(s, k) ? `<small>${esc(keyPlayer(s, k))}</small>` : ""}${s.hearts?.[k] ? `<small>${s.hearts[k] % 2 ? "💔" : "❤️"} ya tiene</small>` : ""}</button>`).join("")}</div></div>`;
};
document.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest?.("[data-heart]") as HTMLElement | null; if (b) room.submit({ heart: b.dataset.heart! }); });
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
    return info(`<p class="eyebrow">💄 Elige tu pintalabios</p><h3>Si ganas el lip sync, ¿a quién mandas a casa?</h3><p>Tu rival también elige el suyo en secreto. Puedes mirar la semana, la temporada... o hacer la jugarreta.</p>${trackPeek()}
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
// All Winners: nombre de la eliminatoria y de la ronda
const brLabel = (s: RoomState) => (s.bracket ? `${s.bracket.kind === "qosd" ? "💅 QoSDADHH" : "👑 Reina de reinas"} · ${s.bracket.alive.length === 2 ? "la final" : `ronda ${s.bracket.round}`}` : "");
function lipsync(s: RoomState, myKey: string | null) {
  // Lip sync a tres bandas: cada jugadora baila contra la más fuerte de las otras dos
  if (s.triple) {
    const T = s.triple;
    if (myKey && T.includes(myKey) && !(s.subs[room.me] || {}).ls) {
      const rival = T.filter((k) => k !== myKey)[0];
      return play(s, s.phase, (el) => api().lipsyncShow(el, keyQueen(s, rival), { eyebrow: "💄 Lip sync a tres bandas", curtain: "LIP SYNC A TRES BANDAS", note: `Contra ${names(s, T.filter((k) => k !== myKey))}. Solo se queda una.` }, (won: boolean, score: number) => { playing = null; room.submit({ ls: { won, score } }); }));
    }
    if (myKey && T.includes(myKey)) return info(`<p class="eyebrow">💄 Lip sync a tres bandas</p><h3>¡Hecho! Esperando el veredicto...</h3>`);
    return info(`<p class="eyebrow">💄 Lip sync a tres bandas</p><h3>${esc(names(s, T))}</h3><div class="vs three">${T.map((k) => `<img src="${Q(keyQueen(s, k)).photo}" alt="${esc(keyName(s, k))}">`).join("")}</div><p class="muted">Las tres lo dan todo. Solo una se queda.</p>${T.some(isP) ? skipBtn(s) : ""}`);
  }
  const pairs = s.pairs || [];
  const mine = myKey ? pairs.find((p) => (p.a === myKey || p.b === myKey) && !p.winner) : null;
  if (mine && !(s.subs[room.me] || {}).ls) {
    const rivalKey = mine.a === myKey ? mine.b : mine.a;
    const br = s.phase === "final" ? brLabel(s) : null;
    const o = br ? { eyebrow: br, curtain: s.bracket!.alive.length === 2 ? (s.bracket!.kind === "qosd" ? "QoSDADHH" : "REINA DE REINAS") : "GRAN FINAL", note: `${s.note ? s.note + " " : ""}La que pierda se queda fuera.` }
      : s.phase === "final"
      ? { eyebrow: s.finalStage === 2 ? "👑 Lip sync por la corona" : "Gran final · semifinal", curtain: s.finalStage === 2 ? "LIP SYNC POR LA CORONA" : "LIP SYNC", note: "" }
      : AS(s) ? { eyebrow: "💄 Lip sync por el poder", curtain: "LIP SYNC POR EL PODER", note: "La que gane se lleva el reto y saca su pintalabios." }
      : s.fmt === "winners" ? { eyebrow: "⭐ Lip sync por la estrella", curtain: "LIP SYNC POR LA ESTRELLA", note: "La que gane bloquea a una rival." }
      : { eyebrow: "💔 Lip sync for your life", curtain: "LIP SYNC FOR YOUR LIFE", note: "La que pierda se va a casa." };
    return play(s, s.phase, (el) => api().lipsyncShow(el, keyQueen(s, rivalKey), o, (won: boolean, score: number) => { playing = null; room.submit({ ls: { won, score } }); }));
  }
  if (myKey && pairs.some((p) => p.a === myKey || p.b === myKey) && (s.subs[room.me] || {}).ls) return info(`<p class="eyebrow">💄 Lip sync</p><h3>¡Hecho! Esperando el veredicto...</h3>`);
  info(`${s.phase === "final" && s.finalStage === 1 ? revealHTML(s) : ""}<p class="eyebrow">${s.phase === "final" && brLabel(s) ? brLabel(s) : s.phase === "final" ? (s.finalStage === 2 ? "👑 Lip sync por la corona" : "Gran final · semifinales") : AS(s) ? "💄 Lip sync por el poder" : s.fmt === "winners" ? "⭐ Lip sync por la estrella" : "Lip sync for your life"}</p>${s.note ? `<p class="twist-note">${esc(s.note)}</p>` : ""}${pairs.map((p) => `<div class="mp-vs">${face(s, p.a)}${s.fmt === "winners" && s.phase === "lipsync" ? `<img class="ll-vs" src="./images/legendary-star.png?v=2" alt="Legendary Legend Star">` : "<span>VS</span>"}${face(s, p.b)}</div>`).join("")}<p class="muted">${pairs.some((p) => isP(p.a) || isP(p.b)) ? "Las jugadoras del lip sync están bailando..." : "Las reinas lo dan todo en el escenario..."}</p>${pairs.some((p) => isP(p.a) || isP(p.b)) ? skipBtn(s) : ""}`);
}
function track(s: RoomState) {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const rows = standings(s);
  const cls = (l: string) => ({ WIN: "t-win", BWIN: "t-win t-blocked", WINNER: "t-win", TOP2: "t-top2", BTOP: "t-top2 t-blocked", HIGH: "t-high", SAFE: "t-safe", LOW: "t-low", BTM2: "t-btm", BTM3: "t-btm", ELIM: "t-elim", ELIMF: "t-elim", RTRN: "t-rtrn", "RUNNER-UP": "t-runner", "3ª": "t-third", QOSD: "t-qosd" } as Record<string, string>)[l] || "t-none";
  const lab = (l: string) => ({ WINNER: "GANADORA", "RUNNER-UP": "RUNNER-UP", "3ª": "3ª/4ª", BWIN: "WIN", BTOP: "TOP2", ELIMF: "ELIMINADA", QOSD: "QoSDADHH" } as Record<string, string>)[l] || l;
  const AW = s.fmt === "winners";
  const lastEp = (k: string) => Math.max(0, ...eps.filter((e) => (s.track[k] || {})[e]));
  return `<div class="track-wrap"><table class="track"><thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(s.epNames[e])}</small></th>`).join("")}${AW ? "<th>⭐</th>" : ""}<th>PPE</th></tr></thead><tbody>${rows
    .map((r, i) => { const k = r.key; return `<tr class="${k === pkey(room.me) ? "me" : ""} ${r.out ? "out" : ""}" style="--i:${i}"><td class="rk">${esc(r.place)}</td><td class="qn"><i style="background-image:url('${Q(keyQueen(s, k)).photo}')"></i><span>${esc(keyName(s, k))}${keyPlayer(s, k) ? ` <b>(${esc(keyPlayer(s, k))})</b>` : ""}</span></td>${eps.map((e) => { const l = (s.track[k] || {})[e]; return `<td class="${l ? cls(l) : r.out && e > lastEp(k) ? "t-gone" : "t-none"}">${l ? lab(l) : ""}</td>`; }).join("")}${AW ? `<td class="ppe">${s.stars?.[k] || 0}</td>` : ""}<td class="ppe">${Object.keys(s.track[k] || {}).length ? ppeOf(s, k).toFixed(2) : "–"}</td></tr>`; })
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
let lobbyFilter = "all";
function lobby(s: RoomState) {
  const custom = s.season === CUSTOM;
  const se = W.seasonById(s.season);
  const all = custom ? (api().allQueens() as { id: string; season: string }[]) : castOf(s.season).map((id) => ({ id, season: s.season }));
  const cast = all.map((x) => x.id);
  const taken = new Map(s.players.filter((p) => p.queen).map((p) => [p.queen!, p]));
  const mine = s.players.find((p) => p.id === room.me);
  const cfg = s.custom;
  const rivals = (cfg?.rivals || []).filter((q) => !taken.has(q));
  const need = cfg ? Math.max(0, cfg.size - s.players.length) : 0;
  const ready = s.players.length >= 1 && s.players.every((p) => p.queen) && (!custom || cfg?.pick === "azar" || rivals.length === need);
  if (!lobbyFocus || !cast.includes(lobbyFocus)) lobbyFocus = mine?.queen || cast[0];
  // En la personalizada se filtran por temporada (son muchas)
  const seasonsIn = [...new Set(all.map((x) => x.season))];
  const shown = custom && lobbyFilter !== "all" ? all.filter((x) => x.season === lobbyFilter) : all;
  const compact = shown.length > 8;
  const fmtTxt = `${FORMATOS[(s.fmt || "normal") as Formato].icon} ${FORMATOS[(s.fmt || "normal") as Formato].n}`;
  const card = (id: string, mode: "pick" | "rival") => {
    const t = taken.get(id);
    const other = t && t.id !== room.me;
    const isRival = rivals.includes(id);
    const cls = mode === "pick" ? `${t && t.id === room.me ? "selected" : ""} ${other ? "taken" : ""} ${isRival ? "rival" : ""}` : `${isRival ? "selected" : ""} ${t ? "taken" : ""}`;
    return `<button class="queen-card ${cls} ${id === lobbyFocus ? "active" : ""}" data-${mode === "pick" ? "q" : "r"}="${id}"><span class="portrait" style="background-image:url('${Q(id).photo}')"></span><span class="name">${esc(Q(id).name)}</span><span class="check" aria-hidden="true">✓</span>${t && (other || mode === "rival") ? `<span class="mp-taken">🎮 ${esc(t.name)}</span>` : isRival && mode === "pick" ? `<span class="mp-taken">⚔️ Rival</span>` : ""}</button>`;
  };
  info(`
    <p class="eyebrow">Sala ${esc(s.code)} · ${custom ? "Personalizada" : esc(se?.name || "")} · ${fmtTxt} · ritmo ${s.ritmo === "rapido" ? "rápido" : s.ritmo === "libre" ? "sin límite" : "normal"}${s.ia ? " · ✍️ con IA" : ""}</p>
    <h3>Código de la sala: <span class="mp-code">${esc(s.code)}</span></h3>
    <p class="muted">Pásaselo a tus amigas. ${custom ? `Cada una elige una reina de cualquier temporada. ${cfg?.pick === "elegidas" ? `La anfitriona elige ${need} rivales.` : `Las ${need} rivales se sortean al empezar.`} ${esc(FORMATOS[(s.fmt || "normal") as Formato].d)}` : "Cada una elige una reina; las que no cojáis las juega el juego."} ${s.ritmo === "libre" ? "Sin límite de tiempo." : `Tope de juego por episodio: ${Math.round(topeEpisodio(s.ritmo) / 60)} minutos.`}</p>
    <div class="mp-players">${s.players.map((p) => `<span class="mp-face ${p.id === room.me ? "me" : ""}"><i style="background-image:url('${p.queen ? Q(p.queen).photo : ""}')"></i><b>${esc(p.name)}${p.id === s.host ? " 👑" : ""}</b><small>${p.queen ? esc(Q(p.queen).name) : "eligiendo..."}</small></span>`).join("")}</div>
    <h4>${mine?.queen ? "Tu reina: " + esc(Q(mine.queen).name) : "Elige tu reina"}</h4>
    ${custom ? `<div class="mp-filter" role="tablist">${["all", ...seasonsIn].map((k) => `<button type="button" class="chip ${k === lobbyFilter ? "on" : ""}" data-fil="${k}">${k === "all" ? "Todas" : esc(W.seasonById(k)?.name || k)}</button>`).join("")}</div>` : ""}
    <div class="mp-select">
      <div class="mp-qgrid ${compact ? "compact" : ""}">${shown.map((x) => card(x.id, "pick")).join("")}</div>
      <div class="mp-qdet" aria-live="polite">${queenDetails(s, lobbyFocus)}</div>
    </div>
    ${custom && cfg?.pick === "elegidas" ? `<div class="mp-rivals"><h4>⚔️ Rivales: ${rivals.length}/${need}${room.isHost ? " · pulsa para añadir o quitar" : " · las elige la anfitriona"}</h4>
      <div class="mp-qgrid compact">${rivals.map((id) => card(id, "rival")).join("") || `<p class="muted">${room.isHost ? "Pulsa «Añadir como rival» en la ficha de una reina, o sortea las que falten." : "Todavía no hay rivales."}</p>`}</div>
      ${room.isHost ? `<div class="row"><button class="btn btn-ghost" id="mp-addrival" ${rivals.length >= need || taken.has(lobbyFocus) || rivals.includes(lobbyFocus) ? "disabled" : ""}>⚔️ Añadir a ${esc(Q(lobbyFocus).name)} como rival</button><button class="btn btn-ghost" id="mp-fillrival" ${rivals.length >= need ? "disabled" : ""}>🎲 Sortear las que faltan</button></div>` : ""}</div>` : ""}
    <div class="row">
      <button class="btn btn-ghost" id="mp-exit">Salir</button>
      ${room.isHost ? `<button class="btn btn-primary" id="mp-start" ${ready ? "" : "disabled"}>${ready ? "¡Empezar la temporada!" : custom && cfg?.pick === "elegidas" && rivals.length !== need ? "Faltan rivales por elegir" : "Esperando a que todas elijan"}</button>` : `<p class="muted">La anfitriona empezará cuando estéis todas.</p>`}
    </div>`, () => {
    // Clic: ver su ficha y, si está libre, elegirla (como en el modo normal)
    document.querySelectorAll<HTMLButtonElement>(".mp-qgrid .queen-card[data-q]").forEach((b) => (b.onclick = () => {
      const id = b.dataset.q!;
      lobbyFocus = id;
      const t = taken.get(id);
      if ((!t || t.id === room.me) && !rivals.includes(id)) room.pick(id);
      const st = room.state;
      if (st) lobby(st);
    }));
    // Rival elegida: se quita con un clic (solo la anfitriona)
    document.querySelectorAll<HTMLButtonElement>(".mp-qgrid .queen-card[data-r]").forEach((b) => (b.onclick = () => {
      lobbyFocus = b.dataset.r!;
      if (room.isHost && cfg) room.setCustom({ ...cfg, rivals: rivals.filter((x) => x !== b.dataset.r) });
      const st = room.state; if (st) lobby(st);
    }));
    document.querySelectorAll<HTMLButtonElement>("[data-fil]").forEach((b) => (b.onclick = () => { lobbyFilter = b.dataset.fil!; const st = room.state; if (st) lobby(st); }));
    const add = $("#mp-addrival");
    if (add && cfg) add.onclick = () => room.setCustom({ ...cfg, rivals: [...rivals, lobbyFocus] });
    const fill = $("#mp-fillrival");
    if (fill && cfg) fill.onclick = () => {
      const pool = cast.filter((q) => !taken.has(q) && !rivals.includes(q)).sort(() => Math.random() - 0.5);
      room.setCustom({ ...cfg, rivals: [...rivals, ...pool.slice(0, need - rivals.length)] });
    };
    $("#mp-exit")!.onclick = exit;
    const st = $("#mp-start");
    if (st) st.onclick = () => {
      if (!custom) return room.start();
      // Reparto: las jugadoras + las rivales elegidas (o sorteadas ahora)
      const mineQ = s.players.map((p) => p.queen!).filter(Boolean);
      const pool = cast.filter((q) => !mineQ.includes(q) && !rivals.includes(q)).sort(() => Math.random() - 0.5);
      const rv = cfg?.pick === "elegidas" ? rivals : [...rivals, ...pool].slice(0, need);
      room.start([...mineQ, ...rv]);
    };
  }, "mp-lobby");
}

// Lo que se gana en el multijugador va a tus lentejuelas (las mismas del modo historia y la tienda)
const PAY: Record<string, number> = { WIN: 25, BWIN: 25, TOP2: 20, BTOP: 20, HIGH: 18, SAFE: 15, RTRN: 15, LOW: 12, BTM2: 10, BTM3: 10, ELIM: 10, ELIMF: 10, "3ª": 20, QOSD: 25, "RUNNER-UP": 30, WINNER: 60 };
function payout(s: RoomState | null) {
  if (!s || s.phase === "lobby" || s.phase === "maletas") return;
  const mine = pkey(room.me);
  if (!s.track[mine]) return;
  const key = `dftc-mp-paid:${s.code}:${room.me}`;
  if (W.store?.get(key, false)) return;
  const labs = Object.values(s.track[mine] || {}) as string[];
  const n = 20 + labs.reduce((a, l) => a + (PAY[l] || 0), 0);
  W.store?.set(key, n);
  const won = s.champion === mine;
  api().reward(n, won ? "¡Corona en directo!" : "Por tu temporada en directo");
}
function exit() {
  // Si sales eliminada (o al final), te llevas lo ganado
  const st = room.state, meP = st?.players.find((p) => p.id === room.me);
  if (st && (st.phase === "corona" || (meP && !meP.alive))) payout(st);
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
