// Entrada del juego nuevo (Phaser 4 + React). Convive con el juego actual (index.html) mientras se migra.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./next.css";

createRoot(document.getElementById("app")!).render(<App />);
