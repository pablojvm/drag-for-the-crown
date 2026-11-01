// Minijuegos del modo historia del motor nuevo: posado/costura (parar en la zona buena), flash (reflejos) y ritmo (notas en carriles).
// Todos terminan solos aunque no se toque nada y devuelven una nota de 0 a 100. Teclado, ratón y dedo.
import { useEffect, useRef, useState } from "react";

type Done = (score: number) => void;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Una barra con un marcador que va y viene: pulsa cuando pase por la zona dorada. */
export function TimingGame({ label, rounds = 5, hard = 0, verb = "¡POSE!", onDone }: { label: string; rounds?: number; hard?: number; verb?: string; onDone: Done }) {
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState<number[]>([]);
  const [zone, setZone] = useState(() => 0.25 + Math.random() * 0.5);
  const [flashMsg, setFlashMsg] = useState("");
  const st = useRef({ t0: performance.now(), pos: 0, done: false, last: performance.now() });
  const width = clamp(0.2 - hard * 0.03, 0.08, 0.24);
  const speed = 0.9 + hard * 0.25 + round * 0.08;
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const t = (now - st.current.t0) / 1000;
      const p = (Math.sin(t * speed * Math.PI) + 1) / 2;
      st.current.pos = p;
      setPos(p);
      // Si no se pulsa en 4 s, la ronda cuenta como fallo
      if (now - st.current.last > 4000) hit();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
  const hit = () => {
    if (st.current.done) return;
    st.current.last = performance.now();
    const d = Math.abs(st.current.pos - zone);
    const sc = d <= width / 2 ? 100 - (d / (width / 2)) * 25 : clamp(60 - (d - width / 2) * 300, 0, 60);
    const nh = [...hits, sc];
    setHits(nh);
    setFlashMsg(sc >= 90 ? "¡Perfecta!" : sc >= 75 ? "¡Bien!" : sc >= 40 ? "Casi..." : "Fuera de tiempo");
    setZone(0.2 + Math.random() * 0.6);
    if (nh.length >= rounds) {
      st.current.done = true;
      setTimeout(() => onDone(Math.round(nh.reduce((a, b) => a + b, 0) / nh.length)), 500);
    } else setRound(nh.length);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); hit(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  return (
    <div className="nx-game">
      <p className="nx-game-head"><b>{label}</b> · {Math.min(hits.length + 1, rounds)} de {rounds}</p>
      <div className="nx-timing" aria-hidden="true">
        <span className="nx-timing-zone" style={{ left: `${(zone - width / 2) * 100}%`, width: `${width * 100}%` }} />
        <i style={{ left: `${pos * 100}%` }} />
      </div>
      <p className="nx-game-msg" aria-live="polite">{flashMsg}</p>
      <button className="nx-btn nx-game-hit" data-game-hit onClick={hit}>{verb}</button>
      <small className="nx-muted">Espacio, clic o toca el botón</small>
    </div>
  );
}

/** Reflejos: pulsa justo cuando salte el flash (antes de tiempo no vale). */
export function FlashGame({ label, rounds = 4, onDone }: { label: string; rounds?: number; onDone: Done }) {
  const [state, setState] = useState<"espera" | "flash" | "nota">("espera");
  const [scores, setScores] = useState<number[]>([]);
  const [msg, setMsg] = useState("Espera al flash...");
  const r = useRef({ at: 0, timer: 0 as any, done: false, scores: [] as number[] });
  const arm = () => {
    setState("espera");
    setMsg("Espera al flash...");
    r.current.timer = setTimeout(() => {
      r.current.at = performance.now();
      setState("flash");
      setMsg("¡FLASH!");
      // Si no se pulsa en 1,5 s, cuenta como tarde
      r.current.timer = setTimeout(() => press(), 1500);
    }, 900 + Math.random() * 1600);
  };
  useEffect(() => { arm(); return () => clearTimeout(r.current.timer); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const press = () => {
    if (r.current.done) return;
    clearTimeout(r.current.timer);
    let sc = 0;
    if (r.current.at) {
      const ms = performance.now() - r.current.at;
      sc = clamp(Math.round(100 - (ms - 180) / 9), 0, 100);
      setMsg(sc >= 85 ? "¡Foto perfecta!" : sc >= 50 ? "Buena foto" : "Llegas tarde...");
    } else setMsg("¡Antes de tiempo! Foto movida.");
    r.current.at = 0;
    const ns = [...r.current.scores, sc];
    r.current.scores = ns;
    setScores(ns);
    setState("nota");
    if (ns.length >= rounds) {
      r.current.done = true;
      setTimeout(() => onDone(Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)), 600);
    } else setTimeout(arm, 700);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); press(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  return (
    <div className="nx-game">
      <p className="nx-game-head"><b>{label}</b> · {Math.min(scores.length + 1, rounds)} de {rounds}</p>
      <div className={`nx-flash ${state === "flash" ? "on" : ""}`} aria-live="polite">{msg}</div>
      <button className="nx-btn nx-game-hit" data-game-hit onClick={press}>📸 ¡Ahora!</button>
      <small className="nx-muted">Espacio, clic o toca el botón</small>
    </div>
  );
}

/** Ritmo: las notas bajan por cuatro carriles; pulsa el carril cuando la nota llegue a la línea. */
const KEYS = ["KeyD", "KeyF", "KeyJ", "KeyK"];
const LABELS = ["D", "F", "J", "K"];
export function RitmoGame({ label, notes = 16, hard = 0, onDone }: { label: string; notes?: number; hard?: number; onDone: Done }) {
  const gap = clamp(700 - hard * 110, 380, 700); // ms entre notas
  const travel = 1600; // ms que tarda una nota en bajar
  const [now, setNow] = useState(0);
  const g = useRef({
    t0: performance.now() + 600,
    seq: Array.from({ length: notes }, (_, i) => ({ lane: Math.floor(Math.random() * 4), at: i * gap, res: -1 })),
    done: false,
    msg: "",
  });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = performance.now() - g.current.t0;
      // Las que pasan de largo cuentan como fallo
      g.current.seq.forEach((n) => { if (n.res < 0 && t - n.at > 260) { n.res = 0; g.current.msg = "Fallo"; } });
      setNow(t);
      if (!g.current.done && g.current.seq.every((n) => n.res >= 0)) {
        g.current.done = true;
        const sc = g.current.seq.reduce((a, n) => a + n.res, 0) / notes;
        setTimeout(() => onDone(Math.round(sc)), 400);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const press = (lane: number) => {
    const t = performance.now() - g.current.t0;
    const n = g.current.seq.filter((x) => x.res < 0 && x.lane === lane).sort((a, b) => Math.abs(a.at - t) - Math.abs(b.at - t))[0];
    if (!n || Math.abs(n.at - t) > 260) { g.current.msg = "A destiempo"; return; }
    const d = Math.abs(n.at - t);
    n.res = d < 70 ? 100 : d < 150 ? 80 : 55;
    g.current.msg = n.res === 100 ? "¡Perfecta!" : n.res === 80 ? "¡Bien!" : "Justa";
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { const i = KEYS.indexOf(e.code); const a = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"].indexOf(e.code); if (i >= 0 || a >= 0) { e.preventDefault(); press(i >= 0 ? i : a); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const done = g.current.seq.filter((n) => n.res >= 0).length;
  return (
    <div className="nx-game">
      <p className="nx-game-head"><b>{label}</b> · {done} de {notes} notas</p>
      <div className="nx-ritmo" aria-hidden="true">
        {[0, 1, 2, 3].map((l) => (
          <div key={l} className="nx-lane">
            {g.current.seq.filter((n) => n.lane === l && n.res < 0 && now > n.at - travel && now < n.at + 300).map((n) => (
              <i key={n.at} style={{ top: `${clamp(((now - (n.at - travel)) / travel) * 85, -5, 100)}%` }} />
            ))}
            <span className="nx-lane-line" />
          </div>
        ))}
      </div>
      <p className="nx-game-msg" aria-live="polite">{g.current.msg}</p>
      <div className="nx-lane-btns">{LABELS.map((k, l) => <button key={k} className="nx-opt" data-game-lane={l} onPointerDown={() => press(l)}><b>{k}</b></button>)}</div>
    </div>
  );
}
