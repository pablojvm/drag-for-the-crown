// Órdenes de React a Phaser (empezar, pausar, salir). Phaser escucha; React solo emite.
type Cmd = { type: "start"; queenId: string } | { type: "pause"; on: boolean } | { type: "menu" } | { type: "mute"; on: boolean };
const target = new EventTarget();
export const send = (c: Cmd) => target.dispatchEvent(new CustomEvent("cmd", { detail: c }));
export const listen = (fn: (c: Cmd) => void) => {
  const h = (e: Event) => fn((e as CustomEvent<Cmd>).detail);
  target.addEventListener("cmd", h);
  return () => target.removeEventListener("cmd", h);
};
