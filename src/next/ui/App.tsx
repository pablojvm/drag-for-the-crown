// Interfaz del juego nuevo (React encima del canvas de Phaser): carga, menú, marcador, pausa y resultado.
import { useEffect, useRef, useState } from "react";
import { startGame } from "../game";
import { send } from "../bridge";
import { useGame, setMuted } from "../store";
import { unlockAudio } from "../game/sfx";
import { ARCADE_QUEENS } from "../game/data";
import { startLives } from "../game/rules";
import { lipSyncMove, rivalSoFar } from "../game/lipsync";
import { EMOTES, LS_PHASES, LS_STEPS, REPITE, type LsKind } from "../../core/lipsync";

export function App() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => (host.current ? startGame(host.current) : undefined), []);
  // El audio arranca con el primer gesto (los navegadores no dejan antes)
  useEffect(() => {
    const go = () => unlockAudio();
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
        {screen === "menu" && <MenuUI />}
        {screen === "arcade" && <Hud />}
        {screen === "result" && <Result />}
        {screen === "lipsync" && <LipSyncUI />}
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

function MenuUI() {
  const best = useGame((s) => s.best);
  const [pick, setPick] = useState(useGame((s) => s.queenId));
  const q = ARCADE_QUEENS.find((x) => x.id === pick)!;
  return (
    <div className="nx-menu">
      <div className="nx-panel">
        <p className="nx-eyebrow">Arcade · motor nuevo</p>
        <h1>Elige a tu reina</h1>
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
        </div>
        <p className="nx-muted">Flechas o WASD para moverte, Espacio para lanzar tacones, E para el poder, P para pausar. En el móvil, arrastra el dedo.{best ? ` · Récord: ${best}` : ""}</p>
        <a className="nx-link" href="./index.html">Volver al juego completo (historia y multijugador)</a>
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
  const queenId = useGame((s) => s.queenId);
  if (!ls) return null;
  const me = ARCADE_QUEENS.find((q) => q.id === queenId)!, rv = ARCADE_QUEENS.find((q) => q.id === ls.rivalId)!;
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
            <button className="nx-btn" onClick={() => send({ type: "lipsync", queenId })}>Otro lip sync</button>
            <button className="nx-btn ghost" onClick={() => send({ type: "menu" })}>Menú</button>
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
