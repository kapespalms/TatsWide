import { useCylinder } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';

export function PhysicalPepperCan({ startPos }: { startPos: Triplet }) {
  const [ref] = useCylinder(() => ({
    mass: 1.5,
    position: startPos,
    args: [0.6, 0.6, 2.2, 16],
    material: { friction: 0.2, restitution: 0.8 },
  }));

  return (
    <mesh ref={ref} castShadow>
      <cylinderGeometry args={[0.6, 0.6, 2.2, 16]} />
      <meshStandardMaterial color="#7a1f3d" roughness={0.1} metalness={0.7} />
    </mesh>
  );
}
