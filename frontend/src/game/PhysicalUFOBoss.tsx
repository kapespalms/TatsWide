import { useFrame } from '@react-three/fiber';
import { useCylinder } from '@react-three/cannon';

export function PhysicalUFOBoss({ level }: { level: number }) {
  const active = level % 2 === 0;
  const [ref, api] = useCylinder(() => ({
    type: active ? 'Dynamic' : 'Static',
    mass: active ? 50 : 0,
    position: [15, 10, 0],
    args: [5, 6, 1.5, 24],
    material: { friction: 0.1, restitution: 0.75 },
  }));

  useFrame((state) => {
    if (!active) return;
    api.position.set(15, 10 + Math.sin(state.clock.getElapsedTime() * 2) * 3, 0);
  });

  if (!active) return null;

  return (
    <group>
      <mesh ref={ref} castShadow>
        <cylinderGeometry args={[5, 6, 1.5, 24]} />
        <meshStandardMaterial color="#2d2d35" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[15, 11.5, 0]}>
        <sphereGeometry args={[2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#00ff66" emissive="#00ff33" emissiveIntensity={2} roughness={0.01} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
