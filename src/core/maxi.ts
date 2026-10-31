// Maxirretos por decisiones: cada reto es una lista de pasos con opciones; cada opción da puntos (0 a 100)
// y a veces depende de un chequeo de atributos. La nota del reto es la media de los puntos.
// Aquí están el motor y los retos clásicos (sin textos en directo); los usa el motor nuevo.
import { ATTR_NAMES, type Attrs, type QAttr } from "./reinas";
import { COMEDIA, ROAST, SNATCH_PERSONAJES, SNATCH_PREGUNTAS, SNATCH_PLANAS } from "./textos";

export interface StepResult { pts?: number; msg?: string; w?: number; /** Cambio de relación con una compañera (por su clave). */ rel?: { key: string; d: number } }
export interface Opt { t: string; d?: string; go: (st: StepsState) => StepResult }
export interface Step { q?: string; sub?: string; opts: Opt[] }
export type StepFn = (st: StepsState) => Step | null;
export interface StepsState { total: number; wsum: number; focus: number; [k: string]: any }
export interface Maxi { tipo: string; title: string; icon: string; meters?: "focus"[]; steps: StepFn[] }
export interface Mate { key: string; name: string }
export interface MaxiCtx { attrs: Attrs; rnd: () => number; mates: Mate[] }

export const newSteps = (): StepsState => ({ total: 0, wsum: 0, focus: 50 });
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Chequeo de atributos: la probabilidad sube con la media de los atributos frente a la dificultad. */
export function check(attrs: Attrs, keys: QAttr[], diff: number, roll: number) {
  const v = (keys.reduce((a, k) => a + attrs[k], 0) / keys.length) * 10;
  const p = clamp(0.5 + (v - diff) / 70, 0.08, 0.95);
  const ok = roll < p;
  return { ok, txt: `🎲 ${keys.map((k) => ATTR_NAMES[k]).join(" + ")} → ${ok ? "✅ te sale" : "❌ no te sale"}` };
}
/** Aplica lo que devuelve una opción. */
export function applyPick(st: StepsState, r: StepResult) {
  if (typeof r.pts === "number") {
    const w = r.w === undefined ? 1 : r.w;
    st.total += clamp(r.pts, 0, 100) * w;
    st.wsum += w;
  }
}
export const stepsScore = (st: StepsState) => clamp(st.wsum ? st.total / st.wsum : 50, 0, 100);

// ---------- Retos clásicos ----------
function kit(c: MaxiCtx) {
  const pick = <T,>(a: T[]) => a[Math.floor(c.rnd() * a.length)];
  const shuffle = <T,>(a: T[]) => a.map((v) => [c.rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const chk = (keys: QAttr[], diff: number) => check(c.attrs, keys, diff, c.rnd());
  const res = (r: { ok: boolean; txt: string }, okPts: number, koPts: number, okMsg: string, koMsg: string): StepResult => ({ pts: r.ok ? okPts : koPts, msg: `${r.txt}\n${r.ok ? okMsg : koMsg}` });
  return { pick, shuffle, chk, res };
}

export function snatch(c: MaxiCtx): Maxi {
  const { pick, shuffle, chk, res } = kit(c);
  const chars = shuffle(SNATCH_PERSONAJES).slice(0, 3);
  const qs = shuffle(SNATCH_PREGUNTAS).slice(0, 5);
  // En el plató cada rival es su personaje: se la nombra así, nunca por su nombre drag
  const rc = (st: StepsState, r: Mate) => {
    st.rc = st.rc || {};
    if (!st.rc[r.key]) {
      const taken = [st.char, ...Object.values(st.rc)];
      st.rc[r.key] = shuffle(SNATCH_PERSONAJES).find((x) => !taken.includes(x)) || pick(SNATCH_PERSONAJES);
    }
    return st.rc[r.key].name as string;
  };
  const steps: StepFn[] = [() => ({ q: "🎭 ¿A quién imitas?", sub: "Elige tu personaje para el plató de Supremme.", opts: chars.map((ch) => ({ t: `${ch.icon} ${ch.name}`, d: `Tono ${ch.tono}`, go: (st) => ((st.char = ch), {}) })) })];
  qs.forEach((qq, n) => {
    if (n > 0 && c.rnd() < 0.45)
      steps.push((st) => {
        const r = pick(c.mates);
        return {
          q: `😶 ${rc(st, r)} se queda en blanco...`,
          sub: "Hay un silencio incómodo en el plató. ¿Aprovechas?",
          opts: [
            { t: "🎯 Robar la atención y rematar el chiste", d: "Comedia + Carisma", go: (s) => { s.focus += 18; const k = chk(["comedia", "carisma"], 58); return { ...res(k, 100, 22, "¡Remate perfecto! Te llevas la risa.", "Intentas rematar... y la pisas. Nadie se ríe."), rel: k.ok ? { key: r.key, d: -1 } : undefined }; } },
            { t: "🤫 Dejarla respirar", d: "Sin riesgo", go: (s) => { s.focus -= 6; return { pts: 55, msg: "Discreta. Nadie se fija en ti." }; } },
          ],
        };
      });
    steps.push((st) => {
      const r = pick(c.mates);
      const ch = st.char || chars[0];
      return {
        q: `🎤 Supremme: «${qq}»`,
        sub: `Eres ${ch.name}. Pregunta ${n + 1}/5.`,
        opts: [
          { t: `😂 «${pick(ch.frases as string[])}»`, d: "Comedia absurda", go: (s) => { s.focus += 14; return res(chk(["comedia"], 52), 90, 30, "¡Carcajada general!", "Nadie lo pilla. Grillos."); } },
          { t: `⚡ Replicar a ${rc(st, r)}`, d: "Carisma · sube mucho el foco y crea drama", go: (s) => { s.focus += 24; s.drama = (s.drama || 0) + 1; return { ...res(chk(["carisma"], 55), 94, 34, `¡Le has dado un zasca a ${rc(st, r)} y el plató explota!`, "La réplica suena a ataque. Mala cara en el jurado."), rel: { key: r.key, d: -1 } }; } },
          { t: `🛡️ «${pick(SNATCH_PLANAS)}»`, d: "Respuesta segura", go: (s) => { s.focus -= 12; return { pts: 48, msg: "Correcta. Poco memorable." }; } },
        ],
      };
    });
    // El foco se gestiona tras cada pregunta: ni acaparar ni desaparecer
    steps.push((st) => {
      st.focus -= 6;
      if (st.focus > 80 || st.focus < 30) {
        st.total += 25 * 0.5;
        st.wsum += 0.5;
        st.note = st.focus > 80 ? "🔦 ¡Estás interrumpiendo! Le quitas el plano a las demás" : "🔦 Pasas desapercibida: nadie se acuerda de ti";
      }
      st.focus = clamp(st.focus, 0, 100);
      return null;
    });
  });
  return { tipo: "snatch", title: "Snatch Game", icon: "🎭", meters: ["focus"], steps };
}

export function roast(c: MaxiCtx): Maxi {
  const { pick, shuffle, chk, res } = kit(c);
  const T: Record<string, { t: string; d: string; diff: number; cap: number }> = { jurado: { t: "⚖️ Al jurado", d: "Alto riesgo, alta recompensa", diff: 62, cap: 100 }, comp: { t: "👯 A las compañeras", d: "Crea drama", diff: 55, cap: 96 }, auto: { t: "🪞 A ti misma", d: "Autohumor: seguro, con techo", diff: 42, cap: 82 } };
  const bank = shuffle([...ROAST, ...COMEDIA]).slice(0, 4);
  const steps: StepFn[] = [
    () => ({ q: "🎯 ¿Quién es la diana de tus chistes?", opts: Object.entries(T).map(([k, v]) => ({ t: v.t, d: v.d, go: (s) => ((s.target = k), {}) })) }),
    ...bank.map(([setup, [best, mid, flat]], n): StepFn => (st) => {
      const tg = T[st.target || "comp"];
      return {
        q: `🎙️ Chiste ${n + 1}/4: ${setup}`,
        sub: "¿Cuánta caña le das al remate?",
        opts: [
          { t: `🍬 Suave: «${flat}»`, d: "No falla, pero no da risa", go: () => ({ pts: 52, msg: "Risas educadas." }) },
          { t: `🌶️ Picante: «${mid}»`, d: "Comedia", go: () => res(chk(["comedia"], tg.diff - 8), Math.min(tg.cap, 86), 28, "¡Buena risa!", "Tibio. Se oye toser a alguien.") },
          { t: `💣 Salvaje: «${best}»`, d: "Comedia · si falla, silencio incómodo", go: () => { const k = chk(["comedia"], tg.diff + 10); return { ...res(k, tg.cap, 5, "¡El público llora de risa!", "🥶 Silencio incómodo..."), rel: st.target === "comp" && k.ok && c.mates.length ? { key: pick(c.mates).key, d: -1 } : undefined }; } },
        ],
      };
    }),
  ];
  return { tipo: "roast", title: "El Roast (rapapolvos)", icon: "🔥", steps };
}

export function makeover(c: MaxiCtx): Maxi {
  const { pick, chk, res } = kit(c);
  const who = pick(["Tu madre", "Tu hermana", "Tu mejor amiga"]);
  const MODELS = [
    { d: "Con muchísimas ganas, aunque delante de la cámara se corta un poco. Espalda ancha", comfort: "baja", body: "grande" },
    { d: "Ilusionadísima, pero nunca se ha subido a unos tacones. Espalda ancha", comfort: "media", body: "grande" },
    { d: "Se deja hacer de todo y lo está deseando. Cuerpo menudo", comfort: "alta", body: "menudo" },
    { d: "Viene a comerse el escenario. Muy bajita", comfort: "alta", body: "menudo" },
  ];
  const model = { ...pick(MODELS), n: who };
  const steps: StepFn[] = [
    () => ({
      q: `👥 Tu modelo: ${model.n}`,
      sub: `${model.d}. Tu Maquillaje: ${c.attrs.maquillaje}. ¿Cómo adaptas tu maquillaje?`,
      opts: [
        { t: "🪞 Copia exacta de mi cara", d: "Máximo parecido", go: () => (model.comfort === "alta" ? { pts: 94, msg: "¡Sois dos gotas de agua!" } : { pts: 42, msg: "Tanta pintura le pesa y se le nota en la cara." }) },
        { t: "🎨 Mi paleta, adaptada a su cara", d: "Equilibrado", go: () => ({ pts: 78, msg: "Se ve el parecido sin forzar." }) },
        { t: "🌸 Suavizado: que brille ella", d: "Para quien se corta ante la cámara", go: () => (model.comfort === "baja" ? { pts: 92, msg: "Se siente cómoda y le brillan los ojos." } : { pts: 55, msg: "Queda mono, pero no parecéis familia." }) },
      ],
    }),
    () => ({
      q: "👗 La ropa",
      opts: [
        { t: "👯 Looks gemelos", d: "Mismo vestido para las dos", go: () => (model.body === "menudo" ? { pts: 90, msg: "Parecéis muñecas rusas. ¡Precioso!" } : { pts: 45, msg: "El vestido le queda... raro." }) },
        { t: "🎨 Misma paleta, distinto corte", d: "Adaptado a su cuerpo", go: () => ({ pts: model.body === "grande" ? 92 : 76, msg: "Familia, pero cada una con su silueta." }) },
        { t: "🙈 Que lleve algo discreto", d: "No le opacas... ni se os parece", go: () => ({ pts: 40, msg: "¿Seguro que sois familia?" }) },
      ],
    }),
    () => ({
      q: "🎤 Presentación en pareja en la pasarela",
      opts: [
        { t: "💃 Coreografía juntas", d: "Maquillaje + Carisma", go: () => res(chk(["maquillaje", "carisma"], 55), 96, 35, "¡Family resemblance total!", "Os descoordináis.") },
        { t: "🫶 Dejar que se luzca", d: "Carisma", go: () => res(chk(["carisma"], 48), 85, 45, "El público se enamora de tu invitada.", "Le pueden los nervios y se queda quieta.") },
      ],
    }),
  ];
  return { tipo: "makeover", title: `Makeover: ${model.n}`, icon: "💄", steps };
}

export function impro(c: MaxiCtx): Maxi {
  const { shuffle, chk, res } = kit(c);
  const COMUNES = ["Se cae un decorado detrás de ti.", "La regidora te hace señas de que te quedan 10 segundos.", "Se va la luz del plató tres segundos."];
  const POR_SEC: Record<string, string[]> = {
    noticias: ["El teleprompter se apaga en mitad de la noticia.", "Te pasan una noticia de última hora escrita a boli."],
    entrevista: ["La invitada solo contesta con monosílabos.", "La invitada se levanta y se va del plató."],
    teletienda: ["El producto se rompe en directo.", "Entra una llamada en directo de una clienta muy enfadada."],
  };
  const evFor = (s: StepsState): string[] => (s.evs = s.evs || shuffle([...(POR_SEC[s.sec] || []), ...COMUNES]).slice(0, 4));
  const steps: StepFn[] = [
    () => ({
      q: "📺 ¿Qué sección del programa conduces?",
      opts: [
        { t: "🗞️ Noticias", d: "Seriedad con retranca", go: (s) => ((s.sec = "noticias"), {}) },
        { t: "🎙️ Entrevista", d: "Todo depende del invitado", go: (s) => ((s.sec = "entrevista"), {}) },
        { t: "🛒 Teletienda", d: "Vendes lo que te pongan delante", go: (s) => ((s.sec = "teletienda"), {}) },
      ],
    }),
    ...[0, 1, 2, 3].map((n): StepFn => (s) => ({
      q: `🔴 En directo · imprevisto ${n + 1}/4`,
      sub: evFor(s)[n],
      opts: [
        { t: "😂 Aceptar el caos y hacer broma", d: "Comedia", go: () => res(chk(["comedia"], 52), 90, 35, "¡Lo conviertes en el mejor momento del programa!", "La broma no llega.") },
        { t: "💎 Recomponerse con elegancia", d: "Carisma", go: () => res(chk(["carisma"], 50), 86, 40, "Profesional como una presentadora de toda la vida.", "Se te nota el apuro.") },
      ],
    })),
  ];
  return { tipo: "impro", title: "Improvisación en directo", icon: "📺", steps };
}

export function publicidad(c: MaxiCtx): Maxi {
  const { shuffle, chk, res } = kit(c);
  const P: Record<string, { t: string; slogans: string[] }> = {
    perfume: { t: "💎 Perfume absurdamente caro", slogans: ["«Huele a dinero que no tienes»", "«Un perfume muy bueno»", "«Fragancia con notas de... cosas»"] },
    aparato: { t: "🔌 Aparato inútil", slogans: ["«Para lo que nunca te hizo falta»", "«Es un aparato que hace cosas»", "«Cómpralo, está bien»"] },
    bebida: { t: "🍹 Bebida extravagante", slogans: ["«Burbujas, purpurina y cero arrepentimiento»", "«Una bebida con sabor»", "«Se puede beber»"] },
  };
  const steps: StepFn[] = [
    () => ({ q: "💡 Diseña tu producto", opts: Object.entries(P).map(([k, v]) => ({ t: v.t, go: (s) => ((s.prod = k), {}) })) }),
    (st) => {
      const p = P[st.prod || "perfume"];
      return { q: "📣 Elige el eslogan", sub: "Se valora lo camp.", opts: shuffle<Opt>([{ t: p.slogans[0], go: () => ({ pts: 95, msg: "¡Eso es camp puro!" }) }, { t: p.slogans[1], go: () => ({ pts: 45, msg: "Correcto. Aburrido." }) }, { t: p.slogans[2], go: () => ({ pts: 25, msg: "El director de marketing llora." }) }]) };
    },
    () => ({
      q: "🎬 Grabación del anuncio: toma 1",
      opts: [
        { t: "🧠 Decirlo de memoria", d: "Carisma", go: () => res(chk(["carisma"], 55), 92, 30, "Ni una trabada. ¡Toma buena!", "Te trabas tres veces...") },
        { t: "📋 Leer el cartón", d: "Seguro", go: () => ({ pts: 60, msg: "Se nota que lees, pero sale." }) },
      ],
    }),
    () => ({
      q: "🎬 Toma 2: el remate",
      opts: [
        { t: "🌟 Guiño a cámara exagerado", d: "Camp · Carisma", go: () => res(chk(["carisma"], 50), 94, 40, "¡Campísimo!", "Parece un tic.") },
        { t: "🤪 Improvisar un chiste final", d: "Comedia", go: () => res(chk(["comedia"], 55), 96, 30, "¡El equipo técnico se ríe!", "Nadie lo entiende.") },
        { t: "🙂 Sonrisa y fuera", d: "Seguro", go: () => ({ pts: 55, msg: "Correcto." }) },
      ],
    }),
  ];
  return { tipo: "publicidad", title: "Publicidad: el anuncio falso", icon: "📺", steps };
}

export function actuacion(c: MaxiCtx): Maxi {
  const { pick, chk, res } = kit(c);
  const GENEROS: Record<string, [[string, string], string[]]> = {
    telenovela: [["telenovela", "sobre"], ["«¡Tú no eres mi madre! ¡Mi madre es la de la peluca rubia!»", "«Esta herencia es mía, y el cortijo también.»", "«No me mires así, que me derrito como un helado en agosto.»"]],
    teletienda: [["anuncio de teletienda", "sobre"], ["«¡Llame ya! Solo hoy, dos por uno!»", "«¿Que se le corre el rímel? ¡Con esto, nunca más!»", "«Y si llama en los próximos diez minutos... ¡le regalamos otro!»"]],
    serie: [["parodia de serie juvenil", "absurdo"], ["«¿Que me has dejado por mensaje? ¿En el recreo?»", "«Esta fiesta va a ser la mejor de todo el instituto.»", "«No es lo que parece. Bueno, sí. Pero no.»"]],
  };
  const [genero, beats] = GENEROS[pick(Object.keys(GENEROS))];
  const partner = pick(c.mates);
  const INT: [string, string][] = [["sobre", "🎭 Sobreactuado"], ["drama", "😢 Dramático"], ["absurdo", "🤪 Absurdo"]];
  const steps: StepFn[] = beats.map((b, n): StepFn => () => ({
    q: `🎬 Escena ${n + 1}: ${b}`,
    sub: `Es ${/^(telenovela|parodia)/.test(genero[0]) ? "una" : "un"} ${genero[0]}. ¿Con qué intención lo dices?`,
    opts: INT.map(([k, t]) => ({ t, go: () => (k === genero[1] || (n === 2 && k === "absurdo") ? { pts: 90 + c.attrs.carisma, msg: "¡Corten! Toma buena." } : { pts: 48, msg: "La directora frunce el ceño." }) })),
  }));
  steps.splice(2, 0, () => ({
    q: `😶 ${partner.name} olvida su frase en mitad de la toma`,
    opts: [
      { t: "💡 Salvar la escena improvisando", d: "Carisma + Comedia", go: () => { const k = chk(["carisma", "comedia"], 55); return { ...res(k, 100, 28, "¡Lo que has improvisado es mejor que el guion!", "Te lías tú también. Escena perdida."), rel: k.ok ? { key: partner.key, d: 1 } : undefined }; } },
      { t: "📜 Mantener el guion", d: "Neutro", go: () => ({ pts: 58, msg: "Esperas... y seguís. Correcto." }) },
    ],
  }));
  return { tipo: "actuacion", title: `Reto de interpretación: ${genero[0]}`, icon: "🎬", steps };
}

/** Retos del motor nuevo, con los atributos que cuentan en cada uno. */
export const MAXI: Record<string, { titulo: string; attrs: QAttr[]; make: (c: MaxiCtx) => Maxi }> = {
  snatch: { titulo: "Snatch Game", attrs: ["comedia", "carisma"], make: snatch },
  roast: { titulo: "El roast de Supremme", attrs: ["comedia"], make: roast },
  impro: { titulo: "Improvisación: presentadoras en directo", attrs: ["comedia", "carisma"], make: impro },
  makeover: { titulo: "Makeover: tu familia drag", attrs: ["maquillaje", "carisma"], make: makeover },
  publicidad: { titulo: "Publicidad: el anuncio falso", attrs: ["carisma", "comedia"], make: publicidad },
  actuacion: { titulo: "Reto de interpretación", attrs: ["carisma", "comedia"], make: actuacion },
};
