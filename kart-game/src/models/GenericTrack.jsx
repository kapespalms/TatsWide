import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "../store.js";
import { TrackTitleSign } from "./TrackTitleSign.jsx";

/** Loads any track GLB and tags meshes for kart raycasts / wall collision. */
export function GenericTrack({ track, title }) {
  const { scene } = useGLTF(track.glb);
  const trackRef = useRef(null);
  const setTrackScene = useGameStore((state) => state.setTrackScene);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const n = (obj.name || "").toLowerCase();
      if (n.includes("wall") || n.includes("barrier") || n.includes("fence") || n.includes("border")) {
        if (!n.includes("wall")) obj.name = "wall barrier";
        return;
      }
      if (!n.includes("ground")) {
        obj.name = n.includes("dirt") ? "ground dirt" : "ground";
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    if (setTrackScene && trackRef.current) {
      setTrackScene(trackRef.current);
    }
  }, [setTrackScene, prepared]);

  const [px, py, pz] = track.position;
  const scale = track.scale ?? 1;

  return (
    <group dispose={null} position={[px, py, pz]} scale={scale}>
      <group ref={trackRef}>
        <primitive object={prepared} />
      </group>
      <TrackTitleSign
        title={title || track.name}
        position={track.signPosition}
        rotation={track.signRotation}
      />
    </group>
  );
}
