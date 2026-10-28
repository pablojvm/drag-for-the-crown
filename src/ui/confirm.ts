// Avisos propios del juego (en vez de confirm()/alert() del navegador)
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface AskOpts { title?: string; ok?: string; cancel?: string | null; icon?: string; danger?: boolean }

/** Pregunta con dos botones. Resuelve true si acepta. Esc o clic fuera = cancelar. */
export function ask(msg: string, o: AskOpts = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const prev = document.activeElement as HTMLElement | null;
    const m = document.createElement("div");
    m.className = "app-ask";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.innerHTML = `
      <div class="story-card app-ask-card">
        ${o.icon ? `<div class="app-ask-icon">${o.icon}</div>` : ""}
        ${o.title ? `<h3>${esc(o.title)}</h3>` : ""}
        <p>${esc(msg)}</p>
        <div class="app-ask-row">
          ${o.cancel === null ? "" : `<button class="btn btn-ghost" data-v="0">${esc(o.cancel || "Cancelar")}</button>`}
          <button class="btn btn-primary ${o.danger ? "danger" : ""}" data-v="1">${esc(o.ok || "Aceptar")}</button>
        </div>
      </div>`;
    const done = (v: boolean) => {
      document.removeEventListener("keydown", onKey, true);
      m.classList.add("closing");
      setTimeout(() => m.remove(), 180);
      prev?.focus?.();
      resolve(v);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(false); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); done(true); }
      else e.stopPropagation(); // que el juego no reciba teclas mientras está abierto
    };
    m.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-v]");
      if (b) done(b.dataset.v === "1");
      else if (e.target === m) done(false);
    });
    document.addEventListener("keydown", onKey, true);
    // Dentro del escenario: se escala igual que el resto del juego (en móvil también)
    (document.querySelector("#stage") || document.body).append(m);
    m.querySelector<HTMLElement>('[data-v="1"]')?.focus();
  });
}
/** Aviso con un solo botón. */
export const notice = (msg: string, o: AskOpts = {}) => ask(msg, { ...o, cancel: null, ok: o.ok || "Vale" }).then(() => undefined);

(window as any).DFTC_ASK = ask;
