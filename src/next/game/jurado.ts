// El jurado en directo del motor nuevo: la misma función del servidor que usa el modo historia.
// La conexión (src/net/cloud.ts) la carga la entrada del juego (main.tsx); aquí se usa a través de window.DFTC_NET.
// Si no hay conexión (o está apagado en ajustes), la pasarela es la clásica.
import { GUION_BASE, parseJSON } from "../../core/guion";

type Opts = { json?: boolean; max?: number; temp?: number };
type Net = { ready(): boolean; chat(system: string, user: string, o: Opts): Promise<string> };
const net = (): Net | undefined => (globalThis as any).DFTC_NET;
type Ask = (system: string, user: string, o: Opts) => Promise<any>;

/** Para las pruebas: una respuesta preparada en lugar del servidor. */
const hook = (): Ask | undefined => (globalThis as any).__dftcNextAsk;
const liveOn = () => {
  try {
    const v = localStorage.getItem("dftc-ia-on2");
    return v === null ? true : !!JSON.parse(v);
  } catch {
    return true;
  }
};

export const juradoListo = () => !!hook() || (liveOn() && !!net()?.ready());

/** Devuelve el objeto (o el texto) de la respuesta, o null si no llega a tiempo. */
export async function ask(system: string, user: string, o: Opts, timeout = 30000): Promise<any> {
  const h = hook();
  try {
    if (h) return await h(system, user, o);
    if (!juradoListo()) return null;
    const t = await Promise.race([net()!.chat(`${GUION_BASE} ${system}`, user, o), new Promise<string>((_, rej) => setTimeout(() => rej(new Error("tarde")), timeout))]);
    return o.json ? parseJSON(t) : t || null;
  } catch {
    return null;
  }
}
