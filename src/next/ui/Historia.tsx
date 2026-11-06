// El modo historia de siempre, dentro de la versión nueva (ver game/historia.ts).
import { useEffect, useRef, useState } from "react";
import { closeHistoria, historiaModo, onHistoria, setHistoriaFrame } from "../game/historia";
import { useGame } from "../store";

export function HistoriaUI() {
  const [ready, setReady] = useState(false);
  const away = useGame((s) => !!s.hist.scene);
  const frame = useRef<HTMLIFrameElement>(null);
  // El multijugador, igual: clasico.html?mp&embed (pasa ?mpserver= si viene en la dirección, para las pruebas)
  const [src] = useState(() => {
    const m = historiaModo();
    if (m !== "mp") return `./clasico.html?historia${m ? "=" + m : ""}`;
    const sv = new URLSearchParams(location.search).get("mpserver");
    return `./clasico.html?mp&embed${sv !== null ? `&mpserver=${encodeURIComponent(sv)}` : ""}`;
  });
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.type !== "dftc-historia") return;
      if (e.data.ev === "ready") { setReady(true); setHistoriaFrame(frame.current?.contentWindow || null); frame.current?.focus(); }
      if (e.data.ev === "exit") closeHistoria();
      onHistoria(e.data);
    };
    addEventListener("message", on);
    return () => { removeEventListener("message", on); setHistoriaFrame(null); };
  }, []);
  return (
    <div className={`nx-historia ${ready ? "on" : ""} ${away ? "away" : ""}`}>
      {!ready && <div className="nx-historia-wait" role="status"><h2>{historiaModo() === "mp" ? "Multijugador" : "Modo historia"}</h2><div className="nx-dots" aria-hidden="true"><i /><i /><i /></div></div>}
      <iframe ref={frame} src={src} title={historiaModo() === "mp" ? "Multijugador" : "Modo historia"} className={ready ? "on" : ""} allow="autoplay; fullscreen; clipboard-write" />
    </div>
  );
}
