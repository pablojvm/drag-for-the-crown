// Función del servidor: la IA del juego (Gemini Flash) con las claves escondidas y un límite diario.
// Secretos (supabase secrets set ...): GEMINI_API_KEY. Opcionales: GROQ_API_KEY (respaldo), GEMINI_MODELS, AI_DAILY_LIMIT, AI_GLOBAL_LIMIT.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Varios modelos porque cada uno tiene su propia cuota gratuita diaria
const MODELS = (Deno.env.get("GEMINI_MODELS") || "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest,gemini-flash-latest").split(",").map((s) => s.trim()).filter(Boolean);
const GROQ = Deno.env.get("GROQ_API_KEY") || "";
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const DAILY = Number(Deno.env.get("AI_DAILY_LIMIT") || 150);
const GLOBAL = Number(Deno.env.get("AI_GLOBAL_LIMIT") || 1400);
const KEY = Deno.env.get("GEMINI_API_KEY") || "";
// Modelos sin cuota o que no existen: se saltan un rato (la función vive varios minutos entre llamadas)
const cool = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!KEY && !GROQ) return json({ error: "sin clave" }, 503);

  // Quién llama (anónima o con Google): la verificación del token la hace Supabase antes de llegar aquí
  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") || "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await asUser.auth.getUser();
  if (!u?.user) return json({ error: "auth" }, 401);

  let body: { system?: string; user?: string; max?: number; temp?: number; json?: boolean };
  try { body = await req.json(); } catch { return json({ error: "body" }, 400); }
  const system = String(body.system || "").slice(0, 12000);
  const user = String(body.user || "").slice(0, 16000);
  if (!user) return json({ error: "vacío" }, 400);
  const max = Math.min(Math.max(Number(body.max) || 160, 16), 4000);
  const temp = Math.min(Math.max(Number(body.temp ?? 0.9), 0), 1.5);

  // Cuota: por jugador y día, y un tope global para no pasarse del plan gratuito
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: q, error: qe } = await admin.rpc("ai_take", { p_user: u.user.id, p_limit: DAILY, p_global: GLOBAL });
  if (qe) return json({ error: "cuota" }, 500);
  const mine = Array.isArray(q) ? q[0]?.mine : (q as any)?.mine;
  if (mine === -1 || mine === -2) return json({ error: mine === -2 ? "límite diario" : "límite global" }, 403);

  const fallos: string[] = [];
  const t0 = Date.now();
  const fresh = MODELS.filter((m) => !(cool.get(m)! > Date.now()));
  const models = KEY ? (fresh.length ? fresh : MODELS) : [];
  // Los textos largos (guiones) necesitan más tiempo
  const BUDGET = max > 1000 ? 45000 : 25000, PER = max > 1000 ? 20000 : 9000;
  for (const [i, model] of models.entries()) {
    // Tope total (25 s, o 45 s en textos largos); a cada modelo, una parte salvo al último
    const left = BUDGET - (Date.now() - t0);
    if (left < 2500) break;
    const slice = i === models.length - 1 ? left : Math.min(PER, left);
    // Los 2.5 piensan con thinkingBudget; los nuevos con thinkingLevel
    const think = model.startsWith("gemini-2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "minimal" };
    const gc: Record<string, unknown> = { temperature: temp, maxOutputTokens: max + 200, thinkingConfig: think };
    if (body.json) gc.responseMimeType = "application/json";
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(slice),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: gc }),
      });
      if (!r.ok) {
        if (r.status === 429) cool.set(model, Date.now() + 10 * 60000);
        if (r.status === 404) cool.set(model, Date.now() + 24 * 3600000);
        fallos.push(`${model}: ${r.status} ${(await r.text()).slice(0, 160).replace(/\s+/g, " ")}`);
        continue;
      }
      const d = await r.json();
      const text = (d.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("").trim();
      if (text) return json({ text, model, left: Math.max(0, DAILY - mine) });
      fallos.push(`${model}: vacío (${d.candidates?.[0]?.finishReason || d.promptFeedback?.blockReason || "?"})`);
    } catch (e) { fallos.push(`${model}: ${String(e).slice(0, 80)}`); }
  }
  // Respaldo: Groq (Llama), si hay clave
  for (const model of GROQ ? GROQ_MODELS : []) {
    try {
      const b: Record<string, unknown> = { model, temperature: Math.min(temp, 1), max_tokens: max, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
      if (body.json) b.response_format = { type: "json_object" };
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify(b),
      });
      if (!r.ok) { fallos.push(`${model}: ${r.status}`); continue; }
      const d = await r.json();
      const text = String(d.choices?.[0]?.message?.content || "").trim();
      if (text) return json({ text, model, left: Math.max(0, DAILY - mine) });
    } catch (e) { fallos.push(`${model}: ${String(e).slice(0, 80)}`); }
  }
  console.error("[ai] sin respuesta", fallos.join(" | "));
  // Si todo es falta de cuota, 429 (el juego espera un minuto); si no, 502
  const todo429 = fallos.length > 0 && fallos.every((f) => / 429 /.test(f + " "));
  return json({ error: "sin respuesta", fallos }, todo429 ? 429 : 502);
});
