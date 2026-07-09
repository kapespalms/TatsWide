import { useMemo } from "react";
import { RoundedBox, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { TILE } from "../board.js";
import { MODELS, assetUrl } from "../modelConfig.js";

const TILE_SIZE = TILE * 0.86;
const TILE_H = 0.5;

function GlbTile({ url, color }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

/** One board space. Uses a custom GLB if configured, else a colored slab. */
export function Tile({ tile }) {
  const modelPath = MODELS.tiles?.[tile.kind];
  const url = assetUrl(modelPath);
  const emissive = new THREE.Color(tile.color).multiplyScalar(0.18);

  return (
    <group position={[tile.x, 0, tile.z]}>
      {url ? (
        <GlbTile url={url} color={tile.color} />
      ) : (
        <>
          <RoundedBox
            args={[TILE_SIZE, TILE_H, TILE_SIZE]}
            radius={0.16}
            smoothness={4}
            position={[0, -TILE_H / 2, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={tile.color}
              emissive={emissive}
              roughness={0.55}
              metalness={0.1}
            />
          </RoundedBox>
          {/* Face icon laid flat on the tile */}
          {tile.icon || tile.fruit ? (
            <Html
              transform
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.02, 0]}
              distanceFactor={9}
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div className="fruity-tile-face">
                {tile.icon || (tile.fruit ? fruitIcon(tile.fruit) : "")}
              </div>
            </Html>
          ) : null}
        </>
      )}
    </group>
  );
}

function fruitIcon(key) {
  const icons = {
    chaos: "🎴",
    brain: "🧠",
    lore: "🎙️",
    thisorthat: "⚡",
    closer: "💬",
    neverever: "🙈",
    wouldrather: "🤔",
  };
  return icons[key] || "🍇";
}
