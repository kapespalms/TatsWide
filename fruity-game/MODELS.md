# Adding custom 3D models to Get Fruity

The 3D board ships with stylized primitives so it works with **zero assets**.
Upgrade any element to a real model by dropping a `.glb`/`.gltf` file into
`fruity-game/public/models/` and pointing to it in `src/modelConfig.js`.

## Where things live

- Put files in `fruity-game/public/models/` (this folder is copied to
  `/fruity/models/` on build).
- Reference them in `src/modelConfig.js` with a path **relative to the site
  root**, e.g. `"models/dice.glb"`. The base prefix `/fruity/` is added for you.
- Leave any entry as `null` to keep the primitive fallback.

## What you can replace

| Manifest key            | What it is                          | Authoring notes |
|-------------------------|-------------------------------------|-----------------|
| `board`                 | Whole board platform                | ~centered at origin; footprint ≈ 42×42 units |
| `tiles.path/fruit/golden/rotten` | Per-space tile mesh        | ~1 unit tall, centered; tile spacing is 4.2 units |
| `fruitProps.<fruit>`    | Floating decoration over fruit tiles | small (~1 unit) |
| `dice`                  | Rolling dice                        | ~1.3 unit cube; pip "1" on +Y face if you want the settle to match |
| `tokens.tats`           | Tats player piece                   | rigged character, ~2 units tall, standing at origin |
| `tokens.wideass`        | Wideass player piece                | same |
| `environmentHDR`        | Image-based lighting (.hdr)         | optional; overrides the default lights |

## Character animations (optional but recommended)

If a token GLB includes animation clips, name them:

- `idle` — plays while the piece is waiting
- `hop` (or `walk`) — plays while the piece is moving between spaces
- `cheer` — reserved for landing celebrations

`src/scene/Token.jsx` auto-detects these clips (case-insensitive) via
`useAnimations` and cross-fades between `idle` and `hop`.

## Tips

- Keep models low-poly and use baked/simple PBR materials — this renders on
  phones inside an iframe.
- Draco-compressed GLBs work; drei's `useGLTF` handles decoding.
- After adding files, run `npm run build` from the repo root (it rebuilds all
  sub-games and copies `fruity-game/dist` to `dist/fruity`).
