import { useBox } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';

interface SilentTrapBlockProps {
  position: Triplet;
}

export function SilentTrapBlock({ position }: SilentTrapBlockProps) {
  const [ref] = useBox(() => ({
    type: 'Static',
    args: [3, 3, 3],
    position,
    material: { friction: 0.1, restitution: 1.2 },
  }));

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial
        color="#ff44aa"
        emissive="#ff0088"
        emissiveIntensity={1.5}
        roughness={0.2}
      />
    </mesh>
  );
}
