/**
 * Board geometry for the 3D Get Fruity board.
 *
 * The parent arena (js/get-fruity.js) owns all game logic. This module mirrors
 * ONLY the static board layout so the 3D scene can position tiles + animate
 * tokens hopping from one space index to the next.
 *
 * The 36 spaces form a square ring on a 10x10 grid (indices run clockwise from
 * the bottom-left "Golden Banana" corner). We convert each grid cell into a
 * world position on the XZ plane, centered at the origin.
 */

export const FRUIT_META = {
  chaos: { icon: "🎴", label: "Chaos", color: "#e11d48" },
  brain: { icon: "🧠", label: "Same Brain", color: "#7c3aed" },
  lore: { icon: "🎙️", label: "Lore", color: "#2563eb" },
  thisorthat: { icon: "⚡", label: "This or That", color: "#d97706" },
  closer: { icon: "💬", label: "Closer", color: "#db2777" },
  neverever: { icon: "🙈", label: "Never Ever", color: "#059669" },
  wouldrather: { icon: "🤔", label: "Would You Rather", color: "#0891b2" },
};

export const SPACES = [
  { kind: "golden", label: "Golden Banana", icon: "🍌" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "chaos" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "brain" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "lore" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "thisorthat" },
  { kind: "rotten", label: "Rotten Apple", icon: "🍎" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "closer" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "neverever" },
  { kind: "path", label: "Stroll" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "wouldrather" },
  { kind: "path", label: "Stroll" },
  { kind: "golden", label: "Golden Banana", icon: "🍌" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "chaos" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "brain" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "lore" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "thisorthat" },
  { kind: "rotten", label: "Rotten Apple", icon: "🍎" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "closer" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "neverever" },
  { kind: "path", label: "Stroll" },
  { kind: "path", label: "Stroll" },
  { kind: "fruit", fruit: "wouldrather" },
  { kind: "path", label: "Stroll" },
];

/** Grid position (row, col) for space index — mirrors parent spaceGridPos(). */
function spaceGridPos(i) {
  if (i === 0) return { r: 9, c: 0 };
  if (i >= 1 && i <= 8) return { r: 9, c: i };
  if (i === 9) return { r: 9, c: 9 };
  if (i >= 10 && i <= 17) return { r: 17 - i, c: 9 };
  if (i === 18) return { r: 0, c: 9 };
  if (i >= 19 && i <= 26) return { r: 0, c: 27 - i };
  if (i === 27) return { r: 0, c: 0 };
  if (i >= 28 && i <= 35) return { r: i - 27, c: 0 };
  return { r: 0, c: 0 };
}

/** World-units between adjacent tile centers. */
export const TILE = 4.2;
const GRID = 10;
const CENTER = (GRID - 1) / 2; // 4.5

/** World position [x, z] for a grid cell. Y is applied per-tile in the scene. */
function gridToWorld(r, c) {
  return [(c - CENTER) * TILE, (r - CENTER) * TILE];
}

/**
 * Ordered tile descriptors, index-aligned with SPACES.
 * Each: { index, kind, fruit?, icon?, label?, x, z, color }
 */
export const TILES = SPACES.map((sp, index) => {
  const { r, c } = spaceGridPos(index);
  const [x, z] = gridToWorld(r, c);
  const color =
    sp.kind === "fruit"
      ? FRUIT_META[sp.fruit].color
      : sp.kind === "golden"
      ? "#f5c518"
      : sp.kind === "rotten"
      ? "#c0392b"
      : "#3a2a5c";
  return { index, ...sp, x, z, color };
});

/** Half-extent of the board footprint (for ground/base sizing). */
export const BOARD_HALF = CENTER * TILE + TILE * 0.75;

/** World position at the center of a tile (for camera focus). */
export function tileWorldPos(index) {
  const t = TILES[index] || TILES[0];
  return [t.x, 0, t.z];
}

/** World position of a token sitting on a space, with a small per-role offset. */
export function tokenWorldPos(index, role) {
  const t = TILES[index] || TILES[0];
  // Two tokens share a tile: nudge host/joiner apart so both are visible.
  const offset = role === "joiner" ? TILE * 0.22 : -TILE * 0.22;
  return [t.x + offset, 0, t.z + offset];
}

/** Shortest forward step sequence of indices from `from` to `to` (inclusive of to). */
export function hopIndices(from, to) {
  const seq = [];
  let cur = from;
  const total = SPACES.length;
  while (cur !== to) {
    cur = (cur + 1) % total;
    seq.push(cur);
  }
  return seq;
}
