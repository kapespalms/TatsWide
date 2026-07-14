import type { LevelAuthoring } from './types';
import { GROUND_Y, getTrackKitForLevel } from './run/levelTracks';

function authorLevel(level: number): LevelAuthoring {
  const kit = getTrackKitForLevel(level);
  const main = kit.tracks.MAIN.path;
  const high = kit.tracks.HIGH.path;
  const low = kit.tracks.LOW.path;
  const grind = kit.tracks.GRIND?.path;
  const hard = 1 + (level - 1) * 0.08;

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
    ...onMain(x),
    kind: 'pepper' as const,
  }));

  const ducks = [
    { id: `L${level}-duck-0`, ...onHigh(kit.highX + 80), kind: 'duck' as const },
    { id: `L${level}-duck-1`, ...onHigh(kit.highX + 220), kind: 'duck' as const },
    { id: `L${level}-duck-2`, ...onLow(kit.tunnelX + 200), kind: 'duck' as const },
    { id: `L${level}-duck-3`, ...onGrind(0.4), kind: 'duck' as const },
  ];

  const hats = [
    { id: `L${level}-hat-0`, ...onMain(kit.loop1X + 200), kind: 'witchHat' as const },
    { id: `L${level}-hat-1`, ...onHigh(kit.highX + 300), kind: 'witchHat' as const },
    { id: `L${level}-hat-2`, ...onGrind(0.75), kind: 'witchHat' as const },
    { id: `L${level}-hat-3`, ...onMain(kit.spaceAtX - 400), kind: 'witchHat' as const },
  ];

  const ghostXs = kit.ghostXs;

  return {
    level,
    name: kit.name,
    theme: kit.theme,
    skyColor: kit.skyColor,
    worldWidth: kit.worldWidth,
    finishX: kit.finishX,
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
    ],
    seesaws: [],
    grindRails: [
      {
        x: kit.grindX,
        y: GROUND_Y - kit.grindHeight,
        length: kit.grindLen,
      },
    ],
    collectibles: [...peppers, ...ducks, ...hats],
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
        killQuota: Math.min(26, Math.floor(9 + level * 0.85 * hard)),
        durationSec: Math.max(48, 58 - level * 0.4),
      },
      {
        id: `L${level}-space`,
        kind: 'space',
        atX: kit.spaceAtX,
        resumeX: kit.spaceResumeX,
        killQuota: Math.min(28, Math.floor(10 + level * 0.9 * hard)),
        durationSec: Math.max(48, 58 - level * 0.4),
      },
    ],
  };
}

export const LEVEL_1 = authorLevel(1);

export function getLevelAuthoring(level: number): LevelAuthoring {
  return authorLevel(Math.max(1, Math.min(20, level)));
}
