// Tabla del track record (como la de la versión clásica): foto, colores por resultado, puesto y PPE.
import type { TrackSnap } from "../game/track";
import { useGame } from "../store";
import { closeTrack } from "../game/historia";

export function TrackTabla({ snap }: { snap: TrackSnap }) {
  return (
    <div className="nx-track-wrap">
      <table className="nx-track">
        <thead>
          <tr>
            <th>#</th><th>Reina</th>
            {Array.from({ length: snap.eps }, (_, i) => <th key={i}>Ep. {i + 1}{snap.epNames[i] && <small>{snap.epNames[i]}</small>}</th>)}
            {snap.extra && <th>{snap.extra}</th>}
            <th>PPE</th>
          </tr>
        </thead>
        <tbody>
          {snap.rows.map((r, i) => (
            <tr key={r.key} className={`${r.me ? "me" : ""} ${r.out ? "out" : ""}`} style={{ ["--i" as string]: i }}>
              <td className="rk">{r.place}</td>
              <td className="qn"><i style={{ backgroundImage: r.img ? `url('./${r.img}')` : undefined }} /><span>{r.name}{r.me && <b> (tú)</b>}</span></td>
              {r.cells.map((c, e) => <td key={e} className={c.c}>{c.t}</td>)}
              {snap.extra && <td className="ppe">{r.extra}</td>}
              <td className="ppe">{r.ppe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** El track record de cada episodio del modo historia, con la tabla del motor nuevo. */
export function HistTrack() {
  const t = useGame((s) => s.htrack);
  if (!t) return null;
  return (
    <div className="nx-htrack" role="dialog" aria-label="Track record">
      <div className="nx-panel nx-htrack-card">
        {t.title && <p className="nx-eyebrow">{t.title}</p>}
        {t.note && <p className="nx-htrack-note">{t.note}</p>}
        <h2>Track record</h2>
        <TrackTabla snap={t.snap} />
        <button className="nx-btn nx-htrack-next" autoFocus onClick={closeTrack}>{t.label}</button>
      </div>
    </div>
  );
}
