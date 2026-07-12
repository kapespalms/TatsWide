import { useEffect, useState } from 'react';
import Game3D from './game/Game3D';

type CharacterId = 'Wideass' | 'Tats';

interface EmbedConfig {
  room: string;
  character: CharacterId;
}

function readEmbedConfig(): EmbedConfig | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') !== '1') {
    return null;
  }

  const characterParam = params.get('character')?.toLowerCase();
  return {
    room: params.get('room')?.trim() || 'arena-room',
    character: characterParam === 'wideass' ? 'Wideass' : 'Tats',
  };
}

export default function App() {
  const embed = readEmbedConfig();
  const [room, setRoom] = useState(embed?.room ?? 'AAA-Sonic-Zone');
  const [character, setCharacter] = useState<CharacterId>(embed?.character ?? 'Wideass');
  const [level, setLevel] = useState(3);
  const [gameActive, setGameActive] = useState(Boolean(embed));
  const [controllers, setControllers] = useState<string[]>([]);

  useEffect(() => {
    const updateGamepads = () => {
      const pads = navigator.getGamepads?.() ?? [];
      setControllers(pads.filter(Boolean).map((pad) => pad!.id));
    };
    window.addEventListener('gamepadconnected', updateGamepads);
    window.addEventListener('gamepaddisconnected', updateGamepads);
    const interval = window.setInterval(updateGamepads, 1000);
    updateGamepads();
    return () => {
      window.removeEventListener('gamepadconnected', updateGamepads);
      window.removeEventListener('gamepaddisconnected', updateGamepads);
      window.clearInterval(interval);
    };
  }, []);

  if (gameActive) {
    return <Game3D roomID={room} character={character} level={level} embedded={Boolean(embed)} />;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 font-mono text-white">
      <p className="mb-2 max-w-md text-center text-sm text-zinc-400">
        Co-op 3D physics sandbox — loop track, ricocheting cans, UFO boss, mic jumps,
        webcam sync. Open two tabs with the same room key.
      </p>
      <h1 className="mb-4 text-3xl font-black tracking-widest text-cyan-400">
        3D REALISTIC CO-OP SANDBOX
      </h1>

      <div className="mb-4 flex items-center gap-2 rounded bg-slate-900 px-3 py-1.5 text-xs">
        <span
          className={`h-2 w-2 rounded-full ${controllers.length ? 'animate-ping bg-green-400' : 'bg-red-500'}`}
        />
        <span className="text-slate-400">
          {controllers.length
            ? `CONTROLLER: ${controllers[0].slice(0, 28)}`
            : 'NO GAMEPAD (PRESS ANY BUTTON)'}
        </span>
      </div>

      <div className="mb-4 w-80 space-y-1 rounded-md border border-slate-800 bg-slate-900 p-3 text-left text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-ping rounded-full bg-pink-500" />
          <span className="text-slate-400">
            TETHER: <span className="font-bold text-pink-400">CANNON RIGID BODIES</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          <span className="text-slate-400">
            MEDIA: <span className="font-bold text-cyan-400">WEBCAM + MIC FFT</span>
          </span>
        </div>
      </div>

      <div className="w-80 space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
        <input
          className="w-full rounded border border-slate-700 bg-black p-2 text-center text-sm font-bold text-cyan-400"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Enter Room Key"
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded p-2 text-xs font-bold ${character === 'Wideass' ? 'bg-red-600 shadow-lg' : 'bg-slate-800'}`}
            onClick={() => setCharacter('Wideass')}
          >
            WIDEASS
          </button>
          <button
            type="button"
            className={`flex-1 rounded p-2 text-xs font-bold ${character === 'Tats' ? 'bg-cyan-500 text-black shadow-lg' : 'bg-slate-800'}`}
            onClick={() => setCharacter('Tats')}
          >
            TATS
          </button>
        </div>
        <input
          type="number"
          className="w-full rounded border border-slate-700 bg-black p-2 text-center text-sm"
          value={level}
          onChange={(e) =>
            setLevel(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
          }
          min={1}
          max={20}
        />
        <button
          type="button"
          className="w-full rounded bg-amber-500 p-3 text-sm font-black tracking-wider text-black transition-transform hover:scale-105"
          onClick={() => setGameActive(true)}
        >
          LAUNCH ENGINE
        </button>
      </div>
    </div>
  );
}
