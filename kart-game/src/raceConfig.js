/**
 * Race layout for Arena Kart: laps, coins, and prize boxes.
 *
 * The kart spawns at world origin (0,0,0) facing -Z, so the default collectibles
 * are placed along the opening straight. Positions are in WORLD space (not track-
 * local). To fine-tune placement, open the kart with ?debug and drive over a spot:
 *   - press K to log a coin coordinate
 *   - press B to log a prize-box coordinate
 * then paste the logged {x,y,z} into COINS / PRIZE_BOXES below.
 */

export const TOTAL_LAPS = 3;

// Start/finish line (world space). Kart spawns here.
export const START_LINE = { x: 0, y: 0, z: 0 };
export const START_RADIUS = 14;

// Minimum distance (world units) that must be travelled between two start-line
// touches for it to count as a real lap. Prevents farming by circling the line.
export const MIN_LAP_DISTANCE = 220;

// Boost tuning (added to kartSettings.speed.max while active).
export const PRIZE_BOOST_SPEED = 55;
export const PRIZE_BOOST_MS = 2600;
export const COIN_BOOST_SPEED = 18;
export const COIN_BOOST_MS = 700;
export const MAX_COIN_BONUS = 10; // coins beyond this stop raising top speed
export const COIN_TOP_SPEED_PER = 1.2;

// Pickup radii (world units).
export const COIN_PICKUP_RADIUS = 5;
export const BOX_PICKUP_RADIUS = 6;

// Respawn delay after a pickup (seconds).
export const COIN_RESPAWN_S = 6;
export const BOX_RESPAWN_S = 5;

// Rendered heights above the surface.
export const COIN_Y = 3;
export const BOX_Y = 4;

// Default coins along the opening straight (kart drives toward -Z).
export const COINS = [
  { x: 0, y: COIN_Y, z: -18 },
  { x: 4, y: COIN_Y, z: -30 },
  { x: -4, y: COIN_Y, z: -30 },
  { x: 6, y: COIN_Y, z: -44 },
  { x: -6, y: COIN_Y, z: -44 },
  { x: 0, y: COIN_Y, z: -58 },
  { x: 8, y: COIN_Y, z: -72 },
  { x: -8, y: COIN_Y, z: -72 },
];

// Default prize boxes.
export const PRIZE_BOXES = [
  { x: 0, y: BOX_Y, z: -50 },
  { x: 10, y: BOX_Y, z: -88 },
  { x: -10, y: BOX_Y, z: -88 },
];
