// Modo temporada: elegir temporada y reina, y cada episodio (reto, críticas, Untucked, dinámicas, lip sync, veredicto y final).
import { useState } from "react";
import { useGame } from "../store";
import * as T from "../../core/temporada";
import { MAXI } from "../../core/maxi";
import { PORTADAS, REINAS_ES, ATTR_NAMES, queenImg, queenStats, baseAttrs, type QAttr } from "../../core/reinas";
import * as F from "../game/temporada";
import { CHARLA_TURNOS } from "../../core/charla";
import { MINIS, roleInfo, fillText } from "../../core/taller";
import { SLOTS, SLOT_NAMES, ARMARIO, fitScore, priceOf, prendaById, prendaImg, bestFor, outfitScore, type Slot } from "../../core/armario";
import { getCloset, euros } from "../game/closet";
import { TimingGame, FlashGame, RitmoGame } from "./Minijuegos";

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
      {ts.view === "custom" && <Custom />}
      {ts.view === "reina" && <Reina seasonId={ts.seasonId!} />}
      {ts.view === "juego" && ts.s && <Juego s={ts.s} />}
    </div>
  );
}

function Elige() {
  return (
    <div className="nx-panel nx-ts-panel">
      <p className="nx-eyebrow">Modo historia · motor nuevo (beta)</p>
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
  const custom = useGame((x) => x.ts?.custom);
  const base = T.seasonById(seasonId)!;
  const t = seasonId === T.CUSTOM.id && custom ? { ...base, cast: custom } : base;
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
  const c: string[] = [`💶 ${euros(getCloset().money)}`];
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
        <span>{T.seasonById(s.seasonId)?.name} · {s.phase === "final" ? "Gran final" : s.phase === "fin" ? "Fin de temporada" : s.phase === "regreso" ? "Segunda Oportunidrag" : s.phase === "reencuentro" ? "El reencuentro" : `Episodio ${s.ep}`}</span>
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
  if (ts.free) return <Charla s={s} />;
  const dancers = (w?.bottom || []).map(n).join(" y ");

  const mini = MINIS.find((m) => m.id === w?.mini?.id) || MINIS[0];
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
        {!def.noRunway && w.tema && <p className="nx-muted">👠 Pasarela: «{w.tema}»</p>}
        <div className="nx-ts-mini"><b>Antes, el minirreto:</b> {mini.titulo}. <span className="nx-muted">{mini.desc} La ganadora tiene ventaja en el reto.</span></div>
        {w.lala && <p className="nx-ts-call">💃 Esta semana no hay reto: es un torneo de lip syncs con todas. Bailas tus duelos; hasta dónde llegues decide tu nota.</p>}
        <button className="nx-btn" onClick={F.goMini}>🏅 Al minirreto</button>
      </>
    );
  }
  if (s.phase === "mini" && w) {
    const label = mini.titulo.replace(/^Minirreto: /, "");
    return (
      <>
        <p className="nx-eyebrow">🏅 Minirreto</p>
        <h2>{label}</h2>
        <p className="nx-muted">{mini.desc}</p>
        {mini.kind === "flash" ? <FlashGame key={s.ep} label={label} onDone={F.miniDone} /> : mini.kind === "ritmo" ? <RitmoGame key={s.ep} label={label} notes={12} onDone={F.miniDone} /> : <TimingGame key={s.ep} label={label} onDone={F.miniDone} />}
      </>
    );
  }
  if (s.phase === "taller" && w) return <Taller s={s} />;
  if (s.phase === "reto" && ts.writing) return (<><p className="nx-eyebrow">{w?.titulo}</p><h2>Los Javis están preparando el reto...</h2><div className="nx-dots" aria-hidden="true"><i /><i /><i /></div></>);
  if (s.phase === "reto" && ts.maxi) return <MaxiUI />;
  if (s.phase === "lalaparuza" && w?.lala) return <Lalaparuza s={s} />;
  if (s.phase === "reencuentro" && ts.reunion) return <Reencuentro s={s} />;
  if (s.phase === "probador" && w) return <Probador s={s} />;
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
        {w.conf && <p className="nx-ts-conf">📹 <b>Confesionario de {n(w.conf.key)}:</b> «{w.conf.text}»</p>}
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
      {F.canChat() && left > 0 && (
        <>
          <p className="nx-muted nx-center-txt">💬 O habla libremente con quien quieras: escribe lo que te apetezca.</p>
          <div className="nx-ts-faces">{s.alive.filter((k) => k !== T.ME && !ut.talked.includes(k)).map((k) => <button key={k} className="nx-face" onClick={() => F.startFree(k, "untucked")} title={`Hablar con ${n(k)}`}><img src={img(queenImg(T.idOf(s, k), s.seasonId, true))} alt="" /><small>{n(k)}</small></button>)}</div>
        </>
      )}
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
      {m.game && !m.game.played && (m.game.kind === "ritmo" ? <RitmoGame key={`${m.title}-${m.n}`} label={m.game.label} hard={m.game.hard} onDone={F.gameDone} /> : <TimingGame key={`${m.title}-${m.n}`} label={m.game.label} hard={m.game.hard} verb="🪡 ¡Puntada!" onDone={F.gameDone} />)}
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

const WHO: Record<string, string> = { host: "Supremme", judge: "Ana Locking" };
/** La escena del taller de esta semana (y, al contestar, el rol de la compañera). */
function Taller({ s }: { s: T.Season }) {
  const w = s.week!;
  const sc = w.scene;
  const n = (k: string) => T.nameOf(s, k);
  const names = { yo: n(T.ME), r1: sc ? n(sc.r1) : "", r2: sc?.r2 ? n(sc.r2) : "", r3: sc?.r3 ? n(sc.r3) : "" };
  const who = (k: string) => (k === "me" ? names.yo : k === "r1" ? names.r1 : k === "r2" ? names.r2 : k === "r3" ? names.r3 : WHO[k] || k);
  const answered = sc?.answered !== undefined;
  const c = answered ? sc!.choices[sc!.answered!] : null;
  const role = sc?.role ? roleInfo(sc.role) : null;
  return (
    <>
      <p className="nx-eyebrow">🧵 El taller</p>
      <News s={s} />
      {sc && (
        <>
          <div className="nx-ts-dialog">
            {sc.lines.map(([k, t], i) => <p key={i}><b>{who(k)}</b> {fillText(t, names)}</p>)}
            {c && <p className="me"><b>{names.yo}</b> {fillText(c.txt, names)}</p>}
            {c?.reply && <p><b>{who(c.reply[0])}</b> {fillText(c.reply[1], names)}</p>}
          </div>
          {!answered && sc.choices.length > 0 && (
            <div className="nx-maxi-opts">{sc.choices.map((ch, i) => <button key={i} className="nx-opt" onClick={() => F.answerScene(i)}><b>{fillText(ch.txt, names)}</b></button>)}</div>
          )}
          {answered && role && <p className="nx-ts-call">{role.icon} Ahora lo sabes: {names.r1} es «{role.name}». <span className="nx-muted">{role.desc}</span></p>}
        </>
      )}
      {(!sc || answered || !sc.choices.length) && F.canChat() && !w.freeUsed && (
        <>
          <p className="nx-muted nx-center-txt">💬 Antes del reto, puedes charlar con una compañera (una por semana):</p>
          <div className="nx-ts-faces">{s.alive.filter((k) => k !== T.ME).map((k) => <button key={k} className="nx-face" onClick={() => F.startFree(k, "taller")} title={`Charlar con ${n(k)}`}><img src={img(queenImg(T.idOf(s, k), s.seasonId, true))} alt="" /><small>{n(k)}</small></button>)}</div>
        </>
      )}
      {(!sc || answered || !sc.choices.length) && <button className="nx-btn" onClick={F.goReto}>¡Al reto!</button>}
    </>
  );
}

/** El probador: eliges lo que llevas en la pasarela con tu armario y, si te falta algo, compras en la tienda. */
function Probador({ s }: { s: T.Season }) {
  const w = s.week!;
  const [slot, setSlot] = useState<Slot>("look");
  const cl = getCloset();
  const o = w.outfit || {};
  const cat = w.tema;
  const fit = (k: Slot, id: string) => fitScore(k, prendaById(id)!, cat);
  const mine = (ARMARIO[slot] || []).filter((x) => cl.owned[x.id] && (slot !== "look" || !x.rv)).sort((a, b) => fit(slot, b.id) - fit(slot, a.id));
  const shop = bestFor(slot, cat, 8).filter((x) => !cl.owned[x.id]);
  const score = outfitScore(o, cat);
  const tag = (f: number) => (f >= 0.8 ? "✨ Encaja de lleno" : f >= 0.6 ? "Encaja" : f >= 0.4 ? "Del estilo" : "No pega");
  return (
    <>
      <p className="nx-eyebrow">👗 El probador · pasarela «{cat}»</p>
      <p className="nx-muted nx-center-txt">Lo que llevas cuenta en la nota de la pasarela. Sin pieza, te prestan un básico.</p>
      <div className="nx-probador">
        {SLOTS.map((k) => {
          const id = o[k];
          const it = id ? prendaById(id) : null;
          return (
            <button key={k} className={`nx-slot ${slot === k ? "on" : ""}`} onClick={() => setSlot(k)}>
              {it ? <img src={`./${prendaImg(it.id)}`} alt="" loading="lazy" /> : <span className="nx-slot-empty">Básico</span>}
              <small>{SLOT_NAMES[k]}</small>
              {it && <em>{tag(fit(k, it.id))}</em>}
            </button>
          );
        })}
      </div>
      <p className="nx-ts-call">Estilismo: {score} / 100 · 💶 {euros(cl.money)}</p>
      <div className="nx-shelf">
        <p className="nx-eyebrow">Tu armario · {SLOT_NAMES[slot]}</p>
        <div className="nx-shelf-row">
          <button className={`nx-item ${!o[slot] ? "on" : ""}`} onClick={() => F.setOutfit(slot, null)}><span className="nx-slot-empty">Básico</span><small>Prestado</small></button>
          {mine.map((x) => (
            <button key={x.id} className={`nx-item ${o[slot] === x.id ? "on" : ""}`} onClick={() => F.setOutfit(slot, x.id)}>
              <img src={`./${prendaImg(x.id)}`} alt="" loading="lazy" /><small>{x.n}</small><em>{tag(fit(slot, x.id))}</em>
            </button>
          ))}
        </div>
        {shop.length > 0 && (
          <>
            <p className="nx-eyebrow">🛍️ Tienda · lo que mejor encaja</p>
            <div className="nx-shelf-row">
              {shop.map((x) => (
                <button key={x.id} className="nx-item shop" disabled={cl.money < priceOf(x)} onClick={() => F.buyItem(x.id)}>
                  <img src={`./${prendaImg(x.id)}`} alt="" loading="lazy" /><small>{x.n}</small><em>{tag(fit(slot, x.id))} · {euros(priceOf(x))}</em>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="nx-btn" onClick={F.goPasarela}>👠 ¡A la pasarela!</button>
    </>
  );
}

/** Lalaparuza: el cuadro del torneo y el siguiente duelo. */
function Lalaparuza({ s }: { s: T.Season }) {
  const L = s.week!.lala!;
  const n = (k: string | null) => (k ? T.nameOf(s, k) : "—");
  const next = T.lalaNext(s);
  const ROUND = (r: number) => (r === 0 ? "Ronda previa" : r === L.R ? "Final" : r === L.R - 1 ? "Semifinales" : r === L.R - 2 ? "Cuartos" : `Ronda ${r}`);
  return (
    <>
      <p className="nx-eyebrow">💃 Lalaparuza</p>
      <h2>{ROUND(L.round)}</h2>
      <div className="nx-lala">
        {L.rounds.map((rs, r) => rs.length > 0 && r <= L.stop && (
          <div key={r} className={`nx-lala-col ${r === L.round ? "now" : ""}`}>
            <small>{ROUND(r)}</small>
            {rs.map((m, i) => (
              <p key={i} className={m.a === T.ME || m.b === T.ME ? "me" : ""}>
                <span className={m.w && m.w === m.a ? "w" : m.w ? "l" : ""}>{n(m.a)}</span>
                <span className={m.w && m.w === m.b ? "w" : m.w ? "l" : ""}>{n(m.b)}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
      <News s={s} />
      {next && <button className="nx-btn" onClick={F.lalaStep}>{next.a === T.ME || next.b === T.ME ? `💋 Bailar contra ${n(next.a === T.ME ? next.b : next.a)}` : `Ver ${n(next.a)} contra ${n(next.b)}`}</button>}
    </>
  );
}

/** El reencuentro: vuelven las eliminadas, hablas con dos y se vota a Miss Simpatía. */
function Reencuentro({ s }: { s: T.Season }) {
  const r = useGame((x) => x.ts?.reunion)!;
  const n = (k: string) => T.nameOf(s, k);
  const lines = (src: [string, string][], key?: string) => src.map(([k, t], i) => {
    const names = { yo: n(T.ME), r1: key ? n(key) : n(s.out[0] || s.alive[0]), r2: n(s.out[1] || s.alive[1] || s.alive[0]) };
    const who = k === "me" ? names.yo : k === "r1" ? names.r1 : k === "r2" ? names.r2 : WHO[k] || k;
    return <p key={i} className={k === "me" ? "me" : ""}><b>{who}</b> {fillText(t.replace(/\{temporada\}/g, T.seasonById(s.seasonId)?.name || ""), names)}</p>;
  });
  if (r.talk) {
    const waiting = r.talk.choices && r.talk.answered === undefined;
    return (
      <>
        <p className="nx-eyebrow">🎉 Reencuentro · con {n(r.talk.key)}</p>
        <div className="nx-ts-dialog">{lines(r.talk.lines, r.talk.key)}</div>
        {waiting ? <div className="nx-maxi-opts">{r.talk.choices!.map((c, i) => <button key={i} className="nx-opt" onClick={() => F.reunionAnswer(i)}><b>{c.txt}</b></button>)}</div> : <button className="nx-btn" onClick={F.reunionClose}>Seguir</button>}
      </>
    );
  }
  return (
    <>
      <p className="nx-eyebrow">🎉 El reencuentro</p>
      <h2>Vuelven las eliminadas</h2>
      <div className="nx-ts-dialog">{lines(r.intro)}</div>
      {!r.drama ? (
        <>
          <p className="nx-muted nx-center-txt">{r.talked.length < 2 ? "Habla con dos de ellas. Cada una te recibe según cómo os llevabais." : "Ya has hablado con dos."}</p>
          <div className="nx-maxi-opts many">{r.talks.filter((t) => !r.talked.includes(t.key)).map((t) => <button key={t.key} className="nx-opt" disabled={r.talked.length >= 2} onClick={() => F.reunionTalk(t.key)}><b>{n(t.key)}</b><small>{t.kind === "buena" ? "💞 Os llevabais bien" : t.kind === "mala" ? "😒 Cuentas pendientes" : "🙂 Sin más"}</small></button>)}</div>
          <button className="nx-btn" onClick={F.reunionMiss}>💐 Votación de Miss Simpatía</button>
        </>
      ) : (
        <>
          <div className="nx-ts-dialog">{lines(r.drama)}</div>
          <News s={s} />
          <button className="nx-btn" onClick={F.toFinal}>👑 A la gran final</button>
        </>
      )}
    </>
  );
}

/** All Stars a tu gusto: eliges el reparto. */
function Custom() {
  const sel = useGame((x) => x.ts?.custom) || [];
  const pool = T.customPool();
  const ok = sel.length >= T.CUSTOM.min;
  return (
    <div className="nx-panel nx-ts-panel">
      <p className="nx-eyebrow">All Stars a tu gusto</p>
      <h2>Monta tu reparto</h2>
      <p className="nx-muted nx-center-txt">Elige de {T.CUSTOM.min} a {T.CUSTOM.max} reinas (tú incluida). Se juega como un All Stars: el top 2 baila y la ganadora saca el pintalabios.</p>
      <div className="nx-ts-cast" role="group" aria-label="Reinas">
        {pool.map((id) => (
          <button key={id} aria-pressed={sel.includes(id)} className={sel.includes(id) ? "on" : ""} onClick={() => F.toggleCustom(id)}>
            <img src={img(queenImg(id, undefined, true))} alt="" loading="lazy" /><span>{REINAS_ES[id]?.name || id}</span>
          </button>
        ))}
      </div>
      <div className="nx-row nx-sticky">
        <span className="nx-chip">{sel.length} de {T.CUSTOM.max}</span>
        <button className="nx-btn" disabled={!ok} onClick={F.confirmCustom}>{ok ? "Seguir" : `Faltan ${T.CUSTOM.min - sel.length}`}</button>
        <button className="nx-btn ghost" onClick={() => F.randomCustom()}>🎲 Al azar</button>
        <button className="nx-btn ghost" onClick={F.openSeasons}>Otra temporada</button>
      </div>
    </div>
  );
}

/** Charla libre con una compañera: escribes y te contesta en personaje. */
function Charla({ s }: { s: T.Season }) {
  const f = useGame((x) => x.ts?.free)!;
  const [txt, setTxt] = useState("");
  const n = (k: string) => T.nameOf(s, k);
  const mine = f.hist.filter((m) => m.me).length;
  const r = s.rel[f.key] || 0;
  return (
    <>
      <div className="nx-ft-head">
        <img src={img(queenImg(T.idOf(s, f.key), s.seasonId, true))} alt="" />
        <div>
          <p className="nx-eyebrow">💬 Charla libre · {f.where === "untucked" ? "Untucked" : "Taller"}</p>
          <h2>{n(f.key)}</h2>
          <small className="nx-muted">{r >= 2 ? "💞 Aliada" : r <= -2 ? "😒 Enemiga" : r > 0 ? "Os lleváis bien" : r < 0 ? "Hay tensión" : "Sin mucha relación"} · Lo que digas cuenta.</small>
        </div>
      </div>
      <div className="nx-ts-dialog nx-ft-log">
        {f.hist.length ? f.hist.map((m, i) => <p key={i} className={m.me ? "me" : ""}><b>{m.me ? n(T.ME) : n(f.key)}</b> {m.t}</p>) : <p className="nx-muted">Empieza tú...</p>}
        {f.waiting && <p><b>{n(f.key)}</b> <span className="nx-dots inline" aria-label="Escribiendo"><i /><i /><i /></span></p>}
      </div>
      {mine < CHARLA_TURNOS ? (
        <form className="nx-concept" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { void F.sendFree(txt); setTxt(""); } }}>
          <label className="nx-sr" htmlFor="nx-ft">Lo que le dices</label>
          <input id="nx-ft" maxLength={200} autoComplete="off" value={txt} disabled={f.waiting} onChange={(e) => setTxt(e.target.value)} placeholder="Escribe aquí..." />
          <button className="nx-btn" disabled={f.waiting || !txt.trim()}>Decir</button>
        </form>
      ) : <p className="nx-muted nx-center-txt">Se acaba el tiempo libre.</p>}
      <button className="nx-btn ghost" onClick={F.endFree}>{f.hist.length ? "Terminar la conversación" : "← Volver"}</button>
    </>
  );
}
