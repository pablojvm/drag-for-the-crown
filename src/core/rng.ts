// Azar reproducible (mulberry32). El estado es un entero de 32 bits que se guarda con la partida.
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
export const newSeed = (): number => (Math.random() * 4294967296) >>> 0;
/** Generador con estado propio: útil para tests y simulaciones. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}
