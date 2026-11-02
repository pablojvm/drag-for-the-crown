// El modo historia de siempre, dentro de la versión nueva (ver game/historia.ts).
import { useEffect, useRef, useState } from "react";
import { closeHistoria, historiaModo } from "../game/historia";

export function HistoriaUI() {
  const [ready, setReady] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => `./clasico.html?historia${historiaModo() ? "=" + historiaModo() : ""}`);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.type !== "dftc-historia") return;
      if (e.data.ev === "ready") { setReady(true); frame.current?.focus(); }
      if (e.data.ev === "exit") closeHistoria();
    };
    addEventListener("message", on);
    return () => removeEventListener("message", on);
  }, []);
  return (
    <div className="nx-historia">
      {!ready && <div className="nx-historia-wait" role="status"><h2>Modo historia</h2><div className="nx-dots" aria-hidden="true"><i /><i /><i /></div></div>}
      <iframe ref={frame} src={src} title="Modo historia" className={ready ? "on" : ""} allow="autoplay; fullscreen; clipboard-write" />
    </div>
  );
}
