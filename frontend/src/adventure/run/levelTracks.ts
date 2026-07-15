import { TrackPath, curvePath, linePath, loopArc, type TrackSegment } from './SonicTrack';
import type { TrackRegistry } from './TrackRider';

export const GROUND_Y = 620;

export interface LevelTrackKit {
  tracks: TrackRegistry;
  boostS: { lo: number; hi: number };
  boost2S: { lo: number; hi: number };
  boost3S: { lo: number; hi: number };
  /** Mud / ice — caps speed while riding through */
  slowS: { lo: number; hi: number };
  slow2S: { lo: number; hi: number };
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
  cupidAtX: number;
  cupidResumeX: number;
  startS: number;
  worldWidth: number;
  finishX: number;
  loopRadius: number;
  highX: number;
  loop1X: number;
  loop2X: number;
  loop3X: number;
  loop4X: number;
  hillStart: number;
  tunnelX: number;
  grindX: number;
  grindLen: number;
  grindHeight: number;
  /** Steep hill crest X positions — rings float above these */
  hillPeaks: number[];
  /** Soft bowl pit midpoints — spring before, rings in air over the trough */
  pitMids: number[];
  /** Bottomless gaps — miss the jump and fall = lose a life */
  deathGaps: { xMin: number; xMax: number }[];
  /** Ground spike strip centers (world X) — hit = lose hearts / life */
  spikeXs: number[];
  pepperXs: number[];
  ghostXs: number[];
  springXs: number[];
  skyColor: string;
  theme: 'hills' | 'jungle' | 'crystal' | 'haunted' | 'industrial' | 'snow' | 'alien';
  name: string;
}

const ZONE_META: Array<{
  name: string;
  theme: LevelTrackKit['theme'];
  sky: string;
}> = [
  { name: 'Green Hill', theme: 'hills', sky: '#5ca8ff' },
  { name: 'Marble Zone', theme: 'crystal', sky: '#6a5848' },
  { name: 'Star Light', theme: 'alien', sky: '#1a1440' },
  { name: 'Scrap Brain', theme: 'industrial', sky: '#3a4048' },
  { name: 'Emerald Hill', theme: 'hills', sky: '#48a8ff' },
  { name: 'Chemical Plant', theme: 'industrial', sky: '#3a2060' },
  { name: 'Casino Night', theme: 'alien', sky: '#2a1048' },
  { name: 'Mystic Cave', theme: 'haunted', sky: '#1c2418' },
  { name: 'Aquatic Ruin', theme: 'jungle', sky: '#2a6878' },
  { name: 'Ice Cap', theme: 'snow', sky: '#b8d8ff' },
  { name: 'Carnival Night', theme: 'alien', sky: '#301848' },
  { name: 'Hydrocity', theme: 'jungle', sky: '#2088a0' },
  { name: 'Sky Sanctuary', theme: 'crystal', sky: '#90c8ff' },
  { name: 'Hilltop Act 2', theme: 'hills', sky: '#58b0ff' },
  { name: 'Lava Reef', theme: 'crystal', sky: '#482018' },
  { name: 'Flying Battery', theme: 'industrial', sky: '#405068' },
  { name: 'Sandopolis', theme: 'hills', sky: '#e0b868' },
  { name: 'Hidden Palace', theme: 'haunted', sky: '#102830' },
  { name: 'Death Egg', theme: 'industrial', sky: '#282830' },
  { name: 'Doomsday', theme: 'alien', sky: '#100818' },
];

/** Theme-driven set pieces — Green Hill–scale hills & loops, not flat runway. */
function themePlan(theme: LevelTrackKit['theme'], idx: number) {
  const base = 1 + idx * 0.03;
  switch (theme) {
    case 'jungle':
      return {
        stretch: base + 0.04,
        loopR: 155 + (idx % 4) * 8,
        hillAmp: 210,
        hillLen: 720,
        tunnelLen: 780,
        highLift: 280,
        grindHeight: 340,
        grindLen: 780,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
      };
    case 'haunted':
      return {
        stretch: base,
        loopR: 168 + (idx % 3) * 10,
        hillAmp: 230,
        hillLen: 640,
        tunnelLen: 520,
        highLift: 300,
        grindHeight: 360,
        grindLen: 560,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
      };
    case 'industrial':
      return {
        stretch: base + 0.06,
        loopR: 150,
        hillAmp: 160,
        hillLen: 520,
        tunnelLen: 900,
        highLift: 240,
        grindHeight: 300,
        grindLen: 900,
        extraDip: true,
        doubleHill: false,
        earlyLoop: true,
      };
    case 'snow':
      return {
        stretch: base + 0.02,
        loopR: 175,
        hillAmp: 250,
        hillLen: 800,
        tunnelLen: 480,
        highLift: 320,
        grindHeight: 380,
        grindLen: 700,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
      };
    case 'crystal':
      return {
        stretch: base,
        loopR: 160,
        hillAmp: 200,
        hillLen: 760,
        tunnelLen: 500,
        highLift: 290,
        grindHeight: 330,
        grindLen: 640,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
        wavy: true,
      };
    case 'alien':
      return {
        stretch: base + 0.05,
        loopR: 165,
        hillAmp: 190,
        hillLen: 600,
        tunnelLen: 600,
        highLift: 300,
        grindHeight: 350,
        grindLen: 720,
        extraDip: true,
        doubleHill: true,
        earlyLoop: true,
      };
    default:
      return {
        stretch: base,
        loopR: 158 + (idx % 5) * 8,
        hillAmp: 220 + (idx % 4) * 12,
        hillLen: 680 + idx * 8,
        tunnelLen: 600,
        highLift: 280,
        grindHeight: 320,
        grindLen: 640,
        extraDip: true,
        doubleHill: true,
        earlyLoop: false,
      };
  }
}

/** Deterministic zone kit — theme-unique layouts with loops, fork, grind, end-of-act finale. */
export function buildZoneTracks(level: number): LevelTrackKit {
  const idx = Math.max(1, Math.min(20, level)) - 1;
  const meta = ZONE_META[idx];
  const plan = themePlan(meta.theme, idx);
  const gy = GROUND_Y;
  // Real Sonic act length — ~5× the old ~14–18k runway so loops/hills breathe
  const worldWidth = Math.floor((14800 + idx * 340 + plan.stretch * 560) * 5);
  const finishX = worldWidth - 720;
  const loopR = plan.loopR;
  const loop2R = loopR + (meta.theme === 'industrial' ? 6 : 12);
  const loop3R = loopR + 8;
  const loop4R = loopR + 14;

  // Classic act rhythm across a long runway
  const loop1X = Math.floor(worldWidth * 0.07);
  const hillStart = Math.floor(worldWidth * 0.14);
  const hillLen = Math.floor(plan.hillLen * 2.1);
  const tunnelX = Math.floor(worldWidth * 0.26);
  const highX = Math.floor(worldWidth * 0.34);
  const loop2X = Math.floor(worldWidth * 0.42);
  const hill2Start = Math.floor(worldWidth * 0.52);
  const loop3X = Math.floor(worldWidth * 0.62);
  const grindLen = Math.floor(plan.grindLen * 1.6);
  const grindX = Math.floor(worldWidth * 0.72 - grindLen);
  const loop4X = Math.floor(worldWidth * 0.82);
  // Side game ONLY at the end of the Sonic act
  const finaleX = Math.floor(worldWidth * 0.925);
  const jeepX = finaleX;
  const spaceX = finaleX;
  const cupidX = finaleX;

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
    const start = fn(0);
    goLine(start.x, start.y);
    mainSegs.push(...curvePath(fn, steps));
    const end = fn(1);
    cx = end.x;
    cy = end.y;
  };
  const goSWave = (len: number, amp: number) => {
    const start = cx;
    goCurve(
      (t) => ({
        x: start + t * len,
        y: gy - amp * Math.sin(t * Math.PI * 2.5),
      }),
      40,
    );
  };
  /** Smooth ease — gradual build then roll, so slope gravity actually speeds you up/down. */
  const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
  const goSteepHill = (startX: number, len: number, amp: number, steps = 64) => {
    // Gradual rise (long) → short crest → longer accelerating plunge
    goLine(startX, gy);
    goCurve(
      (t) => {
        let h: number;
        if (t < 0.42) h = amp * easeInOut(t / 0.42);
        else if (t < 0.52) h = amp;
        else h = amp * (1 - easeInOut((t - 0.52) / 0.48));
        return { x: startX + t * len, y: gy - h };
      },
      steps,
    );
  };
  /** Smaller cascading hills — Green Hill rhythm of getting faster downhill. */
  const goRollingHills = (len: number, amp: number, waves = 3) => {
    const start = cx;
    goCurve(
      (t) => {
        const w = Math.sin(t * Math.PI * waves);
        // Bias second half lower so you pick up speed into the next set piece
        const bias = t * t * amp * 0.22;
        return { x: start + t * len, y: gy - amp * 0.55 * (1 + w) * (1 - t * 0.15) + bias };
      },
      Math.max(36, waves * 18),
    );
  };
  const goPit = (len: number, depth: number) => {
    // Soft bowl — rideable (spike strips placed at bottom separately)
    const start = cx;
    goCurve(
      (t) => ({
        x: start + t * len,
        y: gy + depth * Math.sin(Math.PI * t),
      }),
      36,
    );
  };
  const deathGaps: { xMin: number; xMax: number }[] = [];
  /** Bottomless pit — path breaks; miss the spring/jump and fall forever. */
  const goDeathGap = (len: number) => {
    goLine(cx + 28, gy);
    const xMin = cx;
    const xMax = cx + len;
    deathGaps.push({ xMin, xMax });
    // Warp build cursor across the void — no floor segment to snap onto
    cx = xMax;
    cy = gy;
    goLine(cx + 36, gy);
  };
  const goDoubleLoop = (x: number, r: number) => {
    goLine(x, gy);
    mainSegs.push(loopArc(x, gy - r, r, -1));
    cx = x;
    cy = gy;
    const x2 = x + r * 2 + 36;
    goLine(x2, gy);
    mainSegs.push(loopArc(x2, gy - (r + 8), r + 8, -1));
    cx = x2;
    cy = gy;
    return x2;
  };

  // Opening runway → first loop
  goLine(loop1X - 360, gy);
  goLine(loop1X, gy);
  mainSegs.push(loopArc(loop1X, gy - loopR, loopR, -1));
  cx = loop1X;
  cy = gy;

  // Gradual rolling hills into a big climb — speed builds on the way down
  goRollingHills(Math.floor(worldWidth * 0.035), plan.hillAmp * 0.45, 3);
  goSteepHill(hillStart, hillLen, plan.hillAmp, 72);
  goPit(Math.floor(380 + plan.stretch * 30), 70);
  // First death gap — spring/jump or lose a life
  goDeathGap(Math.floor(260 + plan.stretch * 20));
  goSWave(Math.floor(worldWidth * 0.03), 55);

  if (plan.doubleHill) {
    goSteepHill(cx + 60, hillLen * 0.85, plan.hillAmp * 0.95, 56);
    goRollingHills(Math.floor(hillLen * 0.4), plan.hillAmp * 0.35, 2);
  }

  // Tunnel flat → ramp to HIGH fork → twin loops
  goLine(tunnelX, gy);
  goLine(tunnelX + plan.tunnelLen * 1.2, gy);
  goPit(320, 65);
  goLine(highX, gy - 110);

  const twinA = goDoubleLoop(loop2X, loop2R);

  goSteepHill(hill2Start, hillLen * 1.05, plan.hillAmp * 1.18, 68);
  goDeathGap(Math.floor(300 + plan.stretch * 24));
  goRollingHills(Math.floor(worldWidth * 0.04), plan.hillAmp * 0.4, 3);

  goLine(loop3X, gy);
  mainSegs.push(loopArc(loop3X, gy - loop3R, loop3R, -1));
  cx = loop3X;
  cy = gy;
  goPit(340, 75);

  goLine(grindX - 200, gy);
  goSteepHill(cx + 40, Math.floor(hillLen * 0.6), plan.hillAmp * 0.9, 48);
  goDeathGap(240);

  goLine(loop4X - 200, gy);
  const twinB = goDoubleLoop(loop4X, loop4R);

  goPit(300, 55);
  goRollingHills(Math.floor(worldWidth * 0.025), plan.hillAmp * 0.3, 2);
  goLine(finaleX - 200, gy);
  goLine(finaleX, gy);
  goLine(finishX, gy);
  goLine(worldWidth, gy);

  const hillPeaks = [
    hillStart + hillLen * 0.45,
    hill2Start + hillLen * 0.45,
    grindX - 80,
    hillStart + hillLen * 0.2,
  ].map((x) => Math.floor(x));
  const pitMids = [
    hillStart + hillLen + 190,
    twinA + 240,
    loop3X + loop3R * 2 + 170,
    twinB + 200,
  ].map((x) => Math.floor(x));

  // Spike strips on soft pit floors + flat approaches (Sonic hazard language)
  const spikeXs = [
    pitMids[0],
    pitMids[0]! + 48,
    pitMids[1],
    pitMids[1]! - 40,
    pitMids[2],
    pitMids[3],
    tunnelX + 180,
    tunnelX + 240,
    loop2X - 320,
    loop3X + 420,
    grindX - 360,
    finaleX - 520,
  ].map((x) => Math.floor(x));

  const mainPath = new TrackPath(mainSegs);

  const highPath = new TrackPath(
    linePath([
      { x: highX - 40, y: gy - plan.highLift },
      { x: highX + 420, y: gy - plan.highLift },
      { x: highX + 680, y: gy - 40 },
    ]),
  );

  const lowPath = new TrackPath(
    linePath([
      { x: tunnelX + 40, y: gy + 70 },
      { x: tunnelX + plan.tunnelLen * 0.85, y: gy + 70 },
      { x: tunnelX + plan.tunnelLen * 1.25, y: gy },
    ]),
  );

  const grindPath = new TrackPath(
    linePath([
      { x: grindX, y: gy - plan.grindHeight },
      { x: grindX + grindLen * 0.7, y: gy - plan.grindHeight },
      { x: grindX + grindLen, y: gy - 40 },
    ]),
  );

  const boostS = {
    lo: mainPath.project(loop1X - 280, gy).s,
    hi: mainPath.project(loop1X - 40, gy).s,
  };
  const tunnelDuckS = {
    lo: mainPath.project(tunnelX + 20, gy).s,
    hi: mainPath.project(tunnelX + Math.min(320, plan.tunnelLen * 0.45), gy).s,
  };
  const highJoinS = {
    lo: mainPath.project(highX - 60, gy - 90).s,
    hi: mainPath.project(highX + 100, gy - 90).s,
  };
  const grindJoinS = {
    lo: mainPath.project(grindX - 80, gy).s,
    hi: mainPath.project(grindX + 60, gy).s,
  };
  const boost2S = {
    lo: mainPath.project(loop4X - 280, gy).s,
    hi: mainPath.project(loop4X - 40, gy).s,
  };
  // Mid-act speed ribbon into twin loops / second climb
  const boost3S = {
    lo: mainPath.project(loop2X - 320, gy).s,
    hi: mainPath.project(loop2X - 80, gy).s,
  };
  const slowS = {
    lo: mainPath.project(tunnelX + 40, gy).s,
    hi: mainPath.project(tunnelX + Math.min(280, plan.tunnelLen * 0.35), gy).s,
  };
  const slow2S = {
    lo: mainPath.project(hill2Start + hillLen * 0.15, gy - plan.hillAmp * 0.4).s,
    hi: mainPath.project(hill2Start + hillLen * 0.35, gy - plan.hillAmp * 0.8).s,
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
          sMin: Math.max(0, highPath.length - 120),
          sMax: highPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(highX + 680, gy - 40).s,
          trigger: 'auto',
        },
      ],
    },
    LOW: {
      id: 'LOW',
      path: lowPath,
      joins: [
        {
          sMin: Math.max(0, lowPath.length - 100),
          sMax: lowPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(tunnelX + plan.tunnelLen * 1.25, gy).s,
          trigger: 'auto',
        },
      ],
    },
    GRIND: {
      id: 'GRIND',
      path: grindPath,
      joins: [
        {
          sMin: Math.max(0, grindPath.length - 80),
          sMax: grindPath.length,
          toTrackId: 'MAIN',
          toS: mainPath.project(grindX + grindLen, gy - 40).s,
          trigger: 'auto',
        },
      ],
    },
  };

  // Dense classic ring lines — loops, hills, bridges (Sonic act readability)
  const pepperXs: number[] = [];
  const ringBands = [
    [200, Math.floor(worldWidth * 0.1), 56],
    [loop1X - 80, loop1X + 720, 42],
    [hillStart + 40, hillStart + hillLen - 20, 48],
    [tunnelX - 280, tunnelX + plan.tunnelLen * 1.2, 52],
    [highX - 60, highX + 640, 44],
    [loop2X - 60, loop2X + 640, 42],
    [hill2Start, hill2Start + hillLen, 50],
    [loop3X - 40, loop3X + 560, 44],
    [grindX + 20, grindX + grindLen, 48],
    [loop4X - 40, loop4X + 560, 42],
    [finaleX - 900, finaleX - 160, 56],
  ] as const;
  for (const [lo, hi, step] of ringBands) {
    for (let x = lo; x < hi; x += step) {
      pepperXs.push(Math.min(worldWidth - 300, Math.floor(x)));
    }
  }

  const ghostXs = [
    loop1X + 640,
    hillStart + hillLen * 0.45,
    tunnelX - 200,
    highX + 120,
    loop2X + 520,
    hill2Start + 280,
    loop3X + 400,
    grindX + 200,
    loop4X + 360,
    finaleX - 420,
  ]
    .slice(0, 5 + Math.floor(level / 4))
    .map((x) => Math.floor(x));

  return {
    tracks,
    boostS,
    boost2S,
    boost3S,
    slowS,
    slow2S,
    tunnelDuckS,
    highJoinS,
    grindJoinS,
    loopLookaheadStart: boostS.lo,
    finishTrackId: 'MAIN',
    finishMinS: mainPath.project(finishX, gy).s,
    jeepAtX: jeepX,
    jeepResumeX: jeepX + 160,
    spaceAtX: spaceX,
    spaceResumeX: spaceX + 160,
    cupidAtX: cupidX,
    cupidResumeX: cupidX + 160,
    startS: mainPath.project(120, gy).s,
    worldWidth,
    finishX,
    loopRadius: loopR,
    highX,
    loop1X,
    loop2X,
    loop3X,
    loop4X,
    hillStart,
    tunnelX,
    grindX,
    grindLen,
    grindHeight: plan.grindHeight,
    hillPeaks,
    pitMids,
    deathGaps,
    spikeXs,
    pepperXs,
    ghostXs,
    springXs: [
      640,
      Math.floor(hillStart + 40),
      Math.floor((deathGaps[0]?.xMin ?? pitMids[0]!) - 70),
      Math.floor(highX - 80),
      Math.floor(loop2X - 200),
      Math.floor((deathGaps[1]?.xMin ?? pitMids[1]!) - 70),
      Math.floor(loop3X - 160),
      Math.floor(pitMids[2]! - 80),
      Math.floor(loop4X - 200),
      Math.floor((deathGaps[2]?.xMin ?? twinB) - 70),
      Math.floor(pitMids[3]! - 80),
    ],
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
