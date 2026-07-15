import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { CharacterId, CollectibleCounts, LevelAuthoring, LevelTrigger } from '../types';
import { createRunGame } from '../run/createRunGame';
import { AdventureRunScene, type RunProgress } from '../run/AdventureRunScene';
import { AdventureAudio } from '../run/AdventureAudio';

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
  seedLives?: number;
  /** Hide + freeze Phaser while a keep overlays — no destroy/rebuild stutter */
  suspended?: boolean;
  embed?: boolean;
  onProgress: (progress: RunProgress) => void;
  onTrigger: (trigger: LevelTrigger) => void;
  hud?: {
    score: number;
    counts: CollectibleCounts;
    timeSec?: number;
    lives?: number;
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
  seedLives = 3,
  suspended = false,
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
      seedLives,
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

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene('AdventureRunScene') as AdventureRunScene | null;
    if (!scene || typeof scene.suspendForKeep !== 'function') return;
    if (suspended) scene.suspendForKeep();
    else scene.resumeFromKeep(seedFiredTriggers);
  }, [suspended, seedFiredTriggers]);

  const timeSec = hud?.timeSec ?? 0;
  const mm = Math.floor(timeSec / 60);
  const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
  const counts = hud?.counts ?? { pepper: 0, duck: 0, witchHat: 0 };
  const lives = hud?.lives ?? 3;
  const finale = level.triggers[0];
  const finalePct = finale
    ? Math.round((finale.atX / Math.max(1, level.worldWidth)) * 100)
    : 92;
  const finaleLabel =
    finale?.kind === 'jeep'
      ? 'JEEP FINALE'
      : finale?.kind === 'space'
        ? 'STAR FINALE'
        : 'CUPID FINALE';
  const finaleColor =
    finale?.kind === 'jeep' ? '#ff8844' : finale?.kind === 'space' ? '#66ccff' : '#ff66aa';
  const [muted, setMuted] = useState(() => AdventureAudio.readSessionMuted());
  useEffect(() => {
    const id = window.setInterval(() => setMuted(AdventureAudio.readSessionMuted()), 400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={
        embed
          ? 'relative h-full w-full overflow-hidden bg-[#3d8bff]'
          : 'relative mx-auto h-[min(100svh,720px)] w-full max-w-[1280px] overflow-hidden shadow-[0_16px_0_rgba(0,0,0,0.35)] ring-4 ring-black/50'
      }
      style={suspended ? { visibility: 'hidden', pointerEvents: 'none', position: 'absolute', inset: 0 } : undefined}
      aria-hidden={suspended || undefined}
    >
      <div ref={containerRef} className="h-full w-full overflow-hidden" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 wa-hud-shadow font-[family-name:var(--font-mono)]">
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ffe14a]">SCORE</p>
        <p className="mb-2 wa-display text-2xl leading-none text-[#ffe14a]">
          {String(hud?.score ?? 0).padStart(6, '0')}
        </p>
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ffe14a]">TIME</p>
        <p className="mb-2 wa-display text-xl leading-none text-[#ffe14a]">
          {mm}:{ss}
        </p>
        <p className="text-[10px] font-black tracking-[0.28em] text-[#7dffb0]">LIVES</p>
        <p className="mb-2 wa-display text-2xl leading-none text-[#7dffb0]">{lives}</p>
        <p className="text-[10px] font-black tracking-[0.28em] text-[#ff6a9a]">HEARTS</p>
        <p className="mb-1 wa-display text-2xl leading-none text-[#ff6a9a]">{counts.pepper}</p>
        <p className="text-[10px] font-black tracking-[0.2em] text-white/90">WORD HEARTS</p>
        <p className="text-xs font-black text-white">
          <span className="text-[#ff6688]">WIDEASS {counts.duck}</span>
          {' · '}
          <span className="text-[#66ccee]">TATS {counts.witchHat}</span>
        </p>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 text-right wa-hud-shadow">
        <p className="text-[10px] font-black tracking-[0.3em] text-white">ZONE {level.level}/20</p>
        <p className="wa-display text-sm uppercase text-[#ffe14a]">{level.name}</p>
        <p className="mt-1 text-[10px] font-bold text-white/90">
          {playerCount === 2 ? 'WIDEASS + TATS' : `${primaryCharacter.toUpperCase()} SOLO`}
        </p>
        <p className="mt-2 text-[10px] font-black tracking-wide" style={{ color: finaleColor }}>
          {finalePct}% · {finaleLabel}
          {finale?.boss ? ' BOSS' : ''}
        </p>
        <p className="text-[10px] font-black tracking-wide text-[#ffe14a]">GOAL AFTER FINALE</p>
        {muted ? (
          <p className="mt-2 text-[10px] font-black tracking-[0.28em] text-[#ff6688]">MUTED · M</p>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 w-[94%] -translate-x-1/2 text-center">
        <p className="wa-hud-shadow text-[10px] font-bold text-white/90 sm:text-[11px]">
          {playerCount === 2
            ? 'Wideass ←→/WASD · Tats J/L/I/K · SPACE/ENTER jump · ↓+jump spindash · hold pads retract spikes · ESC pause · M mute'
            : 'Hearts shield hits · pads retract spikes · miss jumps = lose a life · SPACE jump · ↓+SPACE spindash · ESC pause'}
        </p>
      </div>
    </div>
  );
}
