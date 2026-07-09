import {
  COINS as MARIO_COINS,
  PRIZE_BOXES as MARIO_BOXES,
  TOTAL_LAPS,
  START_LINE,
  START_RADIUS,
  MIN_LAP_DISTANCE,
  PRIZE_BOOST_SPEED,
  PRIZE_BOOST_MS,
  COIN_BOOST_SPEED,
  COIN_BOOST_MS,
  MAX_COIN_BONUS,
  COIN_TOP_SPEED_PER,
  COIN_PICKUP_RADIUS,
  BOX_PICKUP_RADIUS,
  COIN_RESPAWN_S,
  BOX_RESPAWN_S,
  COIN_Y,
  BOX_Y,
} from "./raceConfig.js";

export const TRACKS = [
  {
    id: "mario",
    name: "Mario Circuit",
    description: "Classic arena loop — tight turns & boost pads.",
    glb: "./models/mario-circuit-test-transformed.glb",
    component: "mario",
    position: [155, -28, 15],
    scale: 0.08,
    signPosition: [-1937, 580, -187],
    signRotation: [0, Math.PI / 2, 0],
  },
  {
    id: "classic",
    name: "Classic Circuit",
    description: "Wide open track — good for testing top speed.",
    glb: "./models/track-transformed.glb",
    component: "generic",
    position: [0, 0, 0],
    scale: 1,
    signPosition: [0, 8, -24],
    signRotation: [0, 0, 0],
  },
];

export const KARTS = [
  {
    id: "standard",
    name: "Standard Kart",
    description: "Balanced arena kart with your mascot riding shotgun.",
    icon: "🏎️",
  },
  {
    id: "witch",
    name: "Witch Kart",
    description: "Animated rig — the witch drives herself (no mascot).",
    icon: "🧙‍♀️",
  },
];

export const KART_COLORS = [
  { id: "cherry", name: "Cherry", hex: "#ff3b30" },
  { id: "sunset", name: "Sunset", hex: "#ff8a1f" },
  { id: "banana", name: "Banana", hex: "#fde047" },
  { id: "mint", name: "Mint", hex: "#34d399" },
  { id: "ocean", name: "Ocean", hex: "#38bdf8" },
  { id: "grape", name: "Grape", hex: "#a855f7" },
  { id: "bubble", name: "Bubble", hex: "#f472b6" },
  { id: "chrome", name: "Chrome", hex: "#e2e8f0" },
];

const CLASSIC_COINS = [
  { x: 0, y: COIN_Y, z: -18 },
  { x: 5, y: COIN_Y, z: -32 },
  { x: -5, y: COIN_Y, z: -32 },
  { x: 0, y: COIN_Y, z: -48 },
  { x: 8, y: COIN_Y, z: -64 },
  { x: -8, y: COIN_Y, z: -64 },
];

const CLASSIC_BOXES = [
  { x: 0, y: BOX_Y, z: -40 },
  { x: 12, y: BOX_Y, z: -76 },
  { x: -12, y: BOX_Y, z: -76 },
];

const BASE_RACE = {
  TOTAL_LAPS,
  START_LINE,
  START_RADIUS,
  MIN_LAP_DISTANCE,
  PRIZE_BOOST_SPEED,
  PRIZE_BOOST_MS,
  COIN_BOOST_SPEED,
  COIN_BOOST_MS,
  MAX_COIN_BONUS,
  COIN_TOP_SPEED_PER,
  COIN_PICKUP_RADIUS,
  BOX_PICKUP_RADIUS,
  COIN_RESPAWN_S,
  BOX_RESPAWN_S,
  COIN_Y,
  BOX_Y,
};

export const TRACK_RACE_CONFIGS = {
  mario: {
    ...BASE_RACE,
    COINS: MARIO_COINS,
    PRIZE_BOXES: MARIO_BOXES,
  },
  classic: {
    ...BASE_RACE,
    COINS: CLASSIC_COINS,
    PRIZE_BOXES: CLASSIC_BOXES,
  },
};

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) || TRACKS[0];
}

export function getKart(id) {
  return KARTS.find((k) => k.id === id) || KARTS[0];
}

export function getColor(idOrHex) {
  if (!idOrHex) return KART_COLORS[0];
  const byId = KART_COLORS.find((c) => c.id === idOrHex);
  if (byId) return byId;
  const byHex = KART_COLORS.find((c) => c.hex.toLowerCase() === String(idOrHex).toLowerCase());
  return byHex || { id: "custom", name: "Custom", hex: idOrHex };
}

export function getRaceConfigForTrack(trackId) {
  return TRACK_RACE_CONFIGS[trackId] || TRACK_RACE_CONFIGS.mario;
}
