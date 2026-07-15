import type { LevelAuthoring } from './types';
import { GROUND_Y, getTrackKitForLevel } from './run/levelTracks';
import { getZoneStory } from './zoneStory';

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

  const pepperXs = kit.pepperXs;
  const peppers = pepperXs.map((x, i) => ({
    id: `L${level}-pep-${i}`,
    ...onMain(x, -44),
    kind: 'pepper' as const,
  }));
  // Arc of rings through loop 1 for that classic Sonic bait
  const loopRings = [0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
    const ang = -Math.PI / 2 + t * Math.PI * 2;
    const r = kit.loopRadius - 36;
    return {
      id: `L${level}-loopring-${i}`,
      x: kit.loop1X + Math.cos(ang) * r,
      y: GROUND_Y - kit.loopRadius + Math.sin(ang) * r,
      kind: 'pepper' as const,
    };
  });

  const ducks = [
    { id: `L${level}-duck-0`, ...onHigh(kit.highX + 80), kind: 'duck' as const },
    { id: `L${level}-duck-1`, ...onHigh(kit.highX + 220), kind: 'duck' as const },
    { id: `L${level}-duck-2`, ...onLow(kit.tunnelX + 200), kind: 'duck' as const },
    { id: `L${level}-duck-3`, ...onGrind(0.35), kind: 'duck' as const },
    { id: `L${level}-duck-4`, ...onGrind(0.65), kind: 'duck' as const },
    { id: `L${level}-duck-5`, ...onMain(kit.jeepAtX - 180, -50), kind: 'duck' as const },
  ];

  const hats = [
    { id: `L${level}-hat-0`, ...onMain(kit.loop1X + 200), kind: 'witchHat' as const },
    { id: `L${level}-hat-1`, ...onHigh(kit.highX + 300), kind: 'witchHat' as const },
    { id: `L${level}-hat-2`, ...onGrind(0.8), kind: 'witchHat' as const },
    { id: `L${level}-hat-3`, ...onMain(kit.spaceAtX - 400), kind: 'witchHat' as const },
    { id: `L${level}-hat-4`, ...onMain(kit.loop2X + 240), kind: 'witchHat' as const },
  ];

  const ghostXs = kit.ghostXs;

  const jeepQuota = Math.min(18, Math.floor(7 + level * 0.55 * hard));
  const spaceQuota = Math.min(20, Math.floor(8 + level * 0.6 * hard));
  const cupidQuota = Math.min(18, Math.floor(6 + level * 0.5 * hard));
  const jeepBoss = level === 5;
  const spaceBoss = level === 10 || level === 20;
  const cupidBoss = level === 15;

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
    ],
    springs: [
      { x: onMain(kit.springXs[0]).x, y: onMain(kit.springXs[0], 8).y, power: -900 },
      { x: onMain(kit.springXs[1]).x, y: onMain(kit.springXs[1], 8).y, power: -880 - level * 4 },
      { x: onMain(kit.highX - 40).x, y: onMain(kit.highX - 40, 8).y, power: -1280 },
      { x: onMain(kit.jeepAtX - 500).x, y: onMain(kit.jeepAtX - 500, 8).y, power: -920 },
      { x: onMain(kit.spaceAtX - 300).x, y: onMain(kit.spaceAtX - 300, 8).y, power: -900 },
      { x: onMain(kit.loop2X - 380).x, y: onMain(kit.loop2X - 380, 8).y, power: -940 },
    ],
    seesaws: [
      { x: kit.hillStart + 180, y: GROUND_Y - 8, width: 160 },
      { x: kit.tunnelX - 280, y: GROUND_Y - 8, width: 140 },
    ],
    grindRails: [
      {
        x: kit.grindX,
        y: GROUND_Y - kit.grindHeight,
        length: kit.grindLen,
      },
    ],
    collectibles: [...peppers, ...loopRings, ...ducks, ...hats],
    ghosts: ghostXs.map((x, i) => {
      const p = onMain(x, -20);
      return { id: `L${level}-ghost-${i}`, x: p.x, y: p.y, patrol: 90 + level * 4 };
    }),
    triggers: [
      {
        id: `L${level}-jeep`,
        kind: 'jeep',
        atX: kit.jeepAtX,
        resumeX: kit.jeepResumeX,
        killQuota: jeepBoss ? Math.min(22, jeepQuota + 6) : jeepQuota,
        durationSec: Math.max(55, (jeepBoss ? 78 : 68) - level * 0.35),
        boss: jeepBoss,
      },
      {
        id: `L${level}-space`,
        kind: 'space',
        atX: kit.spaceAtX,
        resumeX: kit.spaceResumeX,
        killQuota: spaceBoss ? Math.min(24, spaceQuota + 6) : spaceQuota,
        durationSec: Math.max(55, (spaceBoss ? 78 : 68) - level * 0.35),
        boss: spaceBoss,
      },
      {
        id: `L${level}-cupid`,
        kind: 'cupid',
        atX: kit.cupidAtX,
        resumeX: kit.cupidResumeX,
        killQuota: cupidBoss ? Math.min(22, cupidQuota + 7) : cupidQuota,
        durationSec: Math.max(50, (cupidBoss ? 75 : 62) - level * 0.3),
        boss: cupidBoss,
      },
    ],
  };
}

export const LEVEL_1 = authorLevel(1);

export function getLevelAuthoring(level: number): LevelAuthoring {
  return authorLevel(Math.max(1, Math.min(20, level)));
}
