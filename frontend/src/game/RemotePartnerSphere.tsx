import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useRef } from 'react';
import * as THREE from 'three';

export function RemotePartnerSphere({ target }: { target: THREE.Vector3 }) {
  const targetRef = useRef(target);
  targetRef.current = target;
  const [ref] = useSphere(() => ({ type: 'Kinematic', mass: 0, args: [1.2], position: [-20, 2, 0] }));

  useFrame(() => {
    if (ref.current) ref.current.position.lerp(targetRef.current, 0.28);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} wireframe />
    </mesh>
  );
}
