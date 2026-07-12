import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface LoveTetherLineProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
}

export function LoveTetherLine({ from, to }: LoveTetherLineProps) {
  const distance = from.distanceTo(to);
  const color = distance > 45 ? '#ff3344' : '#ff44aa';

  return (
    <Line
      points={[
        [from.x, from.y, from.z],
        [to.x, to.y, to.z],
      ]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.85}
    />
  );
}
