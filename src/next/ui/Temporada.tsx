// Modo temporada: elegir temporada y reina, y cada episodio (reto, críticas, Untucked, dinámicas, lip sync, veredicto y final).
import { useState } from "react";
import { useGame } from "../store";
import * as T from "../../core/temporada";
import { MAXI } from "../../core/maxi";
import { PORTADAS, REINAS_ES, ATTR_NAMES, queenImg, queenStats, baseAttrs, type QAttr } from "../../core/reinas";
import * as F from "../game/temporada";
import { CHARLA_TURNOS } from "../../core/charla";
import { RASGOS, traitsOf } from "../../core/historia";
import { Dialogo, Escena, Caja, type Linea } from "./Dialogo";
import { PPE_VALOR } from "../../core/track";
import { MINIS, roleInfo, fillText } from "../../core/taller";
import { SLOTS, SLOT_NAMES, ARMARIO, fitScore, priceOf, prendaById, prendaImg, bestFor, outfitScore, type Slot } from "../../core/armario";
import { getCloset, euros } from "../game/closet";
import { storyWins } from "../game/cuenta";
import { toast } from "../game/logros";
import { trackSnap } from "../game/track";
import { TrackTabla } from "./Track";
import { TimingGame, FlashGame, RitmoGame } from "./Minijuegos";

const LABEL_TXT: Record<string, string> = { WIN: "Gana", TOP2: "Top 2", BTOP: "Top 2 (bloqueada)", HIGH: "Top", SAFE: "A salvo", LOW: "Low", BTM2: "Bottom", BTM3: "Bottom", ELIM: "Fuera", WINNER: "Ganadora", "RUNNER-UP": "Finalista", RTRN: "Vuelve", OUT: "Fuera de la final" };
const TWIST_TXT: Record<string, string> = { allstars: "💄 All Stars: el top 2 baila y la ganadora saca el pintalabios", winners: "⭐ All Winners: nadie se va, se juega por estrellas", suerte: "🍀 La reina de la suerte", corazon: "❤️ Los corazones", moneda: "🪙 La moneda", repesca: "🔁 Segunda Oportunidrag", normal: "" };
const img = (src: string) => (src ? `./${src}` : "");
const HOSTS: Record<string, Omit<Linea, "text">> = {
  host: { name: "Supremme de Luxe", role: "Presentadora", img: "./images/hosts/supreme.png", side: "left" },
  judge: { name: "Ana Locking", role: "Jueza", img: "./images/hosts/ana-locking.png", side: "left" },
  ambrossi: { name: "Javier Ambrossi", role: "Jurado · Los Javis", img: "./images/hosts/javier-ambrossi.png", side: "left" },
  calvo: { name: "Javier Calvo", role: "Jurado · Los Javis", img: "./images/hosts/javier-calvo.png", side: "right" },
};
const HOST_NAMES: Record<string, string> = { supremme: "host", "supremme de luxe": "host", "ana locking": "judge", ana: "judge" };
/** Quién habla en una conversación: «me», r1/r2/r3 (según `ctx`), las presentadoras o el nombre de una reina. */
function hablante(s: T.Season, ctx: Record<string, string | undefined> = {}) {
  const queen = (k: string, side: "left" | "right"): Omit<Linea, "text"> => {
    const id = T.idOf(s, k);
    const r = s.rel[k] || 0;
    const role = k === T.ME ? "Tú" : k === s.nemesis ? "⚔️ Tu némesis" : r >= 2 ? "💞 Aliada" : r <= -2 ? "😒 Enemiga" : "Reina";
    return { name: T.nameOf(s, k), role, img: img(queenImg(id, s.seasonId) || queenImg(id, s.seasonId, true)), side: k === T.ME ? "right" : side };
  };
  const byName = (nm: string) => [T.ME, ...s.cast].find((k) => T.nameOf(s, k) === nm);
  return (k: string, text: string): Linea => {
    if (HOSTS[k]) return { ...HOSTS[k], text };
    if (HOST_NAMES[k.toLowerCase()]) return { ...HOSTS[HOST_NAMES[k.toLowerCase()]], text };
    if (k === "me") return { ...queen(T.ME, "right"), text };
    if (ctx[k]) return { ...queen(ctx[k]!, k === "r1" ? "right" : "left"), text };
    const q = byName(k) || (s.cast.includes(k) ? k : undefined);
    if (q) return { ...queen(q, "right"), text };
    return { name: k, img: "", side: "left", text };
  };
}
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

// Elegir temporada como en la versión clásica: primero la franquicia y luego la temporada.
// Las temporadas se abren ganando la anterior (src/core/temporada.ts: desbloqueo).
const FRANQUICIAS = [
  { id: "es", tag: "ES", name: "Drag Race España", color: "#ff3b3b" },
  { id: "esas", tag: "AS", name: "Drag Race España All Stars", color: "#e0a400" },
  { id: "us", tag: "US", name: "RuPaul's Drag Race", color: "#ff4fd8", soon: true },
  { id: "as", tag: "AS", name: "RuPaul's Drag Race All Stars", color: "#b36bff", soon: true },
  { id: "uk", tag: "UK", name: "Drag Race UK", color: "#2bc4d6", soon: true },
] as const;
const franquiciaDe = (id: string) => (id === T.CUSTOM.id || id === "esaw" ? "esas" : T.seasonById(id)?.franchise || "es");
let franquicia: string | null = null;

function Elige() {
  const [fr, setFr] = useState<string | null>(franquicia);
  const go = (f: string | null) => { franquicia = f; setFr(f); };
  const wins = storyWins();
  const all = T.playableSeasons();
  if (!fr) {
    return (
      <div className="nx-panel nx-ts-panel nx-pick">
        <p className="nx-eyebrow">Modo historia</p>
        <h2>Elige franquicia</h2>
        <div className="nx-fr-grid">
          {FRANQUICIAS.map((f) => {
            const list = all.filter((x) => franquiciaDe(x.id) === f.id);
            const won = list.filter((x) => wins.includes(x.id)).length;
            const lock = !("soon" in f) && list.length && !list.some((x) => T.desbloqueo(x.id, wins).ok) ? T.desbloqueo(list[0].id, wins).why : null;
            const faces = [...new Set(list.filter((x) => !x.id.startsWith("esaw") && x.id !== T.CUSTOM.id).flatMap((x) => x.cast.slice(-2)))].slice(0, 5);
            const off = "soon" in f || !!lock;
            return (
              <button key={f.id + f.name} className={`nx-fr ${off ? "off" : ""}`} style={{ ["--accent" as string]: f.color }} aria-disabled={off}
                onClick={() => (lock ? toast("🔒 Bloqueada", lock) : "soon" in f ? undefined : go(f.id))}>
                <span className="tag">{f.tag}</span>
                <span className="f-name">{f.name}</span>
                {!("soon" in f) && <span className="faces">{faces.map((id) => <i key={id} style={{ backgroundImage: `url('${img(queenImg(id, undefined, true))}')` }} />)}</span>}
                {!("soon" in f) && <span className="f-progress"><span className="bar"><i style={{ width: `${list.length ? (won / list.length) * 100 : 0}%` }} /></span><small>👑 {won} de {list.length} {list.length === 1 ? "temporada ganada" : "temporadas ganadas"}</small></span>}
                {"soon" in f ? <span className="badge">Próximamente</span> : lock ? <span className="badge">🔒 {lock}</span> : null}
              </button>
            );
          })}
        </div>
        <button className="nx-btn ghost" onClick={F.leave}>‹ Menú</button>
      </div>
    );
  }
  const F0 = FRANQUICIAS.find((x) => x.id === fr)!;
  const list = all.filter((x) => franquiciaDe(x.id) === fr);
  return (
    <div className="nx-panel nx-ts-panel nx-pick">
      <p className="nx-eyebrow">Modo historia · {F0.name}</p>
      <h2>Elige temporada</h2>
      <div className="nx-se-grid">
        {list.map((x, i) => {
          const lk = T.desbloqueo(x.id, wins);
          const won = wins.includes(x.id);
          const special = x.id === T.CUSTOM.id ? "custom" : x.id === "esaw" ? "winners" : null;
          const winner = REINAS_ES[x.cast[x.cast.length - 1]]?.name;
          const info = special === "custom" ? "Elige tu reparto de todas las temporadas" : special === "winners" ? `${x.cast.length} ganadoras` : `${x.cast.length} reinas · ${x.enEmision ? "📺 En emisión" : won && winner ? `Ganadora: ${winner}` : "¿Quién se llevará la corona?"}`;
          const state = won ? "👑 Ganada" : !lk.ok ? `🔒 ${lk.why}` : special === "custom" ? "✨ Monta tu reparto" : special === "winners" ? "🏆 Solo ganadoras" : `Dificultad ${"★".repeat(Math.min(5, i + 1))}`;
          return (
            <button key={x.id} data-id={x.id} className={`nx-se ${lk.ok ? "" : "locked"} ${won ? "won" : ""}`} aria-disabled={!lk.ok} title={T.lemaOf(x.id) || undefined}
              style={PORTADAS[x.id] ? { backgroundImage: `linear-gradient(180deg, rgba(20,3,31,.35) 0%, rgba(20,3,31,0) 22%, rgba(20,3,31,0) 55%, rgba(20,3,31,.6) 100%), url('${PORTADAS[x.id]}')` } : undefined}
              onClick={() => (lk.ok ? F.chooseSeason(x.id) : toast("🔒 Bloqueada", lk.why || ""))}>
              <span className="s-name">{x.name}</span>
              <span className="s-cast">{info}</span>
              <span className="s-state">{state}</span>
            </button>
          );
        })}
      </div>
      <button className="nx-btn ghost" onClick={() => go(null)}>‹ Volver</button>
    </div>
  );
}

/** Ficha de la reina como en la versión clásica: retrato, atributos con puntos, fortaleza y carácter. */
function Ficha({ id, seasonId }: { id: string; seasonId?: string }) {
  const a = baseAttrs(id, queenStats(id));
  const tr = traitsOf(id);
  const fort = RASGOS.fort[tr.fort], car = RASGOS.car[tr.car];
  return (
    <div className="nx-ficha" key={id}>
      <div className="nx-ficha-pic" style={{ backgroundImage: `url('${img(queenImg(id, seasonId, true))}')` }} />
      <h3>{REINAS_ES[id]?.name || id}</h3>
      <p className="nx-ficha-place">📖 En la historia, todo depende de ti</p>
      <div className="nx-ficha-attrs">
        {(Object.keys(ATTR_NAMES) as QAttr[]).map((k) => (
          <div key={k} className="nx-attr">
            <span>{ATTR_NAMES[k]}</span>
            <span className="nx-pips" aria-label={`${a[k]} de 10`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < a[k] ? "on" : ""} style={{ ["--d" as string]: `${i * 30}ms` }} />)}</span>
            <b>{a[k]}</b>
          </div>
        ))}
      </div>
      <p className="nx-ficha-fort">{fort.icon} Fortaleza: <b>{fort.n}</b> · {fort.d}</p>
      <div className="nx-ficha-car">
        <p className="nx-ficha-lbl">🎭 Su carácter</p>
        <h4>{car.n}</h4>
        <p>{car.d}</p>
      </div>
    </div>
  );
}

function Reina({ seasonId }: { seasonId: string }) {
  const custom = useGame((x) => x.ts?.custom);
  const base = T.seasonById(seasonId)!;
  const t = seasonId === T.CUSTOM.id && custom ? { ...base, cast: custom } : base;
  const [pick, setPick] = useState(t.cast[0]);
  const tw = TWIST_TXT[T.twistOf(seasonId)];
  return (
    <div className="nx-panel nx-ts-panel nx-pick">
      <p className="nx-eyebrow">{t.name}</p>
      <h2>¿Con quién compites?</h2>
      {tw && <p className="nx-ts-call">{tw}</p>}
      <div className="nx-pick-body">
        <div className="nx-qgrid" role="radiogroup" aria-label="Reinas">
          {t.cast.map((id) => (
            <button key={id} role="radio" aria-checked={id === pick} className={`nx-qcard ${id === pick ? "on" : ""}`} onClick={() => setPick(id)}>
              <span className="pic" style={{ backgroundImage: `url('${img(queenImg(id, seasonId, true))}')` }} />
              <span className="name">{REINAS_ES[id]?.name || id}</span>
              <span className="check" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
        <Ficha id={pick} seasonId={seasonId} />
      </div>
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
        <Escena id={`crit-${s.seasonId}-${s.ep}`} lines={Object.keys(ts.crit).flatMap((k) => ts.crit[k].map(([who, line]) => hablante(s)(who, line)))}>
          <p className="nx-eyebrow">Las críticas del jurado</p>
          <Rows s={s} />
          <button className="nx-btn" onClick={F.goUntucked}>🍸 Al Untucked</button>
        </Escena>
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
    const waiting = !!sc.choices && sc.answered === undefined;
    const H = hablante(s, { r1: sc.key });
    const from = sc.answered !== undefined ? sc.lines.length - 2 : 0;
    const L = sc.lines.slice(from).map(([who, t]) => H(who, t));
    return <Dialogo key={`ut-${sc.key}-${sc.answered ?? "q"}`} lines={L} choices={waiting ? sc.choices!.map((c) => c.txt) : undefined} me={H("me", "")} onChoice={F.answerUt} onDone={F.closeTalk} />;
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
  return <TrackTabla snap={trackSnap(s)} />;
}

const WHO: Record<string, string> = { host: "Supremme", judge: "Ana Locking" };
/** La escena del taller de esta semana (y, al contestar, el rol de la compañera). */
function Taller({ s }: { s: T.Season }) {
  const w = s.week!;
  const sc = w.scene;
  const n = (k: string) => T.nameOf(s, k);
  const names = { yo: n(T.ME), r1: sc ? n(sc.r1) : "", r2: sc?.r2 ? n(sc.r2) : "", r3: sc?.r3 ? n(sc.r3) : "" };
  const H = hablante(s, { r1: sc?.r1, r2: sc?.r2, r3: sc?.r3 });
  const answered = sc?.answered !== undefined;
  const c = answered ? sc!.choices[sc!.answered!] : null;
  const role = sc?.role ? roleInfo(sc.role) : null;
  return (
    <>
      <p className="nx-eyebrow">🧵 El taller</p>
      <News s={s} />
      {sc && !answered && sc.choices.length > 0 && (
        <Dialogo key={`taller-${s.ep}`} lines={sc.lines.map(([k, tx]) => H(k, fillText(tx, names)))} choices={sc.choices.map((ch) => fillText(ch.txt, names))} me={H("me", "")} onChoice={F.answerScene} />
      )}
      {sc && (answered || !sc.choices.length) && (
        <Escena id={`taller-${s.seasonId}-${s.ep}-${answered ? "r" : "l"}`} lines={answered ? [H("me", fillText(c!.txt, names)), ...(c?.reply ? [H(c.reply[0], fillText(c.reply[1], names))] : [])] : sc.lines.map(([k, tx]) => H(k, fillText(tx, names)))} />
      )}
      {sc && answered && role && <p className="nx-ts-call">{role.icon} Ahora lo sabes: {names.r1} es «{role.name}». <span className="nx-muted">{role.desc}</span></p>}
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
  const temporada = T.seasonById(s.seasonId)?.name || "";
  const lines = (src: [string, string][], key?: string) => {
    const r1 = key || s.out[0] || s.alive[0], r2 = s.out[1] || s.alive[1] || s.alive[0];
    const names = { yo: n(T.ME), r1: n(r1), r2: n(r2) };
    const H = hablante(s, { r1, r2 });
    return src.map(([k, tx]) => H(k, fillText(tx.replace(/\{temporada\}/g, temporada), names)));
  };
  if (r.talk) {
    const waiting = !!r.talk.choices && r.talk.answered === undefined;
    const from = r.talk.answered !== undefined ? r.talk.lines.length - 2 : 0;
    return <Dialogo key={`re-${r.talk.key}-${r.talk.answered ?? "q"}`} lines={lines(r.talk.lines.slice(from), r.talk.key)} choices={waiting ? r.talk.choices!.map((c) => c.txt) : undefined} me={hablante(s)("me", "")} onChoice={F.reunionAnswer} onDone={F.reunionClose} />;
  }
  return (
    <Escena id={`re-intro-${s.seasonId}`} lines={lines(r.intro)}>
      <p className="nx-eyebrow">🎉 El reencuentro</p>
      <h2>Vuelven las eliminadas</h2>
      {!r.drama ? (
        <>
          <p className="nx-muted nx-center-txt">{r.talked.length < 2 ? "Habla con dos de ellas. Cada una te recibe según cómo os llevabais." : "Ya has hablado con dos."}</p>
          <div className="nx-maxi-opts many">{r.talks.filter((t) => !r.talked.includes(t.key)).map((t) => <button key={t.key} className="nx-opt" disabled={r.talked.length >= 2} onClick={() => F.reunionTalk(t.key)}><b>{n(t.key)}</b><small>{t.kind === "buena" ? "💞 Os llevabais bien" : t.kind === "mala" ? "😒 Cuentas pendientes" : "🙂 Sin más"}</small></button>)}</div>
          <button className="nx-btn" onClick={F.reunionMiss}>💐 Votación de Miss Simpatía</button>
        </>
      ) : (
        <Escena id={`re-drama-${s.seasonId}`} lines={lines(r.drama)}>
          <News s={s} />
          <button className="nx-btn" onClick={F.toFinal}>👑 A la gran final</button>
        </Escena>
      )}
    </Escena>
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

/** Charla libre con una compañera: escribes y te contesta en personaje (en la caja de diálogo, como las demás). */
function Charla({ s }: { s: T.Season }) {
  const f = useGame((x) => x.ts?.free)!;
  const [txt, setTxt] = useState("");
  const H = hablante(s);
  const mine = f.hist.filter((m) => m.me).length;
  const last = [...f.hist].reverse().find((m) => !m.me);
  const her = H(f.key, "");
  const where = f.where === "untucked" ? "Untucked" : "Taller";
  const text = f.waiting ? "..." : last ? last.t : f.hist.length ? "" : `(${where}) ${T.nameOf(s, f.key)} te mira. Empieza tú.`;
  return (
    <Caja who={{ ...her, side: "right" }} text={text}>
      {mine < CHARLA_TURNOS ? (
        <form className="nx-dlg-form" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { void F.sendFree(txt); setTxt(""); } }}>
          <label className="nx-sr" htmlFor="nx-ft">Lo que le dices</label>
          <input id="nx-ft" maxLength={200} autoComplete="off" autoFocus value={txt} disabled={f.waiting} onChange={(e) => setTxt(e.target.value)} placeholder="Escribe lo que le dices..." />
          <button className="nx-btn" disabled={f.waiting || !txt.trim()}>Decir</button>
        </form>
      ) : <p className="nx-dlg-hint static">Se acaba el tiempo libre.</p>}
      <button className="nx-btn ghost nx-dlg-end" onClick={(e) => { e.stopPropagation(); F.endFree(); }}>{f.hist.length ? "Terminar la conversación" : "← Volver"}</button>
    </Caja>
  );
}
