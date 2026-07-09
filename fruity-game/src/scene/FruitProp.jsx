import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MODELS, assetUrl } from "../modelConfig.js";

function GlbProp({ url }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

/** A glowing gem hovering over each fruit space (or a custom GLB prop). */
export function FruitProp({ tile }) {
  const ref = useRef(null);
  const url = tile.fruit ? assetUrl(MODELS.fruitProps?.[tile.fruit]) : null;
  const color = useMemo(() => new THREE.Color(tile.color), [tile.color]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.9;
  });

  return (
    <group position={[tile.x, 1.5, tile.z]}>
      <Float speed={2.4} rotationIntensity={0.4} floatIntensity={0.6}>
        <group ref={ref}>
          {url ? (
            <GlbProp url={url} />
          ) : (
            <mesh castShadow>
              <octahedronGeometry args={[0.55, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.6}
                roughness={0.25}
                metalness={0.4}
              />
            </mesh>
          )}
        </group>
        <pointLight color={color} intensity={6} distance={5} position={[0, 0, 0]} />
      </Float>
    </group>
  );
}
