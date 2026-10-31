// Modo temporada: elegir temporada y reina, y cada episodio (reto, resultados, lip sync, veredicto y final).
import { useState } from "react";
import { useGame } from "../store";
import * as T from "../../core/temporada";
import { MAXI } from "../../core/maxi";
import { PORTADAS, REINAS_ES, ATTR_NAMES, queenImg, queenStats, baseAttrs, type QAttr } from "../../core/reinas";
import { chooseSeason, chooseQueen, goReto, pickOption, goLipSync, nextEpisode, finalNext, leave, openSeasons } from "../game/temporada";

const LABEL_TXT: Record<string, string> = { WIN: "Gana", HIGH: "Top", SAFE: "A salvo", LOW: "Low", BTM2: "Bottom", BTM3: "Bottom", ELIM: "Fuera", WINNER: "Ganadora", "RUNNER-UP": "Finalista" };
const img = (src: string) => (src ? `./${src}` : "");

export function TemporadaUI() {
  const ts = useGame((s) => s.ts);
  if (!ts) return null;
  return (
    <div className="nx-ts">
      {ts.view === "elige" && <Elige />}
      {ts.view === "reina" && <Reina seasonId={ts.seasonId!} />}
      {ts.view === "juego" && ts.s && <Juego s={ts.s} />}
    </div>
  );
}

function Elige() {
  return (
    <div className="nx-panel nx-ts-panel">
      <p className="nx-eyebrow">Modo temporada · motor nuevo</p>
      <h2>Elige la temporada</h2>
      <div className="nx-ts-seasons">
        {T.playableSeasons().map((t) => (
          <button key={t.id} className="nx-ts-season" onClick={() => chooseSeason(t.id)}>
            {PORTADAS[t.id] && <img src={PORTADAS[t.id]} alt="" loading="lazy" />}
            <b>{t.name}</b>
            <small>{t.year} · {t.cast.length} reinas</small>
          </button>
        ))}
      </div>
      <button className="nx-btn ghost" onClick={leave}>Menú</button>
    </div>
  );
}

function Reina({ seasonId }: { seasonId: string }) {
  const t = T.seasonById(seasonId)!;
  const [pick, setPick] = useState(t.cast[0]);
  const a = baseAttrs(pick, queenStats(pick));
  return (
    <div className="nx-panel nx-ts-panel">
      <p className="nx-eyebrow">{t.name}</p>
      <h2>¿Con quién compites?</h2>
      <div className="nx-ts-cast" role="radiogroup" aria-label="Reinas">
        {t.cast.map((id) => (
          <button key={id} role="radio" aria-checked={id === pick} className={id === pick ? "on" : ""} onClick={() => setPick(id)}>
            <img src={img(queenImg(id, seasonId, true))} alt="" loading="lazy" /><span>{REINAS_ES[id]?.name || id}</span>
          </button>
        ))}
      </div>
      <div className="nx-ts-attrs">{(Object.keys(ATTR_NAMES) as QAttr[]).map((k) => <span key={k}><small>{ATTR_NAMES[k]}</small><b>{a[k]}</b></span>)}</div>
      <div className="nx-row">
        <button className="nx-btn" onClick={() => chooseQueen(pick)}>Empezar la temporada</button>
        <button className="nx-btn ghost" onClick={openSeasons}>Otra temporada</button>
      </div>
    </div>
  );
}

function Juego({ s }: { s: T.Season }) {
  const [track, setTrack] = useState(false);
  const header = (
    <div className="nx-ts-head">
      <span>{T.seasonById(s.seasonId)?.name} · {s.phase === "final" ? "Gran final" : s.phase === "fin" ? "Fin de temporada" : `Episodio ${s.ep}`}</span>
      <span>{s.alive.length} en competición</span>
      <button className="nx-chip" onClick={() => setTrack(!track)}>{track ? "Cerrar" : "📋 Track record"}</button>
    </div>
  );
  return (
    <div className="nx-panel nx-ts-panel">
      {header}
      {track ? <Track s={s} /> : <Fase s={s} />}
    </div>
  );
}

function Fase({ s }: { s: T.Season }) {
  const ts = useGame((x) => x.ts)!;
  const w = s.week;
  if (s.phase === "anuncio" && w) {
    const def = MAXI[w.tipo];
    return (
      <>
        <p className="nx-eyebrow">El reto de la semana</p>
        <h2>{w.titulo}</h2>
        <p className="nx-ts-chips">Cuentan: {def.attrs.map((k) => <span key={k} className="nx-chip">{ATTR_NAMES[k]} {T.attrsOf(s, T.ME)[k]}</span>)}</p>
        <p className="nx-muted">👠 Pasarela: «{w.tema}»</p>
        <button className="nx-btn" onClick={goReto}>¡Empezar el reto!</button>
      </>
    );
  }
  if (s.phase === "reto" && ts.maxi) return <MaxiUI />;
  if ((s.phase === "resultados" || s.phase === "veredicto") && w?.rows) {
    const shown = Object.keys(ts.crit);
    return (
      <>
        <p className="nx-eyebrow">{s.phase === "resultados" ? "Las críticas del jurado" : "El veredicto"}</p>
        <ol className="nx-ts-rows">
          {w.rows.map((r) => (
            <li key={r.key} className={`${r.key === T.ME ? "me" : ""} lab-${(w.labels![r.key] || "").toLowerCase()}`}>
              <span>{T.nameOf(s, r.key)}{r.key === T.ME ? " (tú)" : ""}</span>
              <em>{LABEL_TXT[w.labels![r.key]] || w.labels![r.key]}</em>
            </li>
          ))}
        </ol>
        {s.phase === "resultados" && (
          <div className="nx-ts-crit">
            {shown.map((k) => <p key={k}><b>{T.nameOf(s, k)}</b> {ts.crit[k].join(" ")}</p>)}
          </div>
        )}
        {s.phase === "resultados" ? (
          <>
            <p className="nx-ts-call">🎤 {w.bottom!.map((k) => T.nameOf(s, k)).join(" y ")}: es hora de hacer el lip sync por vuestra vida.</p>
            <button className="nx-btn" onClick={goLipSync}>{w.bottom!.includes(T.ME) ? "💋 Al lip sync" : "Ver el lip sync"}</button>
          </>
        ) : (
          <>
            <p className="nx-ts-call">{ts.news[0] || `${T.nameOf(s, w.saved!)} se queda. ${T.nameOf(s, w.out!)}, sashay away.`}</p>
            <button className="nx-btn" onClick={nextEpisode}>{s.alive.length <= T.FINAL_AT ? "👑 A la gran final" : "Siguiente episodio"}</button>
          </>
        )}
      </>
    );
  }
  if (s.phase === "final" && s.final) {
    const f = s.final;
    const n = f.semis.length;
    return (
      <>
        <p className="nx-eyebrow">Gran final · lip syncs</p>
        <h2>{n < 2 ? `Duelo ${n + 1} de 2` : "El duelo por la corona"}</h2>
        <ul className="nx-ts-final">
          {f.pairs.map((p, i) => <li key={i} className={i === n && n < 2 ? "now" : ""}>{T.nameOf(s, p[0])} <i>vs</i> {T.nameOf(s, p[1])}</li>)}
          {n === 2 && <li className="now">👑 {T.nameOf(s, f.semis[0])} <i>vs</i> {T.nameOf(s, f.semis[1])}</li>}
        </ul>
        {ts.news.map((t, i) => <p key={i} className="nx-ts-call">{t}</p>)}
        <button className="nx-btn" onClick={finalNext}>{(n < 2 ? f.pairs[n] : f.semis).includes(T.ME) ? "💋 Bailar mi lip sync" : "Ver el lip sync"}</button>
      </>
    );
  }
  if (s.phase === "fin") {
    const won = s.place === 1;
    return (
      <>
        <p className="nx-eyebrow">Fin de la temporada</p>
        <h2>{won ? "👑 ¡Eres la ganadora!" : s.place === 2 ? "Finalista: casi la corona" : `Terminas en el puesto ${s.place}`}</h2>
        {ts.news.map((t, i) => <p key={i} className="nx-ts-call">{t}</p>)}
        {s.final?.crown && !won && <p className="nx-muted">La corona es para {T.nameOf(s, s.final.crown)}.</p>}
        <p className="nx-score">PPE {T.myPpe(s).toFixed(2)}</p>
        <Track s={s} />
        <div className="nx-row">
          <button className="nx-btn" onClick={openSeasons}>Otra temporada</button>
          <button className="nx-btn ghost" onClick={leave}>Menú</button>
        </div>
      </>
    );
  }
  return null;
}

function MaxiUI() {
  const m = useGame((x) => x.ts?.maxi)!;
  return (
    <div className="nx-maxi">
      <p className="nx-eyebrow">{m.icon} {m.title}</p>
      {m.focus !== null && (
        <div className="nx-ts-focus" aria-label={`Foco ${m.focus}`}><small>🔦 Foco</small><div><i style={{ width: `${m.focus}%` }} /><em style={{ left: "30%" }} /><em style={{ left: "80%" }} /></div></div>
      )}
      {m.note && <p className="nx-ls-last meh">{m.note}</p>}
      {m.q && <h3>{m.q}</h3>}
      {m.sub && <p className="nx-muted">{m.sub}</p>}
      <div className="nx-maxi-opts">
        {m.opts.map((o, k) => (
          <button key={k} className={`nx-opt ${m.picked === null ? "" : m.picked === k ? "picked" : "dim"}`} disabled={m.picked !== null} onClick={() => pickOption(k)}>
            <b>{o.t}</b>{o.d && <small>{o.d}</small>}
          </button>
        ))}
      </div>
      <p className="nx-maxi-msg" aria-live="polite">{m.msg}</p>
    </div>
  );
}

function Track({ s }: { s: T.Season }) {
  const keys = [...s.alive, ...[...s.out].reverse()];
  const eps = Math.max(0, ...keys.map((k) => (s.track[k] || []).length));
  return (
    <div className="nx-ts-track">
      <table>
        <thead><tr><th>Reina</th>{Array.from({ length: eps }, (_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className={k === T.ME ? "me" : ""}>
              <td>{T.nameOf(s, k)}</td>
              {Array.from({ length: eps }, (_, i) => { const l = (s.track[k] || [])[i] || ""; return <td key={i} className={`lab-${l.toLowerCase()}`}>{l}</td>; })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
