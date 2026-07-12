import { useBox } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';

export function PhysicsTrackFloor({ position = [0, -0.5, 0] as Triplet, args = [200, 1, 30] as Triplet }) {
  const [ref] = useBox(() => ({
    type: 'Static',
    args,
    position,
    material: { friction: 0.05, restitution: 0.2 },
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#16161f" roughness={0.5} metalness={0.4} />
    </mesh>
  );
}
