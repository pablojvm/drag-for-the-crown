// ---------------------------------------------------------------------------
// Reinas de Drag Race España y All Stars España
// ---------------------------------------------------------------------------
// Cada temporada lista su reparto EN ORDEN DE EXPULSIÓN: la primera es la
// primera eliminada y la última es la ganadora (jefa final de la campaña).
//
// Para completar una reina, rellena su ficha en REINAS_ES:
//   foto:    imagen de cuerpo entero SIN FONDO (PNG) -> images/queens/<id>.png
//   retrato: foto para la tarjeta (JPG)              -> images/queens/<id>_retrato.jpg
//   audio:   frase en audio (MP3)                    -> audio/queens/<id>.mp3
//   frase:   texto de su frase icónica
// Pon true en foto/retrato/audio cuando hayas añadido el archivo. Mientras
// tanto, la reina aparece con una silueta provisional.

export interface Temporada { franchise: string; id: string; name: string; year: number; cast: string[]; enEmision?: boolean }
export interface FichaReina { name: string; foto: boolean; retrato: boolean; audio: boolean; frase: string; sprite?: string; portrait?: string }

export const TEMPORADAS_ES: Temporada[] = [
  {
    "franchise": "es",
    "id": "es1",
    "name": "Temporada 1",
    "year": 2021,
    "cast": [
      "the-macarena",
      "drag-vulcano",
      "inti",
      "arantxa-castilla-la-mancha",
      "hugaceo-crujiente",
      "dovima-nurmi",
      "pupi-poisson",
      "sagittaria",
      "killer-queen",
      "carmen-farala"
    ]
  },
  {
    "franchise": "es",
    "id": "es2",
    "name": "Temporada 2",
    "year": 2022,
    "cast": [
      "marisa-prisa",
      "ariel-rec",
      "samantha-ballentines",
      "jota-carajota",
      "onyx",
      "diamante-merybrown",
      "drag-sethlas",
      "juriji-der-klee",
      "marina",
      "estrella-xtravaganza",
      "venedita-von-dash",
      "sharonne"
    ]
  },
  {
    "franchise": "es",
    "id": "es3",
    "name": "Temporada 3",
    "year": 2023,
    "cast": [
      "maria-edilia",
      "drag-chuchi",
      "chanel-anorex",
      "the-macarena",
      "visa",
      "bestiah",
      "pakita",
      "pink-chadora",
      "clover-bish",
      "kelly-roller",
      "hornella-gongora",
      "vania-vainilla",
      "pitita"
    ]
  },
  {
    "franchise": "es",
    "id": "es4",
    "name": "Temporada 4",
    "year": 2024,
    "cast": [
      "shani-lasanta",
      "porca-theclubkid",
      "dita-dubois",
      "kelly-passa",
      "miss-khristo",
      "angelita-la-perversa",
      "megui-yeillow",
      "mariana-stars",
      "la-nina-delantro",
      "chloe-vittu",
      "la-bella-vampi",
      "le-coco"
    ]
  },
  {
    "franchise": "es",
    "id": "es5",
    "name": "Temporada 5",
    "year": 2025,
    "cast": [
      "nori",
      "eva-harrington",
      "la-escandalo",
      "krystal-forever",
      "denebola-murnau",
      "ferrxn",
      "alexandra-del-raval",
      "dafne-mugler",
      "nix",
      "laca-udilla",
      "margarita-kalifata",
      "satin-greco"
    ]
  },
  {
    "franchise": "es",
    "id": "es6",
    "name": "Temporada 6",
    "year": 2026,
    "enEmision": true,
    "cast": [
      "alex-marteen",
      "alma-desoul",
      "buba-anorex",
      "coco-luna",
      "joan-chevalier",
      "kim-miller",
      "liak",
      "liz-dust",
      "maitetxu-mia",
      "marcus-massalami",
      "sorny",
      "vanessa-artiles"
    ]
  },
  {
    "franchise": "esas",
    "id": "esas1",
    "name": "All Stars 1",
    "year": 2024,
    "cast": [
      "pink-chadora",
      "onyx",
      "pakita",
      "sagittaria",
      "pupi-poisson",
      "juriji-der-klee",
      "hornella-gongora",
      "samantha-ballentines",
      "drag-sethlas"
    ]
  },
  {
    "franchise": "esas",
    "id": "esas2",
    "name": "All Stars 2",
    "year": 2026,
    "enEmision": true,
    "cast": [
      "angelita-la-perversa",
      "chanel-anorex",
      "dafne-mugler",
      "denebola-murnau",
      "jota-carajota",
      "la-nina-delantro",
      "megui-yeillow",
      "vania-vainilla",
      "venedita-von-dash"
    ]
  }
];

export const REINAS_ES: Record<string, FichaReina> = {
  "alex-marteen": { name: "Àlex Marteen", foto: true, retrato: true, audio: false, frase: "" },
  "alma-desoul": { name: "Alma Desoul", foto: true, retrato: true, audio: false, frase: "" },
  "buba-anorex": { name: "Buba Anorex", foto: true, retrato: true, audio: false, frase: "" },
  "coco-luna": { name: "Coco Luna", foto: true, retrato: true, audio: false, frase: "" },
  "joan-chevalier": { name: "Joan Chevalier", foto: true, retrato: true, audio: false, frase: "" },
  "kim-miller": { name: "Kim Miller", foto: true, retrato: true, audio: false, frase: "" },
  "liak": { name: "Liak", foto: true, retrato: true, audio: false, frase: "" },
  "liz-dust": { name: "Liz Dust", foto: true, retrato: true, audio: false, frase: "" },
  "maitetxu-mia": { name: "Maitetxu Mia", foto: true, retrato: true, audio: false, frase: "" },
  "marcus-massalami": { name: "Marcus Massalami", foto: true, retrato: true, audio: false, frase: "" },
  "sorny": { name: "Sorny", foto: true, retrato: true, audio: false, frase: "" },
  "vanessa-artiles": { name: "Vanessa Artiles", foto: true, retrato: true, audio: false, frase: "" },
  "the-macarena": { name: "The Macarena", foto: true, retrato: true, audio: false, frase: "" },
  "drag-vulcano": { name: "Drag Vulcano", foto: true, retrato: true, audio: false, frase: "" },
  "inti": { name: "Inti", foto: true, retrato: true, audio: false, frase: "" },
  "arantxa-castilla-la-mancha": { name: "Arantxa Castilla-La Mancha", foto: true, retrato: true, audio: false, frase: "" },
  "hugaceo-crujiente": { name: "Hugáceo Crujiente", foto: true, retrato: true, audio: false, frase: "" },
  "dovima-nurmi": { name: "Dovima Nurmi", foto: true, retrato: true, audio: false, frase: "" },
  "pupi-poisson": { name: "Pupi Poisson", foto: true, retrato: true, audio: false, frase: "" },
  "sagittaria": { name: "Sagittaria", foto: true, retrato: true, audio: false, frase: "" },
  "killer-queen": { name: "Killer Queen", foto: true, retrato: true, audio: false, frase: "" },
  "carmen-farala": { name: "Carmen Farala", foto: true, retrato: true, audio: false, frase: "" },
  "marisa-prisa": { name: "Marisa Prisa", foto: true, retrato: true, audio: false, frase: "" },
  "ariel-rec": { name: "Ariel Rec", foto: true, retrato: true, audio: false, frase: "" },
  "samantha-ballentines": { name: "Samantha Ballentines", foto: true, retrato: true, audio: false, frase: "" },
  "jota-carajota": { name: "Jota Carajota", foto: true, retrato: true, audio: false, frase: "" },
  "onyx": { name: "Onyx", foto: true, retrato: true, audio: false, frase: "" },
  "diamante-merybrown": { name: "Diamante Merybrown", foto: true, retrato: true, audio: false, frase: "" },
  "drag-sethlas": { name: "Drag Sethlas", foto: true, retrato: true, audio: false, frase: "" },
  "juriji-der-klee": { name: "Juriji der Klee", foto: true, retrato: true, audio: false, frase: "" },
  "marina": { name: "Marina", foto: true, retrato: true, audio: false, frase: "" },
  "estrella-xtravaganza": { name: "Estrella Xtravaganza", foto: true, retrato: true, audio: false, frase: "" },
  "venedita-von-dash": { name: "Venedita Von Däsh", foto: true, retrato: true, audio: false, frase: "" },
  "sharonne": { name: "Sharonne", foto: true, retrato: true, audio: false, frase: "" },
  "maria-edilia": { name: "María Edilia", foto: true, retrato: true, audio: false, frase: "" },
  "drag-chuchi": { name: "Drag Chuchi", foto: true, retrato: true, audio: false, frase: "" },
  "chanel-anorex": { name: "Chanel Anorex", foto: true, retrato: true, audio: false, frase: "" },
  "visa": { name: "Visa", foto: true, retrato: true, audio: false, frase: "" },
  "bestiah": { name: "Bestiah", foto: true, retrato: true, audio: false, frase: "" },
  "pakita": { name: "Pakita", foto: true, retrato: true, audio: false, frase: "" },
  "pink-chadora": { name: "Pink Chadora", foto: true, retrato: true, audio: false, frase: "" },
  "clover-bish": { name: "Clover Bish", foto: true, retrato: true, audio: false, frase: "" },
  "kelly-roller": { name: "Kelly Roller", foto: true, retrato: true, audio: false, frase: "" },
  "hornella-gongora": { name: "Hornella Góngora", foto: true, retrato: true, audio: false, frase: "" },
  "vania-vainilla": { name: "Vania Vainilla", foto: true, retrato: true, audio: false, frase: "" },
  "pitita": { name: "Pitita", foto: true, retrato: true, audio: false, frase: "" },
  "shani-lasanta": { name: "Shani LaSanta", foto: true, retrato: true, audio: false, frase: "" },
  "porca-theclubkid": { name: "Porca Theclubkid", foto: true, retrato: true, audio: false, frase: "" },
  "dita-dubois": { name: "Dita Dubois", foto: true, retrato: true, audio: false, frase: "" },
  "kelly-passa": { name: "Kelly Passa!?", foto: true, retrato: true, audio: false, frase: "" },
  "miss-khristo": { name: "Miss Khristo", foto: true, retrato: true, audio: false, frase: "" },
  "angelita-la-perversa": { name: "Angelita La Perversa", foto: true, retrato: true, audio: false, frase: "" },
  "megui-yeillow": { name: "Megui Yeillow", foto: true, retrato: true, audio: false, frase: "" },
  "mariana-stars": { name: "Mariana Stars", foto: true, retrato: true, audio: false, frase: "" },
  "la-nina-delantro": { name: "La Niña Delantro", foto: true, retrato: true, audio: false, frase: "" },
  "chloe-vittu": { name: "Chloe Vittu", foto: true, retrato: true, audio: false, frase: "" },
  "la-bella-vampi": { name: "La Bella Vampi", foto: true, retrato: true, audio: false, frase: "" },
  "le-coco": { name: "Le Cocó", foto: true, retrato: true, audio: false, frase: "" },
  "nori": { name: "Nori", foto: true, retrato: true, audio: false, frase: "" },
  "eva-harrington": { name: "Eva Harrington", foto: true, retrato: true, audio: false, frase: "" },
  "la-escandalo": { name: "La Escándalo", foto: true, retrato: true, audio: false, frase: "" },
  "krystal-forever": { name: "Krystal Forever", foto: true, retrato: true, audio: false, frase: "" },
  "denebola-murnau": { name: "Denébola Murnau", foto: true, retrato: true, audio: false, frase: "" },
  "ferrxn": { name: "Ferrxn", foto: true, retrato: true, audio: false, frase: "" },
  "alexandra-del-raval": { name: "Alexandra del Raval", foto: true, retrato: true, audio: false, frase: "" },
  "dafne-mugler": { name: "Dafne Mugler", foto: true, retrato: true, audio: false, frase: "" },
  "nix": { name: "Nix", foto: true, retrato: true, audio: false, frase: "" },
  "laca-udilla": { name: "Laca Udilla", foto: true, retrato: true, audio: false, frase: "" },
  "margarita-kalifata": { name: "Margarita Kalifata", foto: true, retrato: true, audio: false, frase: "" },
  "satin-greco": { name: "Satín Greco", foto: true, retrato: true, audio: false, frase: "" },
};

// Portada de cada temporada (póster oficial del reparto) -> images/temporadas/<id>.jpg
export const PORTADAS: Record<string, string> = {
  es1: "./images/temporadas/es1.jpg",
  es2: "./images/temporadas/es2.jpg",
  es3: "./images/temporadas/es3.jpg",
  es4: "./images/temporadas/es4.jpg",
  es5: "./images/temporadas/es5.jpg",
  es6: "./images/temporadas/es6.jpg",
  esas1: "./images/temporadas/esas1.jpg?v=3",
  esas2: "./images/temporadas/esas2.jpg?v=4",
  escustom: "./images/temporadas/escustom.jpg",
  esaw: "./images/temporadas/esaw.jpg?v=6",
};

// Temporadas anunciadas que aún no se pueden jugar (reparto pendiente)
export const PROXIMAS_TEMPORADAS: Temporada[] = [];

// Looks propios de una temporada (p. ej. All Stars): images/queens/<temporada>/<id>.png y <id>_retrato.jpg
export const LOOKS: Record<string, string[]> = {
  es3: ["the-macarena"],
  esas1: ["drag-sethlas", "hornella-gongora", "juriji-der-klee", "onyx", "pakita", "pink-chadora", "pupi-poisson", "sagittaria", "samantha-ballentines"],
};

// ------------------------------ Estadísticas ----------------------------------
const hashStr = (str: string) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export type Stats = { speed: number; rate: number; power: number; lives: number };
/** Estadísticas (1 a 5) de una reina: todas tienen los mismos puntos (14), repartidos de forma distinta según su nombre. */
export function queenStats(id: string): Stats {
  const h = hashStr(id);
  const PATRONES = [[5, 4, 3, 2], [5, 5, 2, 2], [4, 4, 3, 3], [5, 4, 4, 1], [5, 3, 3, 3], [4, 4, 4, 2], [5, 5, 3, 1], [5, 4, 2, 3]];
  const pat = PATRONES[h % PATRONES.length].slice();
  // Orden propio de cada reina (barajado con su nombre)
  let k = h >>> 3;
  for (let i = pat.length - 1; i > 0; i--) {
    const j = k % (i + 1);
    [pat[i], pat[j]] = [pat[j], pat[i]];
    k = (Math.imul(k, 1103515245) + 12345) >>> 0;
    k = k >>> 8;
  }
  return { speed: pat[0], rate: pat[1], power: pat[2], lives: pat[3] };
}
/** ¿Ganó alguna temporada ya emitida? */
export const isWinnerQueen = (id: string) => TEMPORADAS_ES.some((t) => !t.enEmision && t.cast[t.cast.length - 1] === id);

// ------------------------------ Atributos del modo historia ----------------------------------
export type QAttr = "maquillaje" | "baile" | "canto" | "costura" | "comedia" | "interpretacion" | "improvisacion" | "lipsync" | "carisma" | "moda";
export type Attrs = Record<QAttr, number>;
export const ATTR_NAMES: Record<QAttr, string> = {
  maquillaje: "Maquillaje", baile: "Baile", canto: "Canto", costura: "Costura", comedia: "Comedia",
  interpretacion: "Interpretación", improvisacion: "Improvisación", lipsync: "Lipsync", carisma: "Carisma", moda: "Moda",
};
export const QATTRS = Object.keys(ATTR_NAMES) as QAttr[];

/** Rasgos de cada reina: fortaleza, debilidad y carácter (salen de su id, siempre los mismos).
 * La fortaleza y la debilidad son su especialidad y su flojera: suben o bajan sus habilidades. */
export const RASGOS: Record<"fort" | "deb" | "car", Record<string, { n: string; icon: string; d: string; cat?: string }>> = {
  fort: {
    lipsync: { n: "Bestia del lip sync", icon: "🔥", d: "Muy peligrosa en un lip sync" },
    comedia: { n: "Lengua afilada", icon: "🎤", d: "Brilla en Snatch, Roast, impro y talk show" },
    baile: { n: "Pies de fuego", icon: "💃", d: "Brilla en rusicales, Girl Groups y coreografías" },
    costura: { n: "Manos de oro", icon: "🧵", d: "Brilla en materiales, el Ball y los reveals" },
    pasarela: { n: "Imparable en pasarela", icon: "👠", d: "Siempre puntúa alto en la pasarela" },
    canto: { n: "Voz de oro", icon: "🎙️", d: "Brilla en rusicales, Girl Groups y el talent show" },
    actriz: { n: "Actriz de raza", icon: "🎬", d: "Brilla en interpretación y publicidad" },
    pincel: { n: "Pincel de oro", icon: "💄", d: "Brilla en el makeover y con la brocha" },
  },
  deb: {
    pComedia: { n: "Pánico a la comedia", icon: "😰", d: "Se hunde en Snatch, Roast e impro", cat: "comedia" },
    pBaile: { n: "Dos pies izquierdos", icon: "🦶", d: "Se hunde en rusicales y coreografías", cat: "baile" },
    pCostura: { n: "No sabe enhebrar", icon: "🪡", d: "Se hunde en costura, Ball y makeover", cat: "costura" },
    lsFlojo: { n: "Lip sync flojo", icon: "🫥", d: "En un lip sync se le puede ganar", cat: "lipsync" },
    provocable: { n: "Se viene abajo si la provocas", icon: "💥", d: "Si la pinchas, se desconcentra muchísimo" },
    pCanto: { n: "Desafina", icon: "🙉", d: "Sufre en cuanto tiene que cantar", cat: "canto" },
    pActuar: { n: "Actúa de madera", icon: "🪵", d: "Se le ve el guion en cada frase", cat: "actriz" },
    pBrocha: { n: "Maquillaje de andar por casa", icon: "🖌️", d: "Con la brocha no es lo suyo", cat: "pincel" },
  },
  car: {
    rencorosa: { n: "Rencorosa", icon: "🧊", d: "No olvida nada: los golpes le duelen el doble" },
    ambiciosa: { n: "Ambiciosa", icon: "📈", d: "Cada victoria la hace crecer más" },
    leal: { n: "Leal", icon: "🤞", d: "Si pacta contigo, jamás te traiciona" },
    traicionera: { n: "Traicionera", icon: "🐍", d: "Puede romper un pacto en el peor momento" },
    orgullosa: { n: "Orgullosa", icon: "👑", d: "Le cuesta muchísimo hacer las paces" },
  },
};
/** Las habilidades que mueve cada especialidad (fortaleza o, en negativo, debilidad). */
export const RASGO_ATTRS: Record<string, QAttr[]> = {
  lipsync: ["lipsync"], comedia: ["comedia", "improvisacion"], baile: ["baile"], costura: ["costura"],
  pasarela: ["moda", "carisma"], canto: ["canto"], actriz: ["interpretacion"], pincel: ["maquillaje"],
};
/** Lo que cada reina ha demostrado en el programa (retos ganados, talent show y premios), de más a menos.
 * Sale de los resultados publicados de cada temporada; si no hay datos, se queda vacío y manda el azar. */
export const HABILIDADES_REALES: Record<string, QAttr[]> = {
  // Temporada 1
  "the-macarena": ["canto"], "hugaceo-crujiente": ["costura", "moda"], "pupi-poisson": ["comedia", "canto", "interpretacion"],
  "sagittaria": ["interpretacion", "baile"], "killer-queen": ["improvisacion", "comedia"], "carmen-farala": ["canto", "comedia", "maquillaje"],
  // Temporada 2
  "ariel-rec": ["lipsync"], "samantha-ballentines": ["comedia", "lipsync"], "jota-carajota": ["canto"], "onyx": ["moda", "lipsync"],
  "diamante-merybrown": ["lipsync"], "drag-sethlas": ["costura", "lipsync", "baile"], "juriji-der-klee": ["canto", "moda"], "marina": ["comedia"],
  "estrella-xtravaganza": ["improvisacion", "interpretacion", "lipsync"], "venedita-von-dash": ["improvisacion", "maquillaje", "baile"],
  "sharonne": ["canto", "improvisacion", "interpretacion"],
  // Temporada 3
  "maria-edilia": ["improvisacion"], "drag-chuchi": ["lipsync"], "chanel-anorex": ["lipsync"], "visa": ["baile"], "bestiah": ["canto", "lipsync"],
  "pakita": ["baile", "canto"], "pink-chadora": ["baile", "improvisacion", "comedia"], "clover-bish": ["lipsync"], "kelly-roller": ["baile"],
  "hornella-gongora": ["canto"], "vania-vainilla": ["comedia", "maquillaje"], "pitita": ["costura", "interpretacion", "improvisacion"],
  // Temporada 4
  "porca-theclubkid": ["moda"], "dita-dubois": ["comedia"], "kelly-passa": ["canto"], "miss-khristo": ["costura", "baile"],
  "angelita-la-perversa": ["interpretacion"], "megui-yeillow": ["lipsync"], "mariana-stars": ["improvisacion", "baile"],
  "la-nina-delantro": ["canto", "maquillaje", "baile"], "chloe-vittu": ["maquillaje", "comedia"], "la-bella-vampi": ["canto", "interpretacion"],
  "le-coco": ["comedia", "interpretacion", "lipsync"],
  // Temporada 5
  "denebola-murnau": ["costura"], "ferrxn": ["comedia"], "alexandra-del-raval": ["maquillaje"], "dafne-mugler": ["maquillaje"],
  "nix": ["canto", "baile"], "laca-udilla": ["canto", "maquillaje"], "margarita-kalifata": ["interpretacion"], "satin-greco": ["improvisacion", "comedia"],
  // Temporada 6 (en emisión: solo lo que ya se ha visto)
  "alma-desoul": ["interpretacion", "improvisacion"], "buba-anorex": ["improvisacion", "canto"], "joan-chevalier": ["costura", "moda"], "sorny": ["canto", "baile"],
};
/** La fortaleza que corresponde a cada habilidad. */
const FORT_DE: Record<QAttr, string> = {
  canto: "canto", baile: "baile", costura: "costura", moda: "pasarela", comedia: "comedia", improvisacion: "comedia",
  interpretacion: "actriz", maquillaje: "pincel", lipsync: "lipsync", carisma: "pasarela",
};
/** Rasgos de una reina (los mismos en la versión clásica y en el motor nuevo). */
export function traitsOf(id: string): { fort: string; deb: string; car: string } {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = (o: Record<string, unknown>, salt: number) => { const k = Object.keys(o); return k[(h >>> salt) % k.length]; };
  const real = HABILIDADES_REALES[id] || [];
  // Su fortaleza es lo que mejor ha demostrado en el programa (si no hay datos, sale de su nombre)
  const fort = real.length ? FORT_DE[real[0]] : pick(RASGOS.fort, 0);
  let deb = pick(RASGOS.deb, 5);
  // Nunca flojea en algo que ha demostrado que domina
  if (RASGOS.deb[deb].cat === fort || rasgoToca(RASGOS.deb[deb].cat, real)) deb = "provocable";
  return { fort, deb, car: pick(RASGOS.car, 11) };
}
/** ¿La especialidad (o la flojera) de la reina toca alguna de estas habilidades? */
export const rasgoToca = (cat: string | undefined, keys: readonly string[]) => !!cat && (RASGO_ATTRS[cat] || []).some((k) => keys.includes(k));

const hashN = (str: string, k: string) => {
  let h = 7;
  for (const c of str + k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 4;
};
/** De qué estadísticas de la reina sale cada habilidad. */
const BASE: Record<QAttr, (s: Stats) => number> = {
  maquillaje: (s) => (s.power + s.rate) / 2,
  baile: (s) => s.speed,
  canto: (s) => (s.speed + s.lives) / 2,
  costura: (s) => s.power,
  comedia: (s) => s.rate,
  interpretacion: (s) => (s.lives + s.rate) / 2,
  improvisacion: (s) => (s.rate + s.speed) / 2,
  lipsync: (s) => (s.speed * 2 + s.lives) / 3,
  carisma: (s) => s.lives,
  moda: (s) => (s.power + s.lives) / 2,
};
/** Su segunda especialidad: una habilidad más en la que destaca (siempre la misma). */
export function segundaEspecialidad(id: string): QAttr {
  const t = traitsOf(id), no = [...(RASGO_ATTRS[t.fort] || []), ...(RASGO_ATTRS[RASGOS.deb[t.deb].cat || ""] || [])];
  const ok = QATTRS.filter((k) => !no.includes(k));
  let h = 11;
  for (const c of id + ":esp") h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return ok[h % ok.length];
}
/** Habilidades (2 a 10): salen de las estadísticas de la reina, con su especialidad, su flojera y su toque propio. */
export function baseAttrs(id: string, st: Stats): Attrs {
  const t = traitsOf(id), up = RASGO_ATTRS[t.fort] || [], down = RASGO_ATTRS[RASGOS.deb[t.deb].cat || ""] || [], dos = segundaEspecialidad(id), real = HABILIDADES_REALES[id] || [];
  const a = {} as Attrs;
  for (const k of QATTRS) {
    const v = BASE[k](st) * 1.5 + hashN(id, k) - 0.5 + (up.includes(k) ? 3 : 0) - (down.includes(k) ? 3 : 0) + (real.length ? (real.includes(k) ? 2 : 0) : k === dos ? 2 : 0);
    // Lo que ha demostrado en el programa nunca baja de notable (y su punto fuerte, de un 8)
    const suelo = real[0] === k ? 8 : real.includes(k) ? 7 : 2;
    a[k] = Math.max(suelo, Math.min(10, Math.round(v)));
  }
  return a;
}
/** Pasa a las habilidades nuevas lo que se guardó con las de antes (performance y estilo). */
export function migraAttrs(o: Record<string, number> | null | undefined): Partial<Attrs> {
  const r: Partial<Attrs> = {};
  if (!o || typeof o !== "object") return r;
  const add = (k: QAttr, v: number) => (r[k] = Math.max(r[k] || 0, v));
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "number" || !v) continue;
    if (k === "performance") { add("baile", v); add("canto", v); }
    else if (k === "estilo") add("moda", v);
    else if ((QATTRS as string[]).includes(k)) add(k as QAttr, v);
  }
  return r;
}
/** Nota de pasarela que aportan las habilidades (moda y carisma). */
export const pasarelaAttr = (a: Attrs) => (a.moda * 2 + a.carisma) / 3;
/** Imagen de una reina (con su look de temporada si lo tiene). */
export function queenImg(id: string, seasonId?: string, portrait = false) {
  const r = REINAS_ES[id];
  const dir = seasonId && (LOOKS[seasonId] || []).includes(id) ? `images/queens/${seasonId}/` : "images/queens/";
  if (portrait && r?.retrato) return `${dir}${id}_retrato.jpg`;
  return r?.foto ? `${dir}${id}.png` : "";
}

/** Nota de la pasarela de una rival (0-100): su estilo y cómo le ha salido esa semana. Va aparte de la nota del reto,
 * para que la crítica del look no dependa de cómo hizo el reto. Siempre la misma para la misma reina y semana. */
export function lookRival(id: string, ep: number): number {
  const est = baseAttrs(id, queenStats(id)).moda;
  let h = 7;
  for (const c of `${id}:${ep}:look`) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return Math.max(15, Math.min(98, Math.round(est * 7 + 12 + ((h % 41) - 20))));
}
