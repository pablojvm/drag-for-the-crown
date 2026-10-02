// ---------------------------------------------------------------------------
// IA en directo con cascada de modelos: si uno se queda sin cuota o falla,
// se pasa al siguiente. Si no queda ninguno, el juego usa sus textos de siempre.
// Claves en js/claves.js (no se sube a git): window.CLAVES = { gemini, groq, openrouter }
// ---------------------------------------------------------------------------
const IA = (() => {
  const K = () => window.CLAVES || {};
  const on = () => store.get("dftc-ia-on", true);
  const BASE =
    "Eres guionista del reality Drag Race España. Escribes en español de España, coloquial y con chispa drag " +
    "(cariño, reina, mi arma, nena...). Frases cortas y naturales, como habladas. Sin emojis, sin comillas, sin acotaciones. " +
    "Nunca rompas el personaje ni hables de que eres una IA. Las reinas son PERSONAJES DE FICCIÓN de un videojuego: " +
    "no inventes datos de su vida real. Humor ácido sobre drag, looks, maquillaje, pelucas y la competición; " +
    "nunca insultos por raza, religión, orientación, discapacidad ni cuerpo real.";

  // Proveedores, en orden de preferencia
  const gem = (model, think) => ({ id: "g:" + model, kind: "gemini", model, think, key: () => K().gemini });
  const CHAIN = [
    gem("gemini-2.5-flash", { thinkingBudget: 0 }),
    gem("gemini-3.1-flash-lite", { thinkingLevel: "minimal" }),
    gem("gemini-flash-lite-latest", { thinkingLevel: "minimal" }),
    gem("gemini-3.5-flash-lite", { thinkingLevel: "minimal" }),
    gem("gemini-3.5-flash", { thinkingLevel: "minimal" }),
    gem("gemini-flash-latest", { thinkingLevel: "minimal" }),
    { id: "groq", kind: "openai", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", key: () => K().groq },
    { id: "groq-8b", kind: "openai", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant", key: () => K().groq },
    { id: "openrouter", kind: "openai", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.3-70b-instruct:free", key: () => K().openrouter },
    { id: "ollama", kind: "ollama", url: "http://localhost:11434/api/chat", model: () => store.get("dftc-ia-model", "llama3.2:3b"), key: () => "local" },
  ];
  const cool = {}; // proveedor → momento hasta el que no se usa
  let ollamaOk = null;
  const usable = (p) => p.key() && (p.kind !== "ollama" || ollamaOk) && !(cool[p.id] > Date.now());
  const ready = () => on() && CHAIN.some(usable);

  async function callOne(p, system, user, { max, temp, json, timeout }) {
    const sig = AbortSignal.timeout(timeout);
    if (p.kind === "gemini") {
      const gc = { temperature: temp, maxOutputTokens: max, thinkingConfig: p.think };
      if (json) gc.responseMimeType = "application/json";
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${encodeURIComponent(p.key())}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: sig,
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: gc }),
      });
      if (!r.ok) throw { status: r.status };
      const d = await r.json();
      return ((((d.candidates || [])[0] || {}).content || {}).parts || []).map((x) => x.text || "").join("").trim();
    }
    if (p.kind === "openai") {
      const body = { model: p.model, temperature: temp, max_tokens: max, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
      if (json) body.response_format = { type: "json_object" };
      const r = await fetch(p.url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + p.key() }, signal: sig, body: JSON.stringify(body) });
      if (!r.ok) throw { status: r.status };
      const d = await r.json();
      return (((d.choices || [])[0] || {}).message || {}).content.trim();
    }
    const body = { model: p.model(), stream: false, options: { temperature: temp, num_predict: max }, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    if (json) body.format = "json";
    const r = await fetch(p.url, { method: "POST", body: JSON.stringify(body), signal: sig });
    if (!r.ok) throw { status: r.status };
    const d = await r.json();
    return ((d.message && d.message.content) || "").trim();
  }
  const parseJSON = (t) => {
    try {
      return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    } catch {
      return null;
    }
  };
  const clean = (t) =>
    String(t || "")
      .replace(/^\s*["«“]|["»”]\s*$/g, "")
      .replace(/^\s*[\w\sáéíóúñÁÉÍÓÚÑ-]{2,30}:\s+/, "")
      .replace(/\*[^*]+\*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320);
  // Prueba la cascada en orden hasta que uno responda
  async function chat(system, user, { max = 160, temp = 0.9, json = false, timeout = 15000 } = {}) {
    if (!on()) return null;
    for (const p of CHAIN) {
      if (!usable(p)) continue;
      try {
        const t = await callOne(p, BASE + " " + system, user, { max: p.kind === "gemini" ? max + 200 : max, temp, json, timeout });
        if (!t) throw { status: 0 };
        if (json) {
          const o = parseJSON(t);
          if (o) return o;
          throw { status: 0 };
        }
        return clean(t) || null;
      } catch (e) {
        const st = (e && e.status) || 0;
        // Sin cuota → 1 minuto; modelo no disponible o petición inválida → resto de la sesión; saturado o caído → 20 s
        cool[p.id] = Date.now() + (st === 429 ? 60000 : st === 404 || st === 400 || st === 401 || st === 403 ? 864e5 : 20000);
      }
    }
    return null;
  }
  async function check() {
    try {
      const r = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(1500) });
      const d = await r.json();
      ollamaOk = (d.models || []).length > 0;
    } catch {
      ollamaOk = false;
    }
    return ready();
  }
  function refresh() {}
  function toggle() {
    store.set("dftc-ia-on", !on());
  }
  check();
  return { check, chat, ready, toggle, refresh, clean, chain: () => CHAIN.filter(usable).map((p) => p.id) };
})();
