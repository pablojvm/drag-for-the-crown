// Modo temporada: elegir temporada y reina, y cada episodio (reto, críticas, Untucked, dinámicas, lip sync, veredicto y final).
import { useState } from "react";
import { useGame } from "../store";
import * as T from "../../core/temporada";
import { MAXI } from "../../core/maxi";
import { PORTADAS, REINAS_ES, ATTR_NAMES, queenImg, queenStats, baseAttrs, type QAttr } from "../../core/reinas";
import * as F from "../game/temporada";

const LABEL_TXT: Record<string, string> = { WIN: "Gana", TOP2: "Top 2", BTOP: "Top 2 (bloqueada)", HIGH: "Top", SAFE: "A salvo", LOW: "Low", BTM2: "Bottom", BTM3: "Bottom", ELIM: "Fuera", WINNER: "Ganadora", "RUNNER-UP": "Finalista", RTRN: "Vuelve", OUT: "Fuera de la final" };
const TWIST_TXT: Record<string, string> = { allstars: "💄 All Stars: el top 2 baila y la ganadora saca el pintalabios", winners: "⭐ All Winners: nadie se va, se juega por estrellas", suerte: "🍀 La reina de la suerte", corazon: "❤️ Los corazones", moneda: "🪙 La moneda", repesca: "🔁 Segunda Oportunidrag", normal: "" };
const img = (src: string) => (src ? `./${src}` : "");
const half = (n: number) => String(n / 2).replace(".", ",");

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
          <button key={t.id} className="nx-ts-season" onClick={() => F.chooseSeason(t.id)}>
            {PORTADAS[t.id] && <img src={PORTADAS[t.id]} alt="" loading="lazy" />}
            <b>{t.name}</b>
            <small>{T.lemaOf(t.id) || `${t.year} · ${t.cast.length} reinas`}</small>
          </button>
        ))}
      </div>
      <button className="nx-btn ghost" onClick={F.leave}>Menú</button>
    </div>
  );
}

function Reina({ seasonId }: { seasonId: string }) {
  const t = T.seasonById(seasonId)!;
  const [pick, setPick] = useState(t.cast[0]);
  const a = baseAttrs(pick, queenStats(pick));
  const tw = TWIST_TXT[T.twistOf(seasonId)];
  return (
    <div className="nx-panel nx-ts-panel">
      <p className="nx-eyebrow">{t.name}</p>
      <h2>¿Con quién compites?</h2>
      {tw && <p className="nx-ts-call">{tw}</p>}
      <div className="nx-ts-cast" role="radiogroup" aria-label="Reinas">
        {t.cast.map((id) => (
          <button key={id} role="radio" aria-checked={id === pick} className={id === pick ? "on" : ""} onClick={() => setPick(id)}>
            <img src={img(queenImg(id, seasonId, true))} alt="" loading="lazy" /><span>{REINAS_ES[id]?.name || id}</span>
          </button>
        ))}
      </div>
      <div className="nx-ts-attrs">{(Object.keys(ATTR_NAMES) as QAttr[]).map((k) => <span key={k}><small>{ATTR_NAMES[k]}</small><b>{a[k]}</b></span>)}</div>
      <div className="nx-row">
        <button className="nx-btn" onClick={() => F.chooseQueen(pick)}>Empezar la temporada</button>
        <button className="nx-btn ghost" onClick={F.openSeasons}>Otra temporada</button>
      </div>
    </div>
  );
}

/** Lo que pasa en tu temporada: suerte, corazones, estrellas, bloqueo y némesis. */
function chips(s: T.Season) {
  const c: string[] = [];
  if (s.twist === "suerte") c.push(s.luck === T.ME ? "🍀 Tienes la reina de la suerte" : s.luck ? "🍀 ¿Quién la tendrá?" : "🍀 Ya se ha usado");
  if (s.twist === "corazon" && !s.meOut) c.push(`❤️ Tienes ${half(s.hearts[T.ME] || 0)} ${(s.hearts[T.ME] || 0) === 2 ? "corazón" : "corazones"}`);
  if (s.twist === "winners") c.push(`⭐ Tus estrellas: ${s.stars[T.ME] || 0}`);
  if (s.blocked) c.push(`🚫 Bloqueada: ${s.blocked === T.ME ? "tú" : T.nameOf(s, s.blocked)}`);
  if (s.nemesis && s.alive.includes(s.nemesis)) c.push(`⚔️ Némesis: ${T.nameOf(s, s.nemesis)}`);
  return c;
}

function Cast({ s }: { s: T.Season }) {
  return (
    <div className="nx-ts-strip" aria-label="Reinas en competición">
      {s.alive.map((k) => {
        const r = s.rel[k] || 0;
        const cls = k === T.ME ? "me" : r >= 2 ? "ally" : r <= -2 ? "enemy" : "";
        const extra = s.twist === "winners" ? ` · ${s.stars[k] || 0} ⭐` : s.twist === "corazon" && s.hearts[k] ? ` · ${half(s.hearts[k])} ❤️` : "";
        return (
          <span key={k} className={cls} title={`${T.nameOf(s, k)}${k === T.ME ? " (tú)" : r >= 2 ? " · aliada" : r <= -2 ? " · enemiga" : ""}${extra}`}>
            <img src={img(queenImg(T.idOf(s, k), s.seasonId, true))} alt="" loading="lazy" />
            {s.twist === "winners" && <em>{s.stars[k] || 0}</em>}
          </span>
        );
      })}
    </div>
  );
}

function Juego({ s }: { s: T.Season }) {
  const [track, setTrack] = useState(false);
  const c = chips(s);
  return (
    <div className="nx-panel nx-ts-panel">
      <div className="nx-ts-head">
        <span>{T.seasonById(s.seasonId)?.name} · {s.phase === "final" ? "Gran final" : s.phase === "fin" ? "Fin de temporada" : s.phase === "regreso" ? "Segunda Oportunidrag" : `Episodio ${s.ep}`}</span>
        <span>{s.meOut ? "Fuera de la competición" : `${s.alive.length} en competición`}</span>
        <button className="nx-chip" onClick={() => setTrack(!track)}>{track ? "Cerrar" : "📋 Track record"}</button>
      </div>
      {s.phase !== "fin" && <Cast s={s} />}
      {c.length > 0 && <p className="nx-ts-chips">{c.map((t) => <span key={t} className="nx-chip">{t}</span>)}</p>}
      {track ? <Track s={s} /> : <Fase s={s} />}
    </div>
  );
}

function News({ s }: { s: T.Season }) {
  return <>{s.news.map((t, i) => <p key={i} className="nx-ts-call">{t}</p>)}</>;
}

function Rows({ s }: { s: T.Season }) {
  const w = s.week!;
  return (
    <ol className="nx-ts-rows">
      {w.rows!.map((r) => (
        <li key={r.key} className={`${r.key === T.ME ? "me" : ""} lab-${(w.labels![r.key] || "").toLowerCase()}`}>
          <span>{T.nameOf(s, r.key)}{r.key === T.ME ? " (tú)" : ""}{w.teams ? (w.teams[w.winTeam ?? 0].includes(r.key) ? " · equipo ganador" : "") : ""}</span>
          <em>{LABEL_TXT[w.labels![r.key]] || w.labels![r.key]}</em>
        </li>
      ))}
    </ol>
  );
}

function Fase({ s }: { s: T.Season }) {
  const ts = useGame((x) => x.ts)!;
  const w = s.week;
  const n = (k: string) => T.nameOf(s, k);
  const dancers = (w?.bottom || []).map(n).join(" y ");

  if (s.phase === "anuncio" && w) {
    const def = MAXI[w.tipo];
    return (
      <>
        <p className="nx-eyebrow">El reto de la semana</p>
        <h2>{w.titulo}</h2>
        <News s={s} />
        {w.teams && (
          <div className="nx-ts-teams">
            {w.teams.map((t, i) => <p key={i}><b>{i === 0 ? "Tu equipo" : "El otro equipo"}</b> (capitana: {n(w.captains![i])}): {t.map(n).join(", ")}</p>)}
          </div>
        )}
        <p className="nx-ts-chips">Cuentan: {def.attrs.map((k) => <span key={k} className="nx-chip">{ATTR_NAMES[k]} {T.attrsOf(s, T.ME)[k]}</span>)}</p>
        {!def.noRunway && <p className="nx-muted">👠 Pasarela: «{w.tema}»</p>}
        <button className="nx-btn" onClick={F.goReto}>¡Empezar el reto!</button>
      </>
    );
  }
  if (s.phase === "reto" && ts.maxi) return <MaxiUI />;
  if (s.phase === "resultados" && w?.rows) {
    return (
      <>
        <p className="nx-eyebrow">Las críticas del jurado</p>
        <Rows s={s} />
        <div className="nx-ts-crit">{Object.keys(ts.crit).map((k) => <p key={k}><b>{n(k)}</b> {ts.crit[k].join(" ")}</p>)}</div>
        <button className="nx-btn" onClick={F.goUntucked}>🍸 Al Untucked</button>
      </>
    );
  }
  if (s.phase === "untucked" && ts.ut) return <Untucked s={s} />;
  if (s.phase === "decision" && w) {
    const how = T.myDecision(s);
    if (how === "moneda") {
      const voter = !s.meOut && !w.bottom!.includes(T.ME);
      return (
        <>
          <p className="nx-eyebrow">🪙 La moneda</p>
          <h2>Bottom de tres: {dancers}</h2>
          {w.coin ? (
            <>
              <News s={s} />
              <ul className="nx-ts-final">{w.coin.options.map((k) => <li key={k}>{n(k)} <i>·</i> {w.coin!.votes[k].length} {w.coin!.votes[k].length === 1 ? "voto" : "votos"}</li>)}</ul>
              <p className="nx-ts-call">Al lip sync: {w.coin.pair.map(n).join(" y ")}</p>
              <button className="nx-btn" onClick={F.toLipSync}>{w.coin.pair.includes(T.ME) ? "💋 Al lip sync" : "Ver el lip sync"}</button>
            </>
          ) : voter ? (
            <>
              <p className="nx-muted">Antes de lanzar la moneda, votas. Si sale cara, cuenta como voto para salvar; si sale cruz, para condenar.</p>
              <div className="nx-maxi-opts">{w.bottom!.map((k) => <button key={k} className="nx-opt" onClick={() => F.coin(k)}><b>Votar a {n(k)}</b></button>)}</div>
            </>
          ) : (
            <button className="nx-btn" onClick={() => F.coin()}>Lanzar la moneda</button>
          )}
        </>
      );
    }
    if (how === "suerte" || how === "corazon") {
      return (
        <>
          <p className="nx-eyebrow">{how === "suerte" ? "🍀 La reina de la suerte" : "❤️ Tu corazón entero"}</p>
          <h2>Al lip sync: {dancers}</h2>
          <News s={s} />
          <p className="nx-muted">{how === "suerte" ? "Puedes sacarla ahora para salvar a una del bottom (también a ti). Solo se usa una vez." : "Puedes usarlo para salvarte del lip sync."}</p>
          <div className="nx-maxi-opts">
            {w.bottom!.filter((k) => how === "suerte" || k === T.ME).map((k) => <button key={k} className="nx-opt" onClick={() => F.useSave(k)}><b>{k === T.ME ? "Salvarme a mí" : `Salvar a ${n(k)}`}</b></button>)}
            <button className="nx-opt" onClick={() => F.useSave(null)}><b>Guardarla para otra semana</b></button>
          </div>
        </>
      );
    }
  }
  if (s.phase === "pintalabios" && w) {
    const bottom = w.rows!.filter((r) => /^BTM/.test(w.labels![r.key])).map((r) => r.key);
    return (
      <>
        <p className="nx-eyebrow">💄 Has ganado el lip sync</p>
        <h2>¿De quién es el pintalabios?</h2>
        <p className="nx-muted">La que elijas se va a casa. El jurado se fijará en si mandas a la peor de la semana o a una rival peligrosa.</p>
        <div className="nx-maxi-opts">{bottom.map((k) => <button key={k} className="nx-opt" onClick={() => F.chooseLipstick(k)}><b>{n(k)}</b><small>Nota de la semana: {w.rows!.find((r) => r.key === k)!.s} · relación: {s.rel[k] || 0}</small></button>)}</div>
      </>
    );
  }
  if (s.phase === "bloqueo") {
    return (
      <>
        <p className="nx-eyebrow">⭐ Has ganado el lip sync</p>
        <h2>¿A quién bloqueas?</h2>
        <p className="nx-muted">La semana que viene no podrá ganar estrella aunque esté en el top.</p>
        <div className="nx-maxi-opts many">{s.alive.filter((k) => k !== T.ME).sort((a, b) => (s.stars[b] || 0) - (s.stars[a] || 0)).map((k) => <button key={k} className="nx-opt" onClick={() => F.chooseBlock(k)}><b>{n(k)}</b><small>{s.stars[k] || 0} estrellas</small></button>)}</div>
      </>
    );
  }
  if (s.phase === "veredicto" && w?.rows) {
    return (
      <>
        <p className="nx-eyebrow">El veredicto</p>
        <Rows s={s} />
        <News s={s} />
        <button className="nx-btn" onClick={F.nextEpisode}>{s.twist === "winners" ? (s.ep >= T.winnersWeeks(s) ? "⭐ A la gran final" : "Siguiente episodio") : s.alive.length <= T.FINAL_AT ? "👑 A la gran final" : "Siguiente episodio"}</button>
      </>
    );
  }
  if (s.phase === "veredicto") {
    // Tras la Segunda Oportunidrag
    return (
      <>
        <p className="nx-eyebrow">Segunda Oportunidrag</p>
        <News s={s} />
        <button className="nx-btn" onClick={F.nextEpisode}>Siguiente episodio</button>
      </>
    );
  }
  if (s.phase === "regreso") {
    const pair = ts.pair;
    return (
      <>
        <p className="nx-eyebrow">🔁 Segunda Oportunidrag</p>
        <h2>Las eliminadas vuelven a por todas</h2>
        <p className="nx-muted">Las dos con mejor actuación hacen lip sync. La ganadora vuelve a la competición.</p>
        {pair && <p className="nx-ts-call">{pair.map(n).join(" contra ")}</p>}
        <button className="nx-btn" onClick={F.goRepesca}>{pair?.includes(T.ME) ? "💋 Bailar por volver" : "Ver la Segunda Oportunidrag"}</button>
      </>
    );
  }
  if (s.phase === "fuera") {
    const justOut = w?.out === T.ME;
    return (
      <>
        <p className="nx-eyebrow">{justOut ? "Sashay away" : `Desde casa · episodio ${s.ep}`}</p>
        <h2>{justOut ? `Te vas en el puesto ${s.place}` : "Así va la temporada"}</h2>
        {w?.rows && !justOut && <Rows s={s} />}
        <News s={s} />
        {s.heartFrom === T.ME ? (
          <>
            <p className="nx-muted">📼 Antes de irte, grabas un vídeo: ¿a quién le dejas tu medio corazón?</p>
            <div className="nx-maxi-opts many">{s.alive.map((k) => <button key={k} className="nx-opt" onClick={() => F.giveMyHeart(k)}><b>{n(k)}</b><small>relación: {s.rel[k] || 0}</small></button>)}</div>
          </>
        ) : (
          <div className="nx-row">
            <button className="nx-btn" onClick={F.watchWeek}>Ver la semana siguiente</button>
            <button className="nx-btn ghost" onClick={F.endSeason}>Terminar aquí</button>
          </div>
        )}
      </>
    );
  }
  if (s.phase === "final" && s.final) {
    const f = s.final;
    const k = f.semis.length;
    return (
      <>
        <p className="nx-eyebrow">Gran final · lip syncs</p>
        <h2>{k < 2 ? `Duelo ${k + 1} de 2` : "El duelo por la corona"}</h2>
        <ul className="nx-ts-final">
          {f.pairs.map((p, i) => <li key={i} className={i === k && k < 2 ? "now" : ""}>{n(p[0])} <i>vs</i> {n(p[1])}</li>)}
          {k === 2 && <li className="now">👑 {n(f.semis[0])} <i>vs</i> {n(f.semis[1])}</li>}
        </ul>
        <News s={s} />
        <button className="nx-btn" onClick={F.finalNext}>{(k < 2 ? f.pairs[k] : f.semis).includes(T.ME) ? "💋 Bailar mi lip sync" : "Ver el lip sync"}</button>
      </>
    );
  }
  if (s.phase === "fin") {
    const won = s.place === 1;
    return (
      <>
        <p className="nx-eyebrow">Fin de la temporada</p>
        <h2>{won ? "👑 ¡Eres la ganadora!" : s.place === 2 ? "Finalista: casi la corona" : s.place ? `Terminas en el puesto ${s.place}` : "Fin de la temporada"}</h2>
        <News s={s} />
        {s.final?.crown && !won && <p className="nx-muted">La corona es para {n(s.final.crown)}.</p>}
        <p className="nx-score">PPE {T.myPpe(s).toFixed(2)}</p>
        <Track s={s} />
        <div className="nx-row">
          <button className="nx-btn" onClick={F.openSeasons}>Otra temporada</button>
          <button className="nx-btn ghost" onClick={F.leave}>Menú</button>
        </div>
      </>
    );
  }
  return null;
}

function Untucked({ s }: { s: T.Season }) {
  const ut = useGame((x) => x.ts?.ut)!;
  const n = (k: string) => T.nameOf(s, k);
  if (ut.scene) {
    const sc = ut.scene;
    const waiting = sc.choices && sc.answered === undefined;
    return (
      <>
        <p className="nx-eyebrow">🍸 Untucked · con {n(sc.key)}</p>
        <div className="nx-ts-dialog">{sc.lines.map(([who, t], i) => <p key={i}><b>{who}</b> {t}</p>)}</div>
        {waiting ? (
          <div className="nx-maxi-opts">{sc.choices!.map((c, i) => <button key={i} className="nx-opt" onClick={() => F.answerUt(i)}><b>{c.txt}</b></button>)}</div>
        ) : (
          <button className="nx-btn" onClick={F.closeTalk}>Seguir</button>
        )}
      </>
    );
  }
  const left = F.UT_TALKS - ut.talked.length;
  return (
    <>
      <p className="nx-eyebrow">🍸 Untucked</p>
      <h2>Mientras el jurado delibera...</h2>
      <p className="nx-muted">{left > 0 ? `Puedes hablar con ${left === 1 ? "una compañera más" : "dos compañeras"}. Lo que hables cambia cómo os lleváis.` : "Ya has hablado bastante. Vuelve al escenario."}</p>
      <div className="nx-maxi-opts">
        {ut.opts.filter((o) => !ut.talked.includes(o.key)).map((o) => <button key={o.key} className="nx-opt" disabled={left <= 0} onClick={() => F.talkTo(o.key)}><b>{n(o.key)}</b><small>{o.label}</small></button>)}
      </div>
      <button className="nx-btn" onClick={F.endUntucked}>Volver al escenario</button>
    </>
  );
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
          <button key={k} className={`nx-opt ${m.picked === null ? "" : m.picked === k ? "picked" : "dim"}`} disabled={m.picked !== null} onClick={() => F.pickOption(k)}>
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
        <thead><tr><th>Reina</th>{Array.from({ length: eps }, (_, i) => <th key={i}>{i + 1}</th>)}{s.twist === "winners" && <th>⭐</th>}</tr></thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className={k === T.ME ? "me" : ""}>
              <td>{T.nameOf(s, k)}</td>
              {Array.from({ length: eps }, (_, i) => { const l = (s.track[k] || [])[i] || ""; return <td key={i} className={`lab-${l.toLowerCase()}`}>{l}</td>; })}
              {s.twist === "winners" && <td>{s.stars[k] || 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
