import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "./store";
import { useArenaBridge } from "./arenaBridge.js";
import { getRaceConfigForTrack } from "./kartConfig";

function Coin({ data, raceConfig }) {
  const ref = useRef(null);
  const cooldown = useRef(0);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;

    mesh.rotation.y += delta * 3;

    if (cooldown.current > 0) {
      cooldown.current -= delta;
      if (cooldown.current <= 0) mesh.visible = true;
      return;
    }
    if (!mesh.visible) return;

    const store = useGameStore.getState();
    const pos = store.playerPosition;
    if (!pos) return;
    const dx = pos.x - data.x;
    const dz = pos.z - data.z;
    if (Math.hypot(dx, dz) < raceConfig.COIN_PICKUP_RADIUS) {
      mesh.visible = false;
      cooldown.current = raceConfig.COIN_RESPAWN_S;
      store.addCoins(1);
      store.triggerBoost(raceConfig.COIN_BOOST_MS);
      store.setItemFlash("+1 COIN");
    }
  });

  return (
    <group ref={ref} position={[data.x, data.y, data.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2, 2, 0.5, 20]} />
        <meshStandardMaterial
          color="#ffd23f"
          emissive="#ff9a00"
          emissiveIntensity={0.6}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

function PrizeBox({ data, raceConfig }) {
  const ref = useRef(null);
  const cooldown = useRef(0);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;

    t.current += delta;
    mesh.rotation.y += delta * 1.5;
    mesh.rotation.x += delta * 0.6;
    mesh.position.y = data.y + Math.sin(t.current * 2) * 0.6;

    if (cooldown.current > 0) {
      cooldown.current -= delta;
      if (cooldown.current <= 0) mesh.visible = true;
      return;
    }
    if (!mesh.visible) return;

    const store = useGameStore.getState();
    const pos = store.playerPosition;
    if (!pos) return;
    const dx = pos.x - data.x;
    const dz = pos.z - data.z;
    if (Math.hypot(dx, dz) < raceConfig.BOX_PICKUP_RADIUS) {
      mesh.visible = false;
      cooldown.current = raceConfig.BOX_RESPAWN_S;
      store.triggerBoost(raceConfig.PRIZE_BOOST_MS);
      store.addCoins(2);
      store.setItemFlash("BOOST!");
    }
  });

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]}>
      <boxGeometry args={[3.4, 3.4, 3.4]} />
      <meshStandardMaterial
        color="#3fb6ff"
        emissive="#0066ff"
        emissiveIntensity={0.7}
        metalness={0.4}
        roughness={0.2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export function Collectibles() {
  const trackId = useArenaBridge((s) => s.trackId);
  const raceConfig = useMemo(() => getRaceConfigForTrack(trackId), [trackId]);
  const coins = useMemo(() => raceConfig.COINS, [raceConfig]);
  const boxes = useMemo(() => raceConfig.PRIZE_BOXES, [raceConfig]);

  return (
    <group>
      {coins.map((c, i) => (
        <Coin key={"coin-" + i} data={c} raceConfig={raceConfig} />
      ))}
      {boxes.map((b, i) => (
        <PrizeBox key={"box-" + i} data={b} raceConfig={raceConfig} />
      ))}
    </group>
  );
}
