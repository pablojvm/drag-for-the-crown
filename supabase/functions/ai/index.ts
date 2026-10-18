// Función del servidor: la IA del juego (Gemini Flash) con las claves escondidas y un límite diario.
// Secretos (supabase secrets set ...): GEMINI_API_KEY. Opcionales: GEMINI_MODELS, AI_DAILY_LIMIT, AI_GLOBAL_LIMIT.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MODELS = (Deno.env.get("GEMINI_MODELS") || "gemini-2.5-flash,gemini-flash-lite-latest").split(",").map((s) => s.trim()).filter(Boolean);
const DAILY = Number(Deno.env.get("AI_DAILY_LIMIT") || 150);
const GLOBAL = Number(Deno.env.get("AI_GLOBAL_LIMIT") || 1400);
const KEY = Deno.env.get("GEMINI_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!KEY) return json({ error: "sin clave" }, 503);

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

  for (const model of MODELS) {
    const gc: Record<string, unknown> = { temperature: temp, maxOutputTokens: max + 200, thinkingConfig: { thinkingBudget: 0 } };
    if (body.json) gc.responseMimeType = "application/json";
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(40000),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: gc }),
      });
      if (!r.ok) continue;
      const d = await r.json();
      const text = (d.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("").trim();
      if (text) return json({ text, model, left: Math.max(0, DAILY - mine) });
    } catch { /* siguiente modelo */ }
  }
  return json({ error: "sin respuesta" }, 502);
});
