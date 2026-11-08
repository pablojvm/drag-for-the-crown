// Críticas del jurado, como en el modo individual: Supremme abre y critica el reto, Ana Locking critica el look
// (con su propia nota), a veces opinan los Javis y, si hay historia, el jurado se acuerda de cómo vas.
// Las comparten el multijugador (sala y servidor) y el motor nuevo.
import { JURADO, bancoReto } from "./textos";
import { ESTILO_CRITICA } from "./historia";

export type Nivel = "top" | "mid" | "low";
export type Habla = "host" | "judge" | "ambrossi" | "calvo";

export const JAVIS_CRITICA: Record<Nivel, [Habla, string][][]> = {
  top: [
    [["calvo", "Yo me he emocionado. Y no me emociono con cualquier cosa."], ["ambrossi", "Yo sí, pero hoy con razón."]],
    [["ambrossi", "Esto es lo que venimos a ver a este programa. Gracias, {yo}."]],
    [["calvo", "Tienes una verdad que traspasa la pantalla, {yo}."]],
  ],
  mid: [
    [["ambrossi", "Hay algo muy bonito ahí, pero todavía no lo has sacado del todo."], ["calvo", "Estás a un paso. Y ese paso es el que da miedo."]],
    [["calvo", "A mí me ha gustado, pero me he quedado con ganas de más."]],
    [["ambrossi", "Te hemos visto dudar. Y cuando dudas, se nota desde aquí."]],
  ],
  low: [
    [["ambrossi", "{yo}, te queremos mucho, pero hoy no te hemos reconocido."], ["calvo", "Y eso es lo que más nos duele."]],
    [["calvo", "No sé qué ha pasado esta semana, pero no eras tú."]],
    [["ambrossi", "Creo que te has puesto un techo tú sola. Rómpelo."]],
  ],
};

/** Nombre de cada voz del jurado (como lo pinta el multijugador). */
export const NOMBRE_JURADO: Record<Habla, string> = { host: "Supremme", judge: "Ana Locking", ambrossi: "Javier Ambrossi", calvo: "Javier Calvo" };

export interface CriticaCtx {
  tipo: string;
  /** Nivel del reto y nivel del look (van por separado). */
  nivel: Nivel;
  look?: Nivel;
  nombre: string;
  noRunway?: boolean;
  /** Categoría de la pasarela de la semana. */
  cat?: string;
  /** Etiquetas de las semanas anteriores (para que el jurado se acuerde). */
  antes?: string[];
  rnd?: () => number;
}

/** Críticas de una reina: [quién habla, qué dice]. La segunda línea es siempre la del reto. */
export function criticaJurado(o: CriticaCtx): [Habla, string][] {
  const rnd = o.rnd || Math.random;
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  const yo = (t: string) => t.replace(/\{yo\}/g, o.nombre);
  const out: [Habla, string][] = [
    ["host", yo(pick(JURADO.aperturaSupreme))],
    ["host", yo(pick(bancoReto(o.tipo)[o.nivel]))],
  ];
  if (!o.noRunway) {
    const look = o.look || o.nivel;
    // A veces habla del estilismo para la categoría; si no, del look en general
    const estilo = (ESTILO_CRITICA[look] as string[]).filter((t) => !t.includes("{pieza}") && (o.cat || !t.includes("{cat}")));
    const txt = estilo.length && rnd() < 0.5 ? pick(estilo).replace(/\{cat\}/g, o.cat || "") : pick(JURADO.pasarela[look]).replace(/^(y |por cierto, )/i, "").replace(/^./, (c) => c.toUpperCase());
    out.push(["judge", `${yo(pick(JURADO.aperturaAna))} ${txt}`]);
    // Cuando un look le encanta, Ana suelta su «ovaaahhh» con los deditos
    if (look === "top" && rnd() < 0.45) out.push(["judge", pick(JURADO.ovah)]);
  }
  if (rnd() < 0.55) out.push(...pick(JAVIS_CRITICA[o.nivel]).map(([k, t]) => [k, yo(t)] as [Habla, string]));
  // El jurado se acuerda de cómo vas
  const antes = o.antes || [];
  const prev = antes[antes.length - 1] || "";
  const nb = antes.filter((l) => /^BTM/.test(l)).length, nw = antes.filter((l) => l === "WIN" || l === "BWIN").length;
  if (/^BTM/.test(prev) && o.nivel === "top") out.push(["judge", "La semana pasada estabas en el bottom y hoy mírate. Eso es tener hambre de corona."]);
  else if (nb >= 2 && o.nivel === "low") out.push(["host", `${o.nombre}, ya van ${nb} veces abajo. Ya no es un mal día: empieza a ser una tendencia.`]);
  else if (nw >= 2 && o.nivel === "low") out.push(["judge", `Llevas ${nw} victorias y hoy parece que te has relajado. No te lo creas tanto.`]);
  else if (nw >= 2 && o.nivel === "top") out.push(["ambrossi", `Ya llevas ${nw} victorias y no aflojas. Así se hace.`]);
  return out;
}

// ---------- Retos por grupos ----------
/** Nombres de banda para el Girl Groups (la de cada grupo, distinta). */
export const BANDAS = ["Las Lentejuelas Asesinas", "Purpurina Mecánica", "Las Tías Buenas del Barrio", "Peluca Sónica", "Las Hijas del Desamor", "Tacón y Rímel", "Las Chulapas del Bloque", "Laca y Veneno", "Las Divinas Ruinas", "Rímel Atómico"];
/** Nombres de los grupos de los demás retos (como en el modo historia: Pareja Rosa, Grupo Oro...). */
export const COLORES_GRUPO = ["Rosa", "Oro", "Turquesa", "Lila", "Coral", "Esmeralda"];
/** Lo que dice el jurado de cada grupo antes de las críticas una a una ({g}: el nombre del grupo). */
export const GRUPO_CRIT: Record<Nivel, [Habla, string][][]> = {
  top: [[["host", "{g}: como grupo habéis funcionado de maravilla. Se notaba que había un plan."], ["judge", "Y el conjunto tenía una idea clara. Ninguna se ha quedado atrás."]],
    [["host", "{g}: eso es un grupo. Química, ritmo y todas a la misma altura."], ["judge", "Visualmente erais una unidad. Así se presenta un reto en grupo."]]],
  mid: [[["host", "{g}: como grupo habéis cumplido, pero os faltaba algo para destacar."], ["judge", "Había cosas buenas, pero el conjunto no terminaba de cuadrar."]],
    [["host", "{g}: correcto, sin más. Esperaba un poco más de chispa de vosotras juntas."], ["judge", "Cada una ha hecho lo suyo, pero no os he visto como grupo."]]],
  low: [[["host", "{g}: como grupo no ha funcionado. Cada una iba por su lado."], ["judge", "El conjunto no se sostenía. Faltaba una idea común."]],
    [["host", "{g}: lo siento, pero como grupo ha sido de lo más flojo de la noche."], ["judge", "Se notaba que no os habíais puesto de acuerdo. Y eso en el escenario se ve."]]],
};
export function grupoCritica(nombre: string, nivel: Nivel, rnd: () => number = Math.random): [Habla, string][] {
  const b = GRUPO_CRIT[nivel];
  return b[Math.floor(rnd() * b.length)].map(([k, t]) => [k, t.replace("{g}", nombre)] as [Habla, string]);
}
