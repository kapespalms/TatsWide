/**
 * ============================================================================
 *  CUSTOM 3D MODEL MANIFEST  —  drop your GLB/GLTF files in here.
 * ============================================================================
 *
 * The scene renders with stylized PRIMITIVES out of the box (works today, no
 * assets required). To upgrade any element to a real 3D model, put the file in
 *   fruity-game/public/models/<name>.glb
 * and set its path below. Any entry left as `null` keeps the primitive.
 *
 * Paths are relative to the site root of the game (they are prefixed with the
 * Vite base "/fruity/" automatically by assetUrl()). So "models/dice.glb"
 * resolves to "/fruity/models/dice.glb" in production.
 *
 * TOKEN MODELS + ANIMATIONS
 *   Provide a rigged character GLB per arena character (tats / wideass). If the
 *   GLB contains animation clips, name them "idle", "hop", and "cheer" and the
 *   scene will play them automatically (idle while waiting, hop while moving,
 *   cheer when landing on a fruit). See src/scene/Token.jsx.
 *
 * TILE / PROP MODELS
 *   Optional per-kind tile meshes and per-fruit floating props. Models should
 *   be authored ~1 world-unit tall and centered at the origin; the scene
 *   scales/places them onto the board ring (TILE spacing = 4.2 units).
 */

export const MODELS = {
  // Whole board platform (replaces the procedural rounded slab). Optional.
  board: null, // e.g. "models/board.glb"

  // Environment lighting HDR (drei <Environment files=... />). Optional.
  environmentHDR: null, // e.g. "models/venice_sunset_1k.hdr"

  // Per-space-kind tile mesh. Optional; falls back to colored rounded tiles.
  tiles: {
    path: null,
    fruit: null,
    golden: null, // e.g. "models/corner_banana.glb"
    rotten: null,
  },

  // Floating decoration above each fruit space, keyed by fruit type. Optional.
  fruitProps: {
    chaos: null,
    brain: null,
    lore: null,
    thisorthat: null,
    closer: null,
    neverever: null,
    wouldrather: null,
  },

  // Tumbling dice. Optional; falls back to a pipped cube.
  dice: null, // e.g. "models/dice.glb"

  // Player token per arena character. Optional; falls back to a mascot
  // billboard riding a little pedestal.
  tokens: {
    tats: null, // e.g. "models/tats.glb"
    wideass: null, // e.g. "models/wideass.glb"
  },
};

/** Prefix a manifest path with the Vite base URL (e.g. "/fruity/"). */
export function assetUrl(path) {
  if (!path) return null;
  const base = import.meta.env.BASE_URL || "/";
  return (base.endsWith("/") ? base : base + "/") + path.replace(/^\/+/, "");
}
