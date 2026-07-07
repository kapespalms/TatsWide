import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useArenaBridge } from "../arenaBridge.js";
import { MascotBillboard } from "./MascotBillboard.jsx";

/** Partner kart — position from arena WebSocket relay, character from arena pick. */
export function ArenaPeerRacer() {
  const group = useRef();
  const peer = useArenaBridge((state) => state.peer);
  const peerPose = useArenaBridge((state) => state.peerPose);
  const { scene } = useGLTF("./models/kart.glb");
  const kartClone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!group.current || !peerPose) return;
    const pos = peerPose.position;
    if (pos) {
      group.current.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }
    if (peerPose.rotationY !== undefined) {
      group.current.rotation.y = peerPose.rotationY;
    }
  });

  if (!peer || !peerPose) return null;

  return (
    <group ref={group} scale={0.85}>
      <primitive object={kartClone} />
      <MascotBillboard driver={peer} scale={0.34} y={0.88} label />
    </group>
  );
}

useGLTF.preload("./models/kart.glb");
