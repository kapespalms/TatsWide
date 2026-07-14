import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { CharacterId, ShooterKind, ShooterScores } from '../types';
import type { ShooterSegment } from '../shooter/types';
import { useShooterInput } from '../shooter/useShooterInput';
import { ShooterHUD } from '../shooter/ShooterHUD';

interface Enemy {
  id: number;
  x: number;
  y: number;
  z: number;
  hp: number;
  kind: 'trex' | 'raptor' | 'alien' | 'crate';
}

interface ShooterPhaseProps {
  kind: ShooterKind;
  segment: ShooterSegment;
  level: number;
  intensity: number;
  playerCount: 1 | 2;
  embed?: boolean;
  onComplete: (scores: ShooterScores) => void;
}

const JEEP_HP_MAX = 100;

export function ShooterPhase(props: ShooterPhaseProps) {
  const { kind, segment, level, intensity, playerCount, embed, onComplete } = props;
  const [scores, setScores] = useState<ShooterScores>({ Wideass: 0, Tats: 0 });
  const [streaks, setStreaks] = useState<ShooterScores>({ Wideass: 0, Tats: 0 });
  const [kills, setKills] = useState(0);
  const [timeLeft, setTimeLeft] = useState(segment.durationSec);
  const [flash, setFlash] = useState('');
  const [jeepHp, setJeepHp] = useState(JEEP_HP_MAX);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [reticles, setReticles] = useState({
    Wideass: { x: 0.35, y: 0.5 },
    Tats: { x: 0.65, y: 0.5 },
  });
  const input = useShooterInput(true, playerCount);
  const finished = useRef(false);
  const scoresRef = useRef(scores);
  const jeepHpRef = useRef(jeepHp);
  scoresRef.current = scores;
  jeepHpRef.current = jeepHp;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setReticles(input.getReticles());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [input]);

  const handleKill = useCallback((who: CharacterId, points: number) => {
    setStreaks((s) => {
      const streak = s[who] + 1;
      const bonus = streak > 1 ? Math.floor(points * 0.15 * Math.min(streak, 8)) : 0;
      setScores((prev) => {
        const next = { ...prev, [who]: prev[who] + points + bonus };
        scoresRef.current = next;
        return next;
      });
      return { ...s, [who]: streak };
    });
    setKills((k) => k + 1);
    setFlash(who);
    window.setTimeout(() => setFlash(''), 120);
  }, []);

  const handleMissPass = useCallback(
    (damage: number) => {
      if (kind === 'jeep') {
        setJeepHp((hp) => Math.max(0, hp - damage));
        jeepHpRef.current = Math.max(0, jeepHpRef.current - damage);
      }
      setP1Hp((hp) => Math.max(0, hp - damage * 0.35));
      setP2Hp((hp) => Math.max(0, hp - damage * 0.35));
      setStreaks({ Wideass: 0, Tats: 0 });
    },
    [kind],
  );

  const handleComplete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete(scoresRef.current);
  }, [onComplete]);

  useEffect(() => {
    if (kind === 'jeep' && jeepHp <= 0) handleComplete();
  }, [jeepHp, kind, handleComplete]);

  const cam =
    kind === 'jeep'
      ? ({ position: [0, 1.05, 5.2] as [number, number, number], fov: 68 })
      : ({ position: [0, 1.2, 6] as [number, number, number], fov: 60 });

  return (
    <div className={embed ? 'relative h-full w-full bg-black' : 'relative min-h-screen bg-black'}>
      <div className="absolute inset-0">
        <Canvas camera={cam}>
          <Suspense fallback={null}>
            <ShooterWorld
              kind={kind}
              intensity={intensity}
              input={input}
              onKill={handleKill}
              onMissPass={handleMissPass}
              kills={kills}
              killQuota={segment.killQuota}
              timeLeft={timeLeft}
              setTimeLeft={setTimeLeft}
              jeepHpRef={jeepHpRef}
              onComplete={handleComplete}
            />
          </Suspense>
        </Canvas>
      </div>
      <ShooterHUD
        kind={kind}
        level={level}
        scores={scores}
        kills={kills}
        killQuota={segment.killQuota}
        timeLeft={timeLeft}
        playerCount={playerCount}
        reticles={reticles}
        flash={flash}
        streaks={streaks}
        jeepHp={jeepHp}
        jeepHpMax={JEEP_HP_MAX}
        p1Hp={p1Hp}
        p2Hp={p2Hp}
      />
    </div>
  );
}

function ShooterWorld({
  kind,
  intensity,
  input,
  onKill,
  onMissPass,
  kills,
  killQuota,
  timeLeft,
  setTimeLeft,
  jeepHpRef,
  onComplete,
}: {
  kind: ShooterKind;
  intensity: number;
  input: ReturnType<typeof useShooterInput>;
  onKill: (who: CharacterId, points: number) => void;
  onMissPass: (damage: number) => void;
  kills: number;
  killQuota: number;
  timeLeft: number;
  setTimeLeft: (t: number) => void;
  jeepHpRef: MutableRefObject<number>;
  onComplete: () => void;
}) {
  const enemies = useRef<Enemy[]>([]);
  const enemyMeshes = useRef<THREE.Group[]>([]);
  const root = useRef<THREE.Group>(null);
  const idRef = useRef(0);
  const spawnTimer = useRef(0);
  const timerAcc = useRef(0);
  const timeRef = useRef(timeLeft);
  const killsRef = useRef(kills);
  const completed = useRef(false);
  const muzzle = useRef({ Wideass: 0, Tats: 0 });
  timeRef.current = timeLeft;
  killsRef.current = kills;

  useFrame((state, delta) => {
    if (completed.current) return;
    const dt = Math.min(delta, 0.05);

    // Soft camera bob / shake when jeep damaged
    if (kind === 'jeep') {
      const hurt = 1 - jeepHpRef.current / JEEP_HP_MAX;
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 2.2) * 0.04 * (1 + hurt * 3);
      state.camera.position.y = 1.05 + Math.sin(state.clock.elapsedTime * 3.1) * 0.03;
      state.camera.rotation.z = Math.sin(state.clock.elapsedTime * 1.4) * 0.01 * (1 + hurt);
    }

    timerAcc.current += dt;
    if (timerAcc.current >= 1) {
      timerAcc.current -= 1;
      const next = Math.max(0, timeRef.current - 1);
      timeRef.current = next;
      setTimeLeft(next);
    }

    spawnTimer.current += dt;
    const spawnEvery = Math.max(0.4, (kind === 'jeep' ? 1.35 : 1.8) - intensity * 0.08);
    if (spawnTimer.current >= spawnEvery) {
      spawnTimer.current = 0;
      const roll = Math.random();
      let ekind: Enemy['kind'] = kind === 'space' ? 'alien' : 'trex';
      if (kind === 'jeep') {
        if (roll < 0.18) ekind = 'crate';
        else if (roll < 0.45) ekind = 'raptor';
        else ekind = 'trex';
      }
      enemies.current.push({
        id: idRef.current++,
        x: (Math.random() - 0.5) * (kind === 'jeep' ? 9 : 8),
        y:
          ekind === 'crate'
            ? -0.9
            : kind === 'jeep'
              ? -0.4 + Math.random() * 1.2
              : (Math.random() - 0.5) * 3,
        z: -58 - Math.random() * 22,
        hp: ekind === 'trex' ? 4 : ekind === 'raptor' ? 2 : ekind === 'crate' ? 1 : 1,
        kind: ekind,
      });
    }

    const speed = (kind === 'space' ? 14 : 12) + intensity * 2;
    const survivors: Enemy[] = [];
    for (const e of enemies.current) {
      e.z += speed * dt;
      if (e.z >= 6.5) {
        if (e.kind !== 'crate') onMissPass(e.kind === 'trex' ? 14 : 8);
        continue;
      }
      survivors.push(e);
    }
    enemies.current = survivors;

    while (enemyMeshes.current.length > enemies.current.length) {
      const g = enemyMeshes.current.pop();
      if (g) {
        disposeGroup(g);
        root.current?.remove(g);
      }
    }

    enemies.current.forEach((e, i) => {
      let g = enemyMeshes.current[i];
      if (!g || g.userData.kind !== e.kind) {
        if (g) {
          disposeGroup(g);
          root.current?.remove(g);
        }
        g =
          e.kind === 'alien'
            ? buildAlienMesh()
            : e.kind === 'raptor'
              ? buildRaptorMesh()
              : e.kind === 'crate'
                ? buildCrateMesh()
                : buildTreXMesh();
        g.userData.kind = e.kind;
        root.current?.add(g);
        enemyMeshes.current[i] = g;
      }
      g.visible = true;
      g.position.set(e.x, e.y, e.z);
      const scale =
        e.kind === 'trex'
          ? Math.max(1.1, 2.4 + e.z * -0.025)
          : e.kind === 'raptor'
            ? Math.max(0.7, 1.35 + e.z * -0.012)
            : 1;
      g.scale.setScalar(scale);
      g.rotation.y = Math.sin(state.clock.elapsedTime * 2 + e.id) * 0.15;
    });

    const camera = state.camera;
    const fire = input.consumeFire();
    const ret = input.getReticles();

    const checkHit = (who: CharacterId, nx: number, ny: number) => {
      muzzle.current[who] = 1;
      for (let i = enemies.current.length - 1; i >= 0; i -= 1) {
        const e = enemies.current[i];
        const projected = new THREE.Vector3(e.x, e.y + (e.kind === 'trex' ? 1.2 : 0.4), e.z).project(
          camera,
        );
        if (projected.z > 1) continue;
        const sx = projected.x * 0.5 + 0.5;
        const sy = -projected.y * 0.5 + 0.5;
        const dist = Math.hypot(sx - nx, sy - ny);
        const threshold = e.kind === 'trex' ? 0.13 : e.kind === 'crate' ? 0.09 : 0.1;
        if (dist < threshold && e.z > -45) {
          e.hp -= 1;
          if (e.hp <= 0) {
            enemies.current.splice(i, 1);
            const g = enemyMeshes.current.splice(i, 1)[0];
            if (g) {
              disposeGroup(g);
              root.current?.remove(g);
            }
            const points =
              e.kind === 'trex' ? 1000 : e.kind === 'raptor' ? 600 : e.kind === 'crate' ? 250 : 400;
            onKill(who, points);
          }
          break;
        }
      }
    };

    if (fire.Wideass) checkHit('Wideass', ret.Wideass.x, ret.Wideass.y);
    if (fire.Tats) checkHit('Tats', ret.Tats.x, ret.Tats.y);

    muzzle.current.Wideass = Math.max(0, muzzle.current.Wideass - dt * 6);
    muzzle.current.Tats = Math.max(0, muzzle.current.Tats - dt * 6);

    if (killsRef.current >= killQuota || timeRef.current <= 0 || jeepHpRef.current <= 0) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <>
      <color attach="background" args={[kind === 'space' ? '#050510' : '#1a2818']} />
      <fog attach="fog" args={[kind === 'space' ? '#050510' : '#2a3a22', 12, kind === 'jeep' ? 70 : 55]} />
      {kind === 'space' ? <SpaceEnvironment /> : <JeepEnvironment />}
      <group ref={root} />
      <VehicleInterior kind={kind} muzzle={muzzle} />
    </>
  );
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}

function disposeGroup(g: THREE.Group) {
  disposeObject(g);
}

function buildAlienMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#cc2222', emissive: '#ff0000', emissiveIntensity: 0.5 }),
  );
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ff4444', emissive: '#ffff00', emissiveIntensity: 0.8 }),
  );
  head.position.set(0, 0.5, 0.3);
  g.add(body, head);
  return g;
}

function buildTreXMesh() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#4a6b32', roughness: 0.85 });
  const belly = new THREE.MeshStandardMaterial({ color: '#8a9a60', roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.1), skin);
  torso.position.set(0, 1.4, 0);
  const bellyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.9), belly);
  bellyMesh.position.set(0.15, 1.3, 0.15);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.55), skin);
  neck.position.set(0.85, 2.2, 0);
  neck.rotation.z = -0.4;

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.65), skin);
  head.position.set(1.55, 2.55, 0);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.5), belly);
  jaw.position.set(1.65, 2.2, 0);

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ffff44', emissive: '#ffaa00', emissiveIntensity: 2 }),
  );
  eye.position.set(1.7, 2.7, 0.28);

  const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.45), skin);
  thigh.position.set(-0.2, 0.55, 0.25);
  const calf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.35), skin);
  calf.position.set(0.1, 0.15, 0.35);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.2), skin);
  arm.position.set(0.7, 1.5, 0.45);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.35), skin);
  tail.position.set(-1.4, 1.3, 0);
  tail.rotation.z = 0.25;

  g.add(torso, bellyMesh, neck, head, jaw, eye, thigh, calf, arm, tail);
  return g;
}

function buildRaptorMesh() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#3d5a3a', roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.5), skin);
  body.position.y = 0.7;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.35), skin);
  head.position.set(0.55, 1.0, 0);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 6),
    new THREE.MeshStandardMaterial({ color: '#ff2200', emissive: '#ff2200', emissiveIntensity: 1.5 }),
  );
  eye.position.set(0.7, 1.1, 0.15);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), skin);
  leg.position.set(-0.1, 0.25, 0.15);
  g.add(body, head, eye, leg);
  return g;
}

function buildCrateMesh() {
  const g = new THREE.Group();
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.95 }),
  );
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.12, 0.95),
    new THREE.MeshStandardMaterial({ color: '#c9a227', emissive: '#886600', emissiveIntensity: 0.3 }),
  );
  stripe.position.y = 0.1;
  g.add(crate, stripe);
  return g;
}

function SpaceEnvironment() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 3, 2]} intensity={1.2} color="#88ccff" />
      {Array.from({ length: 120 }, (_, i) => (
        <mesh
          key={i}
          position={[(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40, -20 - Math.random() * 60]}
        >
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

function JeepEnvironment() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 12, 4]} intensity={1.1} color="#ffe0a8" castShadow />
      <pointLight position={[-4, 3, -8]} intensity={1.8} color="#ff6622" />
      <pointLight position={[3, 2, 2]} intensity={0.6} color="#88ffaa" />

      {/* Sky wash */}
      <mesh position={[0, 10, -40]}>
        <sphereGeometry args={[60, 16, 16]} />
        <meshBasicMaterial color="#6aa0c8" side={THREE.BackSide} />
      </mesh>

      {/* Sun */}
      <mesh position={[14, 9, -35]}>
        <sphereGeometry args={[3.2, 16, 16]} />
        <meshBasicMaterial color="#fff3c0" />
      </mesh>

      {/* Erupting volcano */}
      <mesh position={[-16, 2, -32]}>
        <coneGeometry args={[4.5, 11, 8]} />
        <meshStandardMaterial color="#2a1810" emissive="#ff3300" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-16, 8, -32]}>
        <sphereGeometry args={[1.8, 10, 10]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={1.2} transparent opacity={0.7} />
      </mesh>

      {/* Jungle trunks */}
      {Array.from({ length: 28 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const z = -6 - (i % 14) * 4.2;
        const x = side * (5.5 + (i % 5) * 1.1);
        return (
          <group key={`tree-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 1.8, 0]}>
              <cylinderGeometry args={[0.25, 0.4, 3.6, 6]} />
              <meshStandardMaterial color="#2a1810" />
            </mesh>
            <mesh position={[0, 4.1, 0]}>
              <coneGeometry args={[1.6, 3.2, 7]} />
              <meshStandardMaterial color="#1a4d22" />
            </mesh>
          </group>
        );
      })}

      {/* Path / dirt track rushing under jeep */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, -8]}>
        <planeGeometry args={[18, 100]} />
        <meshStandardMaterial color="#5a3a1e" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.33, -8]}>
        <planeGeometry args={[5.5, 100]} />
        <meshStandardMaterial color="#7a5530" roughness={1} />
      </mesh>

      {/* Roadside rocks */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={`rock-${i}`}
          position={[(i % 2 === 0 ? -1 : 1) * (3.2 + (i % 3) * 0.4), -0.7, -8 - i * 5]}
        >
          <dodecahedronGeometry args={[0.55 + (i % 3) * 0.15, 0]} />
          <meshStandardMaterial color="#4a4038" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

function VehicleInterior({
  kind,
  muzzle,
}: {
  kind: ShooterKind;
  muzzle: MutableRefObject<{ Wideass: number; Tats: number }>;
}) {
  const leftFlash = useRef<THREE.Mesh>(null);
  const rightFlash = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (leftFlash.current) {
      const m = muzzle.current.Wideass;
      leftFlash.current.visible = m > 0.05;
      (leftFlash.current.material as THREE.MeshBasicMaterial).opacity = m;
    }
    if (rightFlash.current) {
      const m = muzzle.current.Tats;
      rightFlash.current.visible = m > 0.05;
      (rightFlash.current.material as THREE.MeshBasicMaterial).opacity = m;
    }
  });

  if (kind === 'space') {
    return (
      <group position={[0, -1.8, 3]}>
        <mesh>
          <boxGeometry args={[7, 1.2, 2.5]} />
          <meshStandardMaterial color="#223344" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshStandardMaterial color="#555555" emissive="#00ffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshStandardMaterial color="#555555" emissive="#ff4444" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  // Over-hood jeep dashboard + dual gun mounts
  return (
    <group position={[0, -1.55, 3.4]}>
      {/* Hood / dash */}
      <mesh position={[0, 0.15, 0.2]}>
        <boxGeometry args={[6.5, 0.35, 2.8]} />
        <meshStandardMaterial color="#3a4a28" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.45, -0.4]}>
        <boxGeometry args={[6.2, 0.25, 0.9]} />
        <meshStandardMaterial color="#2a3220" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Windshield frame */}
      <mesh position={[-2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshStandardMaterial color="#1a1a14" />
      </mesh>
      <mesh position={[2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshStandardMaterial color="#1a1a14" />
      </mesh>
      <mesh position={[0, 1.85, -0.6]}>
        <boxGeometry args={[5.7, 0.1, 0.1]} />
        <meshStandardMaterial color="#1a1a14" />
      </mesh>

      {/* P1 cannon (left) */}
      <group position={[-1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1.4, 8]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.55, -0.55]} ref={leftFlash}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0} />
        </mesh>
      </group>

      {/* P2 energy gun (right) */}
      <group position={[1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.28, 1.35]} />
          <meshStandardMaterial color="#2a4a55" metalness={0.7} roughness={0.3} emissive="#004466" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.55, -0.55]} ref={rightFlash}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#66eeff" transparent opacity={0} />
        </mesh>
      </group>

      {/* Gauge lights */}
      <mesh position={[-0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.35, 0.18, 0.08]} />
        <meshStandardMaterial color="#222" emissive="#ff3344" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.35, 0.18, 0.08]} />
        <meshStandardMaterial color="#222" emissive="#00ccff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
