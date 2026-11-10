import "../polyfills";
// Entrada del juego (Phaser 4 + React). El modo historia y el multijugador de siempre viven en clasico.html, que se abre en un marco.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./next.css";
import { refreshAcct } from "./game/cuenta";

createRoot(document.getElementById("app")!).render(<App />);
// La cuenta y el jurado en directo (Supabase) llegan en su propio archivo, sin retrasar la portada
void import("../net/cloud").then(({ cloud }) => cloud.readyPromise.then(refreshAcct)).catch(() => {});

declare const __DFTC_VERSION__: string;
// Se puede instalar y jugar sin conexión (el mismo service worker que la versión clásica)
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(__DFTC_VERSION__)}`).catch(() => {});
