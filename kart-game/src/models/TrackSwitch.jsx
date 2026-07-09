import { Track as MarioTrack } from "./Mario-circuit-test.jsx";
import { GenericTrack } from "./GenericTrack.jsx";
import { getTrack } from "../kartConfig.js";
import { useArenaBridge } from "../arenaBridge.js";
import { useGLTF } from "@react-three/drei";

useGLTF.preload("./models/mario-circuit-test-transformed.glb");
useGLTF.preload("./models/track-transformed.glb");
useGLTF.preload("./models/kart.glb");
useGLTF.preload("./models/witch-transformed.glb");

export function TrackSwitch() {
  const trackId = useArenaBridge((s) => s.trackId);
  const track = getTrack(trackId);

  if (track.component === "mario") {
    return <MarioTrack title={track.name} signPosition={track.signPosition} signRotation={track.signRotation} />;
  }

  return <GenericTrack track={track} title={track.name} />;
}
