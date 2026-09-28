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

const TEMPORADAS_ES = [
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
  }
];

const REINAS_ES = {
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
const PORTADAS = {
  es1: "./images/temporadas/es1.jpg",
  es2: "./images/temporadas/es2.jpg",
  es3: "./images/temporadas/es3.jpg",
  es4: "./images/temporadas/es4.jpg",
  es5: "./images/temporadas/es5.jpg",
  es6: "./images/temporadas/es6.jpg",
  esas1: "./images/temporadas/esas1.jpg",
  esas2: "./images/temporadas/esas2.jpg",
};

// Temporadas anunciadas que aún no se pueden jugar (reparto pendiente)
const PROXIMAS_TEMPORADAS = [{ franchise: "esas", id: "esas2", name: "All Stars 2", year: 2026 }];

// Looks propios de una temporada (p. ej. All Stars): images/queens/<temporada>/<id>.png y <id>_retrato.jpg
const LOOKS = {
  esas1: ["drag-sethlas", "hornella-gongora", "juriji-der-klee", "onyx", "pakita", "pink-chadora", "pupi-poisson", "sagittaria", "samantha-ballentines"],
};
