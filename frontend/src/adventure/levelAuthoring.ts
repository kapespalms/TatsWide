import type { LevelAuthoring, LevelTrigger, ShooterKind } from './types';
import { GROUND_Y, getTrackKitForLevel } from './run/levelTracks';
import { getZoneStory } from './zoneStory';

function finaleKindForLevel(level: number, sector: string): ShooterKind {
  if (sector === 'SAFARI') return 'jeep';
  if (sector === 'NEBULA') return 'space';
  if (sector === 'CUPID') return 'cupid';
  return level % 2 === 0 ? 'space' : 'jeep';
}

/** Rings floating in a parabola you must jump/spring to catch */
function airBridge(
  idPrefix: string,
  x0: number,
  y0: number,
  span: number,
  peak: number,
  count: number,
) {
  const out: Array<{ id: string; x: number; y: number; kind: 'pepper' }> = [];
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    out.push({
      id: `${idPrefix}-${i}`,
      x: x0 + t * span,
      y: y0 - Math.sin(t * Math.PI) * peak,
      kind: 'pepper',
    });
  }
  return out;
}

function loopRingArc(idPrefix: string, cx: number, cy: number, r: number) {
  return [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96].map((t, i) => {
    const ang = -Math.PI / 2 + t * Math.PI * 2;
    return {
      id: `${idPrefix}-${i}`,
      x: cx + Math.cos(ang) * r,
      y: cy + Math.sin(ang) * r,
      kind: 'pepper' as const,
    };
  });
}

function authorLevel(level: number): LevelAuthoring {
  const kit = getTrackKitForLevel(level);
  const main = kit.tracks.MAIN.path;
  const high = kit.tracks.HIGH.path;
  const low = kit.tracks.LOW.path;
  const grind = kit.tracks.GRIND?.path;
  const hard = 1 + (level - 1) * 0.08;
  const story = getZoneStory(level);

  const onMain = (x: number, dy = -40) => {
    const p = main.project(x, GROUND_Y);
    const s = main.sample(p.s);
    return { x: s.x, y: s.y + dy };
  };
  const onHigh = (x: number, dy = -36) => {
    const p = high.project(x, GROUND_Y - 200);
    const s = high.sample(p.s);
    return { x: s.x, y: s.y + dy };
  };
  const onLow = (x: number, dy = -30) => {
    const p = low.project(x, GROUND_Y + 70);
    const s = low.sample(p.s);
    return { x: s.x, y: s.y + dy };
  };
  const onGrind = (frac: number, dy = -28) => {
    if (!grind) return onMain(kit.jeepAtX - 1200, dy);
    const s = grind.sample(grind.length * frac);
    return { x: s.x, y: s.y + dy };
  };

  // Ground trail rings (close to path — always collectible while running)
  const peppers = kit.pepperXs.map((x, i) => ({
    id: `L${level}-pep-${i}`,
    ...onMain(x, -24),
    kind: 'pepper' as const,
  }));

  // Full loop ring lines through every major loop
  const loopRings = [
    ...loopRingArc(`L${level}-loop1`, kit.loop1X, GROUND_Y - kit.loopRadius, kit.loopRadius - 32),
    ...loopRingArc(`L${level}-loop2`, kit.loop2X, GROUND_Y - kit.loopRadius - 10, kit.loopRadius - 28),
    ...loopRingArc(`L${level}-loop3`, kit.loop3X, GROUND_Y - kit.loopRadius - 8, kit.loopRadius - 30),
    ...loopRingArc(`L${level}-loop4`, kit.loop4X, GROUND_Y - kit.loopRadius - 14, kit.loopRadius - 26),
  ];

  // High crest rings — standing height + leap
  const crestRings = kit.hillPeaks.flatMap((peakX, pi) => {
    const base = onMain(peakX, 0);
    return airBridge(`L${level}-crest-${pi}`, base.x - 90, base.y - 40, 200, 110, 7);
  });

  // Pit crossings — rings hang in the air over soft troughs (must spring/jump)
  const pitRings = kit.pitMids.flatMap((mid, pi) => {
    const floor = onMain(mid, 0);
    return airBridge(`L${level}-pit-${pi}`, floor.x - 140, floor.y - 20, 280, 150, 9);
  });

  // Death-gap rainbows — collect while jumping the bottomless pit
  const gapRings = kit.deathGaps.flatMap((gap, gi) => {
    const span = gap.xMax - gap.xMin;
    return airBridge(`L${level}-gap-${gi}`, gap.xMin + 20, GROUND_Y - 40, span - 40, 180, 10);
  });

  // Mid-air bridge arcs between set pieces
  const jumpBridges = [
    airBridge(
      `L${level}-bridge-a`,
      onMain(kit.hillStart + 80, 0).x,
      onMain(kit.hillStart + 80, 0).y - 30,
      320,
      130,
      8,
    ),
    airBridge(
      `L${level}-bridge-b`,
      onMain(kit.highX + 40, 0).x,
      onMain(kit.highX + 40, 0).y - 50,
      360,
      160,
      9,
    ),
    airBridge(
      `L${level}-bridge-c`,
      onMain(kit.loop3X + 220, 0).x,
      onMain(kit.loop3X + 220, 0).y - 40,
      300,
      140,
      8,
    ),
  ].flat();

  const ducks = [
    { id: `L${level}-duck-0`, ...onHigh(kit.highX + 80), kind: 'duck' as const },
    { id: `L${level}-duck-1`, ...onHigh(kit.highX + 280), kind: 'duck' as const },
    { id: `L${level}-duck-2`, ...onLow(kit.tunnelX + 200), kind: 'duck' as const },
    { id: `L${level}-duck-3`, ...onGrind(0.35), kind: 'duck' as const },
    { id: `L${level}-duck-4`, ...onGrind(0.65), kind: 'duck' as const },
    {
      id: `L${level}-duck-5`,
      ...onMain(kit.pitMids[0] ?? kit.loop2X, -120),
      kind: 'duck' as const,
    },
    {
      id: `L${level}-duck-6`,
      x: ((kit.deathGaps[0]?.xMin ?? 0) + (kit.deathGaps[0]?.xMax ?? 0)) / 2 || onMain(kit.loop3X, 0).x,
      y: GROUND_Y - 160,
      kind: 'duck' as const,
    },
  ];

  const hats = [
    { id: `L${level}-hat-0`, ...onMain(kit.loop1X + 280, -90), kind: 'witchHat' as const },
    { id: `L${level}-hat-1`, ...onHigh(kit.highX + 360), kind: 'witchHat' as const },
    { id: `L${level}-hat-2`, ...onGrind(0.8), kind: 'witchHat' as const },
    {
      id: `L${level}-hat-3`,
      ...onMain(kit.hillPeaks[1] ?? kit.loop2X, -130),
      kind: 'witchHat' as const,
    },
    {
      id: `L${level}-hat-4`,
      ...onMain(kit.loop4X + 200, -100),
      kind: 'witchHat' as const,
    },
  ];

  const finaleKind = finaleKindForLevel(level, story.sector);
  const jeepBoss = level === 5 && finaleKind === 'jeep';
  const spaceBoss = (level === 10 || level === 20) && finaleKind === 'space';
  const cupidBoss = level === 15 && finaleKind === 'cupid';
  const isBoss = jeepBoss || spaceBoss || cupidBoss || level === 20;

  const jeepQuota = Math.min(18, Math.floor(7 + level * 0.55 * hard));
  const spaceQuota = Math.min(20, Math.floor(8 + level * 0.6 * hard));
  const cupidQuota = Math.min(18, Math.floor(6 + level * 0.5 * hard));

  const quota =
    finaleKind === 'jeep'
      ? jeepBoss
        ? Math.min(22, jeepQuota + 6)
        : jeepQuota
      : finaleKind === 'space'
        ? spaceBoss
          ? Math.min(24, spaceQuota + 6)
          : spaceQuota
        : cupidBoss
          ? Math.min(22, cupidQuota + 7)
          : cupidQuota;

  const atX =
    finaleKind === 'jeep' ? kit.jeepAtX : finaleKind === 'space' ? kit.spaceAtX : kit.cupidAtX;
  const resumeX =
    finaleKind === 'jeep'
      ? kit.jeepResumeX
      : finaleKind === 'space'
        ? kit.spaceResumeX
        : kit.cupidResumeX;

  const triggers: LevelTrigger[] = [
    {
      id: `L${level}-finale`,
      kind: finaleKind,
      atX,
      resumeX,
      killQuota: quota,
      durationSec: Math.max(55, (isBoss ? 78 : 68) - level * 0.35),
      boss: isBoss,
    },
  ];

  // Strong springs just before pits / death gaps / crests so jumps are readable set pieces
  const powers = [-920, -1180, -1320, -980, -1240, -1080, -1280, -1000, -1200, -1100, -1260];
  const springs = kit.springXs.map((sx, i) => {
    const p = onMain(sx, 6);
    return { x: p.x, y: p.y, power: powers[i % powers.length] };
  });

  const seesaws = [
    { x: kit.hillStart + 220, y: onMain(kit.hillStart + 220, 2).y, width: 160 },
    { x: kit.tunnelX - 280, y: onMain(kit.tunnelX - 280, 2).y, width: 140 },
  ];

  const spikes = kit.spikeXs.map((sx) => {
    const p = onMain(sx, 4);
    return { x: p.x, y: p.y, width: 64 };
  });

  return {
    level,
    name: kit.name,
    theme: kit.theme,
    skyColor: kit.skyColor,
    worldWidth: kit.worldWidth,
    finishX: kit.finishX,
    story,
    platforms: [{ x: 0, y: 700, w: kit.worldWidth, h: 40, surface: 'main', color: 0x3a7a30 }],
    loops: [
      { centerX: kit.loop1X, centerY: GROUND_Y - kit.loopRadius, radius: kit.loopRadius },
      { centerX: kit.loop2X, centerY: GROUND_Y - (kit.loopRadius + 10), radius: kit.loopRadius + 10 },
      { centerX: kit.loop3X, centerY: GROUND_Y - (kit.loopRadius + 8), radius: kit.loopRadius + 8 },
      { centerX: kit.loop4X, centerY: GROUND_Y - (kit.loopRadius + 14), radius: kit.loopRadius + 14 },
    ],
    springs,
    seesaws,
    grindRails: [
      {
        x: kit.grindX,
        y: GROUND_Y - kit.grindHeight,
        length: kit.grindLen,
      },
    ],
    spikes,
    buttons: seesaws.map((s, i) => ({
      x: s.x,
      y: s.y - 10,
      w: 44,
      h: 12,
      eventId: `btn-${level}-${i}`,
    })),
    collectibles: [
      ...peppers,
      ...loopRings,
      ...crestRings,
      ...pitRings,
      ...gapRings,
      ...jumpBridges,
      ...ducks,
      ...hats,
    ],
    ghosts: kit.ghostXs.map((x, i) => {
      const p = onMain(x, -20);
      return { id: `L${level}-ghost-${i}`, x: p.x, y: p.y, patrol: 90 + level * 4 };
    }),
    triggers,
  };
}

export const LEVEL_1 = authorLevel(1);

export function getLevelAuthoring(level: number): LevelAuthoring {
  return authorLevel(Math.max(1, Math.min(20, level)));
}
