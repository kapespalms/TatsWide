import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdventureLaunch,
  CollectibleCounts,
  GamePhase,
  LevelTrigger,
  ShooterScores,
} from './types';
import { TOTAL_LEVELS } from './types';
import { getLevelAuthoring } from './levelAuthoring';
import { RunPhase } from './phases/RunPhase';
import { ShooterPhase } from './phases/ShooterPhase';
import type { RunProgress } from './run/AdventureRunScene';

interface AdventureGameProps extends AdventureLaunch {
  embed?: boolean;
}

const EMPTY_COUNTS: CollectibleCounts = { pepper: 0, duck: 0, witchHat: 0 };

export function AdventureGame({
  level: startLevel,
  playerCount,
  primaryCharacter,
  embed = false,
}: AdventureGameProps) {
  const [level, setLevel] = useState(startLevel);
  const [phase, setPhase] = useState<GamePhase>('run');
  const [resumeX, setResumeX] = useState(120);
  const [score, setScore] = useState(0);
  const [zoneScore, setZoneScore] = useState(0);
  const [counts, setCounts] = useState<CollectibleCounts>({ ...EMPTY_COUNTS });
  const [activeTrigger, setActiveTrigger] = useState<LevelTrigger | null>(null);
  const [doneTriggers, setDoneTriggers] = useState<Set<string>>(() => new Set());
  const [timeSec, setTimeSec] = useState(0);
  const [banner, setBanner] = useState('');
  const [failReason, setFailReason] = useState('');
  const runKey = useRef(0);
  const phaseRef = useRef(phase);
  const posRef = useRef(120);
  const finishedHandled = useRef(false);
  const zoneScoreRef = useRef(0);
  const countsRef = useRef<CollectibleCounts>({ ...EMPTY_COUNTS });
  const takenIdsRef = useRef<Set<string>>(new Set());
  const killedGhostsRef = useRef<Set<string>>(new Set());
  const [takenTick, setTakenTick] = useState(0);
  phaseRef.current = phase;
  zoneScoreRef.current = zoneScore;
  countsRef.current = counts;

  const authoring = useMemo(() => getLevelAuthoring(level), [level]);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(''), 2400);
    return () => window.clearTimeout(t);
  }, [banner]);

  const handleProgress = useCallback(
    (progress: RunProgress) => {
      posRef.current = progress.x;
      zoneScoreRef.current = progress.score;
      countsRef.current = progress.counts;
      setZoneScore(progress.score);
      setCounts(progress.counts);
      setTimeSec(progress.timeSec);
      for (const id of progress.takenIds) takenIdsRef.current.add(id);
      for (const id of progress.killedGhostIds) killedGhostsRef.current.add(id);
      if (progress.finished && phaseRef.current === 'run' && !finishedHandled.current) {
        finishedHandled.current = true;
        setScore((s) => s + progress.score);
        if (level >= TOTAL_LEVELS) {
          setPhase('victory');
          setBanner('ALL 20 ZONES CLEAR!');
        } else {
          setPhase('levelComplete');
          setBanner(`${authoring.name.toUpperCase()} CLEAR!`);
        }
      }
    },
    [level, authoring.name],
  );

  const handleTrigger = useCallback(
    (trigger: LevelTrigger) => {
      if (doneTriggers.has(trigger.id) || phaseRef.current !== 'run') return;
      // Prefer latest flushed Phaser values (reportProgress runs just before this)
      zoneScoreRef.current = Math.max(zoneScoreRef.current, zoneScore);
      countsRef.current = counts;
      setResumeX(trigger.resumeX);
      setActiveTrigger(trigger);
      setPhase(trigger.kind);
      setBanner(
        trigger.kind === 'jeep' ? 'JEEP ENGAGED — T-REX INCOMING!' : 'STARSHIP LAUNCH — ALIENS AHEAD!',
      );
    },
    [doneTriggers, zoneScore, counts],
  );

  const retryFromFail = () => {
    setFailReason('');
    setActiveTrigger(null);
    runKey.current += 1;
    setTakenTick((t) => t + 1);
    setPhase('run');
    setBanner('CONTINUE — BACK ON THE TRACK!');
  };

  const handleShooterDone = useCallback(
    (result: { scores: ShooterScores; won: boolean; reason: string }) => {
      if (!activeTrigger) return;
      if (!result.won) {
        setFailReason(result.reason);
        setResumeX(Math.max(120, activeTrigger.atX - 120));
        setActiveTrigger(null);
        setPhase('failed');
        return;
      }
      // Bonus only into zone score — campaign absorbs it at zone clear (no double-count)
      const bonus = Math.floor((result.scores.Wideass + result.scores.Tats) / 10);
      const nextZone = Math.max(zoneScoreRef.current, zoneScore) + bonus;
      zoneScoreRef.current = nextZone;
      setZoneScore(nextZone);
      setCounts(countsRef.current);
      setDoneTriggers((prev) => new Set([...prev, activeTrigger.id]));
      setResumeX(activeTrigger.resumeX);
      setActiveTrigger(null);
      setBanner(`BACK TO ${authoring.name.toUpperCase()}!`);
      runKey.current += 1;
      setTakenTick((t) => t + 1);
      setPhase('run');
    },
    [activeTrigger, authoring.name, zoneScore],
  );

  const clearZoneState = () => {
    setResumeX(120);
    setZoneScore(0);
    setCounts({ ...EMPTY_COUNTS });
    setDoneTriggers(new Set());
    setActiveTrigger(null);
    setBanner('');
    setFailReason('');
    setTimeSec(0);
    finishedHandled.current = false;
    zoneScoreRef.current = 0;
    countsRef.current = { ...EMPTY_COUNTS };
    takenIdsRef.current = new Set();
    killedGhostsRef.current = new Set();
    runKey.current += 1;
    setTakenTick((t) => t + 1);
    setPhase('run');
  };

  const resetCampaign = () => {
    setLevel(startLevel);
    setScore(0);
    clearZoneState();
  };

  const nextLevel = () => {
    setLevel((l) => Math.min(TOTAL_LEVELS, l + 1));
    clearZoneState();
  };

  if (phase === 'failed') {
    return (
      <EndScreen
        title={failReason || 'MISSION FAILED'}
        subtitle="Quota or jeep integrity collapsed. Continue from the checkpoint — pickups stay collected."
        embed={embed}
        buttonLabel="CONTINUE"
        onAction={retryFromFail}
      />
    );
  }

  if (phase === 'victory' || phase === 'levelComplete') {
    return (
      <EndScreen
        title={phase === 'victory' ? 'WIDEASS & TATS FOREVER' : `${authoring.name.toUpperCase()} CLEAR`}
        subtitle={
          phase === 'victory'
            ? `Campaign score ${score.toLocaleString()} · every zone beaten.`
            : `Zone ${zoneScore.toLocaleString()} · Total ${score.toLocaleString()} · PEP ${counts.pepper} · DUCK ${counts.duck} · HAT ${counts.witchHat}`
        }
        embed={embed}
        buttonLabel={phase === 'victory' ? 'PLAY AGAIN' : `ZONE ${level + 1} →`}
        onAction={phase === 'victory' ? resetCampaign : nextLevel}
      />
    );
  }

  if ((phase === 'jeep' || phase === 'space') && activeTrigger) {
    return (
      <div className={embed ? 'relative h-full w-full' : 'relative min-h-screen'}>
        {banner && <Banner text={banner} />}
        <ShooterPhase
          kind={phase}
          segment={{
            id: activeTrigger.id.length,
            kind: phase,
            atDistance: activeTrigger.atX,
            killQuota: activeTrigger.killQuota,
            durationSec: activeTrigger.durationSec,
          }}
          level={level}
          intensity={0.7 + level * 0.05}
          playerCount={playerCount}
          embed={embed}
          onComplete={handleShooterDone}
        />
      </div>
    );
  }

  return (
    <div className={embed ? 'relative h-full w-full' : 'relative min-h-screen bg-[#1a3a6a]'}>
      {banner && <Banner text={banner} />}
      <RunPhase
        key={`${level}-${runKey.current}-${takenTick}`}
        level={authoring}
        playerCount={playerCount}
        primaryCharacter={primaryCharacter}
        startX={resumeX}
        seedScore={zoneScoreRef.current}
        seedCounts={countsRef.current}
        seedTakenIds={[...takenIdsRef.current]}
        seedKilledGhostIds={[...killedGhostsRef.current]}
        embed={embed}
        onProgress={handleProgress}
        onTrigger={handleTrigger}
        hud={{ score: score + zoneScore, counts, timeSec }}
      />
    </div>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 z-50 flex justify-center px-4">
      <p className="wa-display animate-pulse border-2 border-[#ffe14a] bg-black/85 px-6 py-3 text-sm tracking-wide text-[#ffe14a] shadow-[0_6px_0_#101018] sm:text-lg">
        {text}
      </p>
    </div>
  );
}

function EndScreen({
  title,
  subtitle,
  embed,
  buttonLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  embed?: boolean;
  buttonLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={`wa-title-screen flex flex-col items-center justify-center gap-6 px-6 text-white ${
        embed ? 'h-full w-full' : 'min-h-screen'
      }`}
    >
      <h1 className="wa-display max-w-3xl text-center text-3xl text-[#ffe14a] drop-shadow-[4px_4px_0_#101018] sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-lg text-center text-sm font-bold text-white/90">{subtitle}</p>
      <button
        type="button"
        className="wa-cta wa-display bg-[#ffe14a] px-10 py-4 text-lg text-black shadow-[0_6px_0_#b89a10]"
        onClick={onAction}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export type { CharacterId } from './types';
