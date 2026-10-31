// Reinas del arcade (los mismos datos que el juego actual: js/config.js). Estadísticas de 1 a 5.
export interface ArcadeQueen { id: string; name: string; sprite: string; stats: { speed: number; rate: number; power: number; lives: number } }

export const ARCADE_QUEENS: ArcadeQueen[] = [
  { id: "jimbo", name: "Jimbo", sprite: "images/drags/jimbo.png", stats: { speed: 2, rate: 3, power: 3, lives: 5 } },
  { id: "trinity", name: "Trinity The Tuck", sprite: "images/drags/trinity.png", stats: { speed: 4, rate: 4, power: 3, lives: 2 } },
  { id: "monet", name: "Monet X Change", sprite: "images/drags/monetXChange.png", stats: { speed: 3, rate: 3, power: 2, lives: 4 } },
  { id: "shea", name: "Shea Coulee", sprite: "images/drags/sheaCoulee.png", stats: { speed: 4, rate: 3, power: 4, lives: 2 } },
  { id: "plastique", name: "Plastique Tiara", sprite: "images/drags/plastiqueTiara.png", stats: { speed: 5, rate: 4, power: 2, lives: 2 } },
  { id: "angeria", name: "Angeria Paris VanMichael", sprite: "images/drags/angeriaPVM.png", stats: { speed: 3, rate: 2, power: 5, lives: 3 } },
];
