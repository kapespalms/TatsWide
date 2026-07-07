import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { usePlayroomStore } from "../playroomStore.js";
import { MascotBillboard } from "./MascotBillboard.jsx";
import { readArenaParams } from "../arenaParams.js";
import { normalizeDriver } from "../mascotSvg.js";

function PeerRacer({ playerState, driver }) {
  const group = useRef();
  const { scene } = useGLTF("./models/kart.glb");
  const kartClone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!group.current) return;
    const pos = playerState?.state?.position;
    if (pos && pos.x !== undefined) {
      group.current.position.set(pos.x, pos.y ?? 0, pos.z ?? 0);
    }
    const rot = playerState?.state?.rotation;
    if (rot && rot.y !== undefined) {
      group.current.rotation.y = rot.y;
    }
  });

  return (
    <group ref={group} scale={0.85}>
      <primitive object={kartClone} />
      <MascotBillboard driver={driver} scale={0.34} y={0.88} label />
    </group>
  );
}

/** Remote arena partner rendered as their Tats/Wideass mascot on a kart. */
export function PeerRacers() {
  const players = usePlayroomStore((state) => state.players);
  const { peer } = readArenaParams();
  if (!peer || !players.length) return null;

  const driver = normalizeDriver(peer);
  return players.map((playerState) => (
    <PeerRacer key={playerState.id} playerState={playerState} driver={driver} />
  ));
}

useGLTF.preload("./models/kart.glb");
