// ---------------------------------------------------------------------------
// Muñeca drag en SVG: se viste por piezas (look, peluca, accesorio/maquillaje)
// para que el estilismo y la pasarela se vean de verdad.
// ---------------------------------------------------------------------------
const Doll = (() => {
  let uid = 0;
  const SKINS = ["#f6d3b3", "#e9b995", "#d39a72", "#b27650", "#8a5436", "#f3c9a8"];
  const shade = (hex, f) => {
    const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const k = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return `rgb(${k(r)},${k(g)},${k(b)})`;
  };
  const skinOf = (id) => {
    let h = 0;
    for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return SKINS[h % SKINS.length];
  };

  // Traduce una pieza del armario a su forma visual
  function visualOf(it, slot) {
    const n = (it.n || "").toLowerCase();
    const has = (...w) => w.some((x) => n.includes(x));
    const pat = has("lentejuela", "cristal", "pedrería", "purpurina", "brilla") ? "sequins" : has("leopardo") ? "leopard" : has("bicolor", "esmoquin", "blanco y negro", "gráfico") ? "stripes" : has("flores", "flor") ? "flowers" : has("látex", "plateado", "espejo", "neón", "cromo") ? "metal" : "solid";
    if (slot === "look") {
      const shape = has("flamenca") ? "flamenca" : has("hombreras", "esmoquin") ? "suit" : has("mono", "chándal") ? "jumpsuit" : has("capa") ? "cape" : has("body") ? "bodysuit" : has("gala", "cola") ? "mermaid" : has("traje de cristales") ? "mini" : "gown";
      return { shape, pat, color: it.c };
    }
    if (slot === "peluca") {
      const style = has("cardado", "rizos", "afro") ? "big" : has("moño", "peineta") ? "bun" : has("bob") ? "bob" : has("coleta", "tupé") ? "updo" : has("corona de flores") ? "flowers" : has("pixie") ? "pixie" : "long";
      return { style, color: it.c };
    }
    // accesorio o maquillaje
    if (has("maquillaje", "ojo", "cara", "pestañas", "lunar", "piercing")) return { makeup: it.c, acc: has("piercing") ? "piercing" : has("lunar") ? "lunar" : null };
    const acc = has("abanico") ? "fan" : has("corona") ? "crown" : has("gafas") ? "glasses" : has("aro") ? "hoops" : has("guantes") ? "gloves" : has("ramo") ? "bouquet" : has("perlas", "collar") ? "pearls" : has("bolso") ? "bag" : has("mantón") ? "shawl" : has("riñonera") ? "belt" : "hoops";
    return { acc, color: it.c };
  }

  function defs(id, color, pat) {
    const c = color || "#ff3d9a";
    const light = shade(c, 0.45), dark = shade(c, -0.45);
    let p = "";
    if (pat === "sequins")
      p = `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${c}"/><circle cx="2" cy="2" r="1.6" fill="${light}"/><circle cx="6" cy="6" r="1.6" fill="${light}" opacity=".7"/><circle cx="6" cy="2" r=".9" fill="#fff" opacity=".8"/></pattern>`;
    else if (pat === "leopard")
      p = `<pattern id="${id}" width="18" height="16" patternUnits="userSpaceOnUse"><rect width="18" height="16" fill="${c}"/><path d="M3 4 q2 -3 4 0 q-2 3 -4 0z M11 10 q3 -3 5 0 q-2 4 -5 0z M12 2 q1 -1 2 0 q-1 2 -2 0z" fill="#2a1a10"/></pattern>`;
    else if (pat === "stripes")
      p = `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(90)"><rect width="10" height="10" fill="#f7f3ee"/><rect width="5" height="10" fill="#1b1b1b"/></pattern>`;
    else if (pat === "flowers")
      p = `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${c}"/><g fill="#fff" opacity=".9"><circle cx="5" cy="5" r="2"/><circle cx="8" cy="5" r="2"/><circle cx="6.5" cy="2.5" r="2"/><circle cx="6.5" cy="7.5" r="2"/></g><circle cx="6.5" cy="5" r="1.4" fill="#ffd34d"/><g fill="${dark}"><circle cx="15" cy="15" r="1.8"/><circle cx="17.5" cy="15" r="1.8"/><circle cx="16" cy="12.8" r="1.8"/></g></pattern>`;
    else if (pat === "metal")
      p = `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${light}"/><stop offset=".55" stop-color="${c}"/><stop offset=".8" stop-color="${dark}"/><stop offset="1" stop-color="${light}"/></linearGradient>`;
    else p = `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.25)}"/></linearGradient>`;
    return p;
  }

  // spec: { skin, look:{shape,pat,color}, wig:{style,color}, extra:{acc,color,makeup} , ghost }
  function svg(spec = {}, opts = {}) {
    const id = `d${++uid}`;
    const skin = spec.skin || "#e9b995";
    const skD = shade(skin, -0.2);
    const look = spec.look;
    const wig = spec.wig || { style: "long", color: "#3a2418" };
    const ex = spec.extra || {};
    const fill = look ? `url(#${id}f)` : "#ffffff";
    const W = wig.color || "#3a2418", Wd = shade(W, -0.35), Wl = shade(W, 0.3);
    const mk = ex.makeup || "#b14bd6";
    let back = "", body = "", out = "", front = "", acc = "";
    // Pelo por detrás
    if (wig.style === "long") back += `<path d="M72 56 Q70 20 100 18 Q130 20 128 56 L136 150 Q100 162 64 150 Z" fill="${W}"/>`;
    if (wig.style === "big") back += `<g fill="${W}"><circle cx="100" cy="46" r="40"/><circle cx="66" cy="70" r="24"/><circle cx="134" cy="70" r="24"/><circle cx="74" cy="30" r="20"/><circle cx="126" cy="30" r="20"/></g>`;
    if (look && look.shape === "cape") back += `<path d="M66 100 L134 100 L176 428 Q100 440 24 428 Z" fill="${shade(look.color, -0.35)}"/><path d="M66 100 L134 100 L176 428 Q100 440 24 428 Z" fill="url(#${id}f)" opacity=".55"/>`;
    // Cuerpo
    body += `<g stroke="${skin}" stroke-linecap="round" fill="none"><path d="M90 206 L86 402" stroke-width="12"/><path d="M110 206 L114 402" stroke-width="12"/><path d="M74 106 Q60 150 58 196" stroke-width="10"/><path d="M126 106 Q146 140 124 172" stroke-width="10"/></g>`;
    body += `<rect x="93" y="80" width="14" height="20" rx="5" fill="${skin}"/><path d="M72 102 Q100 92 128 102 L122 172 Q100 178 78 172 Z M78 170 L122 170 L126 210 Q100 218 74 210 Z" fill="${skin}"/>`;
    // Zapatos
    body += `<g fill="${shade(look ? look.color : "#222", -0.5)}"><path d="M78 400 l16 0 l2 10 l-20 0z"/><path d="M106 400 l16 0 l2 10 l-20 0z"/><rect x="92" y="404" width="3" height="8"/><rect x="120" y="404" width="3" height="8"/></g>`;
    // Ropa
    const bod = `<path d="M70 100 Q100 90 130 100 L122 172 Q100 179 78 172 Z" fill="${fill}"/>`;
    if (look) {
      const s = look.shape;
      if (s === "gown") out = `<path d="M78 168 Q100 176 122 168 L166 420 Q100 434 34 420 Z" fill="${fill}"/>${bod}`;
      else if (s === "mermaid") out = `<path d="M78 168 L122 168 L118 330 L156 420 Q100 432 44 420 L82 330 Z" fill="${fill}"/>${bod}`;
      else if (s === "mini") out = `<path d="M78 168 L122 168 L136 266 Q100 276 64 266 Z" fill="${fill}"/>${bod}`;
      else if (s === "jumpsuit") out = `<path d="M78 168 L122 168 L128 408 L104 408 L100 246 L96 408 L72 408 Z" fill="${fill}"/>${bod}`;
      else if (s === "suit") out = `<path d="M78 200 L122 200 L126 408 L104 408 L100 250 L96 408 L74 408 Z" fill="${shade(look.color, -0.3)}"/><path d="M62 98 L138 98 L130 222 L70 222 Z" fill="${fill}"/><path d="M100 104 L88 150 M100 104 L112 150" stroke="${shade(look.color, -0.5)}" stroke-width="3"/><path d="M58 96 q12 -10 18 4 M142 96 q-12 -10 -18 4" fill="${fill}"/>`;
      else if (s === "bodysuit" || s === "cape") out = `<path d="M70 100 Q100 90 130 100 L126 208 L108 226 L92 226 L74 208 Z" fill="${fill}"/>`;
      else if (s === "flamenca") {
        out = `<path d="M76 100 Q100 90 124 100 L122 240 Q100 248 78 240 Z" fill="${fill}"/>`;
        [0, 1, 2].forEach((k) => {
          const y = 236 + k * 58, w0 = 26 + k * 18, w1 = 44 + k * 22;
          out += `<path d="M${100 - w0} ${y} L${100 + w0} ${y} L${100 + w1} ${y + 60} Q${100 + w1 / 2} ${y + 72} 100 ${y + 62} Q${100 - w1 / 2} ${y + 72} ${100 - w1} ${y + 60} Z" fill="${fill}" stroke="${shade(look.color, -0.4)}" stroke-width="2"/>`;
        });
      }
    } else out = `<path d="M70 100 Q100 90 130 100 L126 208 L108 226 L92 226 L74 208 Z" fill="#f4eef6" stroke="#d9c9e3" stroke-dasharray="4 3"/>`;
    // Cabeza y cara
    front += `<ellipse cx="100" cy="60" rx="21" ry="25" fill="${skin}"/>`;
    front += `<path d="M86 50 q6 -5 12 0 M102 50 q6 -5 12 0" stroke="#2a1a14" stroke-width="2.2" fill="none"/>`;
    front += `<path d="M85 56 q6 -7 12 0 M103 56 q6 -7 12 0" fill="${mk}" opacity=".85"/>`;
    front += `<ellipse cx="91" cy="58" rx="3" ry="2.2" fill="#1a1016"/><ellipse cx="109" cy="58" rx="3" ry="2.2" fill="#1a1016"/>`;
    front += `<path d="M86 57 l-4 -3 M114 57 l4 -3" stroke="#1a1016" stroke-width="1.5"/>`;
    front += `<circle cx="86" cy="68" r="4" fill="#ff7aa8" opacity=".35"/><circle cx="114" cy="68" r="4" fill="#ff7aa8" opacity=".35"/>`;
    front += `<path d="M93 74 q7 5 14 0 q-7 -3 -14 0z" fill="#c8102e"/>`;
    // Pelo por delante
    if (wig.style === "long") front += `<path d="M78 58 Q76 28 100 26 Q124 28 122 58 Q118 38 100 36 Q84 38 78 58Z" fill="${W}"/>`;
    if (wig.style === "big") front += `<path d="M78 54 Q80 26 100 24 Q120 26 122 54 Q112 36 100 38 Q88 36 78 54Z" fill="${Wl}"/>`;
    if (wig.style === "bob") front += `<path d="M74 72 Q70 22 100 20 Q130 22 126 72 L120 78 Q122 44 100 40 Q78 44 80 78 Z" fill="${W}"/><path d="M80 44 Q100 30 120 44 L120 50 Q100 42 80 50Z" fill="${Wd}"/>`;
    if (wig.style === "pixie") front += `<path d="M78 56 Q74 26 100 24 Q126 26 122 56 Q118 36 104 36 Q92 44 78 56Z" fill="${W}"/>`;
    if (wig.style === "updo") front += `<path d="M80 50 Q76 24 100 22 Q124 24 120 50 Q112 34 100 34 Q88 34 80 50Z" fill="${W}"/><ellipse cx="100" cy="4" rx="22" ry="26" fill="${W}"/><ellipse cx="94" cy="-2" rx="8" ry="14" fill="${Wl}" opacity=".5"/>`;
    if (wig.style === "bun") front += `<path d="M78 52 Q76 26 100 24 Q124 26 122 52 Q112 36 100 36 Q88 36 78 52Z" fill="${W}"/><circle cx="100" cy="16" r="14" fill="${W}"/><path d="M76 10 Q100 -14 124 10 Q100 0 76 10Z" fill="#c9a24a"/>`;
    if (wig.style === "flowers") front += `<path d="M78 56 Q76 28 100 26 Q124 28 122 56 Q118 38 100 36 Q84 38 78 56Z" fill="${W}"/>` + [0, 1, 2, 3, 4, 5, 6].map((k) => `<circle cx="${78 + k * 7.3}" cy="${34 - Math.sin((k / 6) * Math.PI) * 10}" r="5" fill="${["#ff5fa2", "#ffd34d", "#ff9ec7", "#fff"][k % 4]}"/>`).join("");
    // Accesorios
    const a = ex.acc, ac = ex.color || "#ffd34d";
    if (a === "crown") acc += `<path d="M80 30 L84 10 L92 24 L100 6 L108 24 L116 10 L120 30 Z" fill="#ffd34d" stroke="#b8860b" stroke-width="1.5"/><circle cx="100" cy="18" r="3" fill="#ff3d9a"/>`;
    if (a === "glasses") acc += `<path d="M78 52 L122 52 L118 64 Q100 66 82 64 Z" fill="${ac}" opacity=".85"/><path d="M78 55 L122 55" stroke="#fff" stroke-width="1.5" opacity=".8"/>`;
    if (a === "hoops") acc += `<circle cx="79" cy="72" r="7" fill="none" stroke="#ffd34d" stroke-width="2.5"/><circle cx="121" cy="72" r="7" fill="none" stroke="#ffd34d" stroke-width="2.5"/>`;
    if (a === "pearls") acc += `<path d="M86 96 Q100 116 114 96" fill="none" stroke="#fff8ee" stroke-width="5" stroke-dasharray="0.1 6" stroke-linecap="round"/>`;
    if (a === "gloves") acc += `<g stroke="${ac}" stroke-linecap="round" fill="none"><path d="M68 150 Q60 175 58 196" stroke-width="11"/><path d="M140 136 Q146 150 124 172" stroke-width="11"/></g>`;
    if (a === "fan") acc += `<g transform="translate(56 196) rotate(-30)"><path d="M0 0 L-26 -34 A44 44 0 0 1 26 -34 Z" fill="${ac}" stroke="${shade(ac, -0.4)}"/><path d="M0 0 L-13 -40 M0 0 L0 -42 M0 0 L13 -40" stroke="${shade(ac, -0.4)}"/></g>`;
    if (a === "bouquet") acc += `<g transform="translate(58 196)"><rect x="-3" y="-2" width="6" height="22" fill="#3c8d3c"/><circle cx="-8" cy="-6" r="8" fill="#ff5fa2"/><circle cx="8" cy="-6" r="8" fill="#ffd34d"/><circle cx="0" cy="-14" r="8" fill="#ff9ec7"/></g>`;
    if (a === "bag") acc += `<g transform="translate(58 200)"><path d="M-8 -14 Q0 -26 8 -14" stroke="${shade(ac, -0.3)}" stroke-width="2" fill="none"/><rect x="-13" y="-14" width="26" height="20" rx="5" fill="${ac}"/><circle cx="-5" cy="-6" r="1.5" fill="#fff"/><circle cx="4" cy="-2" r="1.5" fill="#fff"/></g>`;
    if (a === "shawl") acc += `<path d="M66 100 Q100 150 134 100 L140 190 Q100 214 60 190 Z" fill="${ac}" opacity=".9"/><path d="M60 190 l-4 16 M72 198 l-2 16 M86 204 l0 16 M100 206 l0 16 M114 204 l0 16 M128 198 l2 16 M140 190 l4 16" stroke="${shade(ac, -0.3)}" stroke-width="2"/>`;
    if (a === "belt") acc += `<rect x="74" y="178" width="52" height="14" rx="6" fill="${ac}"/><rect x="94" y="181" width="12" height="8" rx="2" fill="#222"/>`;
    if (a === "piercing") acc += `<circle cx="112" cy="74" r="2" fill="#ccc"/><circle cx="100" cy="68" r="1.6" fill="#ccc"/>`;
    if (a === "lunar") acc += `<circle cx="112" cy="70" r="1.8" fill="#2a1a14"/>`;
    const glow = opts.glow ? `<ellipse cx="100" cy="418" rx="70" ry="10" fill="${opts.glow}" opacity=".45"/>` : `<ellipse cx="100" cy="418" rx="56" ry="8" fill="#3b0d4f" opacity=".18"/>`;
    return `<svg class="doll ${opts.cls || ""}" viewBox="0 -30 200 460" xmlns="http://www.w3.org/2000/svg"><defs>${defs(id + "f", look && look.color, look && look.pat)}</defs>${glow}<g class="doll-fig">${back}${body}${out}${front}${acc}</g></svg>`;
  }
  return { svg, visualOf, skinOf, shade };
})();
