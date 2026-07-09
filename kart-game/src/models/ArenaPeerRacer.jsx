import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useArenaBridge } from "../arenaBridge.js";
import { MascotBillboard, PEER_SEATED_MASCOT } from "./MascotBillboard.jsx";
import { applyKartTint } from "../utils/kartTint.js";
import { WitchKart } from "./Witch.jsx";

/** Partner kart — pose relay + their garage picks. */
export function ArenaPeerRacer() {
  const group = useRef();
  const peer = useArenaBridge((state) => state.peer);
  const peerPose = useArenaBridge((state) => state.peerPose);
  const peerKartId = useArenaBridge((state) => state.peerKartId);
  const peerKartColor = useArenaBridge((state) => state.peerKartColor);
  const raceStarted = useArenaBridge((state) => state.raceStarted);
  const { scene } = useGLTF("./models/kart.glb");
  const kartClone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (peerKartId !== "standard") return;
    applyKartTint(kartClone, peerKartColor, { strength: 0.52 });
  }, [kartClone, peerKartColor, peerKartId]);

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

  if (!raceStarted || !peer || !peerPose) return null;

  if (peerKartId === "witch") {
    return (
      <group ref={group} scale={0.85}>
        <WitchKart colorHex={peerKartColor} />
      </group>
    );
  }

  return (
    <group ref={group} scale={0.85}>
      <primitive object={kartClone} />
      <MascotBillboard
        driver={peer}
        scale={PEER_SEATED_MASCOT.scale}
        y={PEER_SEATED_MASCOT.y}
        z={PEER_SEATED_MASCOT.z}
      />
    </group>
  );
}

useGLTF.preload("./models/kart.glb");
