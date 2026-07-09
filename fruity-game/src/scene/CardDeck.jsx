import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useBoardStore } from "../store.js";

export function CardDeck({ position = [2.6, 0.55, 1.4] }) {
  const phase = useBoardStore((s) => s.phase);
  const flipRef = useRef(null);
  const flipping = phase === "card" || phase === "reveal";

  useFrame((_, delta) => {
    if (!flipRef.current) return;
    const target = flipping ? Math.PI * 0.08 : 0;
    flipRef.current.rotation.z += (target - flipRef.current.rotation.z) * Math.min(1, delta * 6);
    flipRef.current.rotation.y += delta * (flipping ? 0.35 : 0.08);
  });

  return (
    <group position={position} ref={flipRef}>
      {[0, 1, 2, 3, 4].map((i) => (
        <RoundedBox
          key={i}
          args={[1.05, 0.06, 1.45]}
          radius={0.04}
          smoothness={2}
          position={[i * 0.03, i * 0.07, -i * 0.02]}
          castShadow
        >
          <meshStandardMaterial
            color={i === 4 && flipping ? "#ff77c8" : "#fff8f0"}
            emissive={i === 4 && flipping ? "#ff77c8" : "#000000"}
            emissiveIntensity={i === 4 && flipping ? 0.25 : 0}
            roughness={0.45}
          />
        </RoundedBox>
      ))}
    </group>
  );
}
