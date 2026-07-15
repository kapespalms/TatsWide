import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Sparkles,
  Stars,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import * as THREE from 'three';
import type { CharacterId, ShooterKind, ShooterScores } from '../types';
import type { ShooterSegment } from '../shooter/types';
import { useShooterInput } from '../shooter/useShooterInput';
import { ShooterHUD } from '../shooter/ShooterHUD';
import { AdventureAudio } from '../run/AdventureAudio';

const LASER_GEO = new THREE.BoxGeometry(0.06, 0.06, 1);
const LASER_MAT_W = new THREE.MeshBasicMaterial({
  color: '#ff6644',
  transparent: true,
  depthWrite: false,
});
const LASER_MAT_T = new THREE.MeshBasicMaterial({
  color: '#66eeff',
  transparent: true,
  depthWrite: false,
});

interface Enemy {
  id: number;
  x: number;
  y: number;
  z: number;
  hp: number;
  kind: 'trex' | 'raptor' | 'alien' | 'crate' | 'heart' | 'bossHeart' | 'bossTrex' | 'bossAlien';
}

interface HitSpark {
  id: number;
  x: number;
  y: number;
  z: number;
  life: number;
}

interface ShooterPhaseProps {
  kind: ShooterKind;
  segment: ShooterSegment;
  level: number;
  intensity: number;
  playerCount: 1 | 2;
  primaryCharacter: CharacterId;
  embed?: boolean;
  boss?: boolean;
  onComplete: (result: { scores: ShooterScores; won: boolean; reason: string }) => void;
}

const JEEP_HP_MAX = 100;
const CAM_BASE = {
  jeep: { y: 1.42, z: 6.9, fov: 48 },
  space: { y: 1.52, z: 7.5, fov: 44 },
  cupid: { y: 1.48, z: 7.15, fov: 46 },
} as const;

export function ShooterPhase(props: ShooterPhaseProps) {
  const { kind, segment, level, intensity, playerCount, primaryCharacter, embed, boss, onComplete } = props;
  const [scores, setScores] = useState<ShooterScores>({ Wideass: 0, Tats: 0 });
  const [streaks, setStreaks] = useState<ShooterScores>({ Wideass: 0, Tats: 0 });
  const [kills, setKills] = useState(0);
  const killsCountRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(segment.durationSec);
  const [flash, setFlash] = useState('');
  const [jeepHp, setJeepHp] = useState(JEEP_HP_MAX);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [reticles, setReticles] = useState({
    Wideass: { x: 0.35, y: 0.5 },
    Tats: { x: 0.65, y: 0.5 },
  });
  const input = useShooterInput(true, playerCount, primaryCharacter);
  const finished = useRef(false);
  const scoresRef = useRef(scores);
  const jeepHpRef = useRef(jeepHp);
  const sfx = useRef<AdventureAudio | null>(null);
  if (!sfx.current) sfx.current = new AdventureAudio();
  scoresRef.current = scores;
  jeepHpRef.current = jeepHp;

  useEffect(() => {
    sfx.current?.unlock();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        sfx.current?.toggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      sfx.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      if (acc >= 50) {
        acc = 0;
        setReticles({ ...input.getReticles() });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [input]);

  const handleKill = useCallback((who: CharacterId, points: number, countsForQuota: boolean) => {
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
    if (countsForQuota) {
      killsCountRef.current += 1;
      setKills(killsCountRef.current);
    }
    setFlash(who);
    sfx.current?.kill();
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(''), 120);
    return () => window.clearTimeout(t);
  }, [flash]);

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

  const handleComplete = useCallback(
    (won: boolean, reason: string) => {
      if (finished.current) return;
      finished.current = true;
      onComplete({ scores: scoresRef.current, won, reason });
    },
    [onComplete],
  );

  useEffect(() => {
    if (kind === 'jeep' && jeepHp <= 0) {
      handleComplete(false, 'JEEP DESTROYED — RETRY!');
    }
  }, [jeepHp, kind, handleComplete]);

  useEffect(() => {
    if ((kind === 'space' || kind === 'cupid') && (p1Hp <= 0 || (playerCount === 2 && p2Hp <= 0))) {
      handleComplete(
        false,
        kind === 'cupid' ? 'HEART BARRAGE OVERWHELMED YOU — RETRY!' : 'SHIP HULL BREACHED — RETRY!',
      );
    }
  }, [kind, p1Hp, p2Hp, playerCount, handleComplete]);

  const base = CAM_BASE[kind];
  const cam = {
    position: [0, base.y, base.z] as [number, number, number],
    fov: base.fov,
  };

  return (
    <div className={embed ? 'relative h-full w-full bg-black' : 'relative min-h-screen bg-black'}>
      <div className="absolute inset-0">
        <Canvas shadows camera={cam} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshBasicMaterial color="#ffe14a" />
              </mesh>
            }
          >
            <ShooterWorld
              kind={kind}
              intensity={intensity}
              boss={!!boss}
              input={input}
              onKill={handleKill}
              onMissPass={handleMissPass}
              killsCountRef={killsCountRef}
              killQuota={segment.killQuota}
              durationSec={segment.durationSec}
              setTimeLeft={setTimeLeft}
              jeepHpRef={jeepHpRef}
              onComplete={handleComplete}
              onFire={() => (kind === 'cupid' ? sfx.current?.cupidPop() : sfx.current?.shoot())}
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
        primaryCharacter={primaryCharacter}
        reticles={reticles}
        flash={flash}
        streaks={streaks}
        jeepHp={jeepHp}
        jeepHpMax={JEEP_HP_MAX}
        p1Hp={p1Hp}
        p2Hp={p2Hp}
        boss={boss}
      />
    </div>
  );
}

const ShooterWorld = memo(function ShooterWorld({
  kind,
  intensity,
  boss,
  input,
  onKill,
  onMissPass,
  killsCountRef,
  killQuota,
  durationSec,
  setTimeLeft,
  jeepHpRef,
  onComplete,
  onFire,
}: {
  kind: ShooterKind;
  intensity: number;
  boss?: boolean;
  input: ReturnType<typeof useShooterInput>;
  onKill: (who: CharacterId, points: number, countsForQuota: boolean) => void;
  onMissPass: (damage: number) => void;
  killsCountRef: MutableRefObject<number>;
  killQuota: number;
  durationSec: number;
  setTimeLeft: (t: number) => void;
  jeepHpRef: MutableRefObject<number>;
  onComplete: (won: boolean, reason: string) => void;
  onFire: () => void;
}) {
  const enemies = useRef<Enemy[]>([]);
  const enemyMeshes = useRef<THREE.Group[]>([]);
  const root = useRef<THREE.Group>(null);
  const idRef = useRef(0);
  const spawnTimer = useRef(0);
  const timerAcc = useRef(0);
  // Owned only by the frame loop — never overwritten by React re-renders
  const timeRef = useRef(durationSec);
  const completed = useRef(false);
  const muzzle = useRef({ Wideass: 0, Tats: 0 });
  const lasers = useRef<
    { id: number; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; life: number; color: string }[]
  >([]);
  const roadScroll = useRef(0);
  const laserMeshes = useRef<THREE.Mesh[]>([]);
  const scratch = useRef(new THREE.Vector3());
  const ndcScratch = useRef(new THREE.Vector3());
  const hitSparks = useRef<HitSpark[]>([]);
  const sparkMeshes = useRef<THREE.Mesh[]>([]);

  useLayoutEffect(() => {
    return () => {
      for (const g of enemyMeshes.current) {
        disposeGroup(g);
        root.current?.remove(g);
      }
      enemyMeshes.current = [];
      for (const m of laserMeshes.current) {
        m.visible = false;
        root.current?.remove(m);
      }
      laserMeshes.current = [];
      for (const m of sparkMeshes.current) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
        root.current?.remove(m);
      }
      sparkMeshes.current = [];
      enemies.current = [];
      lasers.current = [];
      hitSparks.current = [];
    };
  }, []);

  useFrame((state, delta) => {
    if (completed.current) return;
    const dt = Math.min(delta, 0.05);
    const camBase = CAM_BASE[kind];

    // Slow, cinematic rail scroll — arcade cabinet timing, not twitch bullet hell
    roadScroll.current += dt * (kind === 'jeep' ? 9 : kind === 'cupid' ? 6.5 : 5);

    // Subtle dolly + sway — cinematic FOV already set on Camera
    const dolly = Math.sin(state.clock.elapsedTime * 0.22) * 0.18;
    if (kind === 'jeep') {
      const hurt = 1 - jeepHpRef.current / JEEP_HP_MAX;
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 1.1) * 0.03 * (1 + hurt * 2);
      state.camera.position.y = camBase.y + Math.sin(state.clock.elapsedTime * 1.6) * 0.02;
      state.camera.position.z = camBase.z + dolly + hurt * 0.12;
      state.camera.rotation.z = Math.sin(state.clock.elapsedTime * 0.9) * 0.008 * (1 + hurt);
    } else if (kind === 'cupid') {
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
      state.camera.position.y = camBase.y + Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
      state.camera.position.z = camBase.z + dolly * 0.85;
      state.camera.rotation.z = Math.sin(state.clock.elapsedTime * 0.55) * 0.012;
    } else {
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.05;
      state.camera.position.y = camBase.y + Math.sin(state.clock.elapsedTime * 0.7) * 0.025;
      state.camera.position.z = camBase.z + dolly * 0.7;
    }

    timerAcc.current += dt;
    if (timerAcc.current >= 1) {
      timerAcc.current -= 1;
      const next = Math.max(0, timeRef.current - 1);
      timeRef.current = next;
      setTimeLeft(next);
    }

    spawnTimer.current += dt;
    // Cap on-screen pressure so every target stays readable
    const maxLive = kind === 'jeep' ? 4 : kind === 'cupid' ? (boss ? 6 : 5) : 5;
    const spawnEvery = Math.max(
      0.85,
      (kind === 'jeep' ? 1.35 : kind === 'cupid' ? 1.15 : 1.5) - intensity * 0.12,
    );
    if (spawnTimer.current >= spawnEvery && enemies.current.length < maxLive) {
      spawnTimer.current = 0;
      const roll = Math.random();
      let ekind: Enemy['kind'] =
        kind === 'cupid' ? 'heart' : kind === 'space' ? 'alien' : 'trex';
      if (kind === 'jeep') {
        if (boss && roll < 0.2) ekind = 'bossTrex';
        else if (roll < 0.14) ekind = 'crate';
        else if (roll < 0.42) ekind = 'raptor';
        else ekind = 'trex';
      } else if (kind === 'space') {
        ekind = boss && roll < 0.22 ? 'bossAlien' : 'alien';
      } else if (kind === 'cupid') {
        ekind = boss && roll < 0.22 ? 'bossHeart' : 'heart';
      }
      // Lane-locked spawns so silhouettes don't stack into mush
      const lanes =
        kind === 'jeep' ? [-2.8, -1.1, 1.1, 2.8] : [-2.4, -0.8, 0.8, 2.4];
      const laneX = lanes[Math.floor(Math.random() * lanes.length)];
      enemies.current.push({
        id: idRef.current++,
        x: laneX + (Math.random() - 0.5) * 0.35,
        y:
          ekind === 'crate'
            ? -0.85
            : kind === 'jeep'
              ? -0.15 + (ekind === 'trex' ? 0 : 0.2)
              : (Math.random() - 0.5) * 1.8,
        z: -42 - Math.random() * 10,
        hp:
          ekind === 'bossTrex'
            ? 8
            : ekind === 'bossAlien'
              ? 6
              : ekind === 'trex'
                ? 3
                : ekind === 'raptor'
                  ? 2
                  : ekind === 'crate'
                    ? 1
                    : ekind === 'bossHeart'
                      ? 4
                      : ekind === 'heart'
                        ? 1
                        : 2,
        kind: ekind,
      });
    }

    const speed =
      (kind === 'space' ? 5.5 : kind === 'cupid' ? 5.8 : 4.6) + intensity * 0.9;
    const survivors: Enemy[] = [];
    for (const e of enemies.current) {
      e.z += speed * dt;
      // Mild side sway so motion feels alive without losing the silhouette
      e.x += Math.sin(state.clock.elapsedTime * 1.4 + e.id) * dt * (kind === 'cupid' ? 0.55 : 0.35);
      if (e.z >= 5.2) {
        if (e.kind !== 'crate') {
          onMissPass(
            e.kind === 'bossTrex' || e.kind === 'bossAlien'
              ? 12
              : e.kind === 'trex'
                ? 8
                : e.kind === 'bossHeart'
                  ? 10
                  : 5,
          );
        }
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
          e.kind === 'alien' || e.kind === 'bossAlien'
            ? buildAlienMesh(e.kind === 'bossAlien')
            : e.kind === 'raptor'
              ? buildRaptorMesh()
              : e.kind === 'crate'
                ? buildCrateMesh()
                : e.kind === 'heart' || e.kind === 'bossHeart'
                  ? buildHeartMesh(e.kind === 'bossHeart')
                  : buildTreXMesh(e.kind === 'bossTrex');
        g.userData.kind = e.kind;
        root.current?.add(g);
        enemyMeshes.current[i] = g;
      }
      g.visible = true;
      g.position.set(e.x, e.y, e.z);
      // Keep targets large and readable from spawn to impact
      const near = Math.min(1, Math.max(0, -e.z / 42));
      const scale =
        e.kind === 'bossTrex'
          ? 3.4 + (1 - near) * 1.4
          : e.kind === 'trex'
            ? 2.6 + (1 - near) * 1.1
            : e.kind === 'raptor'
              ? 1.7 + (1 - near) * 0.7
              : e.kind === 'bossAlien'
                ? 2.3 + (1 - near) * 1.1
                : e.kind === 'alien'
                  ? 1.55 + (1 - near) * 0.85
                  : e.kind === 'bossHeart'
                    ? 2.2 + (1 - near) * 1.0
                    : e.kind === 'heart'
                      ? 1.35 + (1 - near) * 0.75
                      : 1.15;
      g.scale.setScalar(scale);
      g.rotation.y = Math.sin(state.clock.elapsedTime * 1.2 + e.id) * 0.2;
      if (e.kind === 'trex' || e.kind === 'bossTrex' || e.kind === 'raptor') {
        g.rotation.x = Math.sin(state.clock.elapsedTime * 3 + e.id) * 0.04;
      }
      if (e.kind === 'heart' || e.kind === 'bossHeart') {
        g.rotation.z = Math.sin(state.clock.elapsedTime * 2.2 + e.id) * 0.18;
      }
    });

    const camera = state.camera;
    const fire = input.consumeFire();
    const ret = input.getReticles();

    const pushSpark = (x: number, y: number, z: number) => {
      hitSparks.current.push({ id: idRef.current++, x, y, z, life: 0.35 });
      if (hitSparks.current.length > 4) hitSparks.current.shift();
    };

    const checkHit = (who: CharacterId, nx: number, ny: number) => {
      muzzle.current[who] = 1;
      const color =
        kind === 'cupid'
          ? who === 'Wideass'
            ? '#ff6699'
            : '#ffaad4'
          : who === 'Wideass'
            ? '#ff6644'
            : '#66eeff';
      const ndc = ndcScratch.current.set(nx * 2 - 1, -(ny * 2 - 1), 0.85);
      ndc.unproject(camera);
      lasers.current.push({
        id: idRef.current++,
        x0: who === 'Wideass' ? -1.55 : 1.55,
        y0: -0.7,
        z0: 3.2,
        x1: ndc.x,
        y1: ndc.y,
        z1: ndc.z,
        life: 0.12,
        color,
      });

      for (let i = enemies.current.length - 1; i >= 0; i -= 1) {
        const e = enemies.current[i];
        const projected = scratch.current
          .set(
            e.x,
            e.y +
              (e.kind === 'trex' || e.kind === 'bossTrex'
                ? 1.2
                : e.kind === 'bossHeart'
                  ? 0.9
                  : e.kind === 'heart'
                    ? 0.5
                    : 0.4),
            e.z,
          )
          .project(camera);
        if (projected.z > 1) continue;
        const sx = projected.x * 0.5 + 0.5;
        const sy = -projected.y * 0.5 + 0.5;
        const dist = Math.hypot(sx - nx, sy - ny);
        const threshold =
          e.kind === 'bossTrex'
            ? 0.22
            : e.kind === 'trex'
              ? 0.18
              : e.kind === 'bossAlien'
                ? 0.2
                : e.kind === 'alien'
                  ? 0.15
                  : e.kind === 'crate'
                    ? 0.12
                    : e.kind === 'bossHeart'
                      ? 0.2
                      : e.kind === 'heart'
                        ? 0.16
                        : 0.14;
        if (dist < threshold && e.z > -48) {
          e.hp -= 1;
          pushSpark(e.x, e.y + 0.6, e.z);
          if (e.hp <= 0) {
            enemies.current.splice(i, 1);
            const g = enemyMeshes.current.splice(i, 1)[0];
            if (g) {
              disposeGroup(g);
              root.current?.remove(g);
            }
            const points =
              e.kind === 'bossTrex'
                ? 2500
                : e.kind === 'bossAlien'
                  ? 2000
                  : e.kind === 'trex'
                    ? 1000
                    : e.kind === 'raptor'
                      ? 600
                      : e.kind === 'crate'
                        ? 250
                        : e.kind === 'bossHeart'
                          ? 1500
                          : e.kind === 'heart'
                            ? 500
                            : 400;
            onKill(who, points, e.kind !== 'crate');
          }
          break;
        }
      }
    };

    if (fire.Wideass) {
      onFire();
      checkHit('Wideass', ret.Wideass.x, ret.Wideass.y);
      state.camera.rotation.z += (Math.random() - 0.5) * 0.004;
    }
    if (fire.Tats) {
      onFire();
      checkHit('Tats', ret.Tats.x, ret.Tats.y);
      state.camera.rotation.z += (Math.random() - 0.5) * 0.004;
    }

    muzzle.current.Wideass = Math.max(0, muzzle.current.Wideass - dt * 6);
    muzzle.current.Tats = Math.max(0, muzzle.current.Tats - dt * 6);

    lasers.current = lasers.current
      .map((l) => ({ ...l, life: l.life - dt }))
      .filter((l) => l.life > 0);

    hitSparks.current = hitSparks.current
      .map((s) => ({ ...s, life: s.life - dt }))
      .filter((s) => s.life > 0);

    // GPU sparks updated in-place — no React re-render storm
    while (sparkMeshes.current.length > hitSparks.current.length) {
      const m = sparkMeshes.current.pop();
      if (m) {
        m.visible = false;
        root.current?.remove(m);
      }
    }
    hitSparks.current.forEach((s, i) => {
      let mesh = sparkMeshes.current[i];
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 6, 6),
          new THREE.MeshBasicMaterial({
            color: kind === 'cupid' ? '#ff66aa' : kind === 'space' ? '#ff6644' : '#ffe14a',
            transparent: true,
            depthWrite: false,
          }),
        );
        root.current?.add(mesh);
        sparkMeshes.current[i] = mesh;
      }
      mesh.visible = true;
      mesh.position.set(s.x, s.y, s.z);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, s.life * 2.4);
      mesh.scale.setScalar(0.7 + s.life);
    });

    while (laserMeshes.current.length > lasers.current.length) {
      const m = laserMeshes.current.pop();
      if (m) {
        m.visible = false;
        root.current?.remove(m);
      }
    }
    lasers.current.forEach((l, i) => {
      let mesh = laserMeshes.current[i];
      if (!mesh) {
        mesh = new THREE.Mesh(
          LASER_GEO,
          l.color.startsWith('#ff') ? LASER_MAT_W : LASER_MAT_T,
        );
        root.current?.add(mesh);
        laserMeshes.current[i] = mesh;
      }
      mesh.visible = true;
      mesh.material = l.color.startsWith('#ff') ? LASER_MAT_W : LASER_MAT_T;
      const dx = l.x1 - l.x0;
      const dy = l.y1 - l.y0;
      const dz = l.z1 - l.z0;
      const len = Math.max(0.2, Math.hypot(dx, dy, dz));
      mesh.position.set((l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2, (l.z0 + l.z1) / 2);
      mesh.scale.set(1, 1, len);
      mesh.lookAt(l.x1, l.y1, l.z1);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, l.life * 8);
    });

    if (killsCountRef.current >= killQuota) {
      completed.current = true;
      onComplete(true, 'QUOTA CLEAR!');
    } else if (kind === 'jeep' && jeepHpRef.current <= 0) {
      completed.current = true;
      onComplete(false, 'JEEP DESTROYED — RETRY!');
    } else if (timeRef.current <= 0) {
      completed.current = true;
      // Last-frame grace: if quota already met via just-resolved kill, win
      if (killsCountRef.current >= killQuota) onComplete(true, 'QUOTA CLEAR!');
      else onComplete(false, 'TIME UP — RETRY!');
    }
  });

  return (
    <>
      <color
        attach="background"
        args={[kind === 'cupid' ? '#2a1028' : kind === 'space' ? '#1a1428' : '#0a1220']}
      />
      <fog
        attach="fog"
        args={[
          kind === 'cupid' ? '#3a1838' : kind === 'space' ? '#241830' : '#152030',
          42,
          kind === 'jeep' ? 95 : 88,
        ]}
      />
      {kind === 'cupid' ? (
        <CupidEnvironment />
      ) : kind === 'space' ? (
        <SpaceEnvironment />
      ) : (
        <JeepEnvironment scroll={roadScroll} />
      )}
      <group ref={root} />
      <VehicleInterior kind={kind} muzzle={muzzle} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={kind === 'cupid' ? 1.05 : kind === 'space' ? 0.85 : 0.55}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
});

/** Shared materials — never disposed per-instance (avoid leaks). */
const MAT = {
  alienBody: new THREE.MeshPhysicalMaterial({
    color: '#ff1a1a',
    emissive: '#ff2200',
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.15,
    clearcoat: 0.85,
    clearcoatRoughness: 0.2,
    sheen: 1,
    sheenColor: new THREE.Color('#ff8866'),
    sheenRoughness: 0.4,
  }),
  alienHead: new THREE.MeshPhysicalMaterial({
    color: '#ff5533',
    emissive: '#ffcc44',
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  }),
  alienGlow: new THREE.MeshPhysicalMaterial({
    color: '#ffff88',
    emissive: '#ffee55',
    emissiveIntensity: 2.4,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 1,
  }),
  trexSkin: new THREE.MeshPhysicalMaterial({
    color: '#5f8a3c',
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.6,
    sheenColor: new THREE.Color('#a8c878'),
  }),
  trexBelly: new THREE.MeshPhysicalMaterial({
    color: '#e8dcb8',
    roughness: 0.65,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
  }),
  trexStripe: new THREE.MeshPhysicalMaterial({
    color: '#2a1c10',
    roughness: 0.7,
    metalness: 0.08,
    clearcoat: 0.2,
  }),
  trexEye: new THREE.MeshPhysicalMaterial({
    color: '#ffff66',
    emissive: '#ff9900',
    emissiveIntensity: 3.2,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1,
  }),
  raptor: new THREE.MeshPhysicalMaterial({
    color: '#4e7a32',
    roughness: 0.5,
    metalness: 0.06,
    clearcoat: 0.4,
    clearcoatRoughness: 0.4,
    sheen: 0.5,
    sheenColor: new THREE.Color('#88bb55'),
  }),
  raptorAccent: new THREE.MeshPhysicalMaterial({
    color: '#c04028',
    emissive: '#aa1810',
    emissiveIntensity: 0.55,
    roughness: 0.4,
    metalness: 0.15,
    clearcoat: 0.5,
  }),
  raptorEye: new THREE.MeshPhysicalMaterial({
    color: '#ff2200',
    emissive: '#ff2200',
    emissiveIntensity: 2.6,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 1,
  }),
  crate: new THREE.MeshPhysicalMaterial({
    color: '#6a6e72',
    roughness: 0.35,
    metalness: 0.85,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  }),
  crateStripe: new THREE.MeshPhysicalMaterial({
    color: '#f0c020',
    emissive: '#aa8800',
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.7,
    clearcoat: 0.8,
  }),
  alienHalo: new THREE.MeshBasicMaterial({ color: '#ff4422', transparent: true, opacity: 0.14, depthWrite: false }),
  trexRim: new THREE.MeshBasicMaterial({ color: '#88ff66', transparent: true, opacity: 0.08, depthWrite: false }),
  raptorRim: new THREE.MeshBasicMaterial({ color: '#ff8844', transparent: true, opacity: 0.1, depthWrite: false }),
  heartBody: new THREE.MeshPhysicalMaterial({
    color: '#ff3366',
    emissive: '#ff1166',
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.12,
    clearcoat: 0.95,
    clearcoatRoughness: 0.15,
    sheen: 1,
    sheenColor: new THREE.Color('#ffc0d8'),
    sheenRoughness: 0.35,
  }),
  bossHeartBody: new THREE.MeshPhysicalMaterial({
    color: '#ff88cc',
    emissive: '#ff44aa',
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  }),
  heartGlow: new THREE.MeshBasicMaterial({ color: '#ff99cc', transparent: true, opacity: 0.18, depthWrite: false }),
};

function disposeGroup(g: THREE.Group) {
  // Shared materials — only dispose unique geometries on this instance
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry?.dispose();
  });
}

function buildHeartMesh(boss = false) {
  const g = new THREE.Group();
  const mat = boss ? MAT.bossHeartBody : MAT.heartBody;
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), mat);
  left.position.set(-0.32, 0.25, 0);
  left.castShadow = true;
  const right = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), mat);
  right.position.set(0.32, 0.25, 0);
  right.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.05, 4), mat);
  tip.rotation.z = Math.PI;
  tip.position.set(0, -0.35, 0);
  tip.castShadow = true;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(boss ? 1.55 : 1.15, 14, 14), MAT.heartGlow);
  glow.position.y = 0.05;
  g.add(left, right, tip, glow);
  return g;
}

function buildAlienMesh(boss = false) {
  const g = new THREE.Group();
  if (boss) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), MAT.alienHead);
    core.castShadow = true;
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 0), MAT.alienHalo);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.08, 8, 32), MAT.alienGlow);
    ring.rotation.x = Math.PI / 2;
    g.add(core, shell, ring);
    return g;
  }
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), MAT.alienBody);
  body.scale.set(1.15, 0.85, 1.4);
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), MAT.alienHead);
  head.position.set(0, 0.55, 0.55);
  head.castShadow = true;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), MAT.alienGlow);
  eyeL.position.set(-0.18, 0.65, 0.9);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  for (let i = 0; i < 4; i += 1) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.85, 6, 10), MAT.alienBody);
    const side = i < 2 ? -1 : 1;
    const row = i % 2;
    leg.position.set(side * 0.7, -0.35, -0.2 + row * 0.55);
    leg.rotation.z = side * 0.7;
    leg.rotation.x = 0.35;
    leg.castShadow = true;
    g.add(leg);
  }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 16), MAT.alienHalo);
  g.add(body, head, eyeL, eyeR, halo);
  return g;
}

function buildTreXMesh(boss = false) {
  const g = new THREE.Group();
  if (boss) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 1.6, 8, 16), MAT.trexSkin);
    body.position.set(0, 1.9, 0);
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.1), MAT.trexSkin);
    head.position.set(1.6, 3.1, 0);
    head.castShadow = true;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), MAT.trexEye);
    eye.position.set(2.2, 3.25, 0.4);
    const eye2 = eye.clone();
    eye2.position.z = -0.4;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.2), MAT.trexStripe);
    plate.position.set(0, 2.7, 0);
    g.add(body, head, eye, eye2, plate);
    return g;
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 1.1, 8, 16), MAT.trexSkin);
  torso.position.set(0, 1.55, 0);
  torso.scale.set(1.15, 1, 0.95);
  torso.castShadow = true;
  const bellyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.7, 6, 12), MAT.trexBelly);
  bellyMesh.position.set(0.25, 1.4, 0.25);
  bellyMesh.scale.set(1, 1.1, 0.85);
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 1.5, 4, 10), MAT.trexStripe);
  stripe.position.set(0, 2.15, 0);
  stripe.rotation.z = Math.PI / 2;
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 6, 12), MAT.trexSkin);
  neck.position.set(1.0, 2.45, 0);
  neck.rotation.z = -0.45;
  neck.castShadow = true;
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.55, 6, 14), MAT.trexSkin);
  head.position.set(1.85, 2.85, 0);
  head.rotation.z = -0.15;
  head.scale.set(1.4, 0.95, 0.9);
  head.castShadow = true;
  const jaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 4, 10), MAT.trexBelly);
  jaw.position.set(2.05, 2.42, 0);
  jaw.rotation.z = 0.2;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), MAT.trexEye);
  eye.position.set(2.05, 3.05, 0.35);
  const eye2 = eye.clone();
  eye2.position.z = -0.35;
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 10), MAT.trexSkin);
  thigh.position.set(-0.15, 0.6, 0.3);
  thigh.castShadow = true;
  const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.4, 4, 10), MAT.trexSkin);
  calf.position.set(0.15, 0.15, 0.4);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), MAT.trexSkin);
  arm.position.set(0.85, 1.65, 0.55);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.6, 4, 10), MAT.trexSkin);
  tail.position.set(-1.65, 1.45, 0);
  tail.rotation.z = 0.28;
  tail.castShadow = true;
  const rim = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), MAT.trexRim);
  rim.position.y = 1.4;
  g.add(torso, bellyMesh, stripe, neck, head, jaw, eye, eye2, thigh, calf, arm, tail, rim);
  return g;
}

function buildRaptorMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.55, 6, 14), MAT.raptor);
  body.position.y = 0.85;
  body.scale.set(1.4, 1, 0.9);
  body.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.9, 4, 8), MAT.raptorAccent);
  stripe.position.set(0, 1.1, 0);
  stripe.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.28, 6, 12), MAT.raptor);
  head.position.set(0.7, 1.2, 0);
  head.scale.set(1.3, 1, 0.95);
  head.castShadow = true;
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), MAT.raptorAccent);
  crest.position.set(0.85, 1.45, 0);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), MAT.raptorEye);
  eye.position.set(0.9, 1.3, 0.18);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.4, 4, 8), MAT.raptor);
  leg.position.set(-0.1, 0.3, 0.18);
  const leg2 = leg.clone();
  leg2.position.z = -0.18;
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), MAT.raptorRim);
  rim.position.y = 0.8;
  g.add(body, stripe, head, crest, eye, leg, leg2, rim);
  return g;
}

function buildCrateMesh() {
  const g = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), MAT.crate);
  crate.castShadow = true;
  crate.receiveShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.18, 1.08), MAT.crateStripe);
  stripe.position.y = 0.15;
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.18, 1.08), MAT.crateStripe);
  stripe2.position.y = -0.2;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 1.05), MAT.crateStripe);
  g.add(crate, stripe, stripe2, cross);
  return g;
}

function CupidEnvironment() {
  return (
    <>
      {/* Local lights only — no CDN HDR Environment (cabinet / offline safe) */}
      <ambientLight intensity={0.7} color="#ffd0e8" />
      <directionalLight
        position={[4, 8, 2]}
        intensity={1.35}
        color="#ffb0d0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <pointLight position={[-3, 2, 4]} intensity={1.5} color="#ff66aa" />
      <pointLight position={[3, 1.5, 2]} intensity={1.0} color="#ffe14a" />
      <hemisphereLight args={['#ff99cc', '#2a1020', 0.45]} />
      <Stars radius={90} depth={50} count={700} factor={3.2} saturation={0.6} fade speed={0.6} />
      <Sparkles count={28} scale={[18, 10, 28]} size={3.5} speed={0.55} color="#ff99cc" opacity={0.4} />
      <mesh position={[0, 2.2, -18]}>
        <torusGeometry args={[3.2, 0.08, 8, 48]} />
        <meshBasicMaterial color="#ff66aa" transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, -8]} receiveShadow>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color="#2a1430" roughness={0.72} metalness={0.28} />
      </mesh>
      <ContactShadows position={[0, -1.38, -4]} opacity={0.4} scale={20} blur={2.2} far={14} color="#1a0818" />
    </>
  );
}

function SpaceEnvironment() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffd8a8" />
      <hemisphereLight args={['#88aaff', '#120818', 0.55]} />
      <directionalLight
        position={[8, 10, 4]}
        intensity={1.55}
        color="#ffb070"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-7, 4, -6]} intensity={0.85} color="#88aaff" />
      <pointLight position={[0, 4, 3]} intensity={1.3} color="#a8d8ff" />
      <pointLight position={[-6, 2, -12]} intensity={1.5} color="#ff6644" />
      <spotLight position={[4, 8, 2]} angle={0.4} penumbra={0.6} intensity={1.1} color="#ffcc88" />

      <Stars radius={90} depth={60} count={800} factor={3.2} saturation={0.3} fade speed={0.6} />

      <mesh position={[-11, 3.5, -38]} castShadow>
        <boxGeometry args={[7, 14, 4]} />
        <meshStandardMaterial color="#4a5568" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[1, 6, -42]} castShadow>
        <boxGeometry args={[5, 18, 5]} />
        <meshStandardMaterial
          color="#3a4455"
          metalness={0.6}
          roughness={0.35}
          emissive="#224466"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[12, 4, -36]} castShadow>
        <boxGeometry args={[7, 12, 4]} />
        <meshStandardMaterial color="#556070" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[-10, 9.5, -35.5]}>
        <boxGeometry args={[3.2, 0.55, 0.2]} />
        <meshStandardMaterial color="#111" emissive="#ffe14a" emissiveIntensity={1.1} metalness={0.4} roughness={0.3} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -6]} receiveShadow>
        <planeGeometry args={[28, 90]} />
        <meshStandardMaterial color="#3a4555" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, -6]} receiveShadow>
        <planeGeometry args={[9, 90]} />
        <meshStandardMaterial color="#5a6678" metalness={0.45} roughness={0.45} />
      </mesh>

      <ContactShadows position={[0, -1.48, -4]} opacity={0.4} scale={28} blur={2.2} far={18} color="#0a0812" />
    </>
  );
}

function JeepEnvironment({ scroll }: { scroll: MutableRefObject<number> }) {
  const trees = useRef<THREE.Group>(null);
  const stripes = useRef<THREE.Mesh>(null);
  const rocks = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = scroll.current;
    if (trees.current) {
      trees.current.children.forEach((c, i) => {
        const base = -6 - (i % 6) * 7.5;
        c.position.z = ((base + s) % 48) - 42;
      });
    }
    if (rocks.current) {
      rocks.current.children.forEach((c, i) => {
        const base = -8 - i * 5;
        c.position.z = ((base + s) % 50) - 45;
      });
    }
    if (stripes.current) {
      stripes.current.position.z = -8 + (s % 6);
    }
  });

  return (
    <>
      {/* Local lights only — cabinet / offline safe */}
      <ambientLight intensity={0.35} color="#a8b8d8" />
      <hemisphereLight args={['#c8d8ff', '#1a1008', 0.4]} />
      <directionalLight
        position={[-6, 16, -4]}
        intensity={0.75}
        color="#d0e0ff"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <pointLight position={[8, 12, -30]} intensity={1.8} color="#fff6d0" distance={80} />
      <pointLight position={[-18, 6, -28]} intensity={3.2} color="#ff5522" distance={50} />
      <pointLight position={[0, 5, -2]} intensity={0.9} color="#c8d8ff" />
      <spotLight position={[0, 7, 5]} angle={0.5} penumbra={0.55} intensity={1.6} color="#ffe8b0" />
      <pointLight position={[7.5, 2.5, -10]} intensity={1.4} color="#ff44aa" />
      <pointLight position={[-7.5, 2.5, -10]} intensity={1.2} color="#8844ff" />

      {/* Moon */}
      <mesh position={[10, 14, -42]}>
        <sphereGeometry args={[4.4, 32, 32]} />
        <meshPhysicalMaterial
          color="#fff8e0"
          emissive="#ffe8b0"
          emissiveIntensity={0.85}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      <mesh position={[10, 14, -42]}>
        <sphereGeometry args={[5.4, 24, 24]} />
        <meshBasicMaterial color="#ddeeff" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {/* Volcano */}
      <mesh position={[-18, 2, -34]} castShadow>
        <coneGeometry args={[5, 12, 16]} />
        <meshPhysicalMaterial color="#1a1008" emissive="#ff3300" emissiveIntensity={0.65} roughness={0.85} />
      </mesh>
      <mesh position={[-18, 8.5, -34]}>
        <sphereGeometry args={[2.3, 16, 16]} />
        <meshPhysicalMaterial
          color="#ff8800"
          emissive="#ff4400"
          emissiveIntensity={1.8}
          transparent
          opacity={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Neon facility rails */}
      <mesh position={[7.5, 1.5, -18]}>
        <boxGeometry args={[0.22, 3.2, 40]} />
        <meshPhysicalMaterial color="#220022" emissive="#ff44aa" emissiveIntensity={1.5} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-7.5, 1.5, -18]}>
        <boxGeometry args={[0.22, 3.2, 40]} />
        <meshPhysicalMaterial color="#220022" emissive="#8844ff" emissiveIntensity={1.3} metalness={0.4} roughness={0.3} />
      </mesh>

      <group ref={trees}>
        {Array.from({ length: 12 }, (_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const z = -6 - (i % 6) * 7.5;
          const x = side * (5.8 + (i % 3) * 1.1);
          return (
            <group key={`tree-${i}`} position={[x, 0, z]}>
              <mesh position={[0, 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.38, 3.6, 8]} />
                <meshStandardMaterial color="#1a1208" roughness={0.85} />
              </mesh>
              <mesh position={[0, 4.1, 0]} castShadow>
                <sphereGeometry args={[1.55, 10, 10]} />
                <meshStandardMaterial color="#0e3824" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Soft road deck — standard materials for mid-tier GPU headroom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, -8]} receiveShadow>
        <planeGeometry args={[18, 100]} />
        <meshStandardMaterial color="#2a1c10" roughness={0.88} metalness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.325, -8]} receiveShadow>
        <planeGeometry args={[5.8, 100]} />
        <meshStandardMaterial color="#3a2818" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh ref={stripes} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, -8]}>
        <planeGeometry args={[0.4, 100]} />
        <meshPhysicalMaterial color="#c9a227" emissive="#886600" emissiveIntensity={0.55} metalness={0.4} roughness={0.4} />
      </mesh>

      <group ref={rocks}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={`rock-${i}`}
            castShadow
            position={[(i % 2 === 0 ? -1 : 1) * (3.2 + (i % 3) * 0.4), -0.7, -8 - i * 5]}
          >
            <dodecahedronGeometry args={[0.55 + (i % 3) * 0.15, 0]} />
            <meshPhysicalMaterial color="#2a2420" roughness={0.8} clearcoat={0.2} metalness={0.1} />
          </mesh>
        ))}
      </group>

      <ContactShadows position={[0, -1.32, -4]} opacity={0.55} scale={22} blur={2.2} far={16} color="#050308" />
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
          <meshPhysicalMaterial color="#223344" metalness={0.75} roughness={0.25} clearcoat={0.7} />
        </mesh>
        <mesh position={[-1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshPhysicalMaterial color="#555555" emissive="#00ffff" emissiveIntensity={0.45} metalness={0.6} roughness={0.3} clearcoat={0.5} />
        </mesh>
        <mesh position={[1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshPhysicalMaterial color="#555555" emissive="#ff4444" emissiveIntensity={0.45} metalness={0.6} roughness={0.3} clearcoat={0.5} />
        </mesh>
        <mesh position={[-1.55, 0.85, 0.15]} ref={leftFlash}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color="#66eeff" transparent opacity={0} />
        </mesh>
        <mesh position={[1.55, 0.85, 0.15]} ref={rightFlash}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color="#ff6644" transparent opacity={0} />
        </mesh>
      </group>
    );
  }

  if (kind === 'cupid') {
    return (
      <group position={[0, -1.7, 3.1]}>
        <mesh>
          <boxGeometry args={[6.8, 1.1, 2.4]} />
          <meshPhysicalMaterial color="#3a1830" metalness={0.55} roughness={0.3} clearcoat={0.75} />
        </mesh>
        <mesh position={[-1.35, 0.55, 0.85]}>
          <boxGeometry args={[0.45, 0.35, 1.15]} />
          <meshPhysicalMaterial color="#552244" emissive="#ff66aa" emissiveIntensity={0.7} metalness={0.5} roughness={0.25} clearcoat={0.6} />
        </mesh>
        <mesh position={[1.35, 0.55, 0.85]}>
          <boxGeometry args={[0.45, 0.35, 1.15]} />
          <meshPhysicalMaterial color="#442255" emissive="#ffe14a" emissiveIntensity={0.55} metalness={0.5} roughness={0.25} clearcoat={0.6} />
        </mesh>
        <mesh position={[-1.55, 0.9, 0.2]} ref={leftFlash}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color="#ff99cc" transparent opacity={0} />
        </mesh>
        <mesh position={[1.55, 0.9, 0.2]} ref={rightFlash}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color="#ffe14a" transparent opacity={0} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, -1.55, 3.4]}>
      <mesh position={[0, 0.15, 0.2]}>
        <boxGeometry args={[6.5, 0.35, 2.8]} />
        <meshPhysicalMaterial color="#3a4a28" metalness={0.45} roughness={0.4} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.45, -0.4]}>
        <boxGeometry args={[6.2, 0.25, 0.9]} />
        <meshPhysicalMaterial color="#2a3220" metalness={0.55} roughness={0.35} clearcoat={0.6} />
      </mesh>

      <mesh position={[-2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshPhysicalMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshPhysicalMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.85, -0.6]}>
        <boxGeometry args={[5.7, 0.1, 0.1]} />
        <meshPhysicalMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>

      <group position={[-1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1.4, 16]} />
          <meshPhysicalMaterial color="#3a3a3a" metalness={0.9} roughness={0.18} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 0.55, -0.55]} ref={leftFlash}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0} />
        </mesh>
      </group>

      <group position={[1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.28, 1.35]} />
          <meshPhysicalMaterial
            color="#2a4a55"
            metalness={0.8}
            roughness={0.22}
            clearcoat={0.7}
            emissive="#004466"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0.55, -0.55]} ref={rightFlash}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#66eeff" transparent opacity={0} />
        </mesh>
      </group>

      <mesh position={[-0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.35, 0.18, 0.08]} />
        <meshPhysicalMaterial color="#222" emissive="#ff3344" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.35, 0.18, 0.08]} />
        <meshPhysicalMaterial color="#222" emissive="#00ccff" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}
