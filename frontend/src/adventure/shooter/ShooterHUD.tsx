import type { CharacterId, ShooterKind, ShooterScores } from '../types';
import type { DualReticles } from '../shooter/useShooterInput';

interface ShooterHUDProps {
  kind: ShooterKind;
  level: number;
  scores: ShooterScores;
  kills: number;
  killQuota: number;
  timeLeft: number;
  playerCount: 1 | 2;
  reticles: DualReticles;
  flash: string;
  streaks?: ShooterScores;
  jeepHp?: number;
  jeepHpMax?: number;
  p1Hp?: number;
  p2Hp?: number;
  boss?: boolean;
  primaryCharacter?: CharacterId;
}

export function ShooterHUD({
  kind,
  level,
  scores,
  kills,
  killQuota,
  timeLeft,
  playerCount,
  reticles,
  flash,
  streaks = { Wideass: 0, Tats: 0 },
  jeepHp = 100,
  jeepHpMax = 100,
  p1Hp = 100,
  p2Hp = 100,
  boss = false,
  primaryCharacter = 'Wideass',
}: ShooterHUDProps) {
  const isJeep = kind === 'jeep';
  const isCupid = kind === 'cupid';
  const title = isJeep
    ? boss
      ? 'BOSS · JURASSIC JEEP'
      : 'JURASSIC JEEP'
    : isCupid
      ? boss
        ? 'BOSS · CUPID HEARTS'
        : 'CUPID HEARTS'
      : boss
        ? 'BOSS · ALIEN ATTACK'
        : 'ALIEN ATTACK';
  const tip = isJeep
    ? 'Shoot T-REX + RAPTORS · crates = bonus points only'
    : isCupid
      ? 'Pop floating HEARTS with dual arrow lasers'
      : 'Shoot the BRIGHT RED aliens — load both cannons';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden font-mono">
      <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/90 via-black/45 to-transparent px-4 pb-12 pt-3">
        <p
          className="wa-display text-center text-lg tracking-[0.2em] drop-shadow-[2px_2px_0_#101018]"
          style={{ color: isCupid ? '#ff66aa' : '#ffe14a' }}
        >
          {title}
        </p>
        <p className="mt-1 text-center text-[11px] font-black tracking-[0.22em] text-white/85">
          ZONE {level} · KILLS {kills}/{killQuota} · {timeLeft}s
        </p>
        <p className="mt-1 text-center text-[11px] font-bold text-[#ffee88]">{tip}</p>
      </div>

      {(playerCount === 2 || primaryCharacter === 'Wideass') && (
        <div className="absolute left-4 top-16 w-48">
          <p className="text-[10px] font-black tracking-widest text-yellow-300">
            {playerCount === 1 ? 'SCORE' : 'P1 SCORE'}
          </p>
          <p className="text-2xl font-black text-yellow-300 drop-shadow">{scores.Wideass.toLocaleString()}</p>
          <p className="text-xs font-bold text-red-400">WIDEASS</p>
          <Meter label="HP" value={p1Hp} color="#ff3344" />
          {streaks.Wideass > 1 && (
            <p className="mt-1 text-xs font-black text-red-400">STREAK ×{streaks.Wideass}</p>
          )}
        </div>
      )}

      {(playerCount === 2 || primaryCharacter === 'Tats') && (
        <div
          className={`absolute top-16 w-48 ${
            playerCount === 1 && primaryCharacter === 'Tats' ? 'left-4' : 'right-4 text-right'
          }`}
        >
          <p className="text-[10px] font-black tracking-widest text-yellow-300">
            {playerCount === 1 ? 'SCORE' : 'P2 SCORE'}
          </p>
          <p className="text-2xl font-black text-yellow-300 drop-shadow">{scores.Tats.toLocaleString()}</p>
          <p className="text-xs font-bold text-cyan-300">TATS</p>
          <div className={playerCount === 1 && primaryCharacter === 'Tats' ? '' : 'ml-auto w-full'}>
            <Meter
              label="HP"
              value={playerCount === 1 ? p1Hp : p2Hp}
              color="#00ffff"
              align={playerCount === 1 && primaryCharacter === 'Tats' ? 'left' : 'right'}
            />
          </div>
          {streaks.Tats > 1 && (
            <p className="mt-1 text-xs font-black text-cyan-300">STREAK ×{streaks.Tats}</p>
          )}
        </div>
      )}

      {isJeep ? (
        <>
          <div className="absolute bottom-28 left-1/2 w-80 -translate-x-1/2">
            <p className="mb-1 text-center text-[10px] font-black tracking-widest text-amber-200">
              JEEP DURABILITY
            </p>
            <div className="h-3 overflow-hidden rounded border border-amber-400/60 bg-black/70">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-green-400 transition-all"
                style={{ width: `${(jeepHp / jeepHpMax) * 100}%` }}
              />
            </div>
          </div>
          <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-4 text-[10px] font-black tracking-wide">
            <span className="rounded bg-green-900/80 px-2 py-1 text-lime-200 ring-1 ring-lime-400/50">
              T-REX / RAPTOR = KILL
            </span>
            <span className="rounded bg-amber-900/80 px-2 py-1 text-amber-200 ring-1 ring-amber-400/50">
              CRATE = BONUS
            </span>
          </div>
        </>
      ) : isCupid ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded bg-pink-950/80 px-3 py-1 text-[10px] font-black tracking-wide text-pink-100 ring-1 ring-pink-400/60">
          HEART = TARGET · POP BEFORE THEY REACH YOU
        </div>
      ) : (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded bg-red-950/80 px-3 py-1 text-[10px] font-black tracking-wide text-red-200 ring-1 ring-red-400/60">
          RED ALIEN = TARGET · DO NOT LET THEM REACH YOU
        </div>
      )}

      {(playerCount === 2 || primaryCharacter === 'Wideass') && (
        <Reticle
          who="Wideass"
          color={isCupid ? '#ff6699' : '#ff3344'}
          pos={reticles.Wideass}
          flash={flash === 'Wideass'}
          laser
        />
      )}
      {(playerCount === 2 || primaryCharacter === 'Tats') && (
        <Reticle
          who="Tats"
          color={isCupid ? '#ffd0e8' : '#00ccff'}
          pos={reticles.Tats}
          flash={flash === 'Tats'}
          laser
        />
      )}

      {(playerCount === 2 || primaryCharacter === 'Wideass') && (
        <div
          className={`absolute bottom-3 left-6 h-20 w-32 rounded-t-xl border-2 bg-gradient-to-t shadow-lg ${
            isCupid
              ? 'border-pink-500/50 from-pink-950/90 to-zinc-700/60 shadow-pink-500/30'
              : 'border-red-500/50 from-red-950/90 to-zinc-700/60 shadow-red-500/30'
          }`}
        >
          <p className={`pt-3 text-center text-[10px] font-black ${isCupid ? 'text-pink-200' : 'text-red-200'}`}>
            {playerCount === 1 ? '' : 'P1 '}
            {isCupid ? 'ARROW' : 'CANNON'}
          </p>
          <p className={`text-center text-[9px] ${isCupid ? 'text-pink-100/70' : 'text-red-100/70'}`}>
            AIM · FIRE
          </p>
        </div>
      )}
      {playerCount === 2 && (
        <div
          className={`absolute bottom-3 right-6 h-20 w-32 rounded-t-xl border-2 bg-gradient-to-t shadow-lg ${
            isCupid
              ? 'border-yellow-400/50 from-fuchsia-950/90 to-zinc-700/60 shadow-yellow-400/20'
              : 'border-cyan-500/50 from-cyan-950/90 to-zinc-700/60 shadow-cyan-500/30'
          }`}
        >
          <p className={`pt-3 text-center text-[10px] font-black ${isCupid ? 'text-yellow-200' : 'text-cyan-200'}`}>
            P2 {isCupid ? 'ARROW' : 'ENERGY'}
          </p>
          <p className={`text-center text-[9px] ${isCupid ? 'text-yellow-100/70' : 'text-cyan-100/70'}`}>
            AIM · FIRE
          </p>
        </div>
      )}
      {playerCount === 1 && primaryCharacter === 'Tats' && (
        <div
          className={`absolute bottom-3 left-6 h-20 w-32 rounded-t-xl border-2 bg-gradient-to-t shadow-lg ${
            isCupid
              ? 'border-yellow-400/50 from-fuchsia-950/90 to-zinc-700/60 shadow-yellow-400/20'
              : 'border-cyan-500/50 from-cyan-950/90 to-zinc-700/60 shadow-cyan-500/30'
          }`}
        >
          <p className={`pt-3 text-center text-[10px] font-black ${isCupid ? 'text-yellow-200' : 'text-cyan-200'}`}>
            {isCupid ? 'ARROW' : 'ENERGY'}
          </p>
          <p className={`text-center text-[9px] ${isCupid ? 'text-yellow-100/70' : 'text-cyan-100/70'}`}>
            AIM · FIRE
          </p>
        </div>
      )}
    </div>
  );
}

function Meter({
  label,
  value,
  color,
  align = 'left',
}: {
  label: string;
  value: number;
  color: string;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`mt-1 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="text-[9px] text-white/60">{label}</p>
      <div className="h-2 overflow-hidden rounded border border-white/20 bg-black/60">
        <div className="h-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Reticle({
  who,
  color,
  pos,
  flash,
  laser,
}: {
  who: CharacterId;
  color: string;
  pos: { x: number; y: number };
  flash: boolean;
  laser?: boolean;
}) {
  const left = `${pos.x * 100}%`;
  const top = `${pos.y * 100}%`;
  const gunBottom = '12%';
  const gunSide = who === 'Wideass' ? '12%' : '88%';

  return (
    <>
      {laser && (
        <svg className="absolute inset-0 h-full w-full opacity-80">
          <line
            x1={gunSide}
            y1={`calc(100% - ${gunBottom})`}
            x2={left}
            y2={top}
            stroke={color}
            strokeWidth="2.5"
            strokeOpacity="0.65"
          />
        </svg>
      )}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
        <div
          className={`relative h-16 w-16 rounded-full border-[3px] ${flash ? 'scale-125' : ''} transition-transform`}
          style={{ borderColor: color, boxShadow: `0 0 20px ${color}` }}
        >
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ backgroundColor: color }} />
          <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2" style={{ backgroundColor: color }} />
          <div
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </>
  );
}
