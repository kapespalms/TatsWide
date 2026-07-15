import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { CharacterId, CollectibleCounts, LevelAuthoring, LevelTrigger } from '../types';
import { createRunGame } from '../run/createRunGame';
import type { RunProgress } from '../run/AdventureRunScene';

interface RunPhaseProps {
  level: LevelAuthoring;
  playerCount: 1 | 2;
  primaryCharacter: CharacterId;
  startX: number;
  seedScore?: number;
  seedCounts?: CollectibleCounts;
  seedTakenIds?: string[];
  seedKilledGhostIds?: string[];
  seedElapsed?: number;
  seedFiredTriggers?: string[];
  embed?: boolean;
  onProgress: (progress: RunProgress) => void;
  onTrigger: (trigger: LevelTrigger) => void;
  hud?: {
    score: number;
    counts: CollectibleCounts;
    timeSec?: number;
  };
}

export function RunPhase({
  level,
  playerCount,
  primaryCharacter,
  startX,
  seedScore = 0,
  seedCounts,
  seedTakenIds = [],
  seedKilledGhostIds = [],
  seedElapsed = 0,
  seedFiredTriggers = [],
  embed = false,
  onProgress,
  onTrigger,
  hud,
}: RunPhaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const progressRef = useRef(onProgress);
  const triggerRef = useRef(onTrigger);
  progressRef.current = onProgress;
  triggerRef.current = onTrigger;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const game = createRunGame(parent, {
      level,
      playerCount,
      primaryCharacter,
      startX,
      seedScore,
      seedCounts: seedCounts ?? { pepper: 0, duck: 0, witchHat: 0 },
      seedTakenIds,
      seedKilledGhostIds,
      seedElapsed,
      seedFiredTriggers,
      onProgress: (p) => progressRef.current(p),
      onTrigger: (t) => triggerRef.current(t),
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, playerCount, primaryCharacter]);

  const timeSec = hud?.timeSec ?? 0;
  const mm = Math.floor(timeSec / 60);
  const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
  const counts = hud?.counts ?? { pepper: 0, duck: 0, witchHat: 0 };

  return (
    <div
      className={
        embed
          ? 'relative h-full w-full overflow-hidden bg-[#3d8bff]'
          : 'relative mx-auto h-[min(100svh,720px)] w-full max-w-[1280px] overflow-hidden shadow-[0_16px_0_rgba(0,0,0,0.35)] ring-4 ring-black/50'
      }
    >
      <div ref={containerRef} className="h-full w-full overflow-hidden" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 wa-hud-shadow font-[family-name:var(--font-mono)]">
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ffe14a]">SCORE</p>
        <p className="mb-2 wa-display text-2xl leading-none text-[#ffe14a]">
          {(hud?.score ?? 0).toLocaleString().padStart(6, '0')}
        </p>
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ffe14a]">TIME</p>
        <p className="mb-2 wa-display text-xl leading-none text-[#ffe14a]">
          {mm}:{ss}
        </p>
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ffe14a]">RINGS</p>
        <p className="mb-1 wa-display text-2xl leading-none text-[#ffe14a]">{counts.pepper}</p>
        <p className="text-[10px] font-black tracking-[0.2em] text-white/90">BONUS</p>
        <p className="text-xs font-black text-white">
          <span className="text-[#ffd84a]">DUCK {counts.duck}</span>
          {' · '}
          <span className="text-[#d8a0ff]">HAT {counts.witchHat}</span>
        </p>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 text-right wa-hud-shadow">
        <p className="text-[10px] font-black tracking-[0.3em] text-white">ZONE {level.level}/20</p>
        <p className="wa-display text-sm uppercase text-[#ffe14a]">{level.name}</p>
        <p className="mt-1 text-[10px] font-bold text-white/90">
          {playerCount === 2 ? 'WIDEASS + TATS' : `${primaryCharacter.toUpperCase()} SOLO`}
        </p>
        <p className="mt-2 text-[10px] font-black tracking-wide text-[#ff8844]">50% · JEEP KEEP</p>
        <p className="text-[10px] font-black tracking-wide text-[#66ccff]">75% · STAR KEEP</p>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 w-[94%] -translate-x-1/2 text-center">
        <p className="wa-hud-shadow text-[10px] font-bold text-white/90 sm:text-[11px]">
          Collect gold rings · grab ducks/hats for bonus · avoid red spike orbs (spin or stomp to smash) · ←→ run · SPACE jump · ↓+SPACE spindash · ESC pause
        </p>
      </div>
    </div>
  );
}
