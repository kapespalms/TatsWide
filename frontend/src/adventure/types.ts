export type CharacterId = 'Wideass' | 'Tats';
export type GamePhase = 'run' | 'jeep' | 'space' | 'levelComplete' | 'victory';
export type ShooterKind = 'jeep' | 'space';
export type CollectibleKind = 'pepper' | 'duck' | 'witchHat';

export interface AdventureLaunch {
  level: number;
  playerCount: 1 | 2;
  primaryCharacter: CharacterId;
  embed?: boolean;
}

export interface LevelTrigger {
  id: string;
  kind: ShooterKind;
  /** World X where the event begins — must be on flat ground, never mid-loop */
  atX: number;
  /** Resume platforming here after the event */
  resumeX: number;
  killQuota: number;
  durationSec: number;
}

/** Surface drives Sonic lane art + collision: main ground, elevated road, tunnel, ramp, wall */
export type PlatformSurface = 'main' | 'high' | 'mid' | 'tunnel' | 'ramp' | 'wall' | 'bridge';

export interface PlatformRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Optional tint hex */
  color?: number;
  /** Sonic path type — continuous lanes read as routes you pick */
  surface?: PlatformSurface;
}

export interface LoopDef {
  centerX: number;
  centerY: number;
  radius: number;
}

export interface SpringDef {
  x: number;
  y: number;
  power: number;
}

export interface SeesawDef {
  x: number;
  y: number;
  width: number;
}

export interface GrindRailDef {
  x: number;
  y: number;
  length: number;
}

export interface CollectibleSpawn {
  x: number;
  y: number;
  kind: CollectibleKind;
}

export interface GhostSpawn {
  x: number;
  y: number;
  patrol: number;
}

export interface LevelAuthoring {
  level: number;
  name: string;
  theme: 'hills' | 'jungle' | 'crystal' | 'haunted' | 'industrial' | 'snow' | 'alien';
  skyColor: string;
  worldWidth: number;
  finishX: number;
  platforms: PlatformRect[];
  loops: LoopDef[];
  springs: SpringDef[];
  seesaws: SeesawDef[];
  grindRails: GrindRailDef[];
  collectibles: CollectibleSpawn[];
  ghosts: GhostSpawn[];
  /** Safe authored vehicle events (order = appearance order) */
  triggers: LevelTrigger[];
}

export interface ShooterScores {
  Wideass: number;
  Tats: number;
}

export interface CollectibleCounts {
  pepper: number;
  duck: number;
  witchHat: number;
}

export const TOTAL_LEVELS = 20;

export const CHARACTER_COLORS = {
  Wideass: 0xff3344,
  Tats: 0x00ccff,
} as const;
