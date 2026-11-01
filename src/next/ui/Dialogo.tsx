// Conversaciones como en la versión clásica: la reina (o la presentadora) en grande, su nombre en la etiqueta
// y el texto que se va escribiendo en la caja de abajo. Clic, Espacio o Enter para seguir; 1, 2, 3 para elegir.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface Linea { name: string; role?: string; img: string; side: "left" | "right"; text: string }

/** Avisa al plató de que se abre o se cierra una conversación (para apartar a la reina del fondo). */
function useAviso() {
  useEffect(() => {
    queueMicrotask(() => dispatchEvent(new Event("nx-dlg")));
    return () => { setTimeout(() => dispatchEvent(new Event("nx-dlg")), 0); };
  }, []);
}

/** Conversaciones ya vistas (para no repetirlas al volver a la pantalla). */
const vistas = new Set<string>();

function useTyping(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; }
    const t = setInterval(() => setN((v) => { if (v + 2 >= text.length) { clearInterval(t); return text.length; } return v + 2; }), 22);
    return () => clearInterval(t);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, finish: () => setN(text.length) };
}

interface Props {
  lines: Linea[];
  /** Al final, la jugadora elige qué decir (habla ella: `me`). */
  choices?: string[];
  me?: Linea;
  onChoice?: (i: number) => void;
  onDone?: () => void;
}

export function Dialogo({ lines, choices, me, onChoice, onDone }: Props) {
  useAviso();
  const [i, setI] = useState(0);
  const atChoices = i >= lines.length && !!choices?.length;
  const cur = lines[Math.min(i, lines.length - 1)];
  const { shown, done, finish } = useTyping(atChoices || !cur ? "" : cur.text);
  const ended = useRef(false);
  useEffect(() => {
    if (i >= lines.length && !choices?.length && !ended.current) { ended.current = true; onDone?.(); }
  }, [i, lines.length, choices, onDone]);
  const next = () => { if (atChoices) return; if (!done) finish(); else setI((v) => v + 1); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (atChoices && /^[1-9]$/.test(e.key) && choices![+e.key - 1]) { e.preventDefault(); onChoice?.(+e.key - 1); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  if (i >= lines.length && !atChoices) return null;
  const w = atChoices ? me! : cur;
  return createPortal(
    <div className="nx-dlg" onClick={next} role="dialog" aria-label={`Habla ${w.name}`}>
      {w.img && <img key={`${i}-${w.img}`} className={`nx-dlg-char ${w.side}`} src={w.img} alt="" />}
      <div className="nx-dlg-box">
        <p className="nx-dlg-name">{w.name} {w.role && <small>{w.role}</small>}</p>
        {atChoices ? (
          <div className="nx-dlg-choices">
            {choices!.map((c, k) => <button key={k} className="nx-btn ghost" onClick={(e) => { e.stopPropagation(); onChoice?.(k); }}><b>{k + 1}</b> {c}</button>)}
          </div>
        ) : (
          <>
            <p className="nx-dlg-text" aria-live="polite">{shown}{!done && <i className="caret" />}</p>
            <p className="nx-dlg-hint">Clic, Espacio o Enter para continuar ▸</p>
          </>
        )}
      </div>
      {!atChoices && <button className="nx-btn ghost nx-dlg-skip" onClick={(e) => { e.stopPropagation(); setI(lines.length); }}>Saltar</button>}
    </div>,
    document.body,
  );
}

/** Una conversación que se ve una vez: mientras dura, ocupa la pantalla; después se enseña lo de dentro. */
export function Escena({ id, lines, children, onDone }: { id: string; lines: Linea[]; children?: ReactNode; onDone?: () => void }) {
  const [, force] = useState(0);
  if (!lines.length || vistas.has(id)) return <>{children}</>;
  return <Dialogo key={id} lines={lines} onDone={() => { vistas.add(id); force((v) => v + 1); onDone?.(); }} />;
}

/** Caja de diálogo fija con contenido propio (la charla libre: escribes tú y te contesta). */
export function Caja({ who, text, children }: { who: Linea; text: string; children?: ReactNode }) {
  useAviso();
  const { shown, done, finish } = useTyping(text);
  return createPortal(
    <div className="nx-dlg fixed" onClick={finish}>
      {who.img && <img className={`nx-dlg-char ${who.side}`} src={who.img} alt="" />}
      <div className="nx-dlg-box">
        <p className="nx-dlg-name">{who.name} {who.role && <small>{who.role}</small>}</p>
        <p className="nx-dlg-text" aria-live="polite">{shown}{!done && <i className="caret" />}</p>
        {children}
      </div>
    </div>,
    document.body,
  );
}
