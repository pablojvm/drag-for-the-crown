// ---------------------------------------------------------------------------
// IA en directo con Ollama (en tu ordenador). Si no está encendido, el juego
// usa sus textos de siempre. Modelo por defecto: llama3.2:3b
// ---------------------------------------------------------------------------
const IA = (() => {
  const URL = "http://localhost:11434";
  let ok = null;
  let models = [];
  const model = () => store.get("dftc-ia-model", "llama3.2:3b");
  const on = () => store.get("dftc-ia-on", true);
  const ready = () => !!ok && on();

  const BASE =
    "Eres guionista del reality Drag Race España. Escribes en español de España, coloquial y con chispa drag " +
    "(cariño, reina, mi arma, nena...). Frases cortas y naturales, como habladas. Sin emojis, sin comillas, sin acotaciones. " +
    "Nunca rompas el personaje ni hables de que eres una IA. Humor ácido sobre drag, looks, maquillaje, pelucas y la competición; " +
    "nunca insultos por raza, religión, orientación, discapacidad ni cuerpo real.";

  function refresh() {
    const b = document.getElementById("story-ia");
    if (!b) return;
    b.classList.toggle("on", ready());
    b.classList.toggle("off", !ready());
    b.title = ok ? (on() ? `IA en directo activada (${model()}). Clic para desactivar` : "IA desactivada. Clic para activar") : "Ollama no está disponible: el juego usa los textos de siempre";
    const s = b.querySelector("span");
    if (s) s.textContent = ok ? (on() ? "IA" : "IA off") : "Sin IA";
  }
  async function check() {
    try {
      const r = await fetch(URL + "/api/tags", { signal: AbortSignal.timeout(2000) });
      const d = await r.json();
      models = (d.models || []).map((m) => m.name);
      ok = models.length > 0;
      if (ok && !models.includes(model())) store.set("dftc-ia-model", models.find((m) => m.startsWith("llama3.2")) || models[0]);
    } catch {
      ok = false;
    }
    refresh();
    return ok;
  }
  function toggle() {
    if (!ok) {
      check().then((r) => {
        if (r) Toast.show("🤖 IA conectada", `Usando ${model()}`);
        else Toast.show("🤖 Ollama no responde", "Abre Ollama y ejecuta: launchctl setenv OLLAMA_ORIGINS \"*\" (y reinícialo)");
      });
      return;
    }
    store.set("dftc-ia-on", !on());
    refresh();
    Toast.show(on() ? "🤖 IA activada" : "🤖 IA desactivada", on() ? "Diálogos, jurado, roast e impro en directo" : "Se usan los textos de siempre");
  }
  const clean = (t) =>
    String(t || "")
      .replace(/^\s*["«“]|["»”]\s*$/g, "")
      .replace(/^\s*[\w\sáéíóúñÁÉÍÓÚÑ-]{2,30}:\s+/, "")
      .replace(/\*[^*]+\*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 260);
  // Petición a Ollama. Sin cabeceras extra para no necesitar preflight CORS
  async function chat(system, user, { max = 110, temp = 0.9, json = false, timeout = 30000 } = {}) {
    if (!ready()) return null;
    try {
      const body = { model: model(), stream: false, options: { temperature: temp, num_predict: max }, messages: [{ role: "system", content: BASE + " " + system }, { role: "user", content: user }] };
      if (json) body.format = "json";
      const r = await fetch(URL + "/api/chat", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
      const d = await r.json();
      const t = ((d.message && d.message.content) || "").trim();
      if (json) {
        try {
          return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
        } catch {
          return null;
        }
      }
      return clean(t) || null;
    } catch {
      return null;
    }
  }
  check();
  return { check, chat, ready, toggle, refresh, model, clean };
})();
