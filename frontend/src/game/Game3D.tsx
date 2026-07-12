import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PublicApi } from '@react-three/cannon';
import { FollowCamera } from './FollowCamera';
import { GameHUD } from './GameHUD';
import { LoveTetherLine } from './LoveTetherLine';
import { NetworkController } from './NetworkController';
import { PhysicalPepperCan } from './PhysicalPepperCan';
import { PhysicalPlayer } from './PhysicalPlayer';
import { PhysicalTRex } from './PhysicalTRex';
import { PhysicalUFOBoss } from './PhysicalUFOBoss';
import { PhysicsTrackFloor } from './PhysicsTrackFloor';
import { RemotePartnerSphere } from './RemotePartnerSphere';
import { SilentTrapBlock } from './SilentTrapBlock';
import { useMediaCapture } from './useMediaCapture';
import { useMicSpectrum } from './useMicSpectrum';

type CharacterId = 'Wideass' | 'Tats';

function generateSonicTrackCurve() {
  const points: THREE.Vector3[] = [];
  for (let x = -60; x < 15; x += 3) {
    points.push(new THREE.Vector3(x, 0, 0));
  }
  const centerX = 25;
  const centerY = 11;
  const radius = 10;
  for (let a = Math.PI / 2; a <= 3 * Math.PI * 1.02; a += 0.12) {
    const crossOverZ = a > 2.5 * Math.PI ? 2.5 : 0;
    points.push(
      new THREE.Vector3(
        centerX + Math.cos(a) * radius,
        centerY + Math.sin(a) * radius,
        crossOverZ,
      ),
    );
  }
  for (let x = 35; x < 120; x += 3) {
    points.push(new THREE.Vector3(x, 0, 2.5));
  }
  return new THREE.CatmullRomCurve3(points);
}

function AudioReactiveGrid({
  volume,
  remoteVolume,
}: {
  volume: number;
  remoteVolume: number;
}) {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (!gridRef.current) {
      return;
    }
    const combined = volume + remoteVolume;
    const scale = 1 + combined / 90;
    gridRef.current.scale.set(scale, 1, scale);
    gridRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 2) * (combined / 200);
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[200, 50, '#ff44aa', '#22222b']}
      position={[0, 0.01, 0]}
    />
  );
}

function SceneContent({
  roomID,
  character,
  level,
  volume,
  workerOrigin,
  onStatus,
  onPlayerPosition,
  onPartnerVolume,
  playerPosition,
  trapPositions,
}: {
  roomID: string;
  character: CharacterId;
  level: number;
  volume: number;
  workerOrigin: string;
  onStatus: (s: string) => void;
  onPlayerPosition: (p: THREE.Vector3) => void;
  onPartnerVolume: (v: number) => void;
  playerPosition: THREE.Vector3;
  trapPositions: [number, number, number][];
}) {
  const [playerApi, setPlayerApi] = useState<PublicApi | null>(null);
  const [partnerPos, setPartnerPos] = useState(() => new THREE.Vector3(-20, 2, 0));
  const [partnerVolume, setPartnerVolume] = useState(0);
  const trackCurve = useMemo(() => generateSonicTrackCurve(), []);

  const sodaPositions = useMemo<[number, number, number][]>(() => {
    const count = level % 3 === 0 ? 8 : 4;
    return Array.from({ length: count }, (_, index) => [
      -15 + index * 8,
      12 + Math.random() * 6,
      (Math.random() - 0.5) * 4,
    ]);
  }, [level]);

  const handlePartnerUpdate = useCallback(
    (position: THREE.Vector3, remoteVol: number) => {
      setPartnerPos(position.clone());
      setPartnerVolume(remoteVol);
      onPartnerVolume(remoteVol);
    },
    [onPartnerVolume],
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 30]} fov={45} />
      <FollowCamera target={playerPosition} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#ff44aa" distance={60} />
      <fog attach="fog" args={['#050508', 40, 180]} />

      <Physics gravity={[0, -9.81, 0]} broadphase="SAP">
        <PhysicsTrackFloor />
        <PhysicalPlayer
          chosenCharacter={character}
          onApiReady={setPlayerApi}
          onPosition={onPlayerPosition}
          volume={volume}
          remoteVolume={partnerVolume}
        />
        <RemotePartnerSphere target={partnerPos} />
        <PhysicalUFOBoss level={level} />
        <PhysicalTRex level={level} />
        {sodaPositions.map((pos, index) => (
          <PhysicalPepperCan key={`can-${index}`} startPos={pos} />
        ))}
        {trapPositions.map((pos, index) => (
          <SilentTrapBlock key={`trap-${index}`} position={pos} />
        ))}
      </Physics>

      <mesh receiveShadow>
        <tubeGeometry args={[trackCurve, 120, 1.8, 16, false]} />
        <meshStandardMaterial color="#16161f" roughness={0.3} metalness={0.7} />
      </mesh>

      <AudioReactiveGrid volume={volume} remoteVolume={partnerVolume} />
      <LoveTetherLine from={playerPosition} to={partnerPos} />

      {playerApi && (
        <NetworkController
          playerBodyApi={playerApi}
          roomID={roomID}
          chosenCharacter={character}
          volume={volume}
          workerOrigin={workerOrigin}
          onPartnerUpdate={handlePartnerUpdate}
          onStatus={onStatus}
        />
      )}

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.15} />
        <Vignette eskil={false} offset={0.2} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

export default function Game3D({
  roomID,
  character,
  level,
  embedded = false,
}: {
  roomID: string;
  character: CharacterId;
  level: number;
  embedded?: boolean;
}) {
  const workerOrigin =
    (import.meta.env.VITE_GAME_WORKER_ORIGIN as string | undefined)?.replace(/\/$/, '') ??
    'http://localhost:8787';
  const media = useMediaCapture();
  const spectrum = useMicSpectrum(media.stream);
  const [status, setStatus] = useState('CONNECTING...');
  const [remoteVolume, setRemoteVolume] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(
    () => new THREE.Vector3(-25, 2, 0),
  );
  const [trapPositions, setTrapPositions] = useState<[number, number, number][]>([]);
  const quietSinceRef = useRef<number | null>(null);

  useEffect(() => {
    const combined = spectrum.volume + remoteVolume;
    const isQuiet = combined < 5;

    if (!isQuiet) {
      quietSinceRef.current = null;
      setTrapPositions([]);
      return;
    }

    if (quietSinceRef.current === null) {
      quietSinceRef.current = Date.now();
      return;
    }

    if (Date.now() - quietSinceRef.current > 2000 && trapPositions.length === 0) {
      setTrapPositions([
        [playerPosition.x + 12, 2, playerPosition.z],
        [playerPosition.x + 20, 2, playerPosition.z + 2],
        [playerPosition.x + 28, 2, playerPosition.z - 2],
      ]);
    }
  }, [spectrum.volume, remoteVolume, playerPosition, trapPositions.length]);

  return (
    <div className={`relative w-full overflow-hidden bg-black ${embedded ? 'h-full min-h-[520px]' : 'h-screen w-screen'}`}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SceneContent
            roomID={roomID}
            character={character}
            level={level}
            volume={spectrum.volume}
            workerOrigin={workerOrigin}
            onStatus={setStatus}
            onPlayerPosition={setPlayerPosition}
            onPartnerVolume={setRemoteVolume}
            playerPosition={playerPosition}
            trapPositions={trapPositions}
          />
        </Suspense>
      </Canvas>

      <GameHUD
        status={status}
        volume={spectrum.volume}
        remoteVolume={remoteVolume}
        bins={spectrum.bins}
        level={level}
        mediaActive={media.active}
        mediaError={media.error}
        onEnableMedia={() => void media.activate()}
        videoRef={media.videoRef}
      />
    </div>
  );
}
