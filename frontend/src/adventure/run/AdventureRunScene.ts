import Phaser from 'phaser';
import type {
  CharacterId,
  CollectibleCounts,
  CollectibleKind,
  LevelAuthoring,
  LevelTrigger,
} from '../types';
import { createModern16BitAtlas } from './PixelAtlas';
import { getTrackKitForLevel, type LevelTrackKit } from './levelTracks';
import { AdventureAudio } from './AdventureAudio';
import {
  DEFAULT_RIDER_CONFIG,
  applyInvincibility,
  applySpringLaunch,
  checkApproachSpeed,
  createRiderState,
  riderConfigFor,
  stepRider,
  type RiderInput,
  type RiderState,
} from './TrackRider';
import {
  createButtonTile,
  resolveSpikeCollision,
  springOverride,
  updateButtonTile,
  type ButtonTile,
} from './SonicPhysics';

export interface AdventureRunInit {
  level: LevelAuthoring;
  playerCount: 1 | 2;
  primaryCharacter: CharacterId;
  startX: number;
  seedScore?: number;
  seedCounts?: CollectibleCounts;
  seedTakenIds?: string[];
  seedKilledGhostIds?: string[];
  seedElapsed?: number;
  seedFiredTriggers?: string[];
  seedLives?: number;
  onProgress: (payload: RunProgress) => void;
  onTrigger: (trigger: LevelTrigger) => void;
}

export interface RunProgress {
  x: number;
  counts: CollectibleCounts;
  score: number;
  finished: boolean;
  timeSec: number;
  takenIds: string[];
  killedGhostIds: string[];
  lives: number;
  dead: boolean;
  checkpointX: number;
}

interface GhostState {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  homeX: number;
  homeY: number;
  patrol: number;
  dir: number;
}

export class AdventureRunScene extends Phaser.Scene {
  private initData!: AdventureRunInit;
  private kit!: LevelTrackKit;
  private wideass!: Phaser.GameObjects.Sprite;
  private tats!: Phaser.GameObjects.Sprite;
  private riderW!: RiderState;
  private riderT!: RiderState;
  private jumpPressedW = false;
  private jumpPressedT = false;
  private needSpeed = 0;
  private keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    a: false,
    d: false,
    s: false,
    w: false,
    space: false,
    j: false,
    l: false,
    i: false,
    k: false,
    enter: false,
  };
  private onKeyDown!: (e: KeyboardEvent) => void;
  private onKeyUp!: (e: KeyboardEvent) => void;
  private collectibles: {
    id: string;
    x: number;
    y: number;
    kind: CollectibleKind;
    img: Phaser.GameObjects.Image;
  }[] = [];
  private takenIds = new Set<string>();
  private killedGhostIds = new Set<string>();
  private springs: {
    x: number;
    y: number;
    power: number;
    vx?: number;
    img: Phaser.GameObjects.Image;
    coolUntil: number;
  }[] = [];
  private ghosts: GhostState[] = [];
  private hazards: { x: number; y: number; r: number; ball: Phaser.GameObjects.Image }[] = [];
  private spikes: { x: number; y: number; halfW: number; img: Phaser.GameObjects.Image }[] = [];
  private buttons: { tile: ButtonTile; img: Phaser.GameObjects.Image; eventId?: string }[] = [];
  private buttonHeld = new Set<string>();
  private keepBeacons: { atX: number; imgs: Phaser.GameObjects.Image[] }[] = [];
  private flyingRings: {
    img: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    life: number;
  }[] = [];
  private clouds!: Phaser.GameObjects.TileSprite;
  private brandClouds!: Phaser.GameObjects.TileSprite;
  private mountains!: Phaser.GameObjects.TileSprite;
  private counts: CollectibleCounts = { pepper: 0, duck: 0, witchHat: 0 };
  private score = 0;
  private lives = 3;
  private checkpointX = 120;
  private dying = false;
  private dead = false;
  private firedTriggers = new Set<string>();
  /** Keeps that finished successfully — required before zone GOAL counts */
  private clearedKeeps = new Set<string>();
  private keepSuspended = false;
  private finished = false;
  private elapsed = 0;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private needSpeedText!: Phaser.GameObjects.Image;
  private debugText!: Phaser.GameObjects.Text;
  private audio = new AdventureAudio();
  private paused = false;
  private pauseText!: Phaser.GameObjects.Image;
  private hudAcc = 0;
  private lastNeedSpeed = false;
  private gp = { left: false, right: false, down: false, jump: false };
  private gp2 = { left: false, right: false, down: false, jump: false };
  private invulnUntil: Record<CharacterId, number> = { Wideass: 0, Tats: 0 };
  private cfgW = DEFAULT_RIDER_CONFIG;
  private cfgT = DEFAULT_RIDER_CONFIG;
  private speedLines!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Rectangle;
  private lastBoostS = -1;
  private pepperBoostUntil = 0;
  private baseCfgW = DEFAULT_RIDER_CONFIG;
  private baseCfgT = DEFAULT_RIDER_CONFIG;
  private lastLeadX = 0;

  constructor() {
    super('AdventureRunScene');
  }

  init(data: AdventureRunInit) {
    this.initData = data;
    this.counts = { ...(data.seedCounts ?? { pepper: 0, duck: 0, witchHat: 0 }) };
    this.score = data.seedScore ?? 0;
    this.elapsed = data.seedElapsed ?? 0;
    this.firedTriggers = new Set(data.seedFiredTriggers ?? []);
    this.clearedKeeps = new Set(data.seedFiredTriggers ?? []);
    this.keepSuspended = false;
    this.finished = false;
    this.paused = false;
    this.dying = false;
    this.dead = false;
    this.lives = Math.max(1, Math.min(9, data.seedLives ?? 3));
    this.checkpointX = Math.max(120, data.startX);
    this.ghosts = [];
    this.hazards = [];
    this.spikes = [];
    this.buttons = [];
    this.buttonHeld.clear();
    this.flyingRings = [];
    this.keepBeacons = [];
    this.collectibles = [];
    this.springs = [];
    this.needSpeed = 0;
    this.jumpPressedW = false;
    this.jumpPressedT = false;
    this.takenIds = new Set(data.seedTakenIds ?? []);
    this.killedGhostIds = new Set(data.seedKilledGhostIds ?? []);
    this.invulnUntil = { Wideass: 0, Tats: 0 };
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      a: false,
      d: false,
      s: false,
      w: false,
      space: false,
      j: false,
      l: false,
      i: false,
      k: false,
      enter: false,
    };
  }

  create() {
    createModern16BitAtlas(this, this.initData.level.theme, this.initData.level.skyColor);
    const level = this.initData.level;
    this.kit = getTrackKitForLevel(level.level);
    this.cfgW = riderConfigFor('Wideass');
    this.cfgT = riderConfigFor('Tats');
    this.baseCfgW = { ...this.cfgW };
    this.baseCfgT = { ...this.cfgT };
    this.pepperBoostUntil = 0;

    this.cameras.main.setBackgroundColor(level.skyColor);
    this.physics.world.setBounds(0, 0, level.worldWidth, 780);
    this.physics.world.gravity.y = 0;

    this.buildParallax(level);
    this.buildDecor(level);
    this.drawAllTracks();
    this.buildDeathGaps();
    this.buildMilestoneKeeps(level);
    this.buildSeesaws(level);
    this.buildSpikes(level);
    this.buildButtons(level);
    this.buildSprings(level);
    this.buildGrindVisual(level);
    this.buildCollectibles(level);
    this.buildGhosts(level);
    this.buildPlayers();
    this.buildDust();
    this.buildSpeedFx();
    this.setupInput();

    this.needSpeedText = this.add
      .image(640, 240, 'px_sign_need')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(3.2)
      .setAlpha(0);

    this.debugText = this.add
      .text(640, 690, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffe14a',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(new URLSearchParams(window.location.search).has('debug'));

    this.pauseText = this.add
      .image(640, 360, 'px_pause')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setScale(2.4)
      .setVisible(false);

    this.cameras.main.setBounds(0, 0, level.worldWidth, 780);
    this.audio.unlock();
    this.audio.startMusic();
    this.audio.sectorBed(level.story.sector);
  }

  private buildParallax(level: LevelAuthoring) {
    this.add
      .tileSprite(640, 360, 1280, 720, 'px_sky')
      .setScrollFactor(0)
      .setDepth(-20);
    this.mountains = this.add
      .tileSprite(640, 430, 1280, 180, 'px_mountains')
      .setScrollFactor(0)
      .setDepth(-15);
    this.clouds = this.add
      .tileSprite(640, 140, 1280, 96, 'px_clouds')
      .setScrollFactor(0)
      .setDepth(-10);
    this.brandClouds = this.add
      .tileSprite(640, 88, 1280, 96, 'px_brand_clouds')
      .setScrollFactor(0)
      .setDepth(-9)
      .setAlpha(0.35);
    if (level.theme === 'haunted' || level.theme === 'alien') {
      this.mountains.setTint(0x8866aa);
      this.clouds.setTint(0xccaaff);
      this.brandClouds.setTint(0xe8ccff);
    } else if (level.theme === 'snow') {
      this.mountains.setTint(0xddeeff);
    } else if (level.theme === 'industrial') {
      this.mountains.setTint(0x8899aa);
      this.clouds.setTint(0x8899aa);
      this.brandClouds.setTint(0xaabbcc);
    } else if (level.theme === 'jungle') {
      this.mountains.setTint(0x66aa55);
    }
  }

  private buildDecor(level: LevelAuthoring) {
    const step = level.theme === 'industrial' ? 280 : 240;
    // One TileSprite ground strip — not thousands of grass images
    const groundKey = level.theme === 'industrial' ? 'px_stone' : 'px_grass';
    const ground = this.add
      .tileSprite(level.worldWidth / 2, 668, level.worldWidth, 64, groundKey)
      .setDepth(-6);
    if (level.theme === 'snow') ground.setTint(0xddeeff);
    if (level.theme === 'alien') ground.setTint(0x66ff99);
    if (level.theme === 'haunted') ground.setTint(0x665588);
    if (level.theme === 'jungle') ground.setTint(0x3a8840);

    for (let x = 80; x < level.worldWidth; x += step) {
      const key = level.theme === 'industrial' ? 'px_stone' : 'px_pine';
      const pine = this.add
        .image(x + (x % 60), 640, key)
        .setDepth(-8)
        .setScale(level.theme === 'industrial' ? 2.4 : 2)
        .setScrollFactor(0.55);
      pine.setOrigin(0.5, 1);
      if (level.theme === 'snow') pine.setTint(0xeeffff);
      if (level.theme === 'haunted') pine.setTint(0x664488);
      if (level.theme === 'alien') pine.setTint(0x44ff88);
      if (level.theme === 'crystal' && x % (step * 2) < step) {
        this.add.image(x + 40, 520, 'px_flower_y').setDepth(-7).setScale(2).setScrollFactor(0.6);
      }
      if (level.theme === 'hills' && x % (step * 3) < step) {
        this.add.image(x + 90, 600, 'px_flower_p').setDepth(-7).setScale(2).setScrollFactor(0.62);
      }
    }
  }

  private drawAllTracks() {
    this.drawTrackPath(this.kit.tracks.MAIN.path, 0xf0f0f8, 0x101018, 1.15);
    this.drawTrackPath(this.kit.tracks.HIGH.path, 0xffe14a, 0x8a6010, 0.95);
    this.drawTrackPath(this.kit.tracks.LOW.path, 0xc8d0e0, 0x202028, 0.9);
    if (this.kit.tracks.GRIND) {
      this.drawTrackPath(this.kit.tracks.GRIND.path, 0xffd020, 0x886600, 0.85);
    }

    const boost = this.kit.tracks.MAIN.path.sample(this.kit.boostS.lo);
    this.add.image(boost.x, boost.y - 48, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.6);

    const duck = this.kit.tracks.MAIN.path.sample(this.kit.tunnelDuckS.lo);
    this.add.image(duck.x, duck.y - 40, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.2).setTint(0xf0d9ad);

    const loop2 = this.kit.tracks.MAIN.path.sample(this.kit.boost2S.lo);
    this.add.image(loop2.x, loop2.y - 48, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.6);

    const midBoost = this.kit.tracks.MAIN.path.sample(this.kit.boost3S.lo);
    this.add.image(midBoost.x, midBoost.y - 48, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.5);

    const highJoin = this.kit.tracks.MAIN.path.sample(this.kit.highJoinS.lo);
    this.add.image(highJoin.x, highJoin.y - 56, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.3).setTint(0xffe14a);

    const grindJoin = this.kit.tracks.MAIN.path.sample(this.kit.grindJoinS.lo);
    this.add.image(grindJoin.x, grindJoin.y - 56, 'px_sign_boost').setOrigin(0.5).setDepth(6).setScale(1.3).setTint(0xffd020);
  }

  /** Visual void under bottomless jumps so the risk reads clearly. */
  private buildDeathGaps() {
    for (const gap of this.kit.deathGaps) {
      const mid = (gap.xMin + gap.xMax) / 2;
      const w = gap.xMax - gap.xMin;
      const pit = this.add.rectangle(mid, 740, w + 40, 220, 0x080810, 0.92).setDepth(-5);
      pit.setStrokeStyle(3, 0xff2244, 0.55);
      // Cliff lips
      this.add.rectangle(gap.xMin - 6, 610, 14, 40, 0x101018, 1).setDepth(4);
      this.add.rectangle(gap.xMax + 6, 610, 14, 40, 0x101018, 1).setDepth(4);
    }
  }

  private buildSpikes(level: LevelAuthoring) {
    this.spikes = [];
    for (const s of level.spikes ?? []) {
      const halfW = (s.width ?? 64) / 2;
      const img = this.add
        .image(s.x, s.y + 6, 'px_spikes')
        .setDepth(7)
        .setScale(2.1)
        .setOrigin(0.5, 1);
      this.spikes.push({ x: s.x, y: s.y, halfW, img });
    }
  }

  private buildButtons(level: LevelAuthoring) {
    this.buttons = [];
    const defs =
      level.buttons ??
      level.seesaws.map((s, i) => ({
        x: s.x,
        y: s.y - 8,
        w: 44,
        h: 12,
        eventId: `seesaw-btn-${i}`,
      }));
    for (const b of defs) {
      const tile = createButtonTile(b.x, b.y, b.w ?? 44, b.h ?? 12, 4);
      const img = this.add
        .image(tile.x, tile.y, 'px_button')
        .setDepth(7)
        .setScale(2)
        .setOrigin(0.5, 0.5);
      this.buttons.push({ tile, img, eventId: b.eventId });
    }
  }

  /** Finale keep at end of the Sonic act — one side game after the full run */
  private buildMilestoneKeeps(level: LevelAuthoring) {
    const finale = level.triggers[0];
    if (finale) {
      const label =
        finale.kind === 'jeep'
          ? finale.boss
            ? 'BOSS FINALE · T-REX'
            : 'FINALE · JUNGLE JEEP'
          : finale.kind === 'space'
            ? finale.boss
              ? 'BOSS FINALE · DREADNOUGHT'
              : 'FINALE · STAR KEEP'
            : finale.boss
              ? 'BOSS FINALE · HEART ENGINE'
              : 'FINALE · CUPID GRID';
      this.placeKeep(
        finale.atX,
        finale.atX - 160,
        finale.boss ? 'BOSS KEEP' : 'ACT CLEAR',
        label,
        finale.kind === 'jeep' ? 0xff8844 : finale.kind === 'space' ? 0x66ccff : 0xff66aa,
      );
    }
    this.drawFinish(level.finishX);
  }

  private placeKeep(atX: number, x: number, _title: string, _subtitle: string, accent: number) {
    const gy = 620;
    const left = this.add.image(x - 90, gy - 40, 'px_keep').setDepth(4).setScale(2.2).setOrigin(0.5, 1);
    const right = this.add.image(x + 90, gy - 40, 'px_keep').setDepth(4).setScale(2.2).setOrigin(0.5, 1);
    this.keepBeacons.push({ atX, imgs: [left, right] });
    const lintelKey =
      accent === 0xff8844
        ? 'px_keep_lintel_orange'
        : accent === 0x66ccff
          ? 'px_keep_lintel_cyan'
          : accent === 0xff66aa
            ? 'px_keep_lintel_pink'
            : 'px_keep_lintel';
    this.add.image(x, gy - 220, lintelKey).setDepth(5).setScale(2.4);
    this.add.image(x - 420, gy - 72, 'px_sign_keep').setOrigin(0.5).setDepth(6).setScale(1.5);
  }

  /** Draw track as batched Graphics — thousands of Image sprites killed 60fps. */
  private drawTrackPath(
    path: {
      length: number;
      sample: (s: number) => { x: number; y: number; nx: number; ny: number };
    },
    light: number,
    dark: number,
    scale: number,
  ) {
    const step = path.length > 50000 ? 32 : path.length > 25000 ? 22 : 12;
    const halfW = 16 * scale;
    const dirt = this.add.graphics().setDepth(1);
    const lane = this.add.graphics().setDepth(3);
    const rail = this.add.graphics().setDepth(5);
    rail.lineStyle(3, 0x78a8f8, 0.9);
    rail.beginPath();

    for (let s = 0; s < path.length; s += step) {
      const p = path.sample(s);
      const n = Math.min(path.length, s + step);
      const q = path.sample(n);
      const checker = Math.floor(s / step) % 2 === 0 ? light : dark;
      dirt.fillStyle(0x8a4a18, 1);
      dirt.fillTriangle(
        p.x + p.nx * (halfW + 10),
        p.y + p.ny * (halfW + 10),
        q.x + q.nx * (halfW + 10),
        q.y + q.ny * (halfW + 10),
        q.x - q.nx * 4,
        q.y - q.ny * 4,
      );
      dirt.fillTriangle(
        p.x + p.nx * (halfW + 10),
        p.y + p.ny * (halfW + 10),
        q.x - q.nx * 4,
        q.y - q.ny * 4,
        p.x - p.nx * 4,
        p.y - p.ny * 4,
      );
      lane.fillStyle(checker, 1);
      lane.fillTriangle(
        p.x + p.nx * halfW,
        p.y + p.ny * halfW,
        q.x + q.nx * halfW,
        q.y + q.ny * halfW,
        q.x - q.nx * halfW,
        q.y - q.ny * halfW,
      );
      lane.fillTriangle(
        p.x + p.nx * halfW,
        p.y + p.ny * halfW,
        q.x - q.nx * halfW,
        q.y - q.ny * halfW,
        p.x - p.nx * halfW,
        p.y - p.ny * halfW,
      );
      const rx = p.x - p.nx * (halfW + 2);
      const ry = p.y - p.ny * (halfW + 2);
      if (s === 0) rail.moveTo(rx, ry);
      else rail.lineTo(rx, ry);
    }
    rail.strokePath();
  }

  private buildSeesaws(level: LevelAuthoring) {
    for (const s of level.seesaws) {
      this.add.image(s.x, s.y, 'px_seesaw').setDepth(5).setScale(2.2);
      // Hazard hangs ABOVE the lane — runners pass under; jump/roll to smash
      const hx = s.x + s.width * 0.2;
      const hy = s.y - 96;
      const ball = this.add.image(hx, hy, 'px_hazard').setDepth(6).setScale(2.2);
      this.hazards.push({ x: hx, y: hy, r: 20, ball });
    }
  }

  private buildSprings(level: LevelAuthoring) {
    this.springs = [];
    for (const s of level.springs) {
      const img = this.add.image(s.x, s.y, 'px_spring').setDepth(5).setScale(2.3);
      this.springs.push({ x: s.x, y: s.y, power: s.power, vx: s.vx, img, coolUntil: 0 });
    }
  }

  private buildGrindVisual(_level: LevelAuthoring) {
    const grind = this.kit.tracks.GRIND;
    if (!grind) return;
    // Sparkle markers follow the authored GRIND path (not a flat authoring strip)
    for (let s = 0; s < grind.path.length; s += 40) {
      const p = grind.path.sample(s);
      this.add
        .image(p.x - p.nx * 10, p.y - p.ny * 10, 'px_rail')
        .setDepth(4)
        .setScale(1.8)
        .setAngle(Phaser.Math.RadToDeg(p.angle));
    }
  }

  private buildCollectibles(level: LevelAuthoring) {
    this.collectibles = [];
    for (const c of level.collectibles) {
      if (this.takenIds.has(c.id)) continue;
      const key = c.kind === 'pepper' ? 'px_pepper' : c.kind === 'duck' ? 'px_duck' : 'px_hat';
      // Small hearts / WIDEASS hearts / TATS hearts — brand art baked in
      const scale = c.kind === 'pepper' ? 2.1 : c.kind === 'duck' ? 1.55 : 1.65;
      const img = this.add.image(c.x, c.y, key).setDepth(8).setScale(scale);
      this.collectibles.push({ id: c.id, x: c.x, y: c.y, kind: c.kind, img });
    }
  }

  private buildGhosts(level: LevelAuthoring) {
    this.ghosts = [];
    for (const g of level.ghosts) {
      if (this.killedGhostIds.has(g.id)) continue;
      const sprite = this.add.sprite(g.x, g.y, 'px_ghost_0');
      sprite.setDepth(9).setScale(2.4);
      if (this.anims.exists('ghost-float')) sprite.play('ghost-float');
      this.ghosts.push({ id: g.id, sprite, homeX: g.x, homeY: g.y, patrol: g.patrol, dir: 1 });
    }
  }

  private buildPlayers() {
    const startS = this.kit.tracks.MAIN.path.project(this.initData.startX, 620).s;
    const sample = this.kit.tracks.MAIN.path.sample(startS);

    this.wideass = this.add.sprite(sample.x, sample.y, 'px_wideass_0');
    this.tats = this.add.sprite(sample.x - 52, sample.y, 'px_tats_0');
    for (const [who, p] of [
      ['Wideass', this.wideass] as const,
      ['Tats', this.tats] as const,
    ]) {
      p.setDepth(20).setScale(who === 'Wideass' ? 1.35 : 1.28);
      p.setData('char', who);
      p.setOrigin(0.5, 0.82);
    }

    this.riderW = createRiderState('MAIN', startS, this.kit.tracks.MAIN.path);
    this.riderT = createRiderState(
      'MAIN',
      Math.max(0, startS - 40),
      this.kit.tracks.MAIN.path,
    );
    this.lastLeadX = sample.x;

    // Snap sprite to rider immediately
    this.syncSprite(this.wideass, this.riderW, 'Wideass');
    this.syncSprite(this.tats, this.riderT, 'Tats');
  }

  private buildDust() {
    this.dust = this.add.particles(0, 0, 'px_flower_y', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.85, end: 0 },
      lifespan: 280,
      emitting: false,
      gravityY: 180,
      tint: [0xffe14a, 0xffffff, 0xff8866],
    });
    this.dust.setDepth(18);
  }

  private buildSpeedFx() {
    this.speedLines = this.add.graphics().setScrollFactor(0).setDepth(90).setAlpha(0);
    this.vignette = this.add
      .rectangle(640, 360, 1280, 720, 0x000000, 0.35)
      .setScrollFactor(0)
      .setDepth(89)
      .setAlpha(0);
  }

  private updateSpeedFx(lead: RiderState) {
    // Keep the view clean — no strobing speed lines / vignette
    this.speedLines.clear();
    this.speedLines.setAlpha(0);
    this.vignette.setAlpha(0);
    const speed = Math.abs(lead.gsp);
    if (lead.mode === 'ground' && speed > 280 && Math.random() < 0.12) {
      this.dust.emitParticleAt(lead.x - lead.facing * 18, lead.y + 8, 1);
    }
  }

  private setupInput() {
    const setKey = (code: string, down: boolean) => {
      switch (code) {
        case 'ArrowLeft':
          this.keys.left = down;
          break;
        case 'ArrowRight':
          this.keys.right = down;
          break;
        case 'ArrowUp':
          this.keys.up = down;
          if (down) this.jumpPressedW = true;
          break;
        case 'ArrowDown':
          this.keys.down = down;
          break;
        case 'KeyA':
          this.keys.a = down;
          break;
        case 'KeyD':
          this.keys.d = down;
          break;
        case 'KeyS':
          this.keys.s = down;
          break;
        case 'KeyW':
          this.keys.w = down;
          if (down) this.jumpPressedW = true;
          break;
        case 'Space':
          this.keys.space = down;
          if (down) this.jumpPressedW = true;
          break;
        case 'KeyJ':
          this.keys.j = down;
          break;
        case 'KeyL':
          this.keys.l = down;
          break;
        case 'KeyI':
          this.keys.i = down;
          if (down) this.jumpPressedT = true;
          break;
        case 'KeyK':
          this.keys.k = down;
          break;
        case 'Enter':
          this.keys.enter = down;
          if (down) this.jumpPressedT = true;
          break;
        case 'Escape':
        case 'KeyP':
          if (down && !this.keepSuspended) {
            this.paused = !this.paused;
            this.pauseText.setVisible(this.paused);
            this.physics.world.isPaused = this.paused;
            if (this.paused) this.audio.stopMusic();
            else if (!this.audio.isMuted()) this.audio.startMusic();
          }
          break;
        case 'KeyM':
          if (down) {
            this.audio.toggleMute();
          }
          break;
        default:
          break;
      }
    };

    this.onKeyDown = (e: KeyboardEvent) => {
      setKey(e.code, true);
      this.audio.unlock();
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        e.preventDefault();
      }
    };
    this.onKeyUp = (e: KeyboardEvent) => setKey(e.code, false);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    const clearKeys = () => {
      for (const k of Object.keys(this.keys) as (keyof typeof this.keys)[]) this.keys[k] = false;
      this.jumpPressedW = false;
      this.jumpPressedT = false;
    };
    const onBlur = () => clearKeys();
    window.addEventListener('blur', onBlur);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', onBlur);
      this.audio.dispose();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', onBlur);
      this.audio.dispose();
    });
  }

  private pickupAt(rider: RiderState) {
    for (let i = this.collectibles.length - 1; i >= 0; i -= 1) {
      const c = this.collectibles[i];
      if (!c.img.active) continue;
      if (Math.hypot(rider.x - c.x, rider.y - c.y) < 52) {
        c.img.destroy();
        this.collectibles.splice(i, 1);
        this.takenIds.add(c.id);
        this.counts[c.kind] += 1;
        this.score += c.kind === 'witchHat' ? 500 : c.kind === 'duck' ? 250 : 100;
        // Rings = score only. Speed sneakers = duck. No flash spam.
        if (c.kind === 'duck') {
          this.audio.duckChime();
          this.applySpeedSneakers(rider);
        } else if (c.kind === 'pepper') {
          this.audio.collect();
        } else {
          this.audio.collect();
        }
        this.dust.emitParticleAt(c.x, c.y, 6);
      }
    }
  }

  /** Classic monitor-style sneakers — mild, no screen flash */
  private applySpeedSneakers(rider: RiderState) {
    this.pepperBoostUntil = this.time.now + 2200;
    const dir = Math.sign(rider.gsp || rider.facing || 1) || 1;
    rider.gsp = dir * Math.min(640, Math.max(Math.abs(rider.gsp) + 80, 420));
    this.dust.emitParticleAt(rider.x, rider.y, 8);
  }

  private refreshPepperBoostConfigs() {
    const boosted = this.time.now < this.pepperBoostUntil;
    if (boosted) {
      this.cfgW = {
        ...this.baseCfgW,
        topSpeed: this.baseCfgW.topSpeed * 1.22,
        accel: this.baseCfgW.accel * 1.1,
      };
      this.cfgT = {
        ...this.baseCfgT,
        topSpeed: this.baseCfgT.topSpeed * 1.22,
        accel: this.baseCfgT.accel * 1.1,
      };
    } else {
      this.cfgW = this.baseCfgW;
      this.cfgT = this.baseCfgT;
    }
  }

  private checkSprings(rider: RiderState) {
    if (rider.mode !== 'ground') return;
    const now = this.time.now;
    for (const s of this.springs) {
      if (now < s.coolUntil) continue;
      const dx = rider.x - s.x;
      const dy = rider.y - s.y;
      if (Math.abs(dx) < 28 && Math.abs(dy) < 36) {
        this.bounceSpring(rider, s.power, s.vx ?? 0);
        s.coolUntil = now + 700;
        break;
      }
    }
  }

  private checkGhostHits(rider: RiderState) {
    for (let i = this.ghosts.length - 1; i >= 0; i -= 1) {
      const g = this.ghosts[i];
      if (!g.sprite.active) continue;
      if (Math.hypot(rider.x - g.sprite.x, rider.y - g.sprite.y) < 34) {
        const stomped =
          rider.physState === 'ROLLING_SLIDE' ||
          Math.abs(rider.gsp) > 280 ||
          rider.spindashCharge > 0 ||
          (rider.mode === 'air' && (rider.vy > 80 || Math.abs(rider.vx) > 220));
        if (stomped) {
          this.score += 200;
          this.killedGhostIds.add(g.id);
          this.audio.kill();
          this.dust.emitParticleAt(g.sprite.x, g.sprite.y, 14);
          g.sprite.destroy();
          this.ghosts.splice(i, 1);
        } else {
          this.hitGhost(rider);
        }
        break;
      }
    }
  }

  private bounceSpring(rider: RiderState, powerRaw: number, springVx = 0) {
    const power = Math.abs(powerRaw || 820);
    // SPRING TILE: override all velocities to spring constants → IN_AIR
    const impulse = springOverride(springVx || rider.facing * 60, -power);
    const nearHigh = Math.abs(rider.x - this.kit.highX) < 420;
    applySpringLaunch(rider, impulse.vx, impulse.vy, this.time.now, 140);
    rider.attachedTrackHint = nearHigh && power >= 1000 ? 'HIGH' : null;
    this.dust.emitParticleAt(rider.x, rider.y, 10);
    this.audio.spring();
  }

  private hitGhost(rider: RiderState) {
    this.hurtRider(rider, false);
  }

  /**
   * SPIKES / badnik hurt: if Rings > 0 scatter them + 60f INVINCIBLE;
   * if Rings === 0 → PlayerDeath (loseLife).
   */
  private hurtRider(rider: RiderState, isSpike: boolean) {
    if (this.dying || this.dead || this.finished) return;
    const who = rider === this.riderW ? 'Wideass' : 'Tats';
    if (this.time.now < this.invulnUntil[who] || rider.invincibleFrames > 0) return;
    if (rider.physState === 'INVINCIBLE') return;
    if (rider.mode === 'air' && this.time.now < rider.jumpGraceUntil) return;

    const hit = resolveSpikeCollision(
      this.counts.pepper,
      rider.physState,
      rider.invincibleFrames,
    );
    if (hit.kind === 'ignored') return;
    if (hit.kind === 'death') {
      this.loseLife(rider);
      return;
    }

    this.counts.pepper = 0;
    this.score = Math.max(0, this.score - (isSpike ? 100 : 50));
    this.spawnScatteredRings(rider.x, rider.y, hit.scatterVelocities);
    applyInvincibility(rider, hit.invincibleFrames);
    applySpringLaunch(rider, -rider.facing * 220, -320, this.time.now, 450);
    this.invulnUntil[who] = this.time.now + (hit.invincibleFrames / 60) * 1000;
    this.audio.hurt();
    this.dust.emitParticleAt(rider.x, rider.y, 12);
  }

  private spawnScatteredRings(
    x: number,
    y: number,
    velocities: Array<{ vx: number; vy: number }>,
  ) {
    const max = Math.min(velocities.length, 12);
    for (let i = 0; i < max; i += 1) {
      const v = velocities[i];
      const img = this.add.image(x, y, 'px_pepper').setDepth(20).setScale(1.6);
      this.flyingRings.push({ img, vx: v.vx, vy: v.vy, life: 1.4 });
    }
  }

  private updateFlyingRings(dt: number) {
    for (let i = this.flyingRings.length - 1; i >= 0; i -= 1) {
      const r = this.flyingRings[i];
      r.vy += 1800 * dt;
      r.img.x += r.vx * dt;
      r.img.y += r.vy * dt;
      r.life -= dt;
      r.img.setAlpha(Math.max(0, r.life));
      if (r.life <= 0 || r.img.y > 900) {
        r.img.destroy();
        this.flyingRings.splice(i, 1);
      }
    }
  }

  private spikeRetracted(sx: number): boolean {
    for (const b of this.buttons) {
      if (!b.eventId || !this.buttonHeld.has(b.eventId)) continue;
      // Pressure plate retracts spikes ahead of the pad (classic hold-gate)
      if (sx >= b.tile.x - 40 && sx <= b.tile.x + 560) return true;
    }
    return false;
  }

  private checkSpikeHits(rider: RiderState) {
    if (this.dying || this.dead) return;
    const r = rider.collisionRadius ?? 20;
    for (const s of this.spikes) {
      if (this.spikeRetracted(s.x)) continue;
      if (Math.abs(rider.x - s.x) > s.halfW + r) continue;
      if (rider.y < s.y - 36 || rider.y > s.y + 28) continue;
      this.hurtRider(rider, true);
      return;
    }
  }

  private updateButtons(rider: RiderState) {
    for (const b of this.buttons) {
      updateButtonTile(b.tile, rider.x, rider.y, rider.collisionRadius, (pressed, justPressed) => {
        b.img.setY(b.tile.y);
        b.img.setTint(pressed ? 0xffcc66 : 0xffffff);
        if (!b.eventId) return;
        if (pressed) this.buttonHeld.add(b.eventId);
        else this.buttonHeld.delete(b.eventId);
        if (justPressed) this.dust.emitParticleAt(b.tile.x, b.tile.y, 4);
      });
    }
    for (const s of this.spikes) {
      const down = this.spikeRetracted(s.x);
      s.img.setAlpha(down ? 0.22 : 1);
      s.img.setY(down ? s.y + 18 : s.y + 6);
    }
  }

  private checkHazardHits(rider: RiderState) {
    for (let i = this.hazards.length - 1; i >= 0; i -= 1) {
      const h = this.hazards[i];
      // Orbs hang overhead — only collide when jumping up into them
      if (rider.y > h.y + 28) continue;
      if (Math.hypot(rider.x - h.x, rider.y - h.y) < h.r + 16) {
        if (rider.physState === 'ROLLING_SLIDE' || rider.mode === 'air' || Math.abs(rider.gsp) > 420) {
          h.ball.destroy();
          this.hazards.splice(i, 1);
          this.score += 100;
          this.audio.kill();
          this.dust.emitParticleAt(h.x, h.y, 8);
          return;
        }
        this.hurtRider(rider, false);
        return;
      }
    }
  }

  private loseLife(rider: RiderState) {
    if (this.dying || this.dead || this.finished) return;
    this.dying = true;
    this.lives = Math.max(0, this.lives - 1);
    this.audio.hurt();
    this.dust.emitParticleAt(rider.x, rider.y, 18);

    if (this.lives <= 0) {
      this.dead = true;
      this.dying = false;
      this.reportProgress(this.progressLead().x);
      return;
    }

    // Brief freeze then checkpoint respawn
    this.time.delayedCall(480, () => {
      this.respawnAtCheckpoint();
      this.dying = false;
    });
  }

  private respawnAtCheckpoint() {
    const s = this.kit.tracks.MAIN.path.project(Math.max(120, this.checkpointX), 620).s;
    const sample = this.kit.tracks.MAIN.path.sample(s);
    for (const rider of [this.riderW, this.riderT]) {
      rider.mode = 'ground';
      rider.physState = 'NORMAL_RUN';
      rider.invincibleFrames = 90;
      rider.trackId = 'MAIN';
      rider.s = s;
      rider.x = sample.x;
      rider.y = sample.y;
      rider.angle = sample.angle;
      rider.gsp = 0;
      rider.vx = 0;
      rider.vy = 0;
      rider.spindashCharge = 0;
      rider.attachedTrackHint = 'MAIN';
    }
    this.invulnUntil = {
      Wideass: this.time.now + 1500,
      Tats: this.time.now + 1500,
    };
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      sample.x - 380,
      0,
      this.initData.level.worldWidth - 1280,
    );
  }

  private updateCheckpoint(leadX: number) {
    // Advance checkpoint through keeps and major set pieces
    const gates = [
      this.kit.loop1X + 80,
      this.kit.hillStart + 200,
      this.kit.tunnelX,
      this.kit.loop2X + 80,
      this.kit.hillStart + (this.kit.loop3X - this.kit.hillStart) * 0.5,
      this.kit.loop3X + 80,
      this.kit.grindX,
      this.kit.loop4X + 80,
    ];
    for (const g of gates) {
      if (leadX > g && g > this.checkpointX) this.checkpointX = g;
    }
  }

  /** Furthest active rider — drives camera, keeps, and soft leash. */
  private progressLead(): RiderState {
    const solo = this.initData.playerCount === 1;
    if (solo) {
      return this.initData.primaryCharacter === 'Tats' ? this.riderT : this.riderW;
    }
    return this.riderW.x >= this.riderT.x ? this.riderW : this.riderT;
  }

  private softLeashPartners() {
    if (this.initData.playerCount !== 2) return;
    const lead = this.progressLead();
    const lag = lead === this.riderW ? this.riderT : this.riderW;
    const gap = lead.x - lag.x;
    if (gap < 700) return;
    // Gentle tug first — hard snap only if the partner is truly off-cabinet
    if (gap < 1100) {
      const assist = Math.max(260, Math.abs(lead.gsp) * 0.92) * (lead.facing || 1);
      if (lag.mode === 'ground' && Math.abs(lag.gsp) < Math.abs(assist)) {
        lag.gsp = assist;
        lag.facing = lead.facing || 1;
      }
      return;
    }
    const s = this.kit.tracks.MAIN.path.project(Math.max(120, lead.x - 280), 620).s;
    const sample = this.kit.tracks.MAIN.path.sample(s);
    lag.mode = 'ground';
    lag.physState = 'NORMAL_RUN';
    lag.trackId = 'MAIN';
    lag.s = s;
    lag.x = sample.x;
    lag.y = sample.y;
    lag.angle = sample.angle;
    lag.gsp = Math.max(220, Math.abs(lead.gsp) * 0.55) * (lead.facing || 1);
    lag.vx = 0;
    lag.vy = 0;
    lag.facing = lead.facing || 1;
    lag.attachedTrackHint = 'MAIN';
  }

  /** Freeze scene under a keep overlay — never destroy Phaser mid-act. */
  suspendForKeep() {
    this.keepSuspended = true;
    this.jumpPressedW = false;
    this.jumpPressedT = false;
    this.audio.stopMusic();
  }

  resumeFromKeep(clearedIds: string[]) {
    for (const id of clearedIds) this.clearedKeeps.add(id);
    for (const t of this.initData.level.triggers) {
      if (clearedIds.includes(t.id) && t.resumeX > this.checkpointX) {
        this.checkpointX = t.resumeX;
      }
    }
    this.keepSuspended = false;
    if (!this.paused && !this.audio.isMuted()) this.audio.startMusic();
  }

  /** P1 (primaryCharacter) = arrows/WASD/pad0. P2 = J/L/I/K/pad1. */
  private inputFor(who: CharacterId): RiderInput {
    const solo = this.initData.playerCount === 1;
    const primary = this.initData.primaryCharacter;
    if (solo && who !== primary) {
      return { left: false, right: false, down: false, jumpPressed: false, jumpHeld: false };
    }

    const p1: RiderInput = {
      left: this.keys.left || this.keys.a || this.gp.left,
      right: this.keys.right || this.keys.d || this.gp.right,
      down: this.keys.down || this.keys.s || this.gp.down,
      jumpPressed: this.jumpPressedW || this.gp.jump,
      jumpHeld: this.keys.up || this.keys.w || this.keys.space || this.gp.jump,
    };
    const p2: RiderInput = {
      left: this.keys.j || this.gp2.left,
      right: this.keys.l || this.gp2.right,
      down: this.keys.k || this.gp2.down,
      jumpPressed: this.jumpPressedT || this.gp2.jump,
      jumpHeld: this.keys.i || this.keys.enter || this.gp2.jump,
    };

    if (solo) return p1;
    // Seat-fixed 2P (matches shooter): Wideass = arrows/WASD, Tats = J/L/I/K
    return who === 'Wideass' ? p1 : p2;
  }

  private applyBoostPads(rider: RiderState) {
    if (rider.mode !== 'ground' || rider.trackId !== 'MAIN') return;
    const { boostS, boost2S, boost3S, slowS, slow2S } = this.kit;
    const push = (lo: number, hi: number, minSpeed: number) => {
      if (rider.s >= lo && rider.s <= hi && Math.abs(rider.gsp) < minSpeed) {
        rider.gsp = Math.max(minSpeed, Math.abs(rider.gsp)) * (rider.facing || 1);
        if (Math.abs(rider.s - this.lastBoostS) > 40) {
          this.lastBoostS = rider.s;
          this.audio.boost();
          this.dust.emitParticleAt(rider.x, rider.y, 10);
        }
      }
    };
    push(boostS.lo, boostS.hi, 480);
    push(boost2S.lo, boost2S.hi, 500);
    push(boost3S.lo, boost3S.hi, 460);

    // Slow zones (tunnel sludge / uphill mud) — drag speed down
    const drag = (lo: number, hi: number, cap: number) => {
      if (rider.s >= lo && rider.s <= hi && Math.abs(rider.gsp) > cap) {
        rider.gsp *= 0.92;
        if (Math.abs(rider.gsp) > cap) {
          rider.gsp = Math.sign(rider.gsp) * cap;
        }
      }
    };
    drag(slowS.lo, slowS.hi, 280);
    drag(slow2S.lo, slow2S.hi, 240);
  }

  private syncSprite(sprite: Phaser.GameObjects.Sprite, rider: RiderState, who: CharacterId) {
    sprite.setPosition(rider.x, rider.y);
    sprite.setAngle(Phaser.Math.RadToDeg(rider.angle));
    sprite.setFlipX(rider.facing < 0);

    const rolling = rider.physState === 'ROLLING_SLIDE';
    const skidding = rider.physState === 'SKID';
    const charging = rider.spindashCharge > 0;
    const prefix = who === 'Wideass' ? 'wideass' : 'tats';
    const hasJump = this.anims.exists(`${prefix}-jump`);
    const anim =
      charging
        ? `${prefix}-crouch`
        : rolling || skidding
          ? `${prefix}-roll`
          : rider.physState === 'IN_AIR' || rider.mode === 'air'
            ? hasJump
              ? `${prefix}-jump`
              : `${prefix}-roll`
            : Math.abs(rider.gsp) > 40
              ? `${prefix}-run`
              : `${prefix}-idle`;
    if (this.anims.exists(anim)) {
      try {
        sprite.play(anim, true);
      } catch {
        /* ignore anim edge cases */
      }
    }

    const base = who === 'Wideass' ? 1.35 : 1.28;
    const radiusScale = rolling ? 0.88 : 1;
    if (charging) {
      sprite.setScale(base * 1.05, base * (0.68 + Math.min(0.22, rider.spindashCharge / 4500)));
    } else {
      sprite.setScale(base * radiusScale);
    }
  }

  private soloFollow() {
    if (this.initData.playerCount !== 1) return;
    const lead = this.initData.primaryCharacter === 'Wideass' ? this.riderW : this.riderT;
    const followerSprite =
      this.initData.primaryCharacter === 'Wideass' ? this.tats : this.wideass;
    followerSprite.x = Phaser.Math.Linear(followerSprite.x, lead.x - 52 * lead.facing, 0.12);
    followerSprite.y = Phaser.Math.Linear(followerSprite.y, lead.y - 2, 0.14);
    followerSprite.setAngle(Phaser.Math.RadToDeg(lead.angle));
    followerSprite.setFlipX(lead.facing < 0);
    const prefix = followerSprite.getData('char') === 'Wideass' ? 'wideass' : 'tats';
    const rolling = lead.physState === 'ROLLING_SLIDE' || lead.mode === 'air';
    const anim = rolling
      ? `${prefix}-roll`
      : Math.abs(lead.gsp) > 40
        ? `${prefix}-run`
        : `${prefix}-idle`;
    if (this.anims.exists(anim)) {
      try {
        followerSprite.play(anim, true);
      } catch {
        /* ignore */
      }
    }
  }

  private updateCamera() {
    const lead = this.progressLead();
    // Classic Sonic look-ahead — always framed on the furthest teammate
    const boostMul = this.time.now < this.pepperBoostUntil ? 1.12 : 1;
    const leadOffset = Phaser.Math.Clamp(lead.gsp * 0.38 * boostMul, -120, 340);
    const targetScrollX = Phaser.Math.Clamp(
      lead.x - 380 + leadOffset,
      0,
      this.initData.level.worldWidth - 1280,
    );
    const targetScrollY = Phaser.Math.Clamp(lead.y - 360, -260, 100);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, 0.22);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetScrollY, 0.2);
  }

  private checkTriggers(x: number) {
    const lead = this.progressLead();
    // Side games only while planted on MAIN — spring/boost flings can't yank you in mid-air.
    // If you sailed past while airborne, entry waits until you land and keep running.
    const canTrigger =
      lead.mode === 'ground' && lead.trackId === 'MAIN' && Math.abs(lead.vy ?? 0) < 80;

    if (canTrigger) {
      for (const t of this.initData.level.triggers) {
        if (this.firedTriggers.has(t.id)) continue;
        if (x < t.atX) continue;
        this.firedTriggers.add(t.id);
        this.reportProgress(x);
        this.initData.onTrigger(t);
        break; // one detour at a time
      }
    }
    this.lastLeadX = x;
  }

  private reportProgress(x: number) {
    const keepsCleared = this.initData.level.triggers.every((t) => this.clearedKeeps.has(t.id));
    const atGoal =
      (this.riderW.trackId === this.kit.finishTrackId && this.riderW.s >= this.kit.finishMinS) ||
      (this.riderT.trackId === this.kit.finishTrackId && this.riderT.s >= this.kit.finishMinS) ||
      x >= this.initData.level.finishX;
    const finished = !this.finished && !this.dead && keepsCleared && atGoal;
    if (finished && !this.finished) {
      this.finished = true;
      this.audio.clear();
    }
    this.initData.onProgress({
      x,
      counts: this.counts,
      score: this.score,
      finished: this.finished,
      timeSec: this.elapsed,
      takenIds: [...this.takenIds],
      killedGhostIds: [...this.killedGhostIds],
      lives: this.lives,
      dead: this.dead,
      checkpointX: this.checkpointX,
    });
  }

  private drawFinish(x: number) {
    this.add.image(x + 32, 560, 'px_finish').setDepth(5).setScale(2.2).setOrigin(0.5, 1);
  }

  private updateGhosts(dt: number) {
    for (const g of this.ghosts) {
      if (!g.sprite.active) continue;
      if (g.sprite.x > g.homeX + g.patrol) g.dir = -1;
      if (g.sprite.x < g.homeX - g.patrol) g.dir = 1;
      g.sprite.x += 72 * g.dir * dt;
      g.sprite.y = g.homeY + Math.sin(this.elapsed * 4 + g.homeX) * 6;
      g.sprite.setFlipX(g.dir < 0);
    }
  }

  private bobCollectibles() {
    for (const c of this.collectibles) {
      if (!c.img.active) continue;
      c.img.y = c.y + Math.sin(this.elapsed * 3.2 + c.x * 0.015) * 3;
      const base = c.kind === 'pepper' ? 2.0 : c.kind === 'duck' ? 1.5 : 1.6;
      c.img.setScale(base);
      c.img.setAlpha(1);
    }
  }

  private pulseKeepBeacons(leadX: number) {
    for (const b of this.keepBeacons) {
      const near = leadX > b.atX - 380 && leadX < b.atX + 60;
      const scale = near ? 2.2 + Math.sin(this.elapsed * 9) * 0.18 : 2.2;
      const alpha = near ? 0.85 + Math.sin(this.elapsed * 11) * 0.15 : 1;
      for (const img of b.imgs) img.setScale(scale).setAlpha(alpha);
    }
  }

  update(_time: number, delta: number) {
    if (this.paused || this.keepSuspended || this.dead) {
      // Drop edge-pressed jump so pause can't queue a phantom leap on resume
      this.jumpPressedW = false;
      this.jumpPressedT = false;
      return;
    }
    if (this.dying) {
      this.jumpPressedW = false;
      this.jumpPressedT = false;
      this.elapsed += delta / 1000;
      return;
    }
    this.elapsed += delta / 1000;
    const dt = Math.min(delta / 1000, 0.05);
    const now = this.time.now;
    const solo = this.initData.playerCount === 1;
    const primary = this.initData.primaryCharacter;

    this.pollGamepad();

    this.refreshPepperBoostConfigs();

    const inW = this.inputFor('Wideass');
    const inT = this.inputFor('Tats');

    if (!solo || primary === 'Wideass') {
      stepRider(this.riderW, this.kit.tracks, inW, dt, now, this.cfgW);
      this.handleRiderEvents(this.riderW);
      this.applyBoostPads(this.riderW);
      this.pickupAt(this.riderW);
      this.checkSprings(this.riderW);
      this.checkGhostHits(this.riderW);
      this.checkHazardHits(this.riderW);
      this.checkSpikeHits(this.riderW);
      this.updateButtons(this.riderW);
      this.syncSprite(this.wideass, this.riderW, 'Wideass');
      this.wideass.setAlpha(
        now < this.invulnUntil.Wideass || this.riderW.invincibleFrames > 0 ? 0.45 : 1,
      );
    }
    if (!solo || primary === 'Tats') {
      // inputFor() already maps P1 keys onto Tats when primary === 'Tats' — never feed empty inW
      stepRider(this.riderT, this.kit.tracks, inT, dt, now, this.cfgT);
      this.handleRiderEvents(this.riderT);
      this.applyBoostPads(this.riderT);
      this.pickupAt(this.riderT);
      this.checkSprings(this.riderT);
      this.checkGhostHits(this.riderT);
      this.checkHazardHits(this.riderT);
      this.checkSpikeHits(this.riderT);
      this.updateButtons(this.riderT);
      this.syncSprite(this.tats, this.riderT, 'Tats');
      this.tats.setAlpha(
        now < this.invulnUntil.Tats || this.riderT.invincibleFrames > 0 ? 0.45 : 1,
      );
    }

    this.jumpPressedW = false;
    this.jumpPressedT = false;

    this.softLeashPartners();
    const lead = this.progressLead();
    const ok = checkApproachSpeed(lead, this.kit.tracks, 80);
    if (!ok) {
      this.needSpeed = 1;
      if (!this.lastNeedSpeed) this.audio.needSpeed();
      this.lastNeedSpeed = true;
    } else {
      this.needSpeed = Math.max(0, this.needSpeed - dt * 3);
      this.lastNeedSpeed = false;
    }
    this.needSpeedText.setAlpha(this.needSpeed);

    if (this.debugText.visible) {
      const moving = inW.left || inW.right || inT.left || inT.right;
      this.debugText.setText(
        `SPEED ${Math.abs(lead.gsp).toFixed(0)}  ·  ${lead.physState}  ·  grip ${lead.gripMode}°${moving ? '  ·  GO!' : ''}  ·  ♥${this.lives}`,
      );
    }

    this.soloFollow();
    this.updateGhosts(dt);
    this.updateFlyingRings(dt);
    this.updateCamera();
    this.updateSpeedFx(lead);
    this.bobCollectibles();
    this.pulseKeepBeacons(lead.x);

    const leadX = lead.x;
    this.updateCheckpoint(leadX);
    this.checkTriggers(leadX);

    this.hudAcc += dt;
    // Once finished, report exactly once more — not every frame
    if (this.hudAcc >= 0.1 || (this.finished && this.hudAcc >= 0)) {
      const wasFinished = this.finished;
      this.hudAcc = this.finished ? -999 : 0;
      this.reportProgress(leadX);
      if (wasFinished) this.hudAcc = -999;
    }

    this.clouds.tilePositionX = this.cameras.main.scrollX * 0.15 + this.elapsed * 8;
    if (this.brandClouds) {
      this.brandClouds.tilePositionX = this.cameras.main.scrollX * 0.08 + this.elapsed * 14;
    }
    this.mountains.tilePositionX = this.cameras.main.scrollX * 0.35;

    // Bottomless death — fall through gaps or off the world
    for (const rider of [this.riderW, this.riderT]) {
      const soloSkip =
        solo &&
        ((primary === 'Wideass' && rider === this.riderT) ||
          (primary === 'Tats' && rider === this.riderW));
      if (soloSkip) continue;

      const inDeathGap = this.kit.deathGaps.some(
        (g) => rider.x > g.xMin + 8 && rider.x < g.xMax - 8 && rider.y > 560,
      );
      if (rider.y > 820 || inDeathGap) {
        this.loseLife(rider);
        break;
      }
    }
  }

  private handleRiderEvents(rider: RiderState) {
    for (const ev of rider.events) {
      if (ev.type === 'jump') this.audio.jump();
      else if (ev.type === 'spindashRelease') {
        this.audio.spindashRelease();
      } else if (ev.type === 'detachInverted') this.audio.hurt();
      else if (ev.type === 'land' && Math.abs(rider.gsp) > 360) this.audio.loopEnter();
      else if (ev.type === 'skid') this.dust.emitParticleAt(rider.x, rider.y + 10, 6);
      else if (ev.type === 'rollEnter') this.dust.emitParticleAt(rider.x, rider.y, 4);
    }
    if (rider.spindashCharge > 40 && Math.random() < 0.08) this.audio.spindash();
    if (rider.physState === 'SKID' && Math.random() < 0.25) {
      this.dust.emitParticleAt(rider.x - rider.facing * 8, rider.y + 12, 2);
    }
  }

  private pollGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = pads[0];
    this.gp.left = false;
    this.gp.right = false;
    this.gp.down = false;
    const wasJump = this.gp.jump;
    this.gp.jump = false;
    const dead = 0.28;
    if (pad) {
      const ax = pad.axes[0] ?? 0;
      if (ax < -dead || pad.buttons[14]?.pressed) this.gp.left = true;
      if (ax > dead || pad.buttons[15]?.pressed) this.gp.right = true;
      if (pad.buttons[1]?.pressed || pad.buttons[13]?.pressed) this.gp.down = true;
      const jumpNow = !!(pad.buttons[12]?.pressed || pad.buttons[0]?.pressed);
      this.gp.jump = jumpNow;
      if (jumpNow && !wasJump) this.jumpPressedW = true;
    }

    const pad2 = pads[1];
    this.gp2.left = false;
    this.gp2.right = false;
    this.gp2.down = false;
    const wasJump2 = this.gp2.jump;
    this.gp2.jump = false;
    if (pad2 && this.initData.playerCount === 2) {
      const ax = pad2.axes[0] ?? 0;
      if (ax < -dead || pad2.buttons[14]?.pressed) this.gp2.left = true;
      if (ax > dead || pad2.buttons[15]?.pressed) this.gp2.right = true;
      if (pad2.buttons[1]?.pressed || pad2.buttons[13]?.pressed) this.gp2.down = true;
      const jumpNow = !!(pad2.buttons[12]?.pressed || pad2.buttons[0]?.pressed);
      this.gp2.jump = jumpNow;
      if (jumpNow && !wasJump2) this.jumpPressedT = true;
    }
  }
}
