// Servidor del multijugador de Drag for the Crown (Colyseus). Puerto: PORT (8080 en Fly.io).
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Sala } from "./sala";
import { DURACION } from "../../src/mp/model";

// Solo pruebas: MP_FAST=4 acorta todos los relojes (como ?mpfast en el cliente)
const fast = Number(process.env.MP_FAST || 1);
if (fast > 1) Object.values(DURACION).forEach((d: Record<string, number>) => Object.keys(d).forEach((k) => (d[k] = d[k] > 0 ? Math.max(4, Math.round(d[k] / fast)) : 0)));

const server = new Server({
  transport: new WebSocketTransport({ pingInterval: 5000, pingMaxRetries: 3 }),
  greet: false,
  // /salud (y /health, el nombre que suelen pedir los alojamientos) para comprobar que está vivo
  express: (app) => { ["/salud", "/health"].forEach((p) => app.get(p, (_req: unknown, res: { setHeader(k: string, v: string): void; json(v: unknown): void }) => { res.setHeader("Access-Control-Allow-Origin", "*"); res.json({ ok: true }); })); },
});
server.define("dftc", Sala);
const port = Number(process.env.PORT || 2567);
await server.listen(port, "0.0.0.0");
console.log(`👑 Servidor de salas en el puerto ${port}`);
