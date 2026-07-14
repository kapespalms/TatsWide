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
  checkApproachSpeed,
  createRiderState,
  riderConfigFor,
  stepRider,
  type RiderInput,
  type RiderState,
} from './TrackRider';

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
    img: Phaser.GameObjects.Image;
    coolUntil: number;
  }[] = [];
  private ghosts: GhostState[] = [];
  private clouds!: Phaser.GameObjects.TileSprite;
  private mountains!: Phaser.GameObjects.TileSprite;
  private counts: CollectibleCounts = { pepper: 0, duck: 0, witchHat: 0 };
  private score = 0;
  private firedTriggers = new Set<string>();
  private finished = false;
  private elapsed = 0;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private needSpeedText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private audio = new AdventureAudio();
  private paused = false;
  private pauseText!: Phaser.GameObjects.Text;
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

  constructor() {
    super('AdventureRunScene');
  }

  init(data: AdventureRunInit) {
    this.initData = data;
    this.counts = { ...(data.seedCounts ?? { pepper: 0, duck: 0, witchHat: 0 }) };
    this.score = data.seedScore ?? 0;
    this.elapsed = data.seedElapsed ?? 0;
    this.firedTriggers = new Set(data.seedFiredTriggers ?? []);
    this.finished = false;
    this.paused = false;
    this.ghosts = [];
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

    this.cameras.main.setBackgroundColor(level.skyColor);
    this.physics.world.setBounds(0, 0, level.worldWidth, 780);
    this.physics.world.gravity.y = 0;

    this.buildParallax(level);
    this.buildDecor(level);
    this.drawAllTracks();
    this.buildSprings(level);
    this.buildGrindVisual(level);
    this.buildCollectibles(level);
    this.buildGhosts(level);
    this.buildPlayers();
    this.buildDust();
    this.buildSpeedFx();
    this.setupInput();

    this.needSpeedText = this.add
      .text(640, 240, 'NEED SPEED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ff3333',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
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
      .text(640, 360, 'PAUSED\nESC to resume', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffe14a',
        align: 'center',
        stroke: '#000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setVisible(false);

    this.cameras.main.setBounds(0, 0, level.worldWidth, 780);
    this.drawFinish(level.finishX);
    this.audio.unlock();
    this.audio.startMusic();
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
    if (level.theme === 'haunted' || level.theme === 'alien') {
      this.mountains.setTint(0x8866aa);
      this.clouds.setTint(0xccaaff);
    } else if (level.theme === 'snow') {
      this.mountains.setTint(0xddeeff);
    } else if (level.theme === 'industrial') {
      this.mountains.setTint(0x8899aa);
      this.clouds.setTint(0x8899aa);
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
    this.add
      .text(boost.x, boost.y - 48, 'BOOST >>', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffb400',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(6);

    const duck = this.kit.tracks.MAIN.path.sample(this.kit.tunnelDuckS.lo);
    this.add
      .text(duck.x, duck.y - 48, 'HOLD ↓ : TUNNEL', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f0d9ad',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(6);

    const loop2 = this.kit.tracks.MAIN.path.sample(this.kit.boost2S.lo);
    this.add
      .text(loop2.x, loop2.y - 48, 'BOOST >>', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffb400',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(6);

    const highJoin = this.kit.tracks.MAIN.path.sample(this.kit.highJoinS.lo);
    this.add
      .text(highJoin.x, highJoin.y - 56, 'JUMP → HIGH', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffe14a',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(6);

    const grindJoin = this.kit.tracks.MAIN.path.sample(this.kit.grindJoinS.lo);
    this.add
      .text(grindJoin.x, grindJoin.y - 56, 'JUMP → GRIND', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffd020',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(6);
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
    const step = 12;
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

  private buildSprings(level: LevelAuthoring) {
    this.springs = [];
    for (const s of level.springs) {
      const img = this.add.image(s.x, s.y, 'px_spring').setDepth(5).setScale(2);
      this.springs.push({ x: s.x, y: s.y, power: s.power, img, coolUntil: 0 });
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
      const img = this.add.image(c.x, c.y, key).setDepth(8).setScale(2);
      this.collectibles.push({ id: c.id, x: c.x, y: c.y, kind: c.kind, img });
    }
  }

  private buildGhosts(level: LevelAuthoring) {
    this.ghosts = [];
    for (const g of level.ghosts) {
      if (this.killedGhostIds.has(g.id)) continue;
      const sprite = this.add.sprite(g.x, g.y, 'px_ghost_0');
      sprite.setDepth(9).setScale(2);
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
    const speed = Math.abs(lead.gsp);
    const intensity = Phaser.Math.Clamp((speed - 380) / 420, 0, 1);
    this.speedLines.clear();
    if (intensity <= 0.02) {
      this.speedLines.setAlpha(0);
      this.vignette.setAlpha(0);
      return;
    }
    this.speedLines.setAlpha(0.35 + intensity * 0.55);
    this.vignette.setAlpha(intensity * 0.22);
    const dir = lead.facing;
    for (let i = 0; i < 14; i += 1) {
      const y = 40 + i * 48 + ((this.elapsed * 900 * intensity) % 48);
      const len = 80 + intensity * 160 + (i % 3) * 30;
      const x0 = dir > 0 ? 1280 - 40 : 40;
      const x1 = dir > 0 ? 1280 - 40 - len : 40 + len;
      this.speedLines.lineStyle(2, i % 2 === 0 ? 0xffffff : 0xffe14a, 0.5 + intensity * 0.4);
      this.speedLines.lineBetween(x0, y, x1, y + (i % 2 === 0 ? 4 : -4));
    }
    if (lead.mode === 'ground' && speed > 220) {
      this.dust.emitParticleAt(lead.x - lead.facing * 18, lead.y + 8, intensity > 0.5 ? 2 : 1);
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
          if (down) {
            this.paused = !this.paused;
            this.pauseText.setVisible(this.paused);
            this.physics.world.isPaused = this.paused;
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
      if (Math.hypot(rider.x - c.x, rider.y - c.y) < 36) {
        c.img.destroy();
        this.collectibles.splice(i, 1);
        this.takenIds.add(c.id);
        this.counts[c.kind] += 1;
        this.score += c.kind === 'witchHat' ? 500 : c.kind === 'duck' ? 250 : 100;
        this.audio.collect();
        this.dust.emitParticleAt(c.x, c.y, 8);
      }
    }
  }

  private checkSprings(rider: RiderState) {
    const now = this.time.now;
    for (const s of this.springs) {
      if (now < s.coolUntil) continue;
      if (Math.hypot(rider.x - s.x, rider.y - s.y) < 44) {
        this.bounceSpring(rider, s.power);
        s.coolUntil = now + 450;
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

  private bounceSpring(rider: RiderState, powerRaw: number) {
    const power = Math.abs(powerRaw || 900);
    const sample =
      rider.trackId && this.kit.tracks[rider.trackId]
        ? this.kit.tracks[rider.trackId].path.sample(rider.s)
        : { tx: rider.facing, ty: 0, nx: 0, ny: -1 };
    rider.mode = 'air';
    rider.vx = sample.tx * rider.gsp + sample.nx * power * 0.55 + rider.facing * 80;
    rider.vy = sample.ty * rider.gsp + sample.ny * power * 0.95;
    rider.trackId = null;
    // Only big springs near HIGH ramp bias landings onto HIGH
    const nearHigh = Math.abs(rider.x - this.kit.highX) < 420;
    rider.attachedTrackHint = nearHigh && power >= 1000 ? 'HIGH' : null;
    rider.jumpGraceUntil = this.time.now + 140;
    this.dust.emitParticleAt(rider.x, rider.y, 10);
    this.cameras.main.shake(60, 0.002);
    this.audio.spring();
  }

  private hitGhost(rider: RiderState) {
    const who = rider === this.riderW ? 'Wideass' : 'Tats';
    if (this.time.now < this.invulnUntil[who]) return;
    if (rider.mode === 'air' && this.time.now < rider.jumpGraceUntil) return;
    rider.gsp *= -0.4;
    rider.vx = -rider.facing * 200;
    rider.vy = -280;
    rider.mode = 'air';
    rider.trackId = null;
    rider.jumpGraceUntil = this.time.now + 400;
    this.invulnUntil[who] = this.time.now + 900;
    this.score = Math.max(0, this.score - 50);
    this.cameras.main.shake(100, 0.004);
    this.audio.hurt();
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
    return who === primary ? p1 : p2;
  }

  private applyBoostPads(rider: RiderState) {
    if (rider.mode !== 'ground' || rider.trackId !== 'MAIN') return;
    const { boostS, boost2S } = this.kit;
    const push = (lo: number, hi: number) => {
      if (rider.s >= lo && rider.s <= hi && rider.gsp < 620) {
        rider.gsp = Math.max(620, Math.abs(rider.gsp)) * (rider.facing || 1);
        if (Math.abs(rider.s - this.lastBoostS) > 40) {
          this.lastBoostS = rider.s;
          this.audio.boost();
          this.cameras.main.flash(90, 255, 225, 74);
          this.dust.emitParticleAt(rider.x, rider.y, 12);
        }
      }
    };
    push(boostS.lo, boostS.hi);
    push(boost2S.lo, boost2S.hi);
  }

  private syncSprite(sprite: Phaser.GameObjects.Sprite, rider: RiderState, who: CharacterId) {
    sprite.setPosition(rider.x, rider.y);
    sprite.setAngle(Phaser.Math.RadToDeg(rider.angle));
    sprite.setFlipX(rider.facing < 0);

    const rolling = Math.abs(rider.gsp) > 420;
    const charging = rider.spindashCharge > 0;
    const prefix = who === 'Wideass' ? 'wideass' : 'tats';
    const anim =
      charging
        ? `${prefix}-crouch`
        : rider.mode === 'air' || rolling
          ? `${prefix}-roll`
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
    if (charging) {
      sprite.setScale(base * 1.05, base * (0.68 + Math.min(0.22, rider.spindashCharge / 4500)));
    } else {
      sprite.setScale(base);
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
    const rolling = Math.abs(lead.gsp) > 420 || lead.mode === 'air';
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
    const solo = this.initData.playerCount === 1;
    const lead =
      solo && this.initData.primaryCharacter === 'Tats' ? this.riderT : this.riderW;
    const partner = lead === this.riderW ? this.riderT : this.riderW;
    const midX = solo ? lead.x : (lead.x + partner.x) / 2;
    const midY = solo ? lead.y : (lead.y + partner.y) / 2;
    const leadOffset = Phaser.Math.Clamp(lead.gsp * 0.25, -160, 260);
    const targetScrollX = Phaser.Math.Clamp(
      midX - 420 + leadOffset,
      0,
      this.initData.level.worldWidth - 1280,
    );
    const targetScrollY = Phaser.Math.Clamp(midY - 380, -220, 80);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, 0.12);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetScrollY, 0.14);
  }

  private checkTriggers(x: number) {
    for (const t of this.initData.level.triggers) {
      if (this.firedTriggers.has(t.id)) continue;
      if (x >= t.atX) {
        // Only gate on the lead rider — partner on a rail shouldn't soft-lock co-op
        const lead =
          this.initData.playerCount === 1 && this.initData.primaryCharacter === 'Tats'
            ? this.riderT
            : this.riderW;
        const onBranch =
          lead.trackId === 'GRIND' || lead.trackId === 'HIGH' || lead.trackId === 'LOW';
        if (onBranch) continue;
        this.firedTriggers.add(t.id);
        // Flush HUD/score/pickups before Phaser tears down
        this.reportProgress(x);
        this.initData.onTrigger(t);
      }
    }
  }

  private reportProgress(x: number) {
    const finished =
      !this.finished &&
      ((this.riderW.trackId === this.kit.finishTrackId && this.riderW.s >= this.kit.finishMinS) ||
        (this.riderT.trackId === this.kit.finishTrackId && this.riderT.s >= this.kit.finishMinS) ||
        x >= this.initData.level.finishX);
    if (finished && !this.finished) {
      this.finished = true;
      this.audio.clear();
      this.cameras.main.flash(280, 255, 225, 74);
      this.cameras.main.shake(200, 0.004);
    }
    this.initData.onProgress({
      x,
      counts: this.counts,
      score: this.score,
      finished: this.finished,
      timeSec: this.elapsed,
      takenIds: [...this.takenIds],
      killedGhostIds: [...this.killedGhostIds],
    });
  }

  private drawFinish(x: number) {
    for (let y = 480; y < 640; y += 32) {
      for (let col = 0; col < 4; col += 1) {
        const even = ((y / 32) + col) % 2 === 0;
        this.add
          .rectangle(x + col * 16, y, 16, 32, even ? 0x101018 : 0xf0f0f8)
          .setDepth(5);
      }
    }
    this.add
      .text(x + 32, 420, 'GOAL', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffe14a',
        stroke: '#101018',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);
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
      c.img.y = c.y + Math.sin(this.elapsed * 5 + c.x * 0.02) * 5;
      c.img.setScale(2 + Math.sin(this.elapsed * 6 + c.x) * 0.08);
    }
  }

  update(_time: number, delta: number) {
    if (this.paused) {
      // Drop edge-pressed jump so pause can't queue a phantom leap on resume
      this.jumpPressedW = false;
      this.jumpPressedT = false;
      return;
    }
    this.elapsed += delta / 1000;
    const dt = Math.min(delta / 1000, 0.05);
    const now = this.time.now;
    const solo = this.initData.playerCount === 1;
    const primary = this.initData.primaryCharacter;

    this.pollGamepad();

    const inW = this.inputFor('Wideass');
    const inT = this.inputFor('Tats');

    if (!solo || primary === 'Wideass') {
      stepRider(this.riderW, this.kit.tracks, inW, dt, now, this.cfgW);
      this.handleRiderEvents(this.riderW);
      this.applyBoostPads(this.riderW);
      this.pickupAt(this.riderW);
      this.checkSprings(this.riderW);
      this.checkGhostHits(this.riderW);
      this.syncSprite(this.wideass, this.riderW, 'Wideass');
      this.wideass.setAlpha(now < this.invulnUntil.Wideass ? 0.45 : 1);
    }
    if (!solo || primary === 'Tats') {
      // inputFor() already maps P1 keys onto Tats when primary === 'Tats' — never feed empty inW
      stepRider(this.riderT, this.kit.tracks, inT, dt, now, this.cfgT);
      this.handleRiderEvents(this.riderT);
      this.applyBoostPads(this.riderT);
      this.pickupAt(this.riderT);
      this.checkSprings(this.riderT);
      this.checkGhostHits(this.riderT);
      this.syncSprite(this.tats, this.riderT, 'Tats');
      this.tats.setAlpha(now < this.invulnUntil.Tats ? 0.45 : 1);
    }

    this.jumpPressedW = false;
    this.jumpPressedT = false;

    const lead = solo && primary === 'Tats' ? this.riderT : this.riderW;
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
        `SPEED ${Math.abs(lead.gsp).toFixed(0)}  ·  ${lead.mode.toUpperCase()}${moving ? '  ·  GO!' : ''}`,
      );
    }

    this.soloFollow();
    this.updateGhosts(dt);
    this.updateCamera();
    this.updateSpeedFx(lead);
    this.bobCollectibles();

    const leadX = lead.x;
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
    this.mountains.tilePositionX = this.cameras.main.scrollX * 0.35;

    for (const rider of [this.riderW, this.riderT]) {
      if (rider.y > 900) {
        const s = this.kit.tracks.MAIN.path.project(Math.max(120, leadX - 200), 620).s;
        const sample = this.kit.tracks.MAIN.path.sample(s);
        rider.mode = 'ground';
        rider.trackId = 'MAIN';
        rider.s = s;
        rider.x = sample.x;
        rider.y = sample.y;
        rider.angle = sample.angle;
        rider.gsp = 0;
        rider.vx = 0;
        rider.vy = 0;
        rider.attachedTrackHint = 'MAIN';
        this.audio.hurt();
      }
    }
  }

  private handleRiderEvents(rider: RiderState) {
    for (const ev of rider.events) {
      if (ev.type === 'jump') this.audio.jump();
      else if (ev.type === 'spindashRelease') {
        this.audio.spindashRelease();
        this.cameras.main.shake(50, 0.0025);
      } else if (ev.type === 'detachInverted') this.audio.hurt();
      else if (ev.type === 'land' && Math.abs(rider.gsp) > 480) this.audio.loopEnter();
    }
    if (rider.spindashCharge > 40 && Math.random() < 0.08) this.audio.spindash();
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
