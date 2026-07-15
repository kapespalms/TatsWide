/** Sector Escape campaign copy — 20 zones, four story arcs. */

export type SectorId = 'SAFARI' | 'NEBULA' | 'CUPID' | 'CYBER';

export interface ZoneStory {
  sector: SectorId;
  sectorLabel: string;
  title: string;
  blurb: string;
  accent: string;
  bossZone: boolean;
}

const SECTOR_META: Record<
  SectorId,
  { label: string; accent: string; arc: (n: number) => { title: string; blurb: string } }
> = {
  SAFARI: {
    label: 'JURASSIC SAFARI',
    accent: '#66ff88',
    arc: (n) => ({
      title: n === 5 ? 'BOSS: Cybernetic T-Rex Firewall' : `Dino Outbreak · Stage ${n}`,
      blurb:
        n === 5
          ? 'The facility gates seal. Defend the jeep — a cyber-virus T-Rex blocks the exit.'
          : 'Defend the automated safari jeep. Prehistoric targets are glitched and aggressive.',
    }),
  },
  NEBULA: {
    label: 'NEBULA INTERSTELLAR',
    accent: '#66aaff',
    arc: (n) => ({
      title: n === 10 ? 'BOSS: Dreadnought Mother-Ship Core' : `Nebula Infiltration · Stage ${n - 5}`,
      blurb:
        n === 10
          ? 'Warp flash. Tear the flagship shields generator by generator.'
          : 'Consciousness jacked into a dual-seat fighter. Clear the alien armada.',
    }),
  },
  CUPID: {
    label: 'THE CUPID DIMENSION',
    accent: '#ff66aa',
    arc: (n) => ({
      title: n === 15 ? 'BOSS: The Heart-Break Engine' : `Valentine Grid · Stage ${n - 10}`,
      blurb:
        n === 15
          ? 'A giant mechanical heart fires columns of spite. Pop every crystal heart.'
          : 'Shoot floating hearts — free trapped avatars from a rogue matchmaking AI.',
    }),
  },
  CYBER: {
    label: 'CYBER SPEED ZONE',
    accent: '#ffe14a',
    arc: (n) => ({
      title: n === 20 ? 'FINAL CORE: Escape the Cabinet' : `Grid Runner · Stage ${n - 15}`,
      blurb:
        n === 20
          ? 'Deletion wave on your heels. Hearts, WIDEASS word-hearts, and TATS overload the mainframe.'
          : 'Merge into pure speed. Collect WIDEASS & TATS word-hearts to crash the AI core.',
    }),
  },
};

function sectorForLevel(level: number): SectorId {
  if (level <= 5) return 'SAFARI';
  if (level <= 10) return 'NEBULA';
  if (level <= 15) return 'CUPID';
  return 'CYBER';
}

export function getZoneStory(level: number): ZoneStory {
  const clamped = Math.max(1, Math.min(20, level));
  const sector = sectorForLevel(clamped);
  const meta = SECTOR_META[sector];
  const arc = meta.arc(clamped);
  const bossZone = clamped === 5 || clamped === 10 || clamped === 15 || clamped === 20;
  return {
    sector,
    sectorLabel: meta.label,
    title: arc.title,
    blurb: arc.blurb,
    accent: meta.accent,
    bossZone,
  };
}

export function isBossZone(level: number): boolean {
  return getZoneStory(level).bossZone;
}
