// Reglas del arcade (sin pantalla): las usa la escena de Phaser y se prueban con Vitest.
import { ARCADE_QUEENS, type ArcadeQueen } from "./data";

export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const ROUNDS = 5;

/** Velocidad de movimiento en píxeles por segundo según la estadística (1 a 5). */
export const moveSpeed = (q: ArcadeQueen) => 220 + q.stats.speed * 45;
/** Milisegundos entre tacones al mantener el disparo. */
export const fireDelay = (q: ArcadeQueen) => 420 - q.stats.rate * 50;
/** Daño de cada tacón. */
export const heelDamage = (q: ArcadeQueen) => 1 + Math.floor(q.stats.power / 2);
/** Vidas iniciales: la base más el extra de la reina (con tope). */
export const startLives = (q: ArcadeQueen) => Math.min(MAX_LIVES, START_LIVES + Math.floor((q.stats.lives - 3) / 2));

/** La rival de cada ronda: más vida, más rápida y dispara más cuanto más avanzas. La última es la jefa. */
export function rivalFor(round: number, rivals: ArcadeQueen[]) {
  const r = Math.max(1, Math.min(ROUNDS, round));
  const q = rivals[(r - 1) % rivals.length];
  const boss = r === ROUNDS;
  return {
    queen: q,
    boss,
    hp: 12 + r * 6 + (boss ? 14 : 0),
    speed: 120 + r * 28 + (boss ? 40 : 0),
    fireEvery: Math.max(380, 1300 - r * 170 - (boss ? 150 : 0)),
    pattern: (["recto", "dirigido", "abanico", "rafaga", "todo"] as const)[r - 1],
  };
}

/** Puntos por impacto con combo (x1 a x8) y bonus al tumbar a la rival o terminar sin daño. */
export const hitPoints = (combo: number) => 10 * Math.min(8, Math.max(1, combo));
export const roundBonus = (o: { round: number; flawless: boolean; lives: number }) => 500 * o.round + (o.flawless ? 1000 : 0) + o.lives * 200;

/** Rivales del arcade para una reina: el resto del reparto en orden fijo. */
export const rivalsOf = (id: string) => ARCADE_QUEENS.filter((q) => q.id !== id);
