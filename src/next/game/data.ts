// Reinas del arcade (los mismos datos que el juego actual: js/config.js). Estadísticas de 1 a 5.
export type PowerId = "shield" | "fan" | "sponge" | "slowmo" | "triple" | "homing";
export interface ArcadeQueen { id: string; name: string; sprite: string; stats: { speed: number; rate: number; power: number; lives: number }; power: { id: PowerId; name: string; desc: string } }

export const ARCADE_QUEENS: ArcadeQueen[] = [
  { id: "jimbo", name: "Jimbo", sprite: "images/drags/jimbo.png", stats: { speed: 2, rate: 3, power: 3, lives: 5 }, power: { id: "shield", name: "Abrigo de peluche", desc: "Escudo durante 5 s: los tacones no te hacen daño." } },
  { id: "trinity", name: "Trinity The Tuck", sprite: "images/drags/trinity.png", stats: { speed: 4, rate: 4, power: 3, lives: 2 }, power: { id: "fan", name: "Tuck & Roll", desc: "Lanza dos abanicos de 11 tacones de golpe." } },
  { id: "monet", name: "Monet X Change", sprite: "images/drags/monetXChange.png", stats: { speed: 3, rate: 3, power: 2, lives: 4 }, power: { id: "sponge", name: "¡Esponja!", desc: "Absorbe los tacones rivales de la pantalla y recupera 1 vida." } },
  { id: "shea", name: "Shea Coulee", sprite: "images/drags/sheaCoulee.png", stats: { speed: 4, rate: 3, power: 4, lives: 2 }, power: { id: "slowmo", name: "Categoría: tiempo", desc: "Ralentiza a la rival y sus tacones durante 5 s." } },
  { id: "plastique", name: "Plastique Tiara", sprite: "images/drags/plastiqueTiara.png", stats: { speed: 5, rate: 4, power: 2, lives: 2 }, power: { id: "triple", name: "Muñeca de porcelana", desc: "Triple tacón durante 6 s." } },
  { id: "angeria", name: "Angeria Paris VanMichael", sprite: "images/drags/angeriaPVM.png", stats: { speed: 3, rate: 2, power: 5, lives: 3 }, power: { id: "homing", name: "Alas de ángel", desc: "Tus tacones persiguen a la rival durante 6 s." } },
];

/** Lo que lleva cada estilo de look en la pasarela (el jurado lo tiene en cuenta). */
export const LOOK_PIECES: Record<string, string[]> = {
  Glamour: ["vestido sirena de lentejuelas", "peluca de ondas al agua", "guantes de ópera"],
  Camp: ["vestido de volantes de colores imposibles", "peluca cardada gigante", "bolso con forma de tarta"],
  Edgy: ["mono de cuero con tachuelas", "cresta negra", "botas de plataforma"],
  "Folclórico": ["bata de cola de lunares", "peineta con flores", "mantón bordado"],
  Futurista: ["traje metalizado con hombreras de cromo", "peluca plateada geométrica", "gafas de luces"],
};
