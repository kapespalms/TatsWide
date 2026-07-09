import { useRef, useEffect } from "react";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import { tokenWorldPos, hopIndices } from "../board.js";
import { useBoardStore } from "../store.js";

const HOP_STEP_S = 0.38;
const HOP_HEIGHT = 1.1;

const ROLE_COLOR = {
  host: "#f472b6",
  joiner: "#38bdf8",
};

/** Bright 3D game piece — always visible (no SVG billboards). */
function TokenMesh({ role, icon, showBadge }) {
  const color = ROLE_COLOR[role] || "#c084fc";

  return (
    <group>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1.05, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.9, 1.1, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.62, 24, 24]} />
        <meshStandardMaterial
          color="#fff8e8"
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.3}
        />
      </mesh>
      <pointLight color={color} intensity={8} distance={6} position={[0, 1.8, 0]} />
      {showBadge ? (
        <Html
          center
          position={[0, 2.55, 0]}
          distanceFactor={10}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none", userSelect: "none", fontSize: "36px", lineHeight: 1 }}
        >
          {icon || "🍇"}
        </Html>
      ) : null}
    </group>
  );
}

export function Token({ role }) {
  const groupRef = useRef(null);
  const displayIndex = useRef(null);
  const tlRef = useRef(null);

  const positions = useBoardStore((s) => s.positions);
  const pieceIcons = useBoardStore((s) => s.pieceIcons);
  const target = positions[role] ?? 0;
  const icon = pieceIcons[role] || "🍇";
  const phase = useBoardStore((s) => s.phase);
  const showBadge = phase !== "card" && phase !== "reveal";

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;

    if (displayIndex.current === null) {
      const p = tokenWorldPos(target, role);
      g.position.set(p[0], p[1], p[2]);
      displayIndex.current = target;
      return;
    }
    if (displayIndex.current === target) return;

    if (tlRef.current) tlRef.current.kill();
    const seq = hopIndices(displayIndex.current, target);
    let prevIdx = displayIndex.current;
    const tl = gsap.timeline();
    const store = useBoardStore.getState;

    const syncCamera = (index) => {
      const st = store();
      if (st.lastMover === role && st.isMoving && st.rollStep === "move") {
        useBoardStore.setState({ cameraFollowIndex: index });
      }
    };

    syncCamera(displayIndex.current);

    seq.forEach((next) => {
      const from = tokenWorldPos(prevIdx, role);
      const to = tokenWorldPos(next, role);
      const proxy = { t: 0 };
      tl.call(() => syncCamera(next));
      tl.to(proxy, {
        t: 1,
        duration: HOP_STEP_S,
        ease: "none",
        onUpdate: () => {
          const t = proxy.t;
          g.position.x = from[0] + (to[0] - from[0]) * t;
          g.position.z = from[2] + (to[2] - from[2]) * t;
          g.position.y = Math.sin(t * Math.PI) * HOP_HEIGHT;
        },
      });
      prevIdx = next;
    });

    tl.to(g.scale, { y: 0.85, duration: 0.08, ease: "power2.in" });
    tl.to(g.scale, { y: 1, duration: 0.16, ease: "back.out(3)" });

    displayIndex.current = target;
    tlRef.current = tl;
    return () => tl.kill();
  }, [target, role]);

  return (
    <group ref={groupRef}>
      <TokenMesh role={role} icon={icon} showBadge={showBadge} />
    </group>
  );
}
