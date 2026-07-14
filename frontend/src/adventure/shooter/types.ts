import type { CharacterId, CollectibleCounts, ShooterKind } from '../types';

/** Minimal shooter request passed from AdventureGame. */
export interface ShooterSegment {
  id: number;
  kind: ShooterKind;
  atDistance: number;
  killQuota: number;
  durationSec: number;
}

export type { CharacterId, CollectibleCounts, ShooterKind };
