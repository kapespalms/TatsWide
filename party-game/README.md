# Arena Party (vendored + Arena customizations)

Mario Party-style board game with dice rolls and minigames, embedded in the Wideass Tats Game Arena.

- **Source:** [2001-second-split/Quarantine-Party](https://github.com/2001-second-split/Quarantine-Party) (educational fork; upstream has no explicit license)
- **Authors:** Ayse Erduran, Patty Arunyavikul, Stephanie Chiang, Tiffany Ma
- **Arena path:** `/party/index.html`

## Arena integration

Uses Tats/Wideass characters from the parent arena via `postMessage` — not Socket.IO or room lobbies.

Multiplayer sync uses the arena WebSocket relay (`mp*` messages) with host-authoritative game logic.

Rebuild: `npm run build:party` from repo root (or full `npm run build`).
