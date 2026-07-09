import { RoundedBox, ContactShadows, Environment, Html } from "@react-three/drei";
import { TILES, BOARD_HALF } from "../board.js";
import { MODELS, assetUrl } from "../modelConfig.js";
import { Tile } from "./Tile.jsx";
import { FruitProp } from "./FruitProp.jsx";
import { Token } from "./Token.jsx";
import { DicePair } from "./Dice.jsx";
import { CardDeck } from "./CardDeck.jsx";
import { CARD_DECK_POS } from "../cardPresentation.js";
import { CameraRig } from "./CameraRig.jsx";
import { useBoardStore } from "../store.js";

function BoardBase() {
  const size = BOARD_HALF * 2 + 2;
  return (
    <group>
      <RoundedBox
        args={[size, 1.4, size]}
        radius={0.6}
        smoothness={4}
        position={[0, -0.8, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#241041" roughness={0.7} metalness={0.15} />
      </RoundedBox>
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOARD_HALF * 2 - 3, BOARD_HALF * 2 - 3]} />
        <meshStandardMaterial color="#2f1657" roughness={0.85} />
      </mesh>
    </group>
  );
}

function CenterEmblem() {
  return (
    <Html
      transform
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      distanceFactor={16}
      zIndexRange={[5, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div className="fruity-center-emblem">
        <span className="fruity-center-grape">🍇</span>
        <span className="fruity-center-title">GET FRUITY</span>
      </div>
    </Html>
  );
}

export function BoardScene() {
  const activeRoles = useBoardStore((s) => s.activeRoles);
  const started = useBoardStore((s) => s.started);
  const hdr = assetUrl(MODELS.environmentHDR);

  return (
    <>
      <color attach="background" args={["#150a26"]} />
      <fog attach="fog" args={["#150a26", 28, 70]} />

      <hemisphereLight intensity={0.55} color="#ffd9ec" groundColor="#1a0b2e" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[18, 26, 12]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <pointLight position={[-16, 12, -12]} intensity={40} color="#ff77c8" distance={60} />
      <pointLight position={[16, 10, 14]} intensity={30} color="#7ad7ff" distance={60} />
      {hdr ? <Environment files={hdr} /> : null}

      <BoardBase />
      <CenterEmblem />

      {TILES.map((tile) => (
        <Tile key={tile.index} tile={tile} />
      ))}
      {TILES.filter((t) => t.kind === "fruit").map((tile) => (
        <FruitProp key={"fp-" + tile.index} tile={tile} />
      ))}

      {started
        ? activeRoles.map((role) => <Token key={role} role={role} />)
        : null}

      {started ? <DicePair position={[0, 3.4, 0]} /> : null}
      {started ? <CardDeck position={CARD_DECK_POS} /> : null}

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={BOARD_HALF * 2 + 6}
        blur={2.4}
        opacity={0.4}
        far={12}
      />

      <CameraRig />
    </>
  );
}
