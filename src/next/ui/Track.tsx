// Tabla del track record (como la de la versión clásica): foto, colores por resultado, puesto y PPE.
import type { TrackSnap } from "../game/track";

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
