import type { LevelAuthoring } from './types';
import { GROUND_Y, getTrackKitForLevel } from './run/levelTracks';

function authorLevel(level: number): LevelAuthoring {
  const kit = getTrackKitForLevel(level);
  const main = kit.tracks.MAIN.path;
  const high = kit.tracks.HIGH.path;
  const low = kit.tracks.LOW.path;
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

  const peppers = [400, 700, 1500, 2200, 3000, 3800, 5000, 6500, 7500, 8200]
    .map((x) => Math.min(kit.worldWidth - 200, Math.floor(x * (1 + (level - 1) * 0.03))))
    .map((x) => ({ ...onMain(x), kind: 'pepper' as const }));

  const ducks = [
    { ...onHigh(kit.jeepAtX - 400), kind: 'duck' as const },
    { ...onHigh(kit.jeepAtX - 250), kind: 'duck' as const },
    { ...onLow(kit.jeepAtX - 1100), kind: 'duck' as const },
  ];

  const hats = [
    { ...onMain(1000), kind: 'witchHat' as const },
    { ...onHigh(kit.jeepAtX - 180), kind: 'witchHat' as const },
    { ...onMain(kit.spaceAtX - 400), kind: 'witchHat' as const },
  ];

  const ghostXs = [800, 1800, 2800, 4500, 6000, 7000, 8000].slice(0, 5 + Math.floor(level / 4));

  return {
    level,
    name: kit.name,
    theme: kit.theme,
    skyColor: kit.skyColor,
    worldWidth: kit.worldWidth,
    finishX: kit.finishX,
    platforms: [
      { x: 0, y: 700, w: kit.worldWidth, h: 40, surface: 'main', color: 0x3a7a30 },
    ],
    loops: [],
    springs: [
      { x: onMain(650).x, y: onMain(650, 8).y, power: -900 },
      { x: onMain(2400).x, y: onMain(2400, 8).y, power: -880 - level * 4 },
      { x: onMain(kit.jeepAtX - 900).x, y: onMain(kit.jeepAtX - 900, 8).y, power: -1200 },
      { x: onMain(kit.jeepAtX - 500).x, y: onMain(kit.jeepAtX - 500, 8).y, power: -920 },
      { x: onMain(kit.spaceAtX - 300).x, y: onMain(kit.spaceAtX - 300, 8).y, power: -900 },
    ],
    seesaws: [],
    grindRails: [{ x: kit.jeepAtX - 1400, y: GROUND_Y - 280, length: 640 }],
    collectibles: [...peppers, ...ducks, ...hats],
    ghosts: ghostXs.map((x) => {
      const p = onMain(Math.floor(x * (1 + (level - 1) * 0.02)), -20);
      return { x: p.x, y: p.y, patrol: 90 + level * 4 };
    }),
    triggers: [
      {
        id: `L${level}-jeep`,
        kind: 'jeep',
        atX: kit.jeepAtX,
        resumeX: kit.jeepResumeX,
        killQuota: Math.floor(10 + level * hard),
        durationSec: Math.max(35, 50 - level),
      },
      {
        id: `L${level}-space`,
        kind: 'space',
        atX: kit.spaceAtX,
        resumeX: kit.spaceResumeX,
        killQuota: Math.floor(12 + level * hard),
        durationSec: Math.max(35, 50 - level),
      },
    ],
  };
}

export const LEVEL_1 = authorLevel(1);

export function getLevelAuthoring(level: number): LevelAuthoring {
  return authorLevel(Math.max(1, Math.min(20, level)));
}
