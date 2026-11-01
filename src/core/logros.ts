// Logros: los mismos en el juego de siempre y en el motor nuevo (se guardan en "dftc-achievements").
export interface Logro { id: string; icon: string; name: string; desc: string; reward: number }

export const LOGROS: Logro[] = [
  { id: "debut", icon: "🎬", name: "Debut", desc: "Juega tu primera partida", reward: 50 },
  { id: "corona-arcade", icon: "👠", name: "Reina del arcade", desc: "Gana una temporada en arcade", reward: 200 },
  { id: "corona-historia", icon: "👑", name: "Felicidrages", desc: "Corónate en el modo historia", reward: 400 },
  { id: "racha", icon: "🔥", name: "Imparable", desc: "Gana 3 retos seguidos en una temporada", reward: 250 },
  { id: "sin-bottom", icon: "🛡️", name: "Intocable", desc: "Llega a la final sin pisar el bottom", reward: 300 },
  { id: "superviviente", icon: "💃", name: "Asesina del lip sync", desc: "Gana 3 lip syncs en una misma temporada", reward: 300 },
  { id: "perfecta", icon: "💎", name: "Perfección", desc: "Saca 95 o más en un reto", reward: 150 },
  { id: "combo", icon: "⚡", name: "Combo loco", desc: "Consigue un combo x20 en arcade", reward: 150 },
  { id: "aliadas", icon: "💞", name: "Hermandad", desc: "Ten 3 aliadas a la vez", reward: 150 },
  { id: "enemiga", icon: "🗡️", name: "Villana de la temporada", desc: "Gánate una enemiga declarada", reward: 100 },
  { id: "armario", icon: "🧵", name: "De compras", desc: "Mejora una estadística en el armario", reward: 50 },
  { id: "stat5", icon: "🌟", name: "Al máximo", desc: "Sube una estadística a 5", reward: 150 },
  { id: "doble-shantay", icon: "🍀", name: "Salvada por la campana", desc: "Vive un doble shantay", reward: 100 },
  { id: "miss-simpatia", icon: "💐", name: "Miss Simpatía", desc: "Gana Miss Simpatía en el reencuentro", reward: 250 },
  { id: "villana-as", icon: "😈", name: "Villana All Star", desc: "En un All Stars, manda a casa a una reina que lo hizo mejor solo para quitarte una rival", reward: 200 },
  { id: "juez-justa", icon: "⚖️", name: "Juez de paz", desc: "En un All Stars, decide 3 veces con justicia y manda a casa a la peor", reward: 200 },
  { id: "rudencion", icon: "🔁", name: "Ru-dención", desc: "Gana en un All Stars un tipo de reto en el que antes acabaste en el bottom", reward: 350 },
  { id: "remontada", icon: "📈", name: "Del bottom a la cima", desc: "Gana un reto justo después de estar en el bottom", reward: 200 },
  { id: "snatch", icon: "🎭", name: "Reina del Snatch", desc: "Gana un Snatch Game", reward: 200 },
  { id: "segunda", icon: "🧟", name: "Segunda Oportunidrag", desc: "Vuelve a la competición después de ser eliminada", reward: 250 },
  { id: "mc", icon: "🎤", name: "Maestra de ceremonias", desc: "Presenta la Segunda Oportunidrag con inmunidad", reward: 150 },
  { id: "all-winners", icon: "🌟", name: "Reina de reinas", desc: "Corónate en All Winners", reward: 800 },
  { id: "espana", icon: "🇪🇸", name: "Leyenda de España", desc: "Corónate en todas las temporadas de España en historia", reward: 1000 },
];
