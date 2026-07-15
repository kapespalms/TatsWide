import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdventureLaunch,
  CollectibleCounts,
  GamePhase,
  LevelTrigger,
  ShooterKind,
  ShooterScores,
} from './types';
import { TOTAL_LEVELS } from './types';
import { getLevelAuthoring } from './levelAuthoring';
import { RunPhase } from './phases/RunPhase';
import { ShooterPhase } from './phases/ShooterPhase';
import type { RunProgress } from './run/AdventureRunScene';
import { AdventureAudio } from './run/AdventureAudio';
import { clearCampaignSave, readCampaignSave, writeCampaignSave } from './campaignSave';

interface AdventureGameProps extends AdventureLaunch {
  embed?: boolean;
}

const EMPTY_COUNTS: CollectibleCounts = { pepper: 0, duck: 0, witchHat: 0 };

function triggerBanner(trigger: LevelTrigger): string {
  if (trigger.boss) {
    if (trigger.kind === 'jeep') return 'BOSS FINALE — CYBER T-REX!';
    if (trigger.kind === 'space') return 'BOSS FINALE — DREADNOUGHT!';
    return 'BOSS FINALE — HEART-BREAK ENGINE!';
  }
  if (trigger.kind === 'jeep') return 'ACT FINALE — JUNGLE JEEP!';
  if (trigger.kind === 'space') return 'ACT FINALE — ALIEN ATTACK!';
  return 'ACT FINALE — CUPID HEARTS!';
}

function demoBanner(kind: ShooterKind): string {
  if (kind === 'jeep') return 'JEEP DEMO — SHOOT THE DINOSAURS!';
  if (kind === 'space') return 'SPACE DEMO — LOAD YOUR WEAPON!';
  return 'CUPID DEMO — FREE THE HEARTS!';
}

function zoneEnterBanner(name: string, sectorLabel: string, boss: boolean): string {
  return boss ? `BOSS ZONE · ${sectorLabel}` : `${sectorLabel} · ${name.toUpperCase()}`;
}

function demoTriggerFromPhase(kind: ShooterKind, level: number): LevelTrigger {
  return {
    id: `demo-${kind}`,
    kind,
    atX: 0,
    resumeX: 120,
    killQuota: kind === 'space' ? 10 : 8,
    durationSec: 70,
    boss: false,
  };
}

export function AdventureGame({
  level: startLevel,
  playerCount,
  primaryCharacter,
  embed = false,
  forcePhase,
}: AdventureGameProps) {
  const startAuthoring = useMemo(() => getLevelAuthoring(startLevel), [startLevel]);
  // Title ModeCard demos are one-shot — sticky forcePhase must not poison the full campaign
  const demoSeedRef = useRef<LevelTrigger | null>(
    forcePhase
      ? (startAuthoring.triggers.find((t) => t.kind === forcePhase) ??
          demoTriggerFromPhase(forcePhase, startLevel))
      : null,
  );
  const [demoArmed, setDemoArmed] = useState(() => !!demoSeedRef.current);
  const demoTrigger = demoArmed ? demoSeedRef.current : null;

  const bootSave = useMemo(() => {
    if (forcePhase) return null;
    const s = readCampaignSave();
    if (!s) return null;
    if (s.playerCount !== playerCount || s.primaryCharacter !== primaryCharacter) return null;
    return s;
  }, [forcePhase, playerCount, primaryCharacter]);

  const [level, setLevel] = useState(bootSave?.level ?? startLevel);
  const [phase, setPhase] = useState<GamePhase>(() =>
    demoSeedRef.current ? demoSeedRef.current.kind : 'run',
  );
  const [resumeX, setResumeX] = useState(bootSave?.resumeX ?? 120);
  const [score, setScore] = useState(bootSave?.score ?? 0);
  const [zoneScore, setZoneScore] = useState(bootSave?.zoneScore ?? 0);
  const [counts, setCounts] = useState<CollectibleCounts>(
    () => bootSave?.counts ?? { ...EMPTY_COUNTS },
  );
  const [activeTrigger, setActiveTrigger] = useState<LevelTrigger | null>(() => demoSeedRef.current);
  const [doneTriggers, setDoneTriggers] = useState<Set<string>>(
    () => new Set(bootSave?.doneTriggers ?? []),
  );
  const [timeSec, setTimeSec] = useState(bootSave?.timeSec ?? 0);
  const [lives, setLives] = useState(bootSave?.lives ?? 3);
  const [banner, setBanner] = useState(() =>
    demoSeedRef.current
      ? demoBanner(demoSeedRef.current.kind)
      : zoneEnterBanner(startAuthoring.name, startAuthoring.story.sectorLabel, startAuthoring.story.bossZone),
  );
  const [storyCard, setStoryCard] = useState(() =>
    demoSeedRef.current
      ? null
      : {
          title: startAuthoring.story.title,
          blurb: startAuthoring.story.blurb,
          accent: startAuthoring.story.accent,
        },
  );
  const [wipe, setWipe] = useState(false);
  const [failReason, setFailReason] = useState('');
  const runKey = useRef(0);
  const phaseRef = useRef(phase);
  const posRef = useRef(120);
  const finishedHandled = useRef(false);
  const zoneScoreRef = useRef(bootSave?.zoneScore ?? 0);
  const countsRef = useRef<CollectibleCounts>(bootSave?.counts ?? { ...EMPTY_COUNTS });
  const takenIdsRef = useRef<Set<string>>(new Set(bootSave?.takenIds ?? []));
  const killedGhostsRef = useRef<Set<string>>(new Set(bootSave?.killedGhostIds ?? []));
  const lastPersistAt = useRef(0);
  phaseRef.current = phase;
  zoneScoreRef.current = zoneScore;
  countsRef.current = counts;

  const persistCampaign = useCallback(
    (partial?: { resumeX?: number; lives?: number; level?: number; force?: boolean }) => {
      if (demoArmed) return;
      const now = performance.now();
      if (!partial?.force && now - lastPersistAt.current < 1200) return;
      lastPersistAt.current = now;
      writeCampaignSave({
        level: partial?.level ?? level,
        score,
        zoneScore: zoneScoreRef.current,
        lives: partial?.lives ?? lives,
        resumeX: partial?.resumeX ?? resumeX,
        timeSec,
        counts: countsRef.current,
        doneTriggers: [...doneTriggers],
        takenIds: [...takenIdsRef.current],
        killedGhostIds: [...killedGhostsRef.current],
        playerCount,
        primaryCharacter,
      });
    },
    [demoArmed, level, score, lives, resumeX, timeSec, doneTriggers, playerCount, primaryCharacter],
  );

  const authoring = useMemo(() => getLevelAuthoring(level), [level]);

  const playWipe = useCallback(() => {
    setWipe(true);
    const a = new AdventureAudio();
    a.wipeWhoosh();
    window.setTimeout(() => {
      a.dispose();
      setWipe(false);
    }, 520);
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(''), 2600);
    return () => window.clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (!storyCard) return;
    const t = window.setTimeout(() => setStoryCard(null), 4200);
    return () => window.clearTimeout(t);
  }, [storyCard]);

  const handleProgress = useCallback(
    (progress: RunProgress) => {
      posRef.current = progress.x;
      zoneScoreRef.current = progress.score;
      countsRef.current = progress.counts;
      setZoneScore(progress.score);
      setCounts(progress.counts);
      setTimeSec(progress.timeSec);
      setLives(progress.lives);
      for (const id of progress.takenIds) takenIdsRef.current.add(id);
      for (const id of progress.killedGhostIds) killedGhostsRef.current.add(id);
      if (progress.dead && phaseRef.current === 'run') {
        const ck = Math.max(120, progress.checkpointX);
        setResumeX(ck);
        persistCampaign({ resumeX: ck, lives: 0, force: true });
        setFailReason('OUT OF LIVES — FELL OR GOT SPIKED!');
        phaseRef.current = 'failed';
        setPhase('failed');
        return;
      }
      if (progress.finished && phaseRef.current === 'run' && !finishedHandled.current) {
        finishedHandled.current = true;
        setScore((s) => s + progress.score);
        playWipe();
        if (level >= TOTAL_LEVELS) {
          clearCampaignSave();
          phaseRef.current = 'victory';
          setPhase('victory');
          setBanner('ALL 20 ZONES CLEAR!');
        } else {
          persistCampaign({ resumeX: 120 });
          phaseRef.current = 'levelComplete';
          setPhase('levelComplete');
          setBanner(`${authoring.name.toUpperCase()} CLEAR!`);
        }
      } else if (phaseRef.current === 'run') {
        persistCampaign({ resumeX: Math.max(120, progress.checkpointX), lives: progress.lives });
      }
    },
    [level, authoring.name, playWipe, persistCampaign],
  );

  const handleTrigger = useCallback(
    (trigger: LevelTrigger) => {
      if (doneTriggers.has(trigger.id) || phaseRef.current !== 'run') return;
      phaseRef.current = trigger.kind;
      playWipe();
      setResumeX(trigger.resumeX);
      setActiveTrigger(trigger);
      setPhase(trigger.kind);
      setBanner(triggerBanner(trigger));
      setStoryCard({
        title: authoring.story.title,
        blurb:
          trigger.kind === 'jeep'
            ? 'Safari keep unlocked. Dual reticles — clear the dinosaur quarantine.'
            : trigger.kind === 'space'
              ? 'Nebula hangar open. Load both cannons on the alien wing.'
              : 'Cupid grid online. Pop floating hearts before spite columns land.',
        accent: authoring.story.accent,
      });
    },
    [doneTriggers, playWipe, authoring.story],
  );

  const retryFromFail = () => {
    setFailReason('');
    setLives(3);
    runKey.current += 1;
    persistCampaign({ lives: 3, force: true });
    playWipe();
    // Title demos re-open the keep — never dump a demo fail onto the run mid-act
    if (demoArmed && demoSeedRef.current) {
      const demo = demoSeedRef.current;
      setActiveTrigger(demo);
      phaseRef.current = demo.kind;
      setPhase(demo.kind);
      setBanner(demoBanner(demo.kind));
      return;
    }
    setActiveTrigger(null);
    phaseRef.current = 'run';
    setPhase('run');
    setBanner('CONTINUE — BACK ON THE TRACK!');
  };

  const handleShooterDone = useCallback(
    (result: { scores: ShooterScores; won: boolean; reason: string }) => {
      if (!activeTrigger) return;
      if (!result.won) {
        setFailReason(result.reason);
        // Keep trigger alive for demo retry; campaign resumes before the gate
        if (!demoArmed) {
          setResumeX(Math.max(120, activeTrigger.atX - 120));
          setActiveTrigger(null);
        }
        phaseRef.current = 'failed';
        setPhase('failed');
        return;
      }
      const bonus = Math.floor((result.scores.Wideass + result.scores.Tats) / 10);
      const nextZone = Math.max(zoneScoreRef.current, zoneScore) + bonus;
      zoneScoreRef.current = nextZone;
      setZoneScore(nextZone);
      setCounts(countsRef.current);
      // One-shot demo: clear the arm so later keeps use real campaign fail/win paths
      if (demoArmed) {
        setDemoArmed(false);
        demoSeedRef.current = null;
        setDoneTriggers(new Set());
        setResumeX(120);
        setActiveTrigger(null);
        setBanner('DEMO CLEAR — FULL ZONE RUN!');
        runKey.current += 1;
        playWipe();
        phaseRef.current = 'run';
        setPhase('run');
        return;
      }
      const cleared = new Set([...doneTriggers, activeTrigger.id]);
      setDoneTriggers(cleared);
      setResumeX(activeTrigger.resumeX);
      setActiveTrigger(null);
      setBanner(`BACK TO ${authoring.name.toUpperCase()}!`);
      // Keep Phaser alive — no runKey remount stutter after keep clear
      writeCampaignSave({
        level,
        score,
        zoneScore: nextZone,
        lives,
        resumeX: activeTrigger.resumeX,
        timeSec,
        counts: countsRef.current,
        doneTriggers: [...cleared],
        takenIds: [...takenIdsRef.current],
        killedGhostIds: [...killedGhostsRef.current],
        playerCount,
        primaryCharacter,
      });
      playWipe();
      phaseRef.current = 'run';
      setPhase('run');
    },
    [
      activeTrigger,
      authoring.name,
      zoneScore,
      playWipe,
      demoArmed,
      doneTriggers,
      level,
      score,
      lives,
      timeSec,
      playerCount,
      primaryCharacter,
    ],
  );

  const resetCampaign = () => {
    clearCampaignSave();
    setLevel(startLevel);
    setScore(0);
    playWipe();
    const start = getLevelAuthoring(startLevel);
    setDemoArmed(false);
    demoSeedRef.current = null;
    setResumeX(120);
    setZoneScore(0);
    setCounts({ ...EMPTY_COUNTS });
    setDoneTriggers(new Set());
    setActiveTrigger(null);
    setFailReason('');
    setTimeSec(0);
    setLives(3);
    finishedHandled.current = false;
    zoneScoreRef.current = 0;
    countsRef.current = { ...EMPTY_COUNTS };
    takenIdsRef.current = new Set();
    killedGhostsRef.current = new Set();
    runKey.current += 1;
    phaseRef.current = 'run';
    setPhase('run');
    setBanner(zoneEnterBanner(start.name, start.story.sectorLabel, start.story.bossZone));
    setStoryCard({
      title: start.story.title,
      blurb: start.story.blurb,
      accent: start.story.accent,
    });
  };

  const nextLevel = () => {
    const next = Math.min(TOTAL_LEVELS, level + 1);
    setLevel(next);
    playWipe();
    const auth = getLevelAuthoring(next);
    setResumeX(120);
    setZoneScore(0);
    setCounts({ ...EMPTY_COUNTS });
    setDoneTriggers(new Set());
    setActiveTrigger(null);
    setFailReason('');
    setTimeSec(0);
    setLives(3);
    finishedHandled.current = false;
    zoneScoreRef.current = 0;
    countsRef.current = { ...EMPTY_COUNTS };
    takenIdsRef.current = new Set();
    killedGhostsRef.current = new Set();
    runKey.current += 1;
    writeCampaignSave({
      level: next,
      score,
      zoneScore: 0,
      lives: 3,
      resumeX: 120,
      timeSec: 0,
      counts: { ...EMPTY_COUNTS },
      doneTriggers: [],
      takenIds: [],
      killedGhostIds: [],
      playerCount,
      primaryCharacter,
    });
    phaseRef.current = 'run';
    setPhase('run');
    setBanner(zoneEnterBanner(auth.name, auth.story.sectorLabel, auth.story.bossZone));
    setStoryCard({
      title: auth.story.title,
      blurb: auth.story.blurb,
      accent: auth.story.accent,
    });
  };

  if (phase === 'failed') {
    return (
      <EndScreen
        title={failReason || 'MISSION FAILED'}
        subtitle={
          demoArmed
            ? 'Demo keep failed. Retry the keep, or return to title.'
            : failReason.includes('LIVES')
              ? 'You ran out of lives. Continue from the checkpoint — pickups stay collected.'
              : 'Quota or vehicle integrity collapsed. Continue from the checkpoint — pickups stay collected.'
        }
        embed={embed}
        buttonLabel={demoArmed ? 'RETRY KEEP' : 'CONTINUE'}
        onAction={retryFromFail}
        secondaryLabel="TITLE"
        onSecondary={exitToTitle}
      />
    );
  }

  if (phase === 'victory' || phase === 'levelComplete') {
    return (
      <EndScreen
        title={phase === 'victory' ? 'WIDEASS & TATS FOREVER' : `${authoring.name.toUpperCase()} CLEAR`}
        subtitle={
          phase === 'victory'
            ? `Campaign score ${score.toLocaleString()} · Sector Escape complete.`
            : `Zone ${zoneScore.toLocaleString()} · Total ${score.toLocaleString()} · HEARTS ${counts.pepper} · WIDEASS ${counts.duck} · TATS ${counts.witchHat}`
        }
        embed={embed}
        buttonLabel={phase === 'victory' ? 'PLAY AGAIN' : `ZONE ${level + 1} →`}
        onAction={phase === 'victory' ? resetCampaign : nextLevel}
        secondaryLabel="TITLE"
        onSecondary={exitToTitle}
      />
    );
  }

  const shooterActive =
    (phase === 'jeep' || phase === 'space' || phase === 'cupid') && !!activeTrigger;
  // Title demos start mid-keep — only mount the run once the campaign is live
  const mountRun = !demoArmed || phase === 'run';

  return (
    <div className={embed ? 'relative h-full w-full' : 'relative min-h-screen bg-[#1a3a6a]'}>
      {wipe && <WipeOverlay />}
      {banner && <Banner text={banner} accent={authoring.story.accent} />}
      {storyCard && <StoryBanner {...storyCard} />}
      {mountRun ? (
        <RunPhase
          key={`${level}-${runKey.current}`}
          level={authoring}
          playerCount={playerCount}
          primaryCharacter={primaryCharacter}
          startX={resumeX}
          seedScore={zoneScoreRef.current}
          seedCounts={countsRef.current}
          seedTakenIds={[...takenIdsRef.current]}
          seedKilledGhostIds={[...killedGhostsRef.current]}
          seedElapsed={timeSec}
          seedFiredTriggers={[...doneTriggers]}
          seedLives={lives}
          suspended={shooterActive}
          embed={embed}
          onProgress={handleProgress}
          onTrigger={handleTrigger}
          hud={{ score: score + zoneScore, counts, timeSec, lives }}
        />
      ) : null}
      {shooterActive && activeTrigger ? (
        <div className="absolute inset-0 z-30">
          <ShooterPhase
            key={`shoot-${phase}-${activeTrigger.id}`}
            kind={phase as ShooterKind}
            segment={{
              id: activeTrigger.id.length,
              kind: phase as ShooterKind,
              atDistance: activeTrigger.atX,
              killQuota: activeTrigger.killQuota,
              durationSec: activeTrigger.durationSec,
            }}
            level={level}
            intensity={0.4 + level * 0.025 + (activeTrigger.boss ? 0.12 : 0)}
            playerCount={playerCount}
            primaryCharacter={primaryCharacter}
            embed={embed}
            boss={!!activeTrigger.boss}
            onComplete={handleShooterDone}
          />
        </div>
      ) : null}
    </div>
  );
}

function WipeOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[60] animate-[waWipe_0.52s_ease-in-out]"
      style={{
        background:
          'linear-gradient(105deg, transparent 0%, #0a0814 18%, #ffe14a 46%, #ff66aa 58%, #0a0814 82%, transparent 100%)',
        backgroundSize: '220% 100%',
        animation: 'waWipe 0.52s ease-in-out forwards',
      }}
    />
  );
}

function Banner({ text, accent = '#ffe14a' }: { text: string; accent?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 z-50 flex justify-center px-4">
      <p
        className="wa-display border-2 bg-black/85 px-6 py-3 text-sm tracking-wide shadow-[0_6px_0_#101018] sm:text-lg"
        style={{ borderColor: accent, color: accent }}
      >
        {text}
      </p>
    </div>
  );
}

function StoryBanner({ title, blurb, accent }: { title: string; blurb: string; accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-50 flex justify-center px-4">
      <div
        className="max-w-xl border-2 bg-black/80 px-5 py-3 text-center shadow-[0_6px_0_#101018]"
        style={{ borderColor: accent }}
      >
        <p className="wa-display text-sm tracking-wide sm:text-base" style={{ color: accent }}>
          {title}
        </p>
        <p className="mt-1 text-[11px] font-bold leading-snug text-white/90 sm:text-xs">{blurb}</p>
      </div>
    </div>
  );
}

function exitToTitle() {
  const params = new URLSearchParams(window.location.search);
  params.delete('autostart');
  params.delete('phase');
  const q = params.toString();
  window.location.assign(`${window.location.pathname}${q ? `?${q}` : ''}`);
}

function EndScreen({
  title,
  subtitle,
  embed,
  buttonLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  subtitle: string;
  embed?: boolean;
  buttonLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
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
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="wa-cta wa-display bg-[#ffe14a] px-10 py-4 text-lg text-black shadow-[0_6px_0_#b89a10]"
          onClick={onAction}
        >
          {buttonLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className="wa-display border-2 border-white/30 bg-black/50 px-8 py-4 text-lg text-white/90"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export type { CharacterId } from './types';
