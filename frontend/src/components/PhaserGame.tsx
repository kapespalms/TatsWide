import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createPhaserGame } from '../game/createGame';
import type { GameSceneInitData } from '../game/GameScene';

type CharacterId = 'Wideass' | 'Tats';

interface PhaserGameProps {
  room: string;
  character: CharacterId;
  level?: number;
  embed?: boolean;
}

export function PhaserGame({
  room,
  character,
  level = 1,
  embed = false,
}: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [workerOrigin] = useState(
    () =>
      import.meta.env.VITE_GAME_WORKER_ORIGIN?.replace(/\/$/, '') ??
      'http://localhost:8787',
  );

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || gameRef.current) {
      return;
    }

    const initData: GameSceneInitData = {
      room,
      character,
      level,
    };

    gameRef.current = createPhaserGame(parent, initData);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [room, character, level]);

  return (
    <div
      className={
        embed
          ? 'relative h-full w-full'
          : 'relative flex w-full flex-col items-center gap-3 p-4'
      }
    >
      {!embed && (
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-cyan-500/30 bg-black/70 p-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-ping rounded-full bg-green-400" />
            <p className="font-mono text-gray-300">
              Sonic Loop Rail: <span className="text-cyan-400">ARMED</span>
              <br />
              <span className="text-[10px] text-gray-400">
                ← → run · ↑ jump · hit the loop at speed
              </span>
            </p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={
          embed
            ? 'h-full w-full overflow-hidden bg-black'
            : 'h-[720px] w-full max-w-[1280px] overflow-hidden rounded-lg border border-zinc-700 shadow-lg'
        }
      />
      {!embed && (
        <p className="font-mono text-sm text-zinc-400">
          Worker: {workerOrigin} · Room: {room} · Character: {character} · Level{' '}
          {level}
        </p>
      )}
    </div>
  );
}
