import { useMemo, useState, useEffect } from 'react';
import { AdventureGame, type CharacterId } from './adventure/AdventureGame';

function readLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed') === '1';
  const autostart = params.get('autostart') === '1';
  const rawChar = params.get('character')?.toLowerCase();
  const character: CharacterId = rawChar === 'tats' ? 'Tats' : 'Wideass';
  const level = Math.min(20, Math.max(1, Number(params.get('level')) || 1));
  const players = params.get('players') === '2' ? 2 : 1;
  return { embed, autostart, character, level, players: players as 1 | 2 };
}

function App() {
  const launch = useMemo(() => readLaunchParams(), []);
  const [character, setCharacter] = useState<CharacterId>(launch.character);
  const [level, setLevel] = useState(launch.level);
  const [playerCount, setPlayerCount] = useState<1 | 2>(launch.players);
  const [started, setStarted] = useState(launch.embed && launch.autostart);
  const [controllers, setControllers] = useState<string[]>([]);

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

  if (started) {
    return (
      <main className={launch.embed ? 'h-screen w-screen bg-black p-0' : 'min-h-screen bg-[#1a3a6a] p-0'}>
        <AdventureGame
          level={level}
          playerCount={playerCount}
          primaryCharacter={character}
          embed={launch.embed}
        />
      </main>
    );
  }

  return (
    <main className="wa-title-screen flex flex-col items-center justify-center gap-8 px-6 py-12 text-white">
      <div className="wa-bob relative z-10 max-w-3xl text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.45em] text-white/80">20 ZONES · CO-OP ADVENTURE</p>
        <h1 className="wa-display text-5xl leading-none text-[#ffe14a] drop-shadow-[4px_4px_0_#101018] sm:text-6xl md:text-7xl">
          WIDEASS
          <span className="block text-3xl text-white sm:text-4xl">&amp;</span>
          TATS
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-white/95">
          Sonic-speed lanes, loops, jeep dinosaur runs, and starship alien fights.
        </p>
      </div>

      <div className="relative z-10 grid w-full max-w-xl grid-cols-3 gap-3 text-center text-[10px] font-bold">
        <ModeCard title="RUN" copy="Loops · spindash · routes" accent="border-emerald-300/70 text-emerald-100" />
        <ModeCard title="JEEP" copy="Dual guns · T-Rex" accent="border-amber-300/70 text-amber-100" />
        <ModeCard title="SPACE" copy="Rail dogfights" accent="border-cyan-300/70 text-cyan-100" />
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
          setStarted(true);
        }}
      >
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

        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/70">P1 CHARACTER</p>
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

        <p className="text-center text-[10px] font-bold text-white/55">
          Cabinet grade · 20 zones · loops · jeep · space
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

function ModeCard({ title, copy, accent }: { title: string; copy: string; accent: string }) {
  return (
    <div className={`border-2 bg-black/35 px-2 py-3 ${accent}`}>
      <p className="wa-display text-sm">{title}</p>
      <p className="mt-1 text-white/75">{copy}</p>
    </div>
  );
}

export default App;
