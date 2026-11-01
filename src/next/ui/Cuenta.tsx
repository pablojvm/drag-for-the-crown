// Barra del menú: tu cuenta, tus lentejuelas, Hall of Fame, logros y ajustes.
import { useEffect, useState } from "react";
import { useGame, setMuted } from "../store";
import { signIn, signOut, refreshAcct, localBoard, worldTop, playerName, setPlayerName, type TopRow } from "../game/cuenta";
import { logrosDone, sequins } from "../game/logros";
import { isMusicOn, setMusic } from "../game/music";
import { LOGROS } from "../../core/logros";
import { REINAS_ES } from "../../core/reinas";
import { seasonById } from "../../core/temporada";

type Panel = "cuenta" | "fama" | "logros" | "ajustes" | null;

export function MenuBar() {
  const acct = useGame((s) => s.acct);
  const [panel, setPanel] = useState<Panel>(null);
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
          <span className="nx-chip" title="Lentejuelas">✨ {sequins()}</span>
          <button className="nx-round" aria-label="Hall of Fame" title="Hall of Fame" onClick={() => toggle("fama")}>🏆</button>
          <button className="nx-round" aria-label="Logros" title="Logros" onClick={() => toggle("logros")}>🎖️</button>
          <button className="nx-round" aria-label="Ajustes" title="Ajustes" onClick={() => toggle("ajustes")}>⚙️</button>
        </div>
      </div>
      {panel && (
        <div className="nx-center nx-dim nx-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <div className="nx-panel nx-ts-panel" role="dialog" aria-modal="true">
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
          ? "Tu progreso (temporadas, armario, logros y lentejuelas) te sigue en cualquier dispositivo donde entres con esta cuenta."
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
function Fama() {
  const [tab, setTab] = useState<"mias" | "mundo">("mias");
  const [world, setWorld] = useState<TopRow[] | null>(null);
  const [name, setName] = useState(playerName());
  useEffect(() => { if (tab === "mundo" && !world) worldTop().then(setWorld); }, [tab, world]);
  const rows: TopRow[] = tab === "mias" ? (localBoard() as TopRow[]) : world || [];
  return (
    <>
      <p className="nx-eyebrow">🏆 Hall of Fame</p>
      <div className="nx-row">
        <button className={`nx-chip ${tab === "mias" ? "on" : ""}`} onClick={() => setTab("mias")}>Mis temporadas</button>
        <button className={`nx-chip ${tab === "mundo" ? "on" : ""}`} onClick={() => setTab("mundo")}>Mundial</button>
      </div>
      {tab === "mias" && (
        <label className="nx-name">Tu nombre en el Hall of Fame <input value={name} maxLength={12} onChange={(e) => { setName(e.target.value); setPlayerName(e.target.value); }} placeholder="Anónima" /></label>
      )}
      {tab === "mundo" && !world && <div className="nx-dots" aria-hidden="true"><i /><i /><i /></div>}
      {rows.length ? (
        <ol className="nx-ts-rows nx-fama">
          {rows.slice(0, 20).map((r, i) => (
            <li key={r.id || i}><span><b>{i + 1}.</b> {r.name || "Anónima"} · {queenName(r.queen)} <small>{seasonName(r.season)}</small></span><em>{r.won ? "👑 " : ""}PPE {Number(r.ppe || 0).toFixed(2)}</em></li>
          ))}
        </ol>
      ) : (tab === "mias" || world) && <p className="nx-muted nx-center-txt">{tab === "mias" ? "Aún no has terminado ninguna temporada." : "No se ha podido cargar el Hall of Fame mundial."}</p>}
    </>
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
