import { TrackPath, curvePath, linePath, loopArc } from './SonicTrack';
import type { TrackRegistry } from './TrackRider';

export const GROUND_Y = 620;

export interface LevelTrackKit {
  tracks: TrackRegistry;
  boostS: { lo: number; hi: number };
  boost2S: { lo: number; hi: number };
  tunnelDuckS: { lo: number; hi: number };
  highJoinS: { lo: number; hi: number };
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

/** Deterministic zone kit — every level is a full track with loops, fork, jeep + space events. */
export function buildZoneTracks(level: number): LevelTrackKit {
  const idx = Math.max(1, Math.min(20, level)) - 1;
  const meta = ZONE_META[idx];
  const hard = 1 + idx * 0.04;
  const gy = GROUND_Y;
  const worldWidth = Math.floor(8600 + idx * 280);
  const finishX = worldWidth - 400;
  const loopR = Math.floor(130 + (idx % 5) * 6);
  const loop2R = loopR + 10;
  const stretch = 1 + idx * 0.035;

  const loop1X = Math.floor(1100 * stretch);
  const hillStart = Math.floor(2100 * stretch);
  const hillLen = Math.floor(480 + idx * 8);
  const tunnelX = Math.floor(4000 * stretch);
  const highX = Math.floor(4700 * stretch);
  const jeepX = Math.floor(5400 * stretch);
  const loop2X = Math.floor(6200 * stretch);
  const spaceX = Math.floor(7200 * stretch);

  const mainSegs = [
    ...linePath([
      { x: 0, y: gy },
      { x: loop1X - 300, y: gy },
    ]),
    ...linePath([
      { x: loop1X - 300, y: gy },
      { x: loop1X, y: gy },
    ]),
    loopArc(loop1X, gy - loopR, loopR, -1),
    ...linePath([
      { x: loop1X, y: gy },
      { x: hillStart, y: gy },
    ]),
    ...curvePath(
      (t) => ({
        x: hillStart + t * hillLen,
        y: gy - (70 + idx * 3) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t)),
      }),
      28,
    ),
    ...linePath([
      { x: hillStart + hillLen, y: gy },
      { x: tunnelX, y: gy },
    ]),
    ...linePath([
      { x: tunnelX, y: gy },
      { x: tunnelX + 600, y: gy },
    ]),
    ...linePath([
      { x: tunnelX + 600, y: gy },
      { x: highX, y: gy - 90 },
    ]),
    ...linePath([
      { x: highX, y: gy - 90 },
      { x: jeepX - 200, y: gy },
    ]),
    ...linePath([
      { x: jeepX - 200, y: gy },
      { x: loop2X, y: gy },
    ]),
    loopArc(loop2X, gy - loop2R, loop2R, -1),
    ...linePath([
      { x: loop2X, y: gy },
      { x: spaceX, y: gy },
    ]),
    ...linePath([
      { x: spaceX, y: gy },
      { x: finishX, y: gy },
    ]),
    ...linePath([
      { x: finishX, y: gy },
      { x: worldWidth, y: gy },
    ]),
  ];

  const mainPath = new TrackPath(mainSegs);

  const highPath = new TrackPath(
    linePath([
      { x: highX - 40, y: gy - 200 },
      { x: highX + 320, y: gy - 200 },
      { x: highX + 520, y: gy - 30 },
    ]),
  );

  const lowPath = new TrackPath(
    linePath([
      { x: tunnelX + 40, y: gy + 70 },
      { x: tunnelX + 360, y: gy + 70 },
      { x: tunnelX + 560, y: gy },
    ]),
  );

  const boostS = {
    lo: mainPath.project(loop1X - 250, gy).s,
    hi: mainPath.project(loop1X - 40, gy).s,
  };
  const tunnelDuckS = {
    lo: mainPath.project(tunnelX + 20, gy).s,
    hi: mainPath.project(tunnelX + 280, gy).s,
  };
  const highJoinS = {
    lo: mainPath.project(highX - 60, gy - 90).s,
    hi: mainPath.project(highX + 80, gy - 90).s,
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
          // Hold jump near ramp → HIGH route
          sMin: highJoinS.lo,
          sMax: highJoinS.hi,
          toTrackId: 'HIGH',
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
          toS: mainPath.project(highX + 520, gy - 30).s,
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
          toS: mainPath.project(tunnelX + 560, gy).s,
          trigger: 'auto',
        },
      ],
    },
  };

  void hard;

  return {
    tracks,
    boostS,
    boost2S,
    tunnelDuckS,
    highJoinS,
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
