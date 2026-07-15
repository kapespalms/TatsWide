import { Canvas, useFrame } from '@react-three/fiber';
import {
  Sparkles,
  Stars
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
  type MutableRefObject
} from 'react';
import * as THREE from 'three';
import type { CharacterId, ShooterKind, ShooterScores } from '../types';
import type { ShooterSegment } from '../shooter/types';
import { useShooterInput } from '../shooter/useShooterInput';
import { ShooterHUD } from '../shooter/ShooterHUD';
import { AdventureAudio } from '../run/AdventureAudio';

const LASER_GEO = new THREE.BoxGeometry(0.06, 0.06, 1);
const SPARK_GEO = new THREE.SphereGeometry(0.18, 6, 6);
const LASER_MAT_W = new THREE.MeshBasicMaterial({
  color: '#ff6644',
  transparent: true,
  depthWrite: false
});
const LASER_MAT_T = new THREE.MeshBasicMaterial({
  color: '#66eeff',
  transparent: true,
  depthWrite: false
});

interface Enemy {
  id: number;
  x: number;
  y: number;
  z: number;
  hp: number;
  speedMul: number;
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
  cupid: { y: 1.48, z: 7.15, fov: 46 }
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
    Tats: { x: 0.65, y: 0.5 }
  });
  const [paused, setPaused] = useState(false);
  const input = useShooterInput(!paused, playerCount, primaryCharacter);
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
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      sfx.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (paused) sfx.current?.stopMusic();
    else if (!AdventureAudio.readSessionMuted()) sfx.current?.startMusic();
  }, [paused]);

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
    fov: base.fov
  };

  return (
    <div className={embed ? 'relative h-full w-full bg-black' : 'relative min-h-screen bg-black'}>
      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={cam}
          gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.08;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
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
              paused={paused}
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
      {paused ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="border-2 border-[#ffe14a] bg-black/90 px-10 py-6 text-center shadow-[0_8px_0_#101018]">
            <p className="wa-display text-2xl tracking-[0.2em] text-[#ffe14a]">PAUSED</p>
            <p className="mt-2 text-xs font-black tracking-wide text-white/85">ESC / P RESUME · M MUTE</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const ShooterWorld = memo(function ShooterWorld({
  kind,
  intensity,
  boss,
  paused = false,
  input,
  onKill,
  onMissPass,
  killsCountRef,
  killQuota,
  durationSec,
  setTimeLeft,
  jeepHpRef,
  onComplete,
  onFire
}: {
  kind: ShooterKind;
  intensity: number;
  boss?: boolean;
  paused?: boolean;
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
  const bossAlive = useRef(false);
  const bossSeeded = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
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
    if (completed.current || pausedRef.current) return;
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
    bossAlive.current = enemies.current.some(
      (e) => e.kind === 'bossTrex' || e.kind === 'bossAlien' || e.kind === 'bossHeart',
    );
    const forceBoss = !!(boss && !bossSeeded.current);
    const canSpawn =
      forceBoss || (spawnTimer.current >= spawnEvery && enemies.current.length < maxLive);
    if (canSpawn && enemies.current.length < maxLive + (forceBoss ? 1 : 0)) {
      spawnTimer.current = 0;
      const roll = Math.random();
      let ekind: Enemy['kind'] =
        kind === 'cupid' ? 'heart' : kind === 'space' ? 'alien' : 'trex';
      if (forceBoss || (boss && !bossAlive.current && roll < 0.28)) {
        ekind = kind === 'jeep' ? 'bossTrex' : kind === 'space' ? 'bossAlien' : 'bossHeart';
        bossSeeded.current = true;
        bossAlive.current = true;
      } else if (kind === 'jeep') {
        if (roll < 0.14) ekind = 'crate';
        else if (roll < 0.42) ekind = 'raptor';
        else ekind = 'trex';
      } else if (kind === 'space') {
        ekind = 'alien';
      } else {
        ekind = 'heart';
      }
      // Lane-locked spawns so silhouettes don't stack into mush
      const lanes =
        kind === 'jeep' ? [-2.8, -1.1, 1.1, 2.8] : [-2.4, -0.8, 0.8, 2.4];
      const laneX = forceBoss ? 0 : lanes[Math.floor(Math.random() * lanes.length)];
      enemies.current.push({
        id: idRef.current++,
        x: laneX + (forceBoss ? 0 : (Math.random() - 0.5) * 0.35),
        y:
          ekind === 'crate'
            ? -0.85
            : kind === 'jeep'
              ? -0.15 + (ekind === 'trex' || ekind === 'bossTrex' ? 0 : 0.15)
              : (Math.random() - 0.5) * 1.8,
        z: forceBoss ? -42 : -48 - Math.random() * 14,
        hp:
          ekind === 'bossTrex'
            ? 14
            : ekind === 'bossAlien'
              ? 12
              : ekind === 'trex'
                ? 3
                : ekind === 'raptor'
                  ? 2
                  : ekind === 'crate'
                    ? 1
                    : ekind === 'bossHeart'
                      ? 10
                      : ekind === 'heart'
                        ? 1
                        : 2,
        // Charge at readable, varied pace — raptors sprint, T-Rex stomp
        speedMul:
          ekind === 'raptor'
            ? 1.35 + Math.random() * 0.45
            : ekind === 'trex'
              ? 0.72 + Math.random() * 0.35
              : ekind === 'bossTrex'
                ? 0.55 + Math.random() * 0.2
                : ekind === 'crate'
                  ? 0.9
                  : 0.95 + Math.random() * 0.35,
        kind: ekind
      });
    }

    const baseSpeed =
      (kind === 'space' ? 5.5 : kind === 'cupid' ? 5.8 : 5.2) + intensity * 0.75;
    const survivors: Enemy[] = [];
    for (const e of enemies.current) {
      e.z += baseSpeed * e.speedMul * dt;
      // Mild side sway so motion feels alive without losing the silhouette
      e.x += Math.sin(state.clock.elapsedTime * 1.4 + e.id) * dt * (kind === 'cupid' ? 0.55 : 0.25);
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
      const near = Math.min(1, Math.max(0, -e.z / 50));
      const scale =
        e.kind === 'bossTrex'
          ? 3.6 + (1 - near) * 1.5
          : e.kind === 'trex'
            ? 2.85 + (1 - near) * 1.25
            : e.kind === 'raptor'
              ? 1.85 + (1 - near) * 0.8
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
      if (e.kind === 'trex' || e.kind === 'bossTrex' || e.kind === 'raptor') {
        // Face the camera (charge toward jeep) + stomp bob
        g.rotation.y = Math.PI + Math.sin(state.clock.elapsedTime * 2.4 + e.id) * 0.06;
        g.position.y = e.y + Math.abs(Math.sin(state.clock.elapsedTime * (4 + e.speedMul * 2) + e.id)) * 0.12;
        g.rotation.x = Math.sin(state.clock.elapsedTime * 5 + e.id) * 0.05;
      } else if (e.kind === 'heart' || e.kind === 'bossHeart') {
        g.rotation.y = Math.sin(state.clock.elapsedTime * 1.2 + e.id) * 0.2;
        g.rotation.z = Math.sin(state.clock.elapsedTime * 2.2 + e.id) * 0.18;
      } else {
        g.rotation.y = Math.sin(state.clock.elapsedTime * 1.2 + e.id) * 0.2;
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
        color
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

    for (let i = lasers.current.length - 1; i >= 0; i -= 1) {
      lasers.current[i].life -= dt;
      if (lasers.current[i].life <= 0) lasers.current.splice(i, 1);
    }
    for (let i = hitSparks.current.length - 1; i >= 0; i -= 1) {
      hitSparks.current[i].life -= dt;
      if (hitSparks.current[i].life <= 0) hitSparks.current.splice(i, 1);
    }

    // GPU sparks updated in-place — no React re-render storm
    while (sparkMeshes.current.length > hitSparks.current.length) {
      const m = sparkMeshes.current.pop();
      if (m) {
        (m.material as THREE.Material).dispose();
        root.current?.remove(m);
      }
    }
    hitSparks.current.forEach((s, i) => {
      let mesh = sparkMeshes.current[i];
      if (!mesh) {
        mesh = new THREE.Mesh(
          SPARK_GEO,
          new THREE.MeshBasicMaterial({
            color: kind === 'cupid' ? '#ff66aa' : kind === 'space' ? '#ff6644' : '#ffe14a',
            transparent: true,
            depthWrite: false
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
        (m.material as THREE.Material).dispose();
        root.current?.remove(m);
      }
    }
    lasers.current.forEach((l, i) => {
      let mesh = laserMeshes.current[i];
      const wantW = l.color.startsWith('#ff');
      if (!mesh) {
        // Per-beam material clone — shared mats can't fade independently
        const mat = (wantW ? LASER_MAT_W : LASER_MAT_T).clone();
        mesh = new THREE.Mesh(LASER_GEO, mat);
        root.current?.add(mesh);
        laserMeshes.current[i] = mesh;
      } else {
        (mesh.material as THREE.MeshBasicMaterial).color.copy(
          wantW ? LASER_MAT_W.color : LASER_MAT_T.color,
        );
      }
      mesh.visible = true;
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
        args={[kind === 'jeep' ? '#87b8e8' : kind === 'cupid' ? '#2a1028' : '#1a1428']}
      />
      <fog
        attach="fog"
        args={[
          kind === 'jeep' ? '#c8e0a8' : kind === 'cupid' ? '#3a1838' : '#241830',
          kind === 'jeep' ? 28 : 42,
          kind === 'jeep' ? 110 : 88,
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
      {kind !== 'jeep' ? (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={kind === 'cupid' ? 0.5 : 0.4}
            luminanceThreshold={0.58}
            luminanceSmoothing={0.5}
            mipmapBlur={false}
          />
        </EffectComposer>
      ) : null}
    </>
  );
});

/** Shared materials — never disposed per-instance (avoid leaks). */
const MAT = {
  alienBody: new THREE.MeshStandardMaterial({
    color: '#ff1a1a',
    emissive: '#ff2200',
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.15
  }),
  alienHead: new THREE.MeshStandardMaterial({
    color: '#ff5533',
    emissive: '#ffcc44',
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.1
  }),
  alienGlow: new THREE.MeshStandardMaterial({
    color: '#ffff88',
    emissive: '#ffee55',
    emissiveIntensity: 2.4,
    roughness: 0.15,
    metalness: 0.05
  }),
  trexSkin: new THREE.MeshStandardMaterial({
    color: '#5f8a3c',
    roughness: 0.55,
    metalness: 0.05
  }),
  trexBelly: new THREE.MeshStandardMaterial({
    color: '#e8dcb8',
    roughness: 0.65,
    metalness: 0.02
  }),
  trexStripe: new THREE.MeshStandardMaterial({
    color: '#2a1c10',
    roughness: 0.7,
    metalness: 0.08
  }),
  trexEye: new THREE.MeshStandardMaterial({
    color: '#ffffaa',
    emissive: '#cc7700',
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.05
  }),
  raptor: new THREE.MeshStandardMaterial({
    color: '#5a8a38',
    roughness: 0.55,
    metalness: 0.04
  }),
  raptorAccent: new THREE.MeshStandardMaterial({
    color: '#8a4028',
    emissive: '#401808',
    emissiveIntensity: 0.15,
    roughness: 0.5,
    metalness: 0.08
  }),
  raptorEye: new THREE.MeshStandardMaterial({
    color: '#ffcc44',
    emissive: '#aa4400',
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.05
  }),
  crate: new THREE.MeshStandardMaterial({
    color: '#6a6e72',
    roughness: 0.35,
    metalness: 0.85
  }),
  crateStripe: new THREE.MeshStandardMaterial({
    color: '#f0c020',
    emissive: '#aa8800',
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.7
  }),
  alienHalo: new THREE.MeshBasicMaterial({ color: '#ff4422', transparent: true, opacity: 0.14, depthWrite: false }),
  trexRim: new THREE.MeshBasicMaterial({ color: '#88ff66', transparent: true, opacity: 0.0, depthWrite: false }),
  raptorRim: new THREE.MeshBasicMaterial({ color: '#ff8844', transparent: true, opacity: 0.0, depthWrite: false }),
  heartBody: new THREE.MeshStandardMaterial({
    color: '#ff3366',
    emissive: '#ff1166',
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.12
  }),
  bossHeartBody: new THREE.MeshStandardMaterial({
    color: '#ff88cc',
    emissive: '#ff44aa',
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.35
  }),
  heartGlow: new THREE.MeshBasicMaterial({ color: '#ff99cc', transparent: true, opacity: 0.18, depthWrite: false })
};

function disposeGroup(g: THREE.Group) {
  // Shared materials — only dispose unique geometries on this instance
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry?.dispose();
  });
}

function makeWordHeartTexture(word: 'WIDEASS' | 'TATS') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = word === 'WIDEASS' ? '#d03040' : '#2090b8';
  ctx.beginPath();
  ctx.moveTo(128, 110);
  ctx.bezierCurveTo(40, 60, 40, 20, 128, 45);
  ctx.bezierCurveTo(216, 20, 216, 60, 128, 110);
  ctx.fill();
  // 3×5 pixel glyphs — never canvas AA text
  const GLYPHS: Record<string, number[]> = {
    A: [0b010, 0b101, 0b111, 0b101, 0b101],
    D: [0b110, 0b101, 0b101, 0b101, 0b110],
    E: [0b111, 0b100, 0b110, 0b100, 0b111],
    I: [0b111, 0b010, 0b010, 0b010, 0b111],
    S: [0b011, 0b100, 0b010, 0b001, 0b110],
    T: [0b111, 0b010, 0b010, 0b010, 0b010],
    W: [0b101, 0b101, 0b101, 0b111, 0b101],
  };
  const scale = 4;
  const glyphW = 4 * scale;
  const total = word.length * glyphW;
  let x = Math.floor((256 - total) / 2);
  const oy = 42;
  for (const ch of word) {
    const g = GLYPHS[ch] ?? [0, 0, 0, 0, 0];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (g[row] & (1 << (2 - col))) {
          ctx.fillStyle = '#101018';
          ctx.fillRect(x + col * scale + 1, oy + row * scale + 1, scale, scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + col * scale, oy + row * scale, scale, scale);
        }
      }
    }
    x += glyphW;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const WORD_HEART_TEX = {
  WIDEASS: makeWordHeartTexture('WIDEASS'),
  TATS: makeWordHeartTexture('TATS'),
};

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
  // Word badge — WIDEASS on boss hearts, TATS on regular
  const word = boss ? 'WIDEASS' : 'TATS';
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(boss ? 1.8 : 1.35, boss ? 0.9 : 0.65),
    new THREE.MeshBasicMaterial({
      map: WORD_HEART_TEX[word],
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  badge.position.set(0, 0.15, 0.55);
  g.add(left, right, tip, glow, badge);
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
      <Stars radius={90} depth={50} count={140} factor={3.2} saturation={0.6} fade speed={0.55} />
      <Sparkles count={10} scale={[18, 10, 28]} size={3.2} speed={0.5} color="#ff99cc" opacity={0.38} />
      <mesh position={[0, 2.2, -18]}>
        <torusGeometry args={[3.2, 0.08, 8, 48]} />
        <meshBasicMaterial color="#ff66aa" transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, -8]} receiveShadow>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color="#2a1430" roughness={0.72} metalness={0.28} />
      </mesh>
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

      <Stars radius={90} depth={60} count={160} factor={3.2} saturation={0.3} fade speed={0.55} />

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
    </>
  );
}

function JeepEnvironment({ scroll }: { scroll: MutableRefObject<number> }) {
  const canopy = useRef<THREE.Group>(null);
  const stripes = useRef<THREE.Mesh>(null);
  const ferns = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = scroll.current;
    if (canopy.current) {
      canopy.current.children.forEach((c, i) => {
        const base = -4 - (i % 10) * 6.5;
        c.position.z = ((base + s * 0.85) % 68) - 52;
      });
    }
    if (ferns.current) {
      ferns.current.children.forEach((c, i) => {
        const base = -3 - i * 4.2;
        c.position.z = ((base + s) % 55) - 48;
      });
    }
    if (stripes.current) {
      stripes.current.position.z = -8 + (s % 5);
    }
  });

  return (
    <>
      {/* Daylight jungle safari — readable greens, sun, NO neon mush */}
      <ambientLight intensity={0.95} color="#fff4e0" />
      <hemisphereLight args={['#9ec8ff', '#4a7a28', 0.85]} />
      <directionalLight
        position={[12, 22, 6]}
        intensity={2.4}
        color="#fff2c8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-10, 8, -8]} intensity={0.55} color="#88b868" />
      <pointLight position={[0, 6, 2]} intensity={0.6} color="#ffe8c0" />

      {/* Soft sun disc */}
      <mesh position={[14, 18, -55]}>
        <sphereGeometry args={[3.2, 16, 16]} />
        <meshBasicMaterial color="#ffe8a0" />
      </mesh>
      <mesh position={[14, 18, -55]}>
        <sphereGeometry args={[5.5, 16, 16]} />
        <meshBasicMaterial color="#ffd070" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Distant green hills */}
      <mesh position={[-16, 1, -48]} castShadow>
        <sphereGeometry args={[11, 12, 10]} />
        <meshStandardMaterial color="#3d6b28" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[18, 0.5, -52]} castShadow>
        <sphereGeometry args={[13, 12, 10]} />
        <meshStandardMaterial color="#2f5820" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, -1, -60]} castShadow>
        <sphereGeometry args={[16, 12, 10]} />
        <meshStandardMaterial color="#456e30" roughness={0.95} flatShading />
      </mesh>

      {/* Dense scrolling canopy */}
      <group ref={canopy}>
        {Array.from({ length: 20 }, (_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const z = -4 - (i % 10) * 6.5;
          const x = side * (6.2 + (i % 4) * 1.35);
          const tall = 3.2 + (i % 5) * 0.45;
          const palm = i % 3 === 0;
          return (
            <group key={`tree-${i}`} position={[x, 0, z]}>
              <mesh position={[0, tall * 0.45, 0]}>
                <cylinderGeometry args={[palm ? 0.18 : 0.28, palm ? 0.32 : 0.48, tall, 7]} />
                <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
              </mesh>
              {palm ? (
                <>
                  {[0, 1, 2, 3, 4].map((p) => (
                    <mesh
                      key={p}
                      position={[
                        Math.cos((p / 5) * Math.PI * 2) * 0.9,
                        tall * 0.85,
                        Math.sin((p / 5) * Math.PI * 2) * 0.9,
                      ]}
                      rotation={[0.55, (p / 5) * Math.PI * 2, 0]}
                     
                    >
                      <boxGeometry args={[0.15, 0.08, 2.4]} />
                      <meshStandardMaterial color="#2a8a38" roughness={0.7} />
                    </mesh>
                  ))}
                </>
              ) : (
                <>
                  <mesh position={[0, tall * 0.95, 0]}>
                    <coneGeometry args={[1.6, 2.4, 7]} />
                    <meshStandardMaterial color="#1f6a2e" roughness={0.75} />
                  </mesh>
                  <mesh position={[0, tall * 0.95 + 1.1, 0]}>
                    <coneGeometry args={[1.15, 1.8, 7]} />
                    <meshStandardMaterial color="#2d8a3c" roughness={0.7} />
                  </mesh>
                  <mesh position={[0, tall * 0.95 + 2.0, 0]}>
                    <coneGeometry args={[0.7, 1.2, 7]} />
                    <meshStandardMaterial color="#3caa48" roughness={0.65} />
                  </mesh>
                </>
              )}
            </group>
          );
        })}
      </group>

      <group ref={ferns}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh
            key={`fern-${i}`}
           
            position={[(i % 2 === 0 ? -1 : 1) * (3.6 + (i % 3) * 0.5), -0.2, -3 - i * 4.2]}
            rotation={[0, i * 0.7, 0.15]}
          >
            <coneGeometry args={[0.55, 1.1, 5]} />
            <meshStandardMaterial color="#3d9a40" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Grass field + dirt jeep track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, -8]} receiveShadow>
        <planeGeometry args={[48, 120]} />
        <meshStandardMaterial color="#3d7a28" roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.32, -8]} receiveShadow>
        <planeGeometry args={[7.2, 120]} />
        <meshStandardMaterial color="#8a6a3a" roughness={0.88} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.31, -8]} receiveShadow>
        <planeGeometry args={[5.6, 120]} />
        <meshStandardMaterial color="#6e5430" roughness={0.85} metalness={0.04} />
      </mesh>
      <mesh ref={stripes} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.29, -8]}>
        <planeGeometry args={[0.28, 120]} />
        <meshStandardMaterial color="#e8d050" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Jeep dash brow — soft wood tone instead of neon rails */}
      <mesh position={[0, -0.05, 2.6]}>
        <boxGeometry args={[7.2, 0.08, 1.2]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.7} metalness={0.15} />
      </mesh>
    </>
  );
}

function VehicleInterior({
  kind,
  muzzle
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
          <meshStandardMaterial color="#223344" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[-1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshStandardMaterial color="#555555" emissive="#00ffff" emissiveIntensity={0.45} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 0.5, 0.8]}>
          <boxGeometry args={[0.5, 0.4, 1.2]} />
          <meshStandardMaterial color="#555555" emissive="#ff4444" emissiveIntensity={0.45} metalness={0.6} roughness={0.3} />
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
          <meshStandardMaterial color="#3a1830" metalness={0.55} roughness={0.3} />
        </mesh>
        <mesh position={[-1.35, 0.55, 0.85]}>
          <boxGeometry args={[0.45, 0.35, 1.15]} />
          <meshStandardMaterial color="#552244" emissive="#ff66aa" emissiveIntensity={0.7} metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[1.35, 0.55, 0.85]}>
          <boxGeometry args={[0.45, 0.35, 1.15]} />
          <meshStandardMaterial color="#442255" emissive="#ffe14a" emissiveIntensity={0.55} metalness={0.5} roughness={0.25} />
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
        <meshStandardMaterial color="#3a4a28" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, -0.4]}>
        <boxGeometry args={[6.2, 0.25, 0.9]} />
        <meshStandardMaterial color="#2a3220" metalness={0.55} roughness={0.35} />
      </mesh>

      <mesh position={[-2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshStandardMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[2.8, 1.1, -0.6]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshStandardMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.85, -0.6]}>
        <boxGeometry args={[5.7, 0.1, 0.1]} />
        <meshStandardMaterial color="#1a1a14" metalness={0.7} roughness={0.3} />
      </mesh>

      <group position={[-1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1.4, 16]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.55, -0.55]} ref={leftFlash}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0} />
        </mesh>
      </group>

      <group position={[1.55, 0.55, 0.9]}>
        <mesh rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.28, 1.35]} />
          <meshStandardMaterial
            color="#2a4a55"
            metalness={0.8}
            roughness={0.22}
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
        <meshStandardMaterial color="#222" emissive="#ff3344" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.35, 0.18, 0.08]} />
        <meshStandardMaterial color="#222" emissive="#00ccff" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}
