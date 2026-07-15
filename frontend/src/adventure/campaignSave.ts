import type { CollectibleCounts } from './types';

const KEY = 'wa-adv-campaign-v1';

export interface CampaignSave {
  level: number;
  score: number;
  zoneScore: number;
  lives: number;
  resumeX: number;
  timeSec: number;
  counts: CollectibleCounts;
  doneTriggers: string[];
  takenIds: string[];
  killedGhostIds: string[];
  playerCount: 1 | 2;
  primaryCharacter: 'Wideass' | 'Tats';
}

export function writeCampaignSave(data: CampaignSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

export function readCampaignSave(): CampaignSave | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CampaignSave;
  } catch {
    return null;
  }
}

export function clearCampaignSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
