# Arena Fruity 3D

The 3D board renderer for **Get Fruity**, embedded in the Tats & Wideass arena
as an iframe at `/fruity/`.

## Architecture

All game rules, turn order, scoring, cards, and multiplayer sync live in the
parent arena (`js/get-fruity.js`). Both players already share synced state over
the arena WebSocket relay. This subproject is a **pure presentation layer**:

1. The parent pushes an `arenaInit` message (which character each role drives)
   and a `gfBoard` snapshot (`positions`, `turn`, `pieces`, `lastRoll`, …) via
   `postMessage`.
2. `src/arenaBridge.js` writes those into a small zustand store (`src/store.js`).
3. React Three Fiber renders the board, animates tokens hopping between spaces,
   tumbles the dice on each roll, and glides the camera to the active player.

No game logic or netcode lives here, so both peers just visualize their own
already-synced state.

## Files

- `src/board.js` — static board layout (36-space ring) + world positions
- `src/modelConfig.js` — **custom GLB manifest** (see `MODELS.md`)
- `src/scene/` — R3F components: `BoardScene`, `Tile`, `FruitProp`, `Token`,
  `Dice`, `CameraRig`, `MascotBillboard`
- `src/main.jsx` — canvas + loading overlay + bridge init

## Dev

```bash
npm install
npm run dev     # serves at /fruity/ (needs the arena parent to drive it)
npm run build   # outputs dist/ (copied to /fruity/ by the root build)
```

See `MODELS.md` to swap in your own 3D models and animations.
