import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { MODELS, assetUrl } from "../modelConfig.js";
import { useBoardStore } from "../store.js";

function pipTexture(n) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fef3f8";
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#7c1d4a";
  const r = s * 0.09;
  const g = s * 0.27;
  const layouts = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  (layouts[n] || []).forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(s / 2 + dx * g, s / 2 + dy * g, r, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

const FACE_VALUES = [3, 4, 1, 6, 2, 5];

function rotationForValue(v) {
  switch (v) {
    case 1: return [0, 0, 0];
    case 6: return [Math.PI, 0, 0];
    case 2: return [-Math.PI / 2, 0, 0];
    case 5: return [Math.PI / 2, 0, 0];
    case 3: return [0, 0, Math.PI / 2];
    case 4: return [0, 0, -Math.PI / 2];
    default: return [0, 0, 0];
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function GlbDice({ url }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} scale={0.85} />;
}

function SingleDie({ value, rollSeq, spinSeq, baseY, xOffset, tint = "#fef3f8" }) {
  const spinRef = useRef(null);
  const bobRef = useRef(null);
  const anim = useRef({
    active: false,
    t: 0,
    duration: 1.15,
    from: [0, 0, 0],
    to: [0, 0, 0],
    lift: 2.2,
  });

  const materials = useMemo(
    () =>
      FACE_VALUES.map(
        (v) =>
          new THREE.MeshStandardMaterial({
            map: pipTexture(v),
            roughness: 0.35,
            metalness: 0.05,
            color: tint,
          })
      ),
    [tint]
  );

  const url = assetUrl(MODELS.dice);

  useEffect(() => {
    if (spinSeq === 0 || !spinRef.current) return;
    const g = spinRef.current;
    anim.current = {
      active: true,
      t: 0,
      duration: 0.5,
      from: [g.rotation.x, g.rotation.y, g.rotation.z],
      to: [
        g.rotation.x + Math.PI * 2,
        g.rotation.y + Math.PI * 3,
        g.rotation.z + Math.PI,
      ],
      lift: 0.9,
      settle: null,
    };
    if (bobRef.current) bobRef.current.position.y = baseY + 0.9;
  }, [spinSeq, baseY]);

  useEffect(() => {
    if (rollSeq === 0 || !value || !spinRef.current) return;
    const target = rotationForValue(value);
    const g = spinRef.current;
    anim.current = {
      active: true,
      t: 0,
      duration: 1.15,
      from: [g.rotation.x, g.rotation.y, g.rotation.z],
      to: [
        target[0] + Math.PI * 4,
        target[1] + Math.PI * 4,
        target[2] + Math.PI * 2,
      ],
      lift: 2.2,
      settle: target,
    };
    if (bobRef.current) bobRef.current.position.y = baseY + anim.current.lift;
  }, [rollSeq, value, baseY]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a.active || !spinRef.current || !bobRef.current) return;

    a.t += delta / a.duration;
    const p = Math.min(1, a.t);
    const e = easeOutCubic(p);

    spinRef.current.rotation.x = a.from[0] + (a.to[0] - a.from[0]) * e;
    spinRef.current.rotation.y = a.from[1] + (a.to[1] - a.from[1]) * e;
    spinRef.current.rotation.z = a.from[2] + (a.to[2] - a.from[2]) * e;

    const bounce =
      p < 0.82
        ? baseY + a.lift * (1 - p / 0.82)
        : baseY + Math.sin((p - 0.82) * Math.PI * 6) * (1 - p) * 0.35;
    bobRef.current.position.y = bounce;

    if (p >= 1) {
      a.active = false;
      if (a.settle) {
        spinRef.current.rotation.set(a.settle[0], a.settle[1], a.settle[2]);
        bobRef.current.position.y = baseY;
      }
    }
  });

  return (
    <group position={[xOffset, 0, 0]}>
      <group ref={bobRef} position={[0, baseY, 0]}>
        <group ref={spinRef}>
          {url ? (
            <GlbDice url={url} />
          ) : (
            <mesh castShadow material={materials}>
              <boxGeometry args={[1.1, 1.1, 1.1]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

export function DicePair({ position = [0, 3.4, 0] }) {
  const rollSeq = useBoardStore((s) => s.rollSeq);
  const spinSeq = useBoardStore((s) => s.spinSeq);
  const lastRolls = useBoardStore((s) => s.lastRolls);
  const baseY = position[1];

  const die1 = lastRolls?.die1 || 1;
  const die2 = lastRolls?.die2 || 1;

  return (
    <group position={[position[0], 0, position[2]]}>
      <SingleDie
        value={die1}
        rollSeq={rollSeq}
        spinSeq={spinSeq}
        baseY={baseY}
        xOffset={-0.95}
        tint="#fff5fa"
      />
      <SingleDie
        value={die2}
        rollSeq={rollSeq}
        spinSeq={spinSeq}
        baseY={baseY}
        xOffset={0.95}
        tint="#f0f9ff"
      />
    </group>
  );
}

export function Dice({ position = [0, 3.4, 0] }) {
  return <DicePair position={position} />;
}
