import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useEffect } from 'react';
import type { PublicApi } from '@react-three/cannon';

type CharacterId = 'Wideass' | 'Tats';

export function PhysicalPlayer({
  chosenCharacter,
  onApiReady,
  volume,
  remoteVolume,
}: {
  chosenCharacter: CharacterId;
  onApiReady: (api: PublicApi) => void;
  volume: number;
  remoteVolume: number;
}) {
  const { pointer, viewport } = useThree();
  const [ref, api] = useSphere(() => ({
    mass: chosenCharacter === 'Wideass' ? 12 : 5,
    position: [-25, 2, 0],
    args: [1.2],
    material: { friction: 0.1, restitution: 0.6 },
  }));

  useEffect(() => { onApiReady(api); }, [api, onApiReady]);

  useFrame(() => {
    if (!ref.current) return;
    const targetX = (pointer.x * viewport.width) / 1.8;
    const targetZ = -(pointer.y * viewport.height) / 1.8;
    const pos = ref.current.position;
    api.velocity.set((targetX - pos.x) * 4, pos.y > 1.2 ? 0 : -2, (targetZ - pos.z) * 4);

    if (volume > 45 && pos.y <= 1.25) {
      api.applyImpulse([0, chosenCharacter === 'Wideass' ? 14 : 10, 0], [0, 0, 0]);
    }
    if (volume > 45 && remoteVolume > 45 && pos.y <= 1.25) {
      api.applyImpulse([0, 22, 0], [0, 0, 0]);
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial color={chosenCharacter === 'Wideass' ? '#ff1e43' : '#00ffff'} roughness={0.05} metalness={0.9} />
    </mesh>
  );
}
