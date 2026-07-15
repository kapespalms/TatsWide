import { useMemo, useState } from 'react';
import { AdventureGame, type CharacterId } from './adventure/AdventureGame';
import type { ShooterKind } from './adventure/types';
import { GameOrchestrator } from './game3d/GameOrchestrator';

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

type FloaterKind = 'duck' | 'heart' | 'dino' | 'rat';

const FLOATERS: Array<{
  kind: FloaterKind;
  left: string;
  top: string;
  delay: string;
  dur: string;
}> = [
  { kind: 'duck', left: '7%', top: '16%', delay: '0s', dur: '2.8s' },
  { kind: 'duck', left: '82%', top: '68%', delay: '0.9s', dur: '3.1s' },
  { kind: 'heart', left: '14%', top: '74%', delay: '0.4s', dur: '2.5s' },
  { kind: 'heart', left: '88%', top: '18%', delay: '1.2s', dur: '3.3s' },
  { kind: 'dino', left: '4%', top: '46%', delay: '0.6s', dur: '2.9s' },
  { kind: 'dino', left: '70%', top: '10%', delay: '1.5s', dur: '2.6s' },
  { kind: 'rat', left: '90%', top: '44%', delay: '0.2s', dur: '3s' },
  { kind: 'rat', left: '26%', top: '8%', delay: '1.7s', dur: '2.7s' },
];

function App() {
  const launch = useMemo(() => readLaunchParams(), []);
  const [character, setCharacter] = useState<CharacterId>(launch.character);
  const [level, setLevel] = useState(launch.level);
  const [playerCount, setPlayerCount] = useState<1 | 2>(launch.players);
  const forcePhase = launch.forcePhase;
  const [started, setStarted] = useState(!!(launch.embed && launch.autostart));

  const startAdventure = () => {
    if (playerCount === 2) setCharacter('Wideass');
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
    <main className="wa-title-screen flex flex-col items-center justify-center gap-8 px-6 py-12">
      {FLOATERS.map((f, i) => (
        <span
          key={`${f.kind}-${i}`}
          className="wa-floater"
          style={{
            left: f.left,
            top: f.top,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
          aria-hidden
        >
          <FloaterGlyph kind={f.kind} />
        </span>
      ))}

      <header className="wa-title-hero relative z-20 flex flex-col items-center gap-4">
        <div className="wa-cloud wa-cloud-bob" style={{ animationDelay: '0s' }}>
          <span className="wa-cloud-text wa-cloud-text-wideass">WIDEASS</span>
        </div>
        <div className="wa-cloud-amp wa-cloud-bob" style={{ animationDelay: '0.35s' }}>
          &amp;
        </div>
        <div className="wa-cloud wa-cloud-bob" style={{ animationDelay: '0.7s' }}>
          <span className="wa-cloud-text wa-cloud-text-tats">TATS</span>
        </div>
      </header>

      <form
        className="wa-panel relative z-20 flex w-full max-w-sm flex-col gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          startAdventure();
        }}
      >
        {launch.room ? (
          <p className="wa-panel-note">
            ONLINE ROOM · <span className="wa-panel-accent">{launch.room}</span>
          </p>
        ) : null}

        <label className="wa-panel-label">
          START ZONE
          <input
            type="number"
            min={1}
            max={20}
            className="wa-panel-input wa-display"
            value={level}
            onChange={(e) => setLevel(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>

        <div>
          <p className="wa-panel-label-plain">PLAYERS</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={playerCount === n ? 'wa-chip wa-chip-on' : 'wa-chip'}
                onClick={() => setPlayerCount(n)}
              >
                {n}P
              </button>
            ))}
          </div>
        </div>

        {playerCount === 1 ? (
          <div>
            <p className="wa-panel-label-plain">SOLO CHARACTER</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={character === 'Wideass' ? 'wa-chip wa-chip-wideass' : 'wa-chip'}
                onClick={() => setCharacter('Wideass')}
              >
                WIDEASS
              </button>
              <button
                type="button"
                className={character === 'Tats' ? 'wa-chip wa-chip-tats' : 'wa-chip'}
                onClick={() => setCharacter('Tats')}
              >
                TATS
              </button>
            </div>
          </div>
        ) : (
          <p className="wa-panel-note">
            2P SEATS · Wideass ←→/WASD + SPACE/F · Tats J/L/I/K + ENTER/G · pads 0 / 1
          </p>
        )}

        <button type="submit" className="wa-cta wa-display">
          START ZONE {level}
        </button>
      </form>
    </main>
  );
}

function FloaterGlyph({ kind }: { kind: FloaterKind }) {
  if (kind === 'duck') {
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
        <ellipse cx="10" cy="14" rx="7" ry="5" fill="#f0c040" />
        <circle cx="16" cy="10" r="4.5" fill="#f0c040" />
        <circle cx="18" cy="9" r="1.2" fill="#101018" />
        <path d="M20 10h4l-2 2z" fill="#ff8800" />
        <ellipse cx="7" cy="18" rx="2" ry="1.2" fill="#e09020" />
      </svg>
    );
  }
  if (kind === 'heart') {
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
        <path
          d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.2A4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z"
          fill="#ff4a7a"
        />
        <path d="M8 8.5c0-1.2.9-2 2-2" stroke="#ffe0ea" strokeWidth="1.4" fill="none" />
      </svg>
    );
  }
  if (kind === 'dino') {
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
        <ellipse cx="11" cy="14" rx="7" ry="5" fill="#ff8ab8" />
        <circle cx="16" cy="10" r="4" fill="#ff8ab8" />
        <circle cx="17.5" cy="9" r="1.1" fill="#101018" />
        <rect x="18.5" y="10" width="4" height="1.5" rx="0.5" fill="#ff6688" />
        <path d="M6 10l2 3 2-4 2 4 2-3" fill="#ff6688" />
        <rect x="7" y="18" width="2.2" height="3" fill="#e070a0" />
        <rect x="12" y="18" width="2.2" height="3" fill="#e070a0" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
      <ellipse cx="12" cy="14" rx="6.5" ry="4.5" fill="#f6f6f8" stroke="#c8c8d0" strokeWidth="0.8" />
      <circle cx="16" cy="11" r="3.8" fill="#f6f6f8" stroke="#c8c8d0" strokeWidth="0.8" />
      <circle cx="17.2" cy="10.2" r="1" fill="#101018" />
      <ellipse cx="18.5" cy="12" rx="1.4" ry="0.7" fill="#ffb0c0" />
      <path d="M8 12c-2-1-3 0-3.5 1.5" stroke="#c8c8d0" strokeWidth="1.2" fill="none" />
      <ellipse cx="9" cy="18" rx="1.6" ry="1" fill="#e8e8ee" />
    </svg>
  );
}

export default App;
