import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';

interface PhysicalTRexProps {
  level: number;
}

export function PhysicalTRex({ level }: PhysicalTRexProps) {
  const active = level >= 4;
  const [ref, api] = useBox(() => ({
    type: active ? 'Dynamic' : 'Static',
    mass: active ? 80 : 0,
    position: [-50, 4, 1],
    args: [8, 7, 3],
    material: { friction: 0.15, restitution: 0.55 },
  }));

  useFrame((state) => {
    if (!active) {
      return;
    }
    const elapsed = state.clock.getElapsedTime();
    api.position.set(-50 + elapsed * (4 + level * 0.5), 4, 1);
  });

  if (!active) {
    return null;
  }

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[8, 7, 3]} />
      <meshStandardMaterial
        color="#ff9500"
        emissive="#ff6600"
        emissiveIntensity={0.6}
        wireframe
      />
    </mesh>
  );
}
