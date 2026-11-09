// Barra del menú: tu cuenta, tus rudollars y lipsticks, Hall of Fame, logros y ajustes.
import { useEffect, useState } from "react";
import { useGame, setMuted } from "../store";
import { signIn, signOut, refreshAcct, localBoard, worldTop, playerName, setPlayerName, storyWins, type TopRow } from "../game/cuenta";
import type { TrackSnap } from "../game/track";
import { TrackTabla } from "./Track";
import { logrosDone, sequins, rudollars } from "../game/logros";
import { isMusicOn, setMusic } from "../game/music";
import { LOGROS } from "../../core/logros";
import { REINAS_ES, queenImg } from "../../core/reinas";
import { seasonById, REGULARES, ALLSTARS } from "../../core/temporada";

type Panel = "cuenta" | "fama" | "logros" | "ajustes" | null;

export function MenuBar() {
  const acct = useGame((s) => s.acct);
  const [panel, setPanel] = useState<Panel>(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => { refreshAcct(); }, []);
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);
  return (
    <>
      <div className="nx-topbar">
        <button className={`nx-acct ${acct.google ? "on" : ""}`} aria-expanded={panel === "cuenta"} onClick={() => toggle("cuenta")}>
          <span aria-hidden="true">{acct.google ? acct.name.charAt(0).toUpperCase() : "👤"}</span>
          <span><b>{acct.name}</b><small>{acct.google ? "Guardado en tu cuenta" : acct.ready ? "Guardado en la nube" : "Partida en este dispositivo"}</small></span>
        </button>
        <div className="nx-topbar-r">
          <span className="nx-chip" title="Rudollars (modo normal)">💵 {rudollars().toLocaleString("es-ES")}</span>
          <span className="nx-chip" title="Lipsticks (multijugador)">💄 {sequins().toLocaleString("es-ES")}</span>
          <button className="nx-round nx-wide-only" aria-label="Hall of Fame" title="Hall of Fame" onClick={() => toggle("fama")}>🏆</button>
          <button className="nx-round nx-wide-only" aria-label="Logros" title="Logros" onClick={() => toggle("logros")}>🎖️</button>
          <button className="nx-round nx-wide-only" aria-label="Ajustes" title="Ajustes" onClick={() => toggle("ajustes")}>⚙️</button>
          <button className="nx-round nx-menu-btn" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? "✕" : "☰"}</button>
        </div>
        {menu && (
          <div className="nx-dropdown" role="menu">
            <button role="menuitem" onClick={() => { setMenu(false); setPanel("cuenta"); }}>👤 Tu cuenta</button>
            <button role="menuitem" onClick={() => { setMenu(false); setPanel("fama"); }}>🏆 Hall of Fame</button>
            <button role="menuitem" onClick={() => { setMenu(false); setPanel("logros"); }}>🎖️ Logros</button>
            <button role="menuitem" onClick={() => { setMenu(false); setPanel("ajustes"); }}>⚙️ Ajustes</button>
          </div>
        )}
      </div>
      {panel && (
        <div className="nx-center nx-dim nx-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <div className={`nx-panel nx-ts-panel ${panel === "fama" ? "nx-wide" : ""}`} role="dialog" aria-modal="true">
            {panel === "cuenta" && <CuentaPanel />}
            {panel === "fama" && <Fama />}
            {panel === "logros" && <Logros />}
            {panel === "ajustes" && <Ajustes />}
            <button className="nx-btn ghost" onClick={() => setPanel(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}

function CuentaPanel() {
  const acct = useGame((s) => s.acct);
  return (
    <>
      <p className="nx-eyebrow">Tu cuenta</p>
      <h2>{acct.google ? acct.email : "Juegas como invitada"}</h2>
      <p className="nx-muted nx-center-txt">
        {acct.google
          ? "Tu progreso (temporadas, armario, logros, rudollars y lipsticks) te sigue en cualquier dispositivo donde entres con esta cuenta."
          : acct.ready
            ? acct.googleOn ? "Tu progreso se guarda en la nube desde este navegador. Entra con Google para llevártelo a cualquier dispositivo." : "Tu progreso se guarda en la nube desde este navegador."
            : "Tu progreso se guarda solo en este navegador."}
      </p>
      {!acct.google && acct.ready && acct.googleOn && <button className="nx-btn" onClick={() => signIn()}>Entrar con Google</button>}
      {acct.google && <button className="nx-btn ghost" onClick={() => signOut()}>Cerrar sesión</button>}
    </>
  );
}

const queenName = (id: string) => REINAS_ES[id]?.name || id;
const seasonName = (id: string) => seasonById(id)?.name || id;
type Fila = TopRow & { trackData?: TrackSnap; track?: string; wins?: number };
const leer = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };

/** Hall of Fame como en la versión clásica: tus temporadas (pulsa una para ver su track record), tu carrera y tus coronas. */
function Fama() {
  const [tab, setTab] = useState<"mias" | "mundo" | "reinas">("mias");
  const [world, setWorld] = useState<TopRow[] | null>(null);
  const [name, setName] = useState(playerName());
  const [open, setOpen] = useState<Fila | null>(null);
  useEffect(() => { if (tab === "mundo" && !world) worldTop().then(setWorld); }, [tab, world]);
  const rows: Fila[] = tab === "mias" ? (localBoard() as Fila[]) : (world as Fila[]) || [];
  // En el mundial solo se abre el track record si viene ya calculado (nunca HTML de otras personas)
  const hasTrack = (r: Fila) => !!r.trackData || (tab === "mias" && !!r.track);
  if (open) {
    return (
      <div className="nx-hof-track">
        <p className="nx-eyebrow">{seasonName(open.season)} · {open.name || "Anónima"} con {queenName(open.queen)}</p>
        <h2>Track record</h2>
        {open.trackData ? <TrackTabla snap={open.trackData} /> : <div className="nx-legacy" dangerouslySetInnerHTML={{ __html: open.track || "" }} />}
        <button className="nx-btn" onClick={() => setOpen(null)}>‹ Volver al Hall of Fame</button>
      </div>
    );
  }
  const st = leer("dftc-story-stats", { games: 0, crowns: 0, challengeWins: 0, lipsyncs: 0 });
  const wins = storyWins();
  const fr = [
    { tag: "ES", name: "Drag Race España", color: "#ff3b3b", ids: REGULARES().map((x) => x.id) },
    { tag: "AS", name: "Drag Race España All Stars", color: "#e0a400", ids: [...ALLSTARS().map((x) => x.id), "escustom", "esaw"] },
  ];
  return (
    <div className="nx-hof">
      <h2>Hall of Fame</h2>
      <div className="nx-row">
        <button className={`nx-chip ${tab === "mias" ? "on" : ""}`} onClick={() => setTab("mias")}>📖 Modo historia</button>
        <button className={`nx-chip ${tab === "mundo" ? "on" : ""}`} onClick={() => setTab("mundo")}>🌍 Mundial</button>
        <button className={`nx-chip ${tab === "reinas" ? "on" : ""}`} onClick={() => setTab("reinas")}>👑 Reinas reinantes</button>
      </div>
      {tab === "reinas" ? <Reinantes /> : (
      <div className="nx-hof-layout">
        <div className="nx-hof-card">
          <h3>Top 20</h3>
          {tab === "mundo" && !world && <div className="nx-dots" aria-hidden="true"><i /><i /><i /></div>}
          {rows.length ? (
            <div className="nx-hof-scroll">
              <table className="nx-hof-table">
                <thead><tr><th>#</th><th>Nombre</th><th>Reina</th><th>Resultado</th><th title="PPE: media de tus resultados (WIN 5, HIGH 4, SAFE 3, LOW 2, BTM 1, ELIM 0). A igualdad, gana quien tenga más wins.">Track record</th><th>Fecha</th></tr></thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => {
                    const can = hasTrack(r);
                    const w = r.winsT ?? r.wins ?? 0;
                    return (
                      <tr key={r.id || i} className={can ? "has-track" : ""} title={can ? "Ver su track record" : undefined} tabIndex={can ? 0 : undefined}
                        onClick={() => can && setOpen(r)} onKeyDown={(e) => { if (can && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(r); } }}>
                        <td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
                        <td>{r.name || "Anónima"}</td>
                        <td><span className="mini" style={{ backgroundImage: `url('./${queenImg(r.queen, r.season, true)}')` }} />{queenName(r.queen)}</td>
                        <td><span className="stag">{seasonName(r.season)}</span>{r.won ? "👑 Ganadora" : `Puesto ${r.place || "?"}`}{can && <span className="trk"> 📊</span>}</td>
                        <td className="pts"><b>{Number(r.ppe || 0).toFixed(2)}</b> PPE · {w} {w === 1 ? "win" : "wins"}</td>
                        <td className="muted">{r.date ? new Date(r.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (tab === "mias" || world) && <p className="nx-muted nx-center-txt">{tab === "mias" ? "Todavía no has jugado ninguna temporada en modo historia." : "No se ha podido cargar el ranking mundial."}</p>}
          {tab === "mias" && rows.some(hasTrack) && <p className="nx-muted nx-center-txt">Pulsa una partida para ver su track record.</p>}
        </div>
        <div className="nx-hof-card side">
          <h3>Tu carrera</h3>
          <div className="nx-career">
            <div><span>Temporadas jugadas</span><strong>{st.games}</strong></div>
            <div><span>Coronas</span><strong>{st.crowns}</strong></div>
            <div><span>Retos ganados</span><strong>{st.challengeWins}</strong></div>
            <div><span>Lip syncs ganados</span><strong>{st.lipsyncs}</strong></div>
          </div>
          <h3>Temporadas</h3>
          {fr.map((f) => {
            const won = f.ids.filter((x) => wins.includes(x)).length;
            return (
              <div key={f.tag + f.name} className="nx-unlock">
                <span className="tag" style={{ background: f.color }}>{f.tag}</span>
                <div><strong>{f.name}</strong><small>{won}/{f.ids.length} coronas</small><span className="bar"><i style={{ width: `${(won / f.ids.length) * 100}%` }} /></span></div>
              </div>
            );
          })}
          <label className="nx-name">Tu nombre en el Hall of Fame <input value={name} maxLength={12} onChange={(e) => { setName(e.target.value); setPlayerName(e.target.value); }} placeholder="Anónima" /></label>
        </div>
      </div>
      )}
    </div>
  );
}

// Reinas reinantes: la ganadora original de cada temporada, o la que ganó tu última partida en ella
interface Reinante { queen: string; player?: string; mine?: boolean; date?: number | string; reigns?: number }
function Reinantes() {
  const R = leer<Record<string, Reinante>>("dftc-reinantes", {});
  const fecha = (d?: number | string) => (d ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "");
  const card = (sid: string, qoq = false) => {
    const t = seasonById(sid);
    if (!t) return null;
    const r = R[sid];
    const orig = sid === "esaw" || t.enEmision ? null : t.cast[t.cast.length - 1] || null;
    const q = r ? r.queen : orig;
    const sub = r ? (r.mine ? "Coronada en tu partida" : `Ganó en tu partida${r.player ? ` con ${queenName(r.player)}` : ""}`) : orig ? "Ganadora original" : sid === "esaw" ? "Aún sin coronar" : "En emisión · aún sin reina";
    return (
      <div key={sid} className={`nx-reign ${qoq ? "qoq" : ""} ${r ? (r.mine ? "mine" : "played") : ""}`}>
        <i className="pic" style={q ? { backgroundImage: `url('./${queenImg(q, sid, true)}')` } : undefined} />
        <span className="crown" aria-hidden="true">{qoq ? "👑👑" : "👑"}</span>
        <strong>{q ? queenName(q) : "¿?"}</strong>
        <small className="season">{t.name}</small>
        <small className="sub">{sub}{r && (r.reigns || 0) > 1 ? ` · ${r.reigns} coronas seguidas` : ""}</small>
        {r && <small className="muted">{fecha(r.date)}{orig && orig !== r.queen ? ` · Original: ${queenName(orig)}` : ""}</small>}
      </div>
    );
  };
  return (
    <div className="nx-reigns">
      <h4>👑 Reina de reinas</h4>
      <div className="grid">{card("esaw", true)}</div>
      <h4>⭐ All Stars</h4>
      <div className="grid">{ALLSTARS().map((t) => card(t.id))}</div>
      <h4>💄 Temporadas</h4>
      <div className="grid">{REGULARES().filter((t) => t.cast.length).map((t) => card(t.id))}</div>
    </div>
  );
}

function Logros() {
  const done = logrosDone();
  const n = LOGROS.filter((l) => done[l.id]).length;
  return (
    <>
      <p className="nx-eyebrow">🎖️ Logros · {n} de {LOGROS.length}</p>
      <div className="nx-logros">
        {LOGROS.map((l) => (
          <div key={l.id} className={done[l.id] ? "on" : ""}>
            <i aria-hidden="true">{done[l.id] ? l.icon : "🔒"}</i>
            <span><b>{l.name}</b><small>{l.desc}</small></span>
            <em>+{l.reward} ✨</em>
          </div>
        ))}
      </div>
    </>
  );
}

function Ajustes() {
  const muted = useGame((s) => s.muted);
  const [music, setM] = useState(isMusicOn());
  const [live, setLive] = useState(() => { try { const v = localStorage.getItem("dftc-ia-on2"); return v === null ? true : !!JSON.parse(v); } catch { return true; } });
  const setLiveOn = (on: boolean) => { setLive(on); try { localStorage.setItem("dftc-ia-on2", JSON.stringify(on)); } catch { /* sin almacenamiento */ } };
  return (
    <>
      <p className="nx-eyebrow">⚙️ Ajustes</p>
      <label className="nx-toggle"><input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} /> <span><b>Sonido</b><small>Efectos, Shantay y Sashay</small></span></label>
      <label className="nx-toggle"><input type="checkbox" checked={music} onChange={(e) => { setM(e.target.checked); setMusic(e.target.checked); }} /> <span><b>Música</b><small>En el menú y en el modo historia</small></span></label>
      <label className="nx-toggle"><input type="checkbox" checked={live} onChange={(e) => setLiveOn(e.target.checked)} /> <span><b>Jurado y retos en directo</b><small>Con conexión, el jurado y los retos se escriben para tu partida. Si lo apagas, salen los de siempre.</small></span></label>
    </>
  );
}
