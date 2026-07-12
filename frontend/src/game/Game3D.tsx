import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PublicApi } from '@react-three/cannon';
import { NetworkController } from './NetworkController';
import { PhysicalPepperCan } from './PhysicalPepperCan';
import { PhysicalPlayer } from './PhysicalPlayer';
import { PhysicalUFOBoss } from './PhysicalUFOBoss';
import { PhysicsTrackFloor } from './PhysicsTrackFloor';
import { RemotePartnerSphere } from './RemotePartnerSphere';
import { useMediaCapture } from './useMediaCapture';
import { useMicSpectrum } from './useMicSpectrum';

type CharacterId = 'Wideass' | 'Tats';

function generateSonicTrackCurve() {
  const points: THREE.Vector3[] = [];
  for (let x = -60; x < 15; x += 3) points.push(new THREE.Vector3(x, 0, 0));
  const centerX = 25;
  const centerY = 11;
  const radius = 10;
  for (let a = Math.PI / 2; a <= 3 * Math.PI * 1.02; a += 0.12) {
    const crossOverZ = a > 2.5 * Math.PI ? 2.5 : 0;
    points.push(new THREE.Vector3(centerX + Math.cos(a) * radius, centerY + Math.sin(a) * radius, crossOverZ));
  }
  for (let x = 35; x < 120; x += 3) points.push(new THREE.Vector3(x, 0, 2.5));
  return new THREE.CatmullRomCurve3(points);
}

function AudioReactiveGrid({ volume, remoteVolume }: { volume: number; remoteVolume: number }) {
  const gridRef = useRef<THREE.GridHelper>(null);
  useFrame(() => {
    if (!gridRef.current) return;
    const combined = volume + remoteVolume;
    const scale = 1 + combined / 90;
    gridRef.current.scale.set(scale, 1, scale);
  });
  return <gridHelper ref={gridRef} args={[200, 50, '#ff44aa', '#22222b']} position={[0, 0.01, 0]} />;
}

function SceneContent({
  roomID,
  character,
  level,
  volume,
  remoteVolume,
  workerOrigin,
  onStatus,
  onActivateMedia,
  mediaActive,
}: {
  roomID: string;
  character: CharacterId;
  level: number;
  volume: number;
  remoteVolume: number;
  workerOrigin: string;
  onStatus: (s: string) => void;
  onActivateMedia: () => void;
  mediaActive: boolean;
}) {
  const [playerApi, setPlayerApi] = useState<PublicApi | null>(null);
  const [partnerPos, setPartnerPos] = useState(() => new THREE.Vector3(-20, 2, 0));
  const [partnerVolume, setPartnerVolume] = useState(0);
  const trackCurve = useMemo(() => generateSonicTrackCurve(), []);

  const sodaPositions = useMemo<[number, number, number][]>(
    () => Array.from({ length: 8 }, (_, i) => [-15 + i * 8, 15 + Math.random() * 5, (Math.random() - 0.5) * 4]),
    [level],
  );

  const handlePartnerUpdate = useCallback((position: THREE.Vector3, vol: number) => {
    setPartnerPos(position.clone());
    setPartnerVolume(vol);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 30]} fov={45} />
      <OrbitControls maxPolarAngle={Math.PI / 2 - 0.05} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[20, 40, 20]} intensity={2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#ff44aa" distance={60} />

      <Physics gravity={[0, -9.81, 0]}>
        <PhysicsTrackFloor />
        <PhysicalPlayer chosenCharacter={character} onApiReady={setPlayerApi} volume={volume} remoteVolume={partnerVolume || remoteVolume} />
        <RemotePartnerSphere target={partnerPos} />
        <PhysicalUFOBoss level={level} />
        {level % 3 === 0 && sodaPositions.map((pos, idx) => <PhysicalPepperCan key={idx} startPos={pos} />)}
      </Physics>

      <mesh receiveShadow>
        <tubeGeometry args={[trackCurve, 120, 1.8, 16, false]} />
        <meshStandardMaterial color="#16161f" roughness={0.3} metalness={0.7} />
      </mesh>

      <AudioReactiveGrid volume={volume} remoteVolume={partnerVolume || remoteVolume} />

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

      {!mediaActive && (
        <mesh position={[0, 8, 0]} onClick={onActivateMedia}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.2} />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export default function Game3D({ roomID, character, level }: { roomID: string; character: CharacterId; level: number }) {
  const workerOrigin = (import.meta.env.VITE_GAME_WORKER_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8787';
  const media = useMediaCapture();
  const spectrum = useMicSpectrum(media.stream);
  const [status, setStatus] = useState('CLICK ENABLE WEBCAM + MIC');

  const combinedVolume = spectrum.volume;

  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas shadows onPointerDown={() => void media.activate()}>
        <Suspense fallback={null}>
          <SceneContent
            roomID={roomID}
            character={character}
            level={level}
            volume={combinedVolume}
            remoteVolume={0}
            workerOrigin={workerOrigin}
            onStatus={setStatus}
            onActivateMedia={() => void media.activate()}
            mediaActive={media.active}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4 z-20 space-y-2 font-mono text-xs">
        <div className="rounded border border-cyan-500/40 bg-black/75 px-3 py-2 text-cyan-300">{status}</div>
        <div className="rounded border border-pink-500/40 bg-black/75 px-3 py-2 text-pink-300">
          FFT VOLUME: {Math.round(combinedVolume)}
        </div>
        {media.error && <div className="rounded border border-red-500/40 bg-black/75 px-3 py-2 text-red-300">{media.error}</div>}
      </div>

      <div className="absolute bottom-4 right-4 z-20 overflow-hidden rounded-lg border-2 border-cyan-400/50 bg-black shadow-lg shadow-cyan-500/20">
        <video
          ref={media.videoRef}
          className="h-36 w-48 object-cover"
          autoPlay
          playsInline
          muted
        />
        <div className="bg-black/80 px-2 py-1 text-center font-mono text-[10px] text-cyan-300">
          {media.active ? 'WEBCAM LIVE' : 'CLICK GAME TO ENABLE CAM + MIC'}
        </div>
      </div>
    </div>
  );
}
