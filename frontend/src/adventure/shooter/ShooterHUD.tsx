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
}: ShooterHUDProps) {
  const isJeep = kind === 'jeep';
  const title = isJeep ? 'RESCUE THE DINOSAURS!' : 'ALIEN ATTACK';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden font-mono">
      <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-3">
        <p className="text-center text-sm font-black tracking-[0.3em] text-amber-300">{title}</p>
        <p className="text-center text-[10px] text-white/70">
          ZONE {level} · {kills}/{killQuota} · {timeLeft}s
        </p>
      </div>

      {/* P1 */}
      <div className="absolute left-4 top-14 w-44">
        <p className="text-[10px] font-black tracking-widest text-yellow-300">P1 SCORE</p>
        <p className="text-2xl font-black text-yellow-300 drop-shadow">{scores.Wideass.toLocaleString()}</p>
        <p className="text-xs font-bold text-red-400">WIDEASS</p>
        <Meter label="HP" value={p1Hp} color="#ff3344" />
        {streaks.Wideass > 1 && (
          <p className="mt-1 text-xs font-black text-red-400">STREAK ×{streaks.Wideass}</p>
        )}
      </div>

      {/* P2 — cabinet always shows co-op lane */}
      <div className="absolute right-4 top-14 w-44 text-right">
        <p className="text-[10px] font-black tracking-widest text-yellow-300">P2 SCORE</p>
        <p className="text-2xl font-black text-yellow-300 drop-shadow">{scores.Tats.toLocaleString()}</p>
        <p className="text-xs font-bold text-cyan-300">TATS{playerCount === 1 ? ' (LINKED)' : ''}</p>
        <div className="ml-auto w-full">
          <Meter label="HP" value={p2Hp} color="#00ffff" align="right" />
        </div>
        {streaks.Tats > 1 && (
          <p className="mt-1 text-xs font-black text-cyan-300">STREAK ×{streaks.Tats}</p>
        )}
      </div>

      {isJeep && (
        <div className="absolute bottom-28 left-1/2 w-72 -translate-x-1/2">
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
      )}

      <Reticle who="Wideass" color="#ff3344" pos={reticles.Wideass} flash={flash === 'Wideass'} laser />
      <Reticle who="Tats" color="#00ccff" pos={reticles.Tats} flash={flash === 'Tats'} laser />

      {/* Corner gun silhouettes */}
      <div className="absolute bottom-3 left-6 h-16 w-28 rounded-t-lg border border-red-500/40 bg-gradient-to-t from-red-950/80 to-zinc-800/50 shadow-lg shadow-red-500/20">
        <p className="pt-2 text-center text-[9px] font-black text-red-300">P1 CANNON</p>
      </div>
      <div className="absolute bottom-3 right-6 h-16 w-28 rounded-t-lg border border-cyan-500/40 bg-gradient-to-t from-cyan-950/80 to-zinc-800/50 shadow-lg shadow-cyan-500/20">
        <p className="pt-2 text-center text-[9px] font-black text-cyan-300">P2 ENERGY</p>
      </div>

      {!isJeep && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/60">
          Aim reticles · shoot aliens · steer together
        </p>
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
  const gunBottom = who === 'Wideass' ? '12%' : '12%';
  const gunSide = who === 'Wideass' ? '12%' : '88%';

  return (
    <>
      {laser && (
        <svg className="absolute inset-0 h-full w-full opacity-70">
          <line
            x1={gunSide}
            y1={`calc(100% - ${gunBottom})`}
            x2={left}
            y2={top}
            stroke={color}
            strokeWidth="2"
            strokeOpacity="0.55"
          />
        </svg>
      )}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
        <div
          className={`relative h-14 w-14 rounded-full border-[3px] ${flash ? 'scale-125' : ''} transition-transform`}
          style={{ borderColor: color, boxShadow: `0 0 16px ${color}` }}
        >
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ backgroundColor: color }} />
          <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2" style={{ backgroundColor: color }} />
          <div
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </>
  );
}
