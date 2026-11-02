// Interfaz del juego nuevo (React encima del canvas de Phaser): carga, menú, marcador, pausa y resultado.
import { useEffect, useRef, useState } from "react";
import { startGame } from "../game";
import { send } from "../bridge";
import { useGame, setMuted } from "../store";
import { unlockAudio } from "../game/sfx";
import { ARCADE_QUEENS, LOOK_PIECES } from "../game/data";
import { startLives } from "../game/rules";
import { lipSyncMove, rivalSoFar } from "../game/lipsync";
import { EMOTES, LS_PHASES, LS_STEPS, REPITE, type LsKind } from "../../core/lipsync";
import { chooseLook, chooseWalk, chooseMoment, chooseVoice, submitConcept, chooseConceptMoment, answerAna, WALK_OPTS } from "../game/runway";
import { MOMENT_NAMES } from "../../core/concepto";
import { queenOf } from "../game/queens";
import { backFromScene, openSeasons, resume, hasSaved } from "../game/temporada";
import { TemporadaUI } from "./Temporada";
import { MenuBar } from "./Cuenta";
import { unlockMusic } from "../game/music";

export function App() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => (host.current ? startGame(host.current) : undefined), []);
  // El audio arranca con el primer gesto (los navegadores no dejan antes)
  useEffect(() => {
    const go = () => { unlockAudio(); unlockMusic(); };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
    return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); };
  }, []);
  const screen = useGame((s) => s.screen);
  return (
    <div className="nx-root">
      <div className="nx-canvas" ref={host} />
      <div className="nx-ui">
        {screen === "boot" && <Loading />}
        {screen === "menu" && <MenuBar />}
        {screen === "menu" && <MenuUI />}
        {screen === "arcade" && <Hud />}
        {screen === "result" && <Result />}
        {screen === "lipsync" && <LipSyncUI />}
        {screen === "runway" && <RunwayUI />}
        {screen === "temporada" && <TemporadaUI />}
        <Toasts />
      </div>
    </div>
  );
}

function Loading() {
  const p = useGame((s) => s.loading);
  return (
    <div className="nx-center">
      <p className="nx-eyebrow">Drag for the Crown</p>
      <div className="nx-bar" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${p * 100}%` }} /></div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return <span className="nx-stat"><small>{label}</small><b>{"★".repeat(v)}<em>{"★".repeat(5 - v)}</em></b></span>;
}

// Portada como la de la versión clásica: el logo y un carrusel con los modos de juego
const MODOS = [
  { id: "historia", cls: "s-story", kicker: "Temporada completa", name: "Modo historia", desc: "Retos, pasarela, críticas y lip syncs hasta la corona.", art: ["images/modo-historia.png"] },
  { id: "arcade", cls: "s-arcade", kicker: "Partida rápida", name: "Arcade", desc: "Duelo de tacones, lip sync y pasarela con tu reina.", art: ["images/modo-arcade.png"] },
  { id: "mp", cls: "s-mp", kicker: "En directo con amigas", name: "Multijugador", desc: "Una temporada a la vez, con tiempo por episodio.", art: ["images/queens/alexandra-del-raval.png", "images/queens/carmen-farala.png", "images/queens/arantxa-castilla-la-mancha.png"] },
  { id: "clasico", cls: "s-next", kicker: "La de siempre", name: "Versión clásica", desc: "El juego de antes, con su modo historia y su multijugador.", art: ["images/queens/the-macarena.png", "images/queens/pupi-poisson.png", "images/queens/sagittaria.png"] },
] as const;

// Al volver de una partida rápida se vuelve a la elección de reina, no a la portada
let menuView: "modos" | "arcade" = "modos";
function MenuUI() {
  const [view, setView] = useState(menuView);
  const to = (v: typeof menuView) => { menuView = v; setView(v); };
  return view === "arcade" ? <ArcadeMenu onBack={() => to("modos")} /> : <Modos onArcade={() => to("arcade")} />;
}

function Modos({ onArcade }: { onArcade: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const saved = hasSaved();
  const go = (i: number) => {
    const el = track.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "center", block: "nearest" });
  };
  // La tarjeta activa es la que queda en el centro
  const onScroll = () => {
    const t = track.current;
    if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, dist = Infinity;
    Array.from(t.children).forEach((c, i) => { const el = c as HTMLElement; const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    setActive(best);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(Math.min(MODOS.length - 1, active + 1)); if (e.key === "ArrowLeft") go(Math.max(0, active - 1)); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  const open = (i: number) => {
    if (i !== active) return go(i);
    const id = MODOS[i].id;
    if (id === "historia") openSeasons();
    else if (id === "arcade") onArcade();
    else location.href = id === "mp" ? "./clasico.html?mp" : "./clasico.html";
  };
  return (
    <div className="nx-modes">
      <p className="nx-tagline">Drag Race España · Solo una se lleva la corona</p>
      <div className="nx-modes-car" role="region" aria-roledescription="carrusel" aria-label="Modos de juego">
        <button className="nx-mode-arrow prev" aria-label="Modo anterior" disabled={active === 0} onClick={() => go(active - 1)}>‹</button>
        <div className="nx-modes-track" ref={track} onScroll={onScroll}>
          {MODOS.map((m, i) => (
            <div key={m.id} className={`nx-mode ${m.cls} ${i === active ? "active" : ""}`} role="group" aria-roledescription="modo" aria-label={m.name} onClick={() => open(i)}>
              <span className="ms-num" aria-hidden="true">0{i + 1}</span>
              <span className="ms-copy">
                <span className="ms-kicker">{m.kicker}</span>
                <span className="ms-name">{m.name}</span>
                <span className="ms-desc">{m.desc}</span>
                <span className="ms-ctas">
                  <button className="ms-cta" tabIndex={i === active ? 0 : -1} onClick={(e) => { e.stopPropagation(); if (i !== active) go(i); else open(i); }}>{m.id === "historia" && saved ? "Nueva" : "Jugar"}</button>
                  {m.id === "historia" && saved && <button className="ms-cta alt" tabIndex={i === active ? 0 : -1} onClick={(e) => { e.stopPropagation(); resume(); }}>Seguir mi temporada</button>}
                </span>
              </span>
              {m.art.length === 1 ? <img className="ms-art" src={`./${m.art[0]}`} alt="" /> : <span className="ms-art ms-trio" aria-hidden="true">{m.art.map((a) => <img key={a} src={`./${a}`} alt="" />)}</span>}
            </div>
          ))}
        </div>
        <button className="nx-mode-arrow next" aria-label="Modo siguiente" disabled={active === MODOS.length - 1} onClick={() => go(active + 1)}>›</button>
      </div>
      <div className="nx-modes-dots" role="tablist" aria-label="Elegir modo">
        {MODOS.map((m, i) => <button key={m.id} role="tab" aria-selected={i === active} aria-label={m.name} onClick={() => go(i)} />)}
      </div>
    </div>
  );
}

function ArcadeMenu({ onBack }: { onBack: () => void }) {
  const best = useGame((s) => s.best);
  const start = useGame((s) => s.queenId);
  const [pick, setPick] = useState(ARCADE_QUEENS.some((x) => x.id === start) ? start : ARCADE_QUEENS[0].id);
  const q = ARCADE_QUEENS.find((x) => x.id === pick)!;
  return (
    <div className="nx-menu">
      <div className="nx-panel">
        <button className="nx-btn ghost nx-back" onClick={onBack}>‹ Modos</button>
        <p className="nx-eyebrow">Partida rápida</p>
        <h2 className="nx-step-title">Elige a tu reina</h2>
        <div className="nx-queens" role="radiogroup" aria-label="Reinas">
          {ARCADE_QUEENS.map((x) => (
            <button key={x.id} role="radio" aria-checked={x.id === pick} className={x.id === pick ? "on" : ""} onClick={() => setPick(x.id)}>
              <img src={`./${x.sprite}`} alt="" /><span>{x.name}</span>
            </button>
          ))}
        </div>
        <p className="nx-power"><b>✨ {q.power.name}:</b> {q.power.desc}</p>
        <div className="nx-stats">
          <Stat label="Velocidad" v={q.stats.speed} /><Stat label="Cadencia" v={q.stats.rate} /><Stat label="Poder" v={q.stats.power} />
          <span className="nx-stat"><small>Vidas</small><b>{"❤️".repeat(startLives(q))}</b></span>
        </div>
        <div className="nx-row">
          <button className="nx-btn" onClick={() => send({ type: "start", queenId: pick })}>Arcade</button>
          <button className="nx-btn ghost" onClick={() => send({ type: "lipsync", queenId: pick })}>💋 Lip sync</button>
          <button className="nx-btn ghost" onClick={() => send({ type: "runway", queenId: pick })}>👠 Pasarela</button>
        </div>
        <p className="nx-muted">Flechas o WASD para moverte, Espacio para lanzar tacones, E para el poder, P para pausar. En el móvil, arrastra el dedo.{best ? ` · Récord: ${best}` : ""}</p>
      </div>
    </div>
  );
}

function Hud() {
  const s = useGame((x) => x);
  return (
    <>
      <div className="nx-hud">
        <div className="nx-hud-l"><span aria-label={`${s.lives} vidas`}>{"❤️".repeat(Math.max(0, s.lives))}</span><b>{s.score.toLocaleString("es-ES")}</b>{s.combo > 1 && <em>x{Math.min(8, s.combo)}</em>}</div>
        <div className="nx-hud-r"><small>Ronda {s.round}/5 · {s.rivalName}</small><div className="nx-bar rival"><i style={{ width: `${(s.rivalHp / s.rivalMax) * 100}%` }} /></div></div>
        <MuteBtn />
        <button className="nx-round" aria-label="Pausa" onClick={() => send({ type: "pause", on: true })}>⏸</button>
      </div>
      <div className="nx-power-hud">
        {s.activePower && <span className="nx-chip">✨ {s.powerName}</span>}
        {s.doubleOn && <span className="nx-chip gold">⭐ Doble tacón</span>}
        <button className={`nx-special ${s.special >= 1 ? "ready" : ""}`} disabled={s.special < 1} onClick={() => send({ type: "special" })} aria-label={s.special >= 1 ? `Usar poder: ${s.powerName}` : "Poder cargando"}>
          <i style={{ height: `${s.special * 100}%` }} /><span>✨</span>
        </button>
      </div>
      {s.paused && (
        <div className="nx-center nx-dim">
          <div className="nx-panel small"><h2>Pausa</h2>
            <button className="nx-btn" onClick={() => send({ type: "pause", on: false })}>Seguir</button>
            <button className="nx-btn ghost" onClick={() => send({ type: "menu" })}>Menú</button>
          </div>
        </div>
      )}
    </>
  );
}

// Lip sync: seis movimientos (inicio, puente y clímax). Gana la que más conecta con el público.
function LipSyncUI() {
  const ls = useGame((s) => s.ls);
  const back = useGame((s) => s.back);
  const queenId = useGame((s) => s.queenId);
  if (!ls) return null;
  const me = queenOf(queenId), rv = queenOf(ls.rivalId);
  const theirs = rivalSoFar(ls), mx = Math.max(ls.mine, ls.rival, 120);
  const pi = Math.min(2, Math.floor(ls.step / 2)), clim = pi === 2;
  const [, emoteName, emoteAttr] = EMOTES[ls.emote];
  const opts: { k: LsKind; t: string; d: string }[] = [
    { k: "Emote", t: emoteName, d: `Energía −45 · ${emoteAttr}${clim ? " · ¡momento perfecto!" : " · mejor en el clímax"}` },
    { k: "Cara", t: "💗 Conexión emocional", d: `Energía −10${ls.lastTag === "Cara" ? ` · ⚠️ repetir resta (×${REPITE})` : ""}` },
    { k: "Escenario", t: "🌀 Uso del espacio", d: `Energía −15${ls.lastTag === "Escenario" ? ` · ⚠️ repetir resta (×${REPITE})` : ""}` },
  ];
  const won = ls.mine >= ls.rival;
  return (
    <>
      <div className="nx-hud">
        <div className="nx-ls-crowd">
          <small>👏 Público · {me.name} vs {rv.name}</small>
          <div className="nx-bar"><i style={{ width: `${(ls.mine / mx) * 100}%` }} /></div>
          <div className="nx-bar rival-ls"><i style={{ width: `${(theirs / mx) * 100}%` }} /></div>
        </div>
        <MuteBtn />
      </div>
      <div className="nx-ls-panel">
        {ls.done ? (
          <div className="nx-panel small">
            <p className="nx-eyebrow">Lip sync for your life</p>
            <h2>{won ? "¡Shantay, you stay! 💃" : "Sashay away..."}</h2>
            <p className="nx-muted">Tú: {Math.round(ls.mine)} · {rv.name}: {Math.round(ls.rival)}</p>
            {back ? <button className="nx-btn" onClick={backFromScene}>{back}</button> : (
              <>
                <button className="nx-btn" onClick={() => send({ type: "lipsync", queenId })}>Otro lip sync</button>
                <button className="nx-btn ghost" onClick={() => send({ type: "menu" })}>Menú</button>
              </>
            )}
          </div>
        ) : (
          <div className="nx-panel">
            <p className="nx-eyebrow">🎵 {LS_PHASES[pi]} de la canción · {(ls.step % 2) + 1}/2 · ⚡ Energía {ls.energy}</p>
            {ls.last ? <p className="nx-ls-last"><b>Tú:</b> {ls.last.me} <b>{rv.name}:</b> {ls.last.them}</p> : <p className="nx-ls-last">Alterna movimientos (repetir aburre) y guarda 45 de energía para un truco en el clímax.</p>}
            <div className="nx-ls-opts">
              {opts.map((o) => <button key={o.k} className="nx-opt" onClick={() => lipSyncMove(o.k)}><b>{o.t}</b><small>{o.d}</small></button>)}
            </div>
            <small className="nx-muted">Paso {ls.step + 1} de {LS_STEPS}</small>
          </div>
        )}
      </div>
    </>
  );
}

// Pasarela. Con el jurado en directo: look, concepto, tres momentos y la pregunta de Ana. Sin él, la clásica.
const TAG_ICON: Record<string, string> = { Glamour: "💎", Camp: "🤡", Edgy: "⛓️", "Folclórico": "💃", Futurista: "🚀" };
const CLASSIC_TITLES = ["Elige tu look", "¿Cómo sales a la pasarela?", "Final de pasarela: ¡tu momento!", "🎙️ Tu voz en off..."];
function RunwayUI() {
  const rw = useGame((s) => s.rw);
  const back = useGame((s) => s.back);
  const queenId = useGame((s) => s.queenId);
  const [concept, setConcept] = useState("");
  const conceptRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (rw?.mode === "concepto" && rw.step === 1) conceptRef.current?.focus({ preventScroll: true }); }, [rw?.mode, rw?.step]);
  useEffect(() => { if (rw?.step === 0) setConcept(""); }, [rw?.id, rw?.step]);
  if (!rw) return null;
  const cc = rw.mode === "concepto";
  const title = cc ? (rw.step === 0 ? "Elige tu look" : rw.step === 1 ? "💭 ¿Cuál es el concepto de tu look?" : rw.step <= 4 ? MOMENT_NAMES[rw.moments[rw.step - 2]?.k] : "👓 Ana Locking te pregunta") : CLASSIC_TITLES[rw.step] || "";
  const total = cc ? (rw.step < 2 || rw.qa ? 6 : 5) : 4;
  const verdict = (n: number) => (n >= 85 ? "¡Look de ganadora! 👑" : n >= 70 ? "Muy bien, entre las mejores" : n >= 55 ? "Correcta, sin brillar" : "El jurado no lo ha entendido");
  return (
    <>
      <div className="nx-hud">
        <div className="nx-ls-crowd"><small>👠 Categoría de la pasarela</small><b className="nx-cat">«{rw.cat}»</b></div>
        <MuteBtn />
      </div>
      <div className="nx-ls-panel">
        {rw.done ? (
          <div className="nx-panel small">
            <p className="nx-eyebrow">El jurado ha visto tu pasarela</p>
            <h2>{verdict(rw.score || 0)}</h2>
            <p className="nx-score">{rw.score} / 100</p>
            {rw.lines?.supreme && <p className="nx-jury"><b>Supremme</b> {rw.lines.supreme}</p>}
            {rw.lines?.ana && <p className="nx-jury"><b>Ana</b> {rw.lines.ana}</p>}
            <p className="nx-muted">{rw.msg}</p>
            {back ? <button className="nx-btn" onClick={backFromScene}>{back}</button> : (
              <>
                <button className="nx-btn" onClick={() => send({ type: "runway", queenId })}>Otra pasarela</button>
                <button className="nx-btn ghost" onClick={() => send({ type: "menu" })}>Menú</button>
              </>
            )}
          </div>
        ) : rw.waiting ? (
          <div className="nx-panel small" aria-live="polite">
            <p className="nx-eyebrow">{rw.step >= 4 ? "Fin de tu pasarela" : "Entre bastidores"}</p>
            <h2 className="nx-step-title">{rw.step >= 4 ? "El jurado toma nota..." : "Preparando tu desfile..."}</h2>
            <div className="nx-dots" aria-hidden="true"><i /><i /><i /></div>
          </div>
        ) : (
          <div className="nx-panel">
            <p className="nx-eyebrow">Paso {Math.min(rw.step + 1, total)} de {total}</p>
            <h2 className="nx-step-title">{title}</h2>
            {cc && rw.step <= 1 && <p className="nx-muted nx-theme">{rw.theme}</p>}
            {cc && rw.step === 5 && rw.qa && <p className="nx-quote">{rw.qa.q}</p>}
            {rw.msg && <p className={`nx-ls-last ${rw.good ? "good" : "meh"}`}>{rw.msg}</p>}
            {cc && rw.step === 1 ? (
              <form className="nx-concept" onSubmit={(e) => { e.preventDefault(); void submitConcept(concept); }}>
                <label className="nx-sr" htmlFor="nx-concept">Concepto de tu look</label>
                <input id="nx-concept" ref={conceptRef} maxLength={140} autoComplete="off" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej.: una sirena atrapada en una red de pesca de lujo" />
                <button className="nx-btn" disabled={!concept.trim()}>Salir a la pasarela</button>
              </form>
            ) : (
              <div className="nx-ls-opts">
                {rw.step === 0 && rw.lookOpts.map((t) => <button key={t} className="nx-opt" onClick={() => chooseLook(t)}><b>{TAG_ICON[t]} {t}</b><small>{cc ? LOOK_PIECES[t].join(" · ") : `Look de estilo ${t.toLowerCase()}`}</small></button>)}
                {!cc && rw.step === 1 && WALK_OPTS.map(([k, ico, t]) => <button key={k} className="nx-opt" onClick={() => chooseWalk(k)}><b>{ico} {t}</b></button>)}
                {!cc && rw.step === 2 && ([["pose", "🖼️ Pose", "Segura"], ["comedia", "🤡 Comedia", "Si el look es camp, triunfa"], ["reveal", "🎁 Reveal", "Arriesgado: performance y carisma"]] as const).map(([k, t, d]) => <button key={k} className="nx-opt" onClick={() => chooseMoment(k)}><b>{t}</b><small>{d}</small></button>)}
                {!cc && rw.step === 3 && rw.voices.map((v) => <button key={v.k} className="nx-opt" onClick={() => chooseVoice(v.k)}><b>{v.t}</b></button>)}
                {cc && rw.step >= 2 && rw.step <= 4 && rw.moments[rw.step - 2]?.opts.map((o, j) => <button key={o} className="nx-opt" onClick={() => chooseConceptMoment(j)}><b>{o}</b></button>)}
                {cc && rw.step === 5 && rw.qa?.a.map((x, j) => <button key={x.t} className="nx-opt" onClick={() => answerAna(j)}><b>{x.t}</b></button>)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MuteBtn() {
  const muted = useGame((s) => s.muted);
  return <button className="nx-round" aria-label={muted ? "Activar sonido" : "Silenciar"} onClick={() => setMuted(!muted)}>{muted ? "🔇" : "🔊"}</button>;
}

function Result() {
  const r = useGame((s) => s.result);
  const best = useGame((s) => s.best);
  const queenId = useGame((s) => s.queenId);
  if (!r) return null;
  return (
    <div className="nx-center nx-dim">
      <div className="nx-panel small">
        <p className="nx-eyebrow">{r.won ? "Condragulations" : `Ronda ${r.round}`}</p>
        <h2>{r.won ? "¡Te llevas la corona! 👑" : "Sashay away..."}</h2>
        <p className="nx-score">{r.score.toLocaleString("es-ES")} puntos{r.score >= best && r.score > 0 ? " · ¡Nuevo récord!" : ""}</p>
        <button className="nx-btn" onClick={() => send({ type: "start", queenId })}>Otra vez</button>
        <button className="nx-btn ghost" onClick={() => send({ type: "menu" })}>Menú</button>
      </div>
    </div>
  );
}

function Toasts() {
  const t = useGame((s) => s.toasts);
  if (!t.length) return null;
  return (
    <div className="nx-toasts" role="status" aria-live="polite">
      {t.map((x) => <div key={x.id} className="nx-toast"><b>{x.title}</b>{x.sub && <span>{x.sub}</span>}</div>)}
    </div>
  );
}
