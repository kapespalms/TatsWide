import { useMemo, useState, useEffect, useRef } from 'react';
import { AdventureGame, type CharacterId } from './adventure/AdventureGame';
import type { ShooterKind } from './adventure/types';
import { GameOrchestrator } from './game3d/GameOrchestrator';

const DISPLAY_NAME_KEY = 'wa-display-name';

function readLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed') === '1';
  const autostart = params.get('autostart') === '1';
  const rawChar = params.get('character')?.toLowerCase();
  const character: CharacterId = rawChar === 'tats' ? 'Tats' : 'Wideass';
  const level = Math.min(20, Math.max(1, Number(params.get('level')) || 1));
  const players = params.get('players') === '2' ? 2 : 1;
  const room = params.get('room')?.trim() || '';
  const rawPhase = params.get('phase')?.toLowerCase();
  const forcePhase: ShooterKind | undefined =
    rawPhase === 'jeep' || rawPhase === 'space' || rawPhase === 'cupid' ? rawPhase : undefined;
  const rawMode = params.get('mode')?.toLowerCase() || '';
  const mode = rawMode === 'neon' || rawMode === 'board' ? rawMode : '';
  return { embed, autostart, character, level, players: players as 1 | 2, room, forcePhase, mode };
}

function App() {
  const launch = useMemo(() => readLaunchParams(), []);
  const [character, setCharacter] = useState<CharacterId>(launch.character);
  const [level, setLevel] = useState(launch.level);
  const [playerCount, setPlayerCount] = useState<1 | 2>(launch.players);
  const [forcePhase, setForcePhase] = useState<ShooterKind | undefined>(launch.forcePhase);
  const [started, setStarted] = useState(launch.embed && launch.autostart);
  const [controllers, setControllers] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState(() => {
    try {
      return localStorage.getItem(DISPLAY_NAME_KEY)?.trim() || '';
    } catch {
      return '';
    }
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateGamepads = () => {
      const pads = navigator.getGamepads?.() ?? [];
      setControllers(pads.filter(Boolean).map((pad) => pad!.id));
    };
    window.addEventListener('gamepadconnected', updateGamepads);
    window.addEventListener('gamepaddisconnected', updateGamepads);
    const interval = window.setInterval(updateGamepads, 1_000);
    updateGamepads();
    return () => {
      window.removeEventListener('gamepadconnected', updateGamepads);
      window.removeEventListener('gamepaddisconnected', updateGamepads);
      window.clearInterval(interval);
    };
  }, []);

  const persistName = (name: string) => {
    const trimmed = name.trim().slice(0, 24);
    setDisplayName(trimmed);
    try {
      if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
      else localStorage.removeItem(DISPLAY_NAME_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  };

  const startAdventure = (phase?: ShooterKind) => {
    const name = displayName.trim() || nameInputRef.current?.value.trim() || '';
    if (name) persistName(name);
    // 2P always seat-locks Wideass on P1 sticks — clear leftover solo Tats selection
    if (playerCount === 2) setCharacter('Wideass');
    setForcePhase(phase);
    setStarted(true);
  };

  if (launch.mode === 'neon' || launch.mode === 'board') {
    return (
      <main className={launch.embed ? 'h-screen w-screen bg-black p-0' : 'min-h-screen bg-black p-0'}>
        <GameOrchestrator
          room={launch.room}
          character={launch.character}
          level={launch.level}
          embed={launch.embed}
        />
      </main>
    );
  }

  if (started) {
    return (
      <main className={launch.embed ? 'h-screen w-screen bg-black p-0' : 'min-h-screen bg-[#1a3a6a] p-0'}>
        <AdventureGame
          level={level}
          playerCount={playerCount}
          primaryCharacter={character}
          embed={launch.embed}
          forcePhase={forcePhase}
        />
      </main>
    );
  }

  return (
    <main className="wa-title-screen flex flex-col items-center justify-center gap-8 px-6 py-12 text-white">
      <div className="wa-bob relative z-10 max-w-3xl text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.45em] text-white/80">
          20 ZONES · SAME-SCREEN CO-OP
        </p>
        <h1 className="wa-display text-5xl leading-none text-[#ffe14a] drop-shadow-[4px_4px_0_#101018] sm:text-6xl md:text-7xl">
          WIDEASS
          <span className="block text-3xl text-white sm:text-4xl">&amp;</span>
          TATS
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-white/95">
          Sector Escape — sonic runs, jeep dinos, starship aliens, and cupid hearts. Two players on one
          keyboard or gamepads.
        </p>
      </div>

      <div className="relative z-10 grid w-full max-w-2xl grid-cols-2 gap-3 text-center text-[10px] font-bold sm:grid-cols-4">
        <ModeCard
          title="RUN"
          copy="Loops · spindash · routes"
          accent="border-emerald-300/70 text-emerald-100 hover:bg-emerald-400/15"
          onClick={() => startAdventure()}
        />
        <ModeCard
          title="JEEP"
          copy="Dual guns · T-Rex"
          accent="border-amber-300/70 text-amber-100 hover:bg-amber-400/15"
          onClick={() => {
            setLevel(1);
            startAdventure('jeep');
          }}
        />
        <ModeCard
          title="SPACE"
          copy="Rail dogfights"
          accent="border-cyan-300/70 text-cyan-100 hover:bg-cyan-400/15"
          onClick={() => {
            setLevel(1);
            startAdventure('space');
          }}
        />
        <ModeCard
          title="CUPID"
          copy="Hearts · dual arrows"
          accent="border-pink-300/70 text-pink-100 hover:bg-pink-400/15"
          onClick={() => {
            setLevel(12);
            startAdventure('cupid');
          }}
        />
      </div>

      <div className="relative z-10 flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-[11px] font-bold tracking-wide">
        <span
          className={`h-2 w-2 rounded-full ${controllers.length ? 'animate-ping bg-emerald-400' : 'bg-zinc-500'}`}
        />
        {controllers.length ? `${controllers.length} GAMEPAD READY` : 'KEYBOARD READY'}
      </div>

      <form
        className="wa-panel relative z-10 flex w-full max-w-sm flex-col gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          startAdventure();
        }}
      >
        <label className="block text-[10px] font-bold tracking-[0.2em] text-[#ffe14a]">
          DISPLAY NAME
          <input
            ref={nameInputRef}
            type="text"
            maxLength={24}
            placeholder="Guest"
            className="mt-2 w-full border-2 border-white/20 bg-black/70 p-3 text-center text-lg font-bold text-white outline-none focus:border-[#ffe14a]"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => persistName(displayName)}
          />
        </label>

        {launch.room ? (
          <p className="border border-white/15 bg-black/40 px-3 py-2 text-center text-[11px] font-bold tracking-wide text-white/80">
            ONLINE ROOM · <span className="text-[#ffe14a]">{launch.room}</span>
            <span className="mt-1 block text-[10px] font-bold text-white/55">
              use ?mode=neon for networked neon battler · this adventure is same-screen
            </span>
          </p>
        ) : null}

        <label className="block text-[10px] font-bold tracking-[0.2em] text-[#ffe14a]">
          START ZONE
          <input
            type="number"
            min={1}
            max={20}
            className="wa-display mt-2 w-full border-2 border-white/20 bg-black/70 p-3 text-center text-3xl text-[#ffe14a] outline-none focus:border-[#ffe14a]"
            value={level}
            onChange={(e) => setLevel(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>

        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/70">PLAYERS</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`flex-1 py-3 text-xs font-black tracking-wider ${
                  playerCount === n
                    ? 'bg-[#ffe14a] text-black'
                    : 'bg-black/50 text-white/60 hover:text-white'
                }`}
                onClick={() => setPlayerCount(n)}
              >
                {n}P
              </button>
            ))}
          </div>
        </div>

        {playerCount === 1 ? (
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/70">SOLO CHARACTER</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-3 text-xs font-black tracking-wider ${
                  character === 'Wideass' ? 'bg-[#ff3a4a] text-white' : 'bg-black/50 text-white/60'
                }`}
                onClick={() => setCharacter('Wideass')}
              >
                WIDEASS
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-xs font-black tracking-wider ${
                  character === 'Tats' ? 'bg-[#00d8ff] text-black' : 'bg-black/50 text-white/60'
                }`}
                onClick={() => setCharacter('Tats')}
              >
                TATS
              </button>
            </div>
          </div>
        ) : (
          <p className="border border-white/15 bg-black/40 px-3 py-2 text-center text-[11px] font-bold text-white/80">
            2P SEATS · Wideass = ←→/WASD · Tats = J/L/I/K · pads 0 / 1
          </p>
        )}

        <p className="text-center text-[10px] font-bold text-white/55">
          Same-screen co-op · 20 zones · jeep · space · cupid · M mute
        </p>

        <button
          type="submit"
          className="wa-cta wa-display w-full bg-[#ffe14a] py-4 text-lg text-black shadow-[0_6px_0_#b89a10]"
        >
          START ZONE {level}
        </button>
      </form>
    </main>
  );
}

function ModeCard({
  title,
  copy,
  accent,
  onClick,
}: {
  title: string;
  copy: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 bg-black/35 px-2 py-3 transition ${accent}`}
    >
      <p className="wa-display text-sm">{title}</p>
      <p className="mt-1 text-white/75">{copy}</p>
    </button>
  );
}

export default App;
