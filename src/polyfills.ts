// Lo que les falta a los iPad e iPhone con Safari algo antiguo (iOS 15): sin esto, el juego se quedaba parado al
// llegar a ciertas pantallas (salas, IA, duelos). Solo se añade si el navegador no lo tiene.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, "at", { configurable: true, writable: true, value: function at<T>(this: T[], i: number) { const n = Math.trunc(i) || 0; const k = n < 0 ? this.length + n : n; return k < 0 || k >= this.length ? undefined : this[k]; } });
}
if (typeof AbortSignal !== "undefined" && !(AbortSignal as unknown as { timeout?: unknown }).timeout) {
  (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = (ms: number) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
}
export {};
