// Carrusel de slides: se desliza con el dedo, arrastrando con el ratón, con flechas o con el teclado.
// Pulsar una slide lateral la trae al centro (no la activa); la del centro hace lo suyo.
export interface Carousel { goTo(i: number, smooth?: boolean): void; readonly active: number; recenter(): void }
interface Opts {
  /** Dónde se recuerda la última slide elegida */
  storageKey?: string;
  /** Si las flechas del teclado mueven este carrusel ahora */
  keys?: () => boolean;
  onChange?: (i: number) => void;
}

export function carousel(root: HTMLElement, o: Opts = {}): Carousel {
  const track = root.querySelector<HTMLElement>(".car-track")!;
  const dots = root.querySelector<HTMLElement>(".car-dots");
  const slides = Array.from(track.children) as HTMLElement[];
  let active = 0;
  const scale = () => { const st = document.querySelector<HTMLElement>("#stage"); return st ? st.getBoundingClientRect().width / st.offsetWidth || 1 : 1; };
  const centerOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;

  if (dots) dots.innerHTML = slides.map((s, i) => `<button type="button" role="tab" aria-label="${s.getAttribute("aria-label") || i + 1}" data-i="${i}"></button>`).join("");
  const dotEls = dots ? Array.from(dots.querySelectorAll<HTMLButtonElement>("button")) : [];

  const mark = (i: number) => {
    const changed = i !== active;
    active = i;
    slides.forEach((s, k) => { s.classList.toggle("active", k === i); s.tabIndex = k === i ? 0 : -1; s.setAttribute("aria-current", String(k === i)); });
    dotEls.forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
    if (o.storageKey) try { localStorage.setItem(o.storageKey, String(i)); } catch { /* sin almacenamiento */ }
    if (changed) o.onChange?.(i);
  };
  const goTo = (i: number, smooth = true) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: centerOf(slides[i]), behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    mark(i);
  };
  const nearest = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, d = Infinity;
    slides.forEach((s, k) => { const dd = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (dd < d) { d = dd; best = k; } });
    return best;
  };

  let raf = 0;
  track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const n = nearest(); if (n !== active) mark(n); }); }, { passive: true });

  let dragged = false;
  track.addEventListener("click", (e) => {
    const s = (e.target as HTMLElement).closest<HTMLElement>(".car-track > *");
    if (!s) return;
    const i = slides.indexOf(s);
    if (dragged || i !== active) { e.preventDefault(); e.stopImmediatePropagation(); if (!dragged) goTo(i); }
    dragged = false;
  }, true);

  let down: { x: number; left: number } | null = null;
  track.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = { x: e.clientX, left: track.scrollLeft }; dragged = false; });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = (e.clientX - down.x) / scale();
    if (!dragged && Math.abs(dx) > 6) { dragged = true; track.classList.add("dragging"); }
    if (dragged) track.scrollLeft = down.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!down) return;
    down = null;
    if (dragged) { track.classList.remove("dragging"); goTo(nearest()); }
  });

  root.querySelector(".car-prev")?.addEventListener("click", () => goTo(active - 1));
  root.querySelector(".car-next")?.addEventListener("click", () => goTo(active + 1));
  dots?.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>("[data-i]"); if (b) goTo(+b.dataset.i!); });
  if (o.keys) document.addEventListener("keydown", (e) => {
    if (!root.isConnected || !o.keys!() || (e.target as HTMLElement).closest?.("input, textarea, select, [role=dialog]")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
  });

  let saved = 0;
  if (o.storageKey) try { saved = +(localStorage.getItem(o.storageKey) || 0) || 0; } catch { /* nada */ }
  const recenter = () => goTo(active, false);
  window.addEventListener("resize", () => { if (root.isConnected) recenter(); });
  active = -1;
  requestAnimationFrame(() => goTo(Math.min(saved, slides.length - 1), false));
  mark(Math.min(saved, slides.length - 1));
  return { goTo, recenter, get active() { return active; } };
}
