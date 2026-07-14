import { TrackPath, curvePath, linePath, loopArc, type TrackSegment } from './SonicTrack';
import type { TrackRegistry } from './TrackRider';

export const GROUND_Y = 620;

export interface LevelTrackKit {
  tracks: TrackRegistry;
  boostS: { lo: number; hi: number };
  boost2S: { lo: number; hi: number };
  tunnelDuckS: { lo: number; hi: number };
  highJoinS: { lo: number; hi: number };
  grindJoinS: { lo: number; hi: number };
  loopLookaheadStart: number;
  finishTrackId: string;
  finishMinS: number;
  jeepAtX: number;
  jeepResumeX: number;
  spaceAtX: number;
  spaceResumeX: number;
  startS: number;
  worldWidth: number;
  finishX: number;
  loopRadius: number;
  highX: number;
  loop1X: number;
  loop2X: number;
  tunnelX: number;
  grindX: number;
  grindLen: number;
  grindHeight: number;
  pepperXs: number[];
  ghostXs: number[];
  springXs: [number, number];
  skyColor: string;
  theme: 'hills' | 'jungle' | 'crystal' | 'haunted' | 'industrial' | 'snow' | 'alien';
  name: string;
}

const ZONE_META: Array<{
  name: string;
  theme: LevelTrackKit['theme'];
  sky: string;
}> = [
  { name: 'Emerald Hills', theme: 'hills', sky: '#5ca4ff' },
  { name: 'Pepper Plains', theme: 'hills', sky: '#4eb0ff' },
  { name: 'Duck Marsh', theme: 'jungle', sky: '#3aa0c8' },
  { name: 'Witch Hollow', theme: 'haunted', sky: '#2a1a4a' },
  { name: 'Crystal Run', theme: 'crystal', sky: '#78c8ff' },
  { name: 'Jungle Jeep', theme: 'jungle', sky: '#2a6040' },
  { name: 'Loop Factory', theme: 'industrial', sky: '#4a5568' },
  { name: 'Snow Spiral', theme: 'snow', sky: '#c8e0ff' },
  { name: 'Alien Approach', theme: 'alien', sky: '#1a1030' },
  { name: 'Haunted Hills', theme: 'haunted', sky: '#201838' },
  { name: 'Goldrail Gorge', theme: 'hills', sky: '#58a8ff' },
  { name: 'Canopy Chase', theme: 'jungle', sky: '#1e5038' },
  { name: 'Prism Peak', theme: 'crystal', sky: '#88d0ff' },
  { name: 'Ghost Grade', theme: 'haunted', sky: '#18102a' },
  { name: 'Steel Spindash', theme: 'industrial', sky: '#3a4450' },
  { name: 'Frostbite Loop', theme: 'snow', sky: '#b0d4ff' },
  { name: 'Orbit Outskirts', theme: 'alien', sky: '#120820' },
  { name: 'Volcano Vein', theme: 'jungle', sky: '#402010' },
  { name: 'Final Factory', theme: 'industrial', sky: '#2a3038' },
  { name: 'Starway Summit', theme: 'alien', sky: '#0a0618' },
];

/** Theme-driven set pieces so zones don't feel like one stretched corridor. */
function themePlan(theme: LevelTrackKit['theme'], idx: number) {
  const base = 1 + idx * 0.03;
  switch (theme) {
    case 'jungle':
      return {
        stretch: base + 0.04,
        loopR: 118 + (idx % 4) * 5,
        hillAmp: 95,
        hillLen: 560,
        tunnelLen: 780,
        highLift: 230,
        grindHeight: 300,
        grindLen: 780,
        extraDip: true,
        doubleHill: false,
        earlyLoop: false,
      };
    case 'haunted':
      return {
        stretch: base,
        loopR: 145 + (idx % 3) * 8,
        hillAmp: 110,
        hillLen: 420,
        tunnelLen: 520,
        highLift: 250,
        grindHeight: 320,
        grindLen: 560,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
      };
    case 'industrial':
      return {
        stretch: base + 0.06,
        loopR: 125,
        hillAmp: 40,
        hillLen: 320,
        tunnelLen: 900,
        highLift: 180,
        grindHeight: 260,
        grindLen: 900,
        extraDip: false,
        doubleHill: false,
        earlyLoop: true,
      };
    case 'snow':
      return {
        stretch: base + 0.02,
        loopR: 150,
        hillAmp: 130,
        hillLen: 640,
        tunnelLen: 480,
        highLift: 270,
        grindHeight: 340,
        grindLen: 700,
        extraDip: false,
        doubleHill: true,
        earlyLoop: false,
      };
    case 'crystal':
      return {
        stretch: base,
        loopR: 136,
        hillAmp: 80,
        hillLen: 700,
        tunnelLen: 500,
        highLift: 220,
        grindHeight: 290,
        grindLen: 640,
        extraDip: false,
        doubleHill: false,
        earlyLoop: false,
        wavy: true,
      };
    case 'alien':
      return {
        stretch: base + 0.05,
        loopR: 140,
        hillAmp: 70,
        hillLen: 400,
        tunnelLen: 600,
        highLift: 240,
        grindHeight: 310,
        grindLen: 720,
        extraDip: true,
        doubleHill: false,
        earlyLoop: true,
      };
    default:
      return {
        stretch: base,
        loopR: 130 + (idx % 5) * 6,
        hillAmp: 70 + idx * 2,
        hillLen: 480 + idx * 6,
        tunnelLen: 600,
        highLift: 200,
        grindHeight: 280,
        grindLen: 640,
        extraDip: false,
        doubleHill: false,
        earlyLoop: false,
      };
  }
}

/** Deterministic zone kit — theme-unique layouts with loops, fork, grind, jeep + space. */
export function buildZoneTracks(level: number): LevelTrackKit {
  const idx = Math.max(1, Math.min(20, level)) - 1;
  const meta = ZONE_META[idx];
  const plan = themePlan(meta.theme, idx);
  const gy = GROUND_Y;
  const worldWidth = Math.floor(8600 + idx * 260 + plan.stretch * 400);
  const finishX = worldWidth - 400;
  const loopR = plan.loopR;
  const loop2R = loopR + (meta.theme === 'industrial' ? 6 : 12);
  const stretch = plan.stretch;

  const loop1X = Math.floor((plan.earlyLoop ? 850 : 1100) * stretch);
  const hillStart = Math.floor(2100 * stretch);
  const hillLen = Math.floor(plan.hillLen);
  const tunnelX = Math.floor(3800 * stretch);
  const highX = Math.floor(4600 * stretch);
  const grindX = Math.floor(highX + 600);
  const jeepX = Math.floor(5400 * stretch);
  const loop2X = Math.floor(6100 * stretch);
  const spaceX = Math.floor(7100 * stretch);

  // Build MAIN as one continuous polyline chain — no theme segment gaps.
  const mainSegs: TrackSegment[] = [];
  let cx = 0;
  let cy = gy;

  const goLine = (x: number, y: number) => {
    if (Math.hypot(x - cx, y - cy) < 1) {
      cx = x;
      cy = y;
      return;
    }
    mainSegs.push(...linePath([{ x: cx, y: cy }, { x, y }]));
    cx = x;
    cy = y;
  };
  const goCurve = (fn: (t: number) => { x: number; y: number }, steps: number) => {
    // Anchor start of curve to current tip
    const start = fn(0);
    goLine(start.x, start.y);
    mainSegs.push(...curvePath(fn, steps));
    const end = fn(1);
    cx = end.x;
    cy = end.y;
  };

  goLine(loop1X - 280, gy);
  goLine(loop1X, gy);
  mainSegs.push(loopArc(loop1X, gy - loopR, loopR, -1));
  cx = loop1X;
  cy = gy;
  goLine(hillStart, gy);

  goCurve(
    (t) => ({
      x: hillStart + t * hillLen,
      y: gy - plan.hillAmp * (0.5 - 0.5 * Math.cos(2 * Math.PI * t)),
    }),
    32,
  );

  if (plan.doubleHill) {
    const h2 = cx + 80;
    goLine(h2, gy);
    const h2Len = hillLen * 0.7;
    goCurve(
      (t) => ({
        x: h2 + t * h2Len,
        y: gy - plan.hillAmp * 0.75 * (0.5 - 0.5 * Math.cos(2 * Math.PI * t)),
      }),
      24,
    );
  }

  if (plan.extraDip) {
    const dipStart = cx;
    goCurve(
      (t) => ({
        x: dipStart + t * 360,
        y: gy + 55 * Math.sin(Math.PI * t),
      }),
      18,
    );
  }

  if ('wavy' in plan && plan.wavy) {
    const wStart = cx;
    goCurve(
      (t) => ({
        x: wStart + t * 700,
        y: gy - 36 * Math.sin(t * Math.PI * 3),
      }),
      36,
    );
  }

  goLine(tunnelX, gy);
  goLine(tunnelX + plan.tunnelLen, gy);
  goLine(highX, gy - 90);
  goLine(jeepX - 200, gy);
  goLine(loop2X, gy);
  mainSegs.push(loopArc(loop2X, gy - loop2R, loop2R, -1));
  cx = loop2X;
  cy = gy;
  goLine(spaceX, gy);
  goLine(finishX, gy);
  goLine(worldWidth, gy);

  const mainPath = new TrackPath(mainSegs);

  const highPath = new TrackPath(
    linePath([
      { x: highX - 40, y: gy - plan.highLift },
      { x: highX + 280, y: gy - plan.highLift },
      { x: highX + 480, y: gy - 40 },
    ]),
  );

  const lowPath = new TrackPath(
    linePath([
      { x: tunnelX + 40, y: gy + 70 },
      { x: tunnelX + plan.tunnelLen * 0.55, y: gy + 70 },
      { x: tunnelX + plan.tunnelLen * 0.85, y: gy },
    ]),
  );

  const grindPath = new TrackPath(
    linePath([
      { x: grindX, y: gy - plan.grindHeight },
      { x: grindX + plan.grindLen * 0.7, y: gy - plan.grindHeight },
      { x: grindX + plan.grindLen, y: gy - 40 },
    ]),
  );

  const boostS = {
    lo: mainPath.project(loop1X - 250, gy).s,
    hi: mainPath.project(loop1X - 40, gy).s,
  };
  const tunnelDuckS = {
    lo: mainPath.project(tunnelX + 20, gy).s,
    hi: mainPath.project(tunnelX + Math.min(280, plan.tunnelLen * 0.4), gy).s,
  };
  const highJoinS = {
    lo: mainPath.project(highX - 60, gy - 90).s,
    hi: mainPath.project(highX + 80, gy - 90).s,
  };
  const grindJoinS = {
    lo: mainPath.project(grindX - 80, gy).s,
    hi: mainPath.project(grindX + 40, gy).s,
  };
  const boost2S = {
    lo: mainPath.project(loop2X - 250, gy).s,
    hi: mainPath.project(loop2X - 40, gy).s,
  };

  const tracks: TrackRegistry = {
    MAIN: {
      id: 'MAIN',
      path: mainPath,
      joins: [
        {
          sMin: tunnelDuckS.lo,
          sMax: tunnelDuckS.hi,
          toTrackId: 'LOW',
          toS: 0,
          trigger: 'duck',
        },
        {
          sMin: highJoinS.lo,
          sMax: highJoinS.hi,
          toTrackId: 'HIGH',
          toS: 0,
          trigger: 'jump',
        },
        {
          sMin: grindJoinS.lo,
          sMax: grindJoinS.hi,
          toTrackId: 'GRIND',
          toS: 0,
          trigger: 'jump',
        },
      ],
    },
    HIGH: {
      id: 'HIGH',
      path: highPath,
      joins: [
        {
          sMin: Math.max(0, highPath.length - 40),
          sMax: highPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(highX + 480, gy - 40).s,
          trigger: 'auto',
        },
      ],
    },
    LOW: {
      id: 'LOW',
      path: lowPath,
      joins: [
        {
          sMin: Math.max(0, lowPath.length - 48),
          sMax: lowPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(tunnelX + plan.tunnelLen * 0.85, gy).s,
          trigger: 'auto',
        },
      ],
    },
    GRIND: {
      id: 'GRIND',
      path: grindPath,
      joins: [
        {
          sMin: Math.max(0, grindPath.length - 40),
          sMax: grindPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(grindX + plan.grindLen, gy - 40).s,
          trigger: 'auto',
        },
      ],
    },
  };

  const pepperXs = [
    400,
    700,
    loop1X + 180,
    hillStart + 120,
    hillStart + hillLen / 2,
    tunnelX - 200,
    highX - 100,
    grindX + 100,
    jeepX - 300,
    loop2X + 200,
    spaceX - 500,
    finishX - 300,
  ].map((x) => Math.min(worldWidth - 200, Math.floor(x)));

  const ghostXs = [800, loop1X + 400, hillStart + 200, tunnelX - 100, highX, loop2X - 200, spaceX - 200]
    .slice(0, 5 + Math.floor(level / 4))
    .map((x) => Math.floor(x));

  return {
    tracks,
    boostS,
    boost2S,
    tunnelDuckS,
    highJoinS,
    grindJoinS,
    loopLookaheadStart: boostS.lo,
    finishTrackId: 'MAIN',
    finishMinS: mainPath.project(finishX, gy).s,
    jeepAtX: jeepX,
    jeepResumeX: jeepX + 120,
    spaceAtX: spaceX,
    spaceResumeX: spaceX + 120,
    startS: mainPath.project(120, gy).s,
    worldWidth,
    finishX,
    loopRadius: loopR,
    highX,
    loop1X,
    loop2X,
    tunnelX,
    grindX,
    grindLen: plan.grindLen,
    grindHeight: plan.grindHeight,
    pepperXs,
    ghostXs,
    springXs: [650, Math.floor(hillStart + 200)],
    skyColor: meta.sky,
    theme: meta.theme,
    name: meta.name,
  };
}

export function getTrackKitForLevel(level: number): LevelTrackKit {
  return buildZoneTracks(level);
}

export function sampleOnMain(tracks: TrackRegistry, x: number, y = GROUND_Y) {
  return tracks.MAIN.path.project(x, y);
}
