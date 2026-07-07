# Mario Kart 3.js (vendored + Arena customizations)

3D WebGL kart racing embedded in the Wideass Tats Game Arena.

- **Source:** [Lunakepio/Mario-Kart-3.js](https://github.com/Lunakepio/Mario-Kart-3.js) (MIT)
- **Arena path:** `/kart/index.html?driver=tats&peer=wideass`

## Arena integration

Uses the **same Tats/Wideass character** as the game arena (`/js/mascots.js`), passed from the parent page via `postMessage` — not URL params or PlayroomKit.

Multiplayer position sync uses the arena WebSocket relay (`krPose` messages).

Rebuild: `npm run build:kart` from repo root (or full `npm run build`).
