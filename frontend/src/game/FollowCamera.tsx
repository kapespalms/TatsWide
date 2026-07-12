import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface FollowCameraProps {
  target: THREE.Vector3;
}

export function FollowCamera({ target }: FollowCameraProps) {
  const targetRef = useRef(target);
  targetRef.current = target;

  useFrame((state) => {
    const camera = state.camera;
    const desired = new THREE.Vector3(
      targetRef.current.x,
      targetRef.current.y + 12,
      targetRef.current.z + 22,
    );
    camera.position.lerp(desired, 0.08);
    camera.lookAt(
      targetRef.current.x,
      targetRef.current.y + 2,
      targetRef.current.z,
    );
  });

  return null;
}
