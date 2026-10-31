// Interfaz del juego nuevo (React encima del canvas de Phaser): carga, menú, marcador, pausa y resultado.
import { useEffect, useRef, useState } from "react";
import { startGame } from "../game";
import { send } from "../bridge";
import { useGame } from "../store";
import { ARCADE_QUEENS } from "../game/data";
import { startLives } from "../game/rules";

export function App() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => (host.current ? startGame(host.current) : undefined), []);
  const screen = useGame((s) => s.screen);
  return (
    <div className="nx-root">
      <div className="nx-canvas" ref={host} />
      <div className="nx-ui">
        {screen === "boot" && <Loading />}
        {screen === "menu" && <MenuUI />}
        {screen === "arcade" && <Hud />}
        {screen === "result" && <Result />}
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
        <div className="nx-stats">
          <Stat label="Velocidad" v={q.stats.speed} /><Stat label="Cadencia" v={q.stats.rate} /><Stat label="Poder" v={q.stats.power} />
          <span className="nx-stat"><small>Vidas</small><b>{"❤️".repeat(startLives(q))}</b></span>
        </div>
        <button className="nx-btn" onClick={() => send({ type: "start", queenId: pick })}>¡A la pasarela!</button>
        <p className="nx-muted">Flechas o WASD para moverte, Espacio para lanzar tacones, P para pausar. En el móvil, arrastra el dedo.{best ? ` · Récord: ${best}` : ""}</p>
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
        <button className="nx-round" aria-label="Pausa" onClick={() => send({ type: "pause", on: true })}>⏸</button>
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
