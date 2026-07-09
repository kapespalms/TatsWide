import { Text } from "@react-three/drei";

/** Overhead start-line sign — local coords under the track group. */
export function TrackTitleSign({
  title = "Wideass & Tats Kart",
  position = [-1937, 580, -187],
  rotation = [0, Math.PI / 2, 0],
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -2]}>
        <boxGeometry args={[520, 110, 8]} />
        <meshStandardMaterial color="#1a0a2e" />
      </mesh>
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[500, 90, 4]} />
        <meshStandardMaterial color="#ff3b30" />
      </mesh>
      <Text
        font="./fonts/mario_kart_f2.ttf"
        fontSize={52}
        color="#fff7e6"
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor="#1a0a2e"
        maxWidth={480}
        textAlign="center"
      >
        {title}
      </Text>
    </group>
  );
}
