// Máquina de estados del episodio: el orden real del programa, en un solo sitio.
// El código heredado avisa al entrar en cada fase (flow.go) y aquí se comprueba que el paso es legal:
// así no se puede llegar al veredicto sin críticas ni Untucked, ni saltarse fases por un doble clic.
import { createMachine, getNextSnapshot } from "xstate";

export const FASES = ["inicio", "minirreto", "taller", "reto", "mc", "pasarela", "llamada", "criticas", "untucked", "veredicto", "lipsync", "fin"] as const;
export type Fase = (typeof FASES)[number];

export const episodeMachine = createMachine({
  id: "episodio",
  initial: "inicio",
  states: {
    // El reencuentro y la gran final tienen su propio formato: de inicio pasan directamente a fin
    inicio: { on: { minirreto: "minirreto", fin: "fin" } },
    minirreto: { on: { taller: "taller" } },
    // En la Segunda Oportunidrag la inmune no compite: hace de maestra de ceremonias
    taller: { on: { reto: "reto", mc: "mc" } },
    // Retos sin pasarela aparte (Ball, Materiales, Makeover, Lalaparuza) van directos a la llamada
    reto: { on: { pasarela: "pasarela", llamada: "llamada" } },
    pasarela: { on: { llamada: "llamada" } },
    mc: { on: { veredicto: "veredicto", lipsync: "lipsync", fin: "fin" } },
    llamada: { on: { criticas: "criticas" } },
    criticas: { on: { untucked: "untucked" } },
    untucked: { on: { veredicto: "veredicto" } },
    // All Stars / All Winners: tras el veredicto, lip sync por el poder o por la estrella
    veredicto: { on: { lipsync: "lipsync", fin: "fin" } },
    lipsync: { on: { fin: "fin" } },
    fin: { on: { inicio: "inicio" } },
  },
});

/** ¿Se puede pasar de una fase a otra? */
export function canGo(from: Fase, to: Fase): boolean {
  if (to === "inicio") return true; // empezar episodio (o reanudar) siempre vale
  const snap = episodeMachine.resolveState({ value: from, context: {} });
  return getNextSnapshot(episodeMachine, snap, { type: to }).value === to;
}

export interface FlowHost { flow?: Fase | null; flowErr?: string[] }
/** Avanza el flujo guardado en la partida. Devuelve false (y lo anota) si el paso no es legal. */
export function go(host: FlowHost, to: Fase): boolean {
  const from = (host.flow || "inicio") as Fase;
  if (from === to) return true; // repetir fase (p. ej. al reanudar) no es un error
  const ok = canGo(from, to);
  if (!ok) {
    const msg = `${from} → ${to}`;
    host.flowErr = [...(host.flowErr || []), msg].slice(-20);
    console.warn(`[flujo] paso no válido: ${msg}`);
  }
  host.flow = to;
  return ok;
}
