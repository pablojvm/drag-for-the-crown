// La vida en el taller del motor nuevo: roles detrás de cámaras, escenas con decisiones, confesionario,
// némesis y minirretos. Los textos son los del modo historia (src/core/historia.ts).
import { HISTORIA, ROLES_HISTORIA, ROLES_ORDEN, NEMESIS } from "./historia";
import type { QAttr } from "./reinas";

export type Line = [string, string];
export interface SceneChoice { txt: string; rel: Record<string, number>; bonus: number; adv: number; reply: Line | null }
export interface Scene { kind: "rol" | "evento" | "nemesis"; lines: Line[]; choices: SceneChoice[]; role?: string; r1: string; r2?: string; r3?: string }

const pickR = <T,>(a: T[], rnd: () => number) => a[Math.floor(rnd() * a.length)];
const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

/** Reparte los roles detrás de cámaras entre las rivales (villana, cizañera, graciosa, madre...). */
export function assignRoles(rivals: string[], rnd: () => number): Record<string, string> {
  const roles = shuffle(ROLES_ORDEN as string[], rnd);
  const out: Record<string, string> = {};
  shuffle(rivals, rnd).forEach((k, i) => (out[k] = roles[i % roles.length]));
  return out;
}
export const roleInfo = (role: string): { icon: string; name: string; desc: string } | null => ROLES_HISTORIA[role] || null;

/** Rellena los huecos de un texto: {yo}, {r1}, {r2}. */
export const fillText = (t: string, names: { yo: string; r1?: string; r2?: string; r3?: string }) =>
  t.replace(/\{yo\}/g, names.yo).replace(/\{r1\}/g, names.r1 || "").replace(/\{r2\}/g, names.r2 || "").replace(/\{r3\}/g, names.r3 || names.r2 || "");

function toChoices(src: any[] | undefined, map: Record<string, string>): SceneChoice[] {
  return (src || []).map((c) => ({
    txt: c.txt,
    rel: Object.fromEntries(Object.entries(c.rel || {}).map(([k, v]) => [map[k] || k, v as number])),
    bonus: c.bonus || 0,
    adv: c.adv || 0,
    reply: c.reply ? [c.reply[0], c.reply[1]] : null,
  }));
}

/**
 * Escena del taller de esta semana: una compañera con su rol (si no lo has visto ya todo de ella),
 * un evento entre dos compañeras o, si tienes némesis, su pulla.
 */
export function tallerScene(o: { rivals: string[]; roles: Record<string, string>; nemesis: string | null; seenRoles: Record<string, number>; rnd: () => number }): Scene {
  const { rnd } = o;
  const map = (r1: string, r2?: string, r3?: string): Record<string, string> => ({ r1, ...(r2 ? { r2 } : {}), ...(r3 ? { r3 } : {}) });
  if (o.nemesis && o.rivals.includes(o.nemesis) && rnd() < 0.35) {
    const key = pickR(Object.keys(NEMESIS.pullas), rnd);
    return {
      kind: "nemesis", r1: o.nemesis, lines: pickR(NEMESIS.pullas[key], rnd),
      choices: [
        { txt: "Contestarle a la cara", rel: { [o.nemesis]: -1 }, bonus: 0, adv: 2, reply: ["r1", "Uy, qué miedo. Ya veremos en la pasarela."] },
        { txt: "Ignorarla y seguir cosiendo", rel: {}, bonus: 0, adv: 1, reply: null },
        { txt: "Proponerle una tregua", rel: { [o.nemesis]: 2 }, bonus: 0, adv: 0, reply: NEMESIS.tregua[0] },
      ],
    };
  }
  const withRole = o.rivals.filter((k) => o.roles[k] && (o.seenRoles[k] || 0) < (ROLES_HISTORIA[o.roles[k]]?.escenas?.length || 0));
  if (withRole.length && rnd() < 0.6) {
    const r1 = pickR(withRole, rnd);
    const role = o.roles[r1];
    const sc = ROLES_HISTORIA[role].escenas[(o.seenRoles[r1] || 0) % ROLES_HISTORIA[role].escenas.length];
    const [r2, r3] = shuffle(o.rivals.filter((k) => k !== r1), rnd);
    return { kind: "rol", role, r1, r2: r2 || r1, r3: r3 || r2 || r1, lines: sc.lines, choices: toChoices(sc.choices, map(r1, r2 || r1, r3 || r2 || r1)) };
  }
  const [r1, r2, r3] = shuffle(o.rivals, rnd);
  const ev = pickR(HISTORIA.eventos as any[], rnd);
  return { kind: "evento", r1, r2: r2 || r1, r3: r3 || r2 || r1, lines: ev.lines, choices: toChoices(ev.choices, map(r1, r2 || r1, r3 || r2 || r1)) };
}

/** Lo que dice de ti una compañera en el confesionario (según cómo os llevéis y su rol). */
export function confesionario(o: { key: string; role: string | undefined; rel: number; rnd: () => number }): string | null {
  const c = o.role ? ROLES_HISTORIA[o.role]?.confesionario : null;
  if (!c) return null;
  return pickR(o.rel >= 0 ? c.bien : c.mal, o.rnd);
}
/** Lo que dice tu némesis al nacer la rivalidad. */
export const nemesisBirth = (rnd: () => number): Line => pickR(NEMESIS.nace.choque as Line[], rnd);
/** Líneas de tu némesis en el Untucked (antes del veredicto). */
export function nemesisUntucked(meBottomish: boolean, meTopish: boolean): Line[] {
  const U = NEMESIS.untucked;
  return meBottomish ? U.gloatPre : meTopish ? U.envidiaPre : U.tension;
}

// ---------- Minirretos ----------
export type MiniKind = "posado" | "flash" | "ritmo";
export interface Mini { id: string; titulo: string; desc: string; kind: MiniKind; attr: QAttr }
export const MINIS: Mini[] = [
  { id: "posado", titulo: "Minirreto: posado exprés", desc: "Clava cada pose cuando el foco pase por la zona dorada.", kind: "posado", attr: "moda" },
  { id: "flash", titulo: "Minirreto: ¡flash!", desc: "Pulsa en cuanto salte el flash: ni antes ni tarde.", kind: "flash", attr: "carisma" },
  { id: "karaoke", titulo: "Minirreto: karaoke a ritmo", desc: "Pulsa cada nota justo cuando llegue a la línea.", kind: "ritmo", attr: "canto" },
  { id: "fotocall", titulo: "Minirreto: fotocall extremo (con viento)", desc: "Ventiladores a tope: posa justo cuando el fotógrafo dispare.", kind: "posado", attr: "carisma" },
  { id: "pelucas", titulo: "Minirreto: ¡pelucas al aire!", desc: "Atrapa el momento exacto antes de que la peluca salga volando.", kind: "flash", attr: "lipsync" },
];
/** Nota de una rival en el minirreto. */
export const miniRival = (attr: number, rnd: () => number) => Math.round(Math.max(5, Math.min(99, 30 + attr * 5 + (rnd() - 0.5) * 50)));
