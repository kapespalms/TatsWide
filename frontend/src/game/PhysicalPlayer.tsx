import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useEffect, useRef } from 'react';
import type { PublicApi } from '@react-three/cannon';
import * as THREE from 'three';

type CharacterId = 'Wideass' | 'Tats';

interface PhysicalPlayerProps {
  chosenCharacter: CharacterId;
  onApiReady: (api: PublicApi) => void;
  onPosition: (position: THREE.Vector3) => void;
  volume: number;
  remoteVolume: number;
}

export function PhysicalPlayer({
  chosenCharacter,
  onApiReady,
  onPosition,
  volume,
  remoteVolume,
}: PhysicalPlayerProps) {
  const { pointer, viewport } = useThree();
  const lastJumpAt = useRef(0);
  const wasLoud = useRef(false);

  const [ref, api] = useSphere(() => ({
    mass: chosenCharacter === 'Wideass' ? 12 : 5,
    position: [-25, 2, 0],
    args: [1.2],
    material: { friction: 0.1, restitution: 0.6 },
  }));

  useEffect(() => {
    onApiReady(api);
  }, [api, onApiReady]);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    const pos = ref.current.position;
    onPosition(new THREE.Vector3(pos.x, pos.y, pos.z));

    const targetX = (pointer.x * viewport.width) / 1.8;
    const targetZ = -(pointer.y * viewport.height) / 1.8;

    api.applyForce(
      [(targetX - pos.x) * 120, 0, (targetZ - pos.z) * 120],
      [0, 0, 0],
    );

    if (pos.x > 14 && pos.x < 36) {
      const angle = Math.atan2(pos.y - 11, pos.x - 25);
      const loopY = 11 + Math.sin(angle) * 10;
      const speed = Math.abs(targetX - pos.x);
      if (speed > 0.5 || pos.y > 2) {
        api.position.set(pos.x, THREE.MathUtils.lerp(pos.y, loopY, 0.15), pos.z);
      }
    }

    const now = state.clock.elapsedTime * 1000;
    const grounded = pos.y <= 1.35;
    const isLoud = volume > 45;
    const partnerLoud = remoteVolume > 45;

    if (isLoud && !wasLoud.current && grounded && now - lastJumpAt.current > 400) {
      lastJumpAt.current = now;
      api.applyImpulse(
        [0, chosenCharacter === 'Wideass' ? 16 : 12, 0],
        [0, 0, 0],
      );
    }

    if (
      isLoud &&
      partnerLoud &&
      grounded &&
      now - lastJumpAt.current > 400
    ) {
      lastJumpAt.current = now;
      api.applyImpulse([0, 26, 0], [0, 0, 0]);
    }

    wasLoud.current = isLoud;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial
        color={chosenCharacter === 'Wideass' ? '#ff1e43' : '#00ffff'}
        roughness={0.05}
        metalness={0.9}
        emissive={chosenCharacter === 'Wideass' ? '#440011' : '#004444'}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}
