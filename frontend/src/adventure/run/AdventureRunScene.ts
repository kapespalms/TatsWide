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
import {
  DEFAULT_RIDER_CONFIG,
  checkApproachSpeed,
  createRiderState,
  stepRider,
  type RiderInput,
  type RiderState,
} from './TrackRider';

export interface AdventureRunInit {
  level: LevelAuthoring;
  playerCount: 1 | 2;
  primaryCharacter: CharacterId;
  startX: number;
  onProgress: (payload: RunProgress) => void;
  onTrigger: (trigger: LevelTrigger) => void;
}

export interface RunProgress {
  x: number;
  counts: CollectibleCounts;
  score: number;
  finished: boolean;
  timeSec: number;
}

interface GhostState {
  sprite: Phaser.GameObjects.Sprite;
  homeX: number;
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
  private collectibles: { x: number; y: number; kind: CollectibleKind; img: Phaser.GameObjects.Image }[] =
    [];
  private springs: { x: number; y: number; power: number; img: Phaser.GameObjects.Image }[] = [];
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

  constructor() {
    super('AdventureRunScene');
  }

  init(data: AdventureRunInit) {
    this.initData = data;
    this.counts = { pepper: 0, duck: 0, witchHat: 0 };
    this.score = 0;
    this.elapsed = 0;
    this.firedTriggers = new Set();
    this.finished = false;
    this.ghosts = [];
    this.collectibles = [];
    this.springs = [];
    this.needSpeed = 0;
    this.jumpPressedW = false;
    this.jumpPressedT = false;
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
    createModern16BitAtlas(this);
    const level = this.initData.level;
    this.kit = getTrackKitForLevel(level.level);

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
      .setDepth(100);

    this.cameras.main.setBounds(0, 0, level.worldWidth, 780);
    this.drawFinish(level.finishX);
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
    void level;
  }

  private buildDecor(level: LevelAuthoring) {
    for (let x = 80; x < level.worldWidth; x += 220) {
      const pine = this.add
        .image(x + (x % 60), 600, 'px_pine')
        .setDepth(-8)
        .setScale(2)
        .setScrollFactor(0.55);
      pine.setOrigin(0.5, 1);
    }
  }

  private drawAllTracks() {
    this.drawTrackPath(this.kit.tracks.MAIN.path, 0x3a3f52, 0xe8ebf5, 28);
    this.drawTrackPath(this.kit.tracks.HIGH.path, 0x2f6b3a, 0xcdeed4, 22);
    this.drawTrackPath(this.kit.tracks.LOW.path, 0x6b4a1f, 0xf0d9ad, 22);

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

    // Second loop approach boost zone visual
    const loop2 = this.kit.tracks.MAIN.path.project(this.kit.jeepAtX + 700, 620);
    const l2 = this.kit.tracks.MAIN.path.sample(Math.max(0, loop2.s - 80));
    this.add
      .text(l2.x, l2.y - 48, 'BOOST >>', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffb400',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private drawTrackPath(
    path: { length: number; sample: (s: number) => { x: number; y: number; nx: number; ny: number } },
    colorA: number,
    colorB: number,
    width: number,
  ) {
    const g = this.add.graphics().setDepth(2);
    const step = 12;
    for (let s = 0; s < path.length; s += step) {
      const a = path.sample(s);
      const b = path.sample(Math.min(path.length, s + step));
      const even = Math.floor(s / step) % 2 === 0;
      g.lineStyle(width, even ? colorA : colorB, 1);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.strokePath();
    }
    // Bright rail edge along normal
    g.lineStyle(3, 0xffffff, 0.35);
    g.beginPath();
    for (let s = 0; s <= path.length; s += step) {
      const p = path.sample(s);
      const px = p.x - p.nx * (width / 2);
      const py = p.y - p.ny * (width / 2);
      if (s === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
  }

  private buildSprings(level: LevelAuthoring) {
    this.springs = [];
    for (const s of level.springs) {
      const img = this.add.image(s.x, s.y, 'px_spring').setDepth(5).setScale(2);
      this.springs.push({ x: s.x, y: s.y, power: s.power, img });
    }
  }

  private buildGrindVisual(level: LevelAuthoring) {
    for (const r of level.grindRails) {
      for (let x = 0; x < r.length; x += 32) {
        this.add.image(r.x + x + 16, r.y, 'px_rail').setDepth(4).setScale(2);
      }
    }
  }

  private buildCollectibles(level: LevelAuthoring) {
    this.collectibles = [];
    for (const c of level.collectibles) {
      const key = c.kind === 'pepper' ? 'px_pepper' : c.kind === 'duck' ? 'px_duck' : 'px_hat';
      const img = this.add.image(c.x, c.y, key).setDepth(8).setScale(2);
      this.collectibles.push({ x: c.x, y: c.y, kind: c.kind, img });
    }
  }

  private buildGhosts(level: LevelAuthoring) {
    this.ghosts = [];
    for (const g of level.ghosts) {
      const sprite = this.add.sprite(g.x, g.y, 'px_ghost_0');
      sprite.setDepth(9).setScale(2);
      if (this.anims.exists('ghost-float')) sprite.play('ghost-float');
      this.ghosts.push({ sprite, homeX: g.x, patrol: g.patrol, dir: 1 });
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
      p.setDepth(20).setScale(who === 'Wideass' ? 2.25 : 2.1);
      p.setData('char', who);
      p.setOrigin(0.5, 0.85);
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
      speed: { min: 20, max: 60 },
      scale: { start: 0.6, end: 0 },
      lifespan: 320,
      emitting: false,
      gravityY: 200,
    });
    this.dust.setDepth(18);
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
        default:
          break;
      }
    };

    this.onKeyDown = (e: KeyboardEvent) => {
      setKey(e.code, true);
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    });
  }

  private pickupAt(rider: RiderState) {
    for (let i = this.collectibles.length - 1; i >= 0; i -= 1) {
      const c = this.collectibles[i];
      if (!c.img.active) continue;
      if (Math.hypot(rider.x - c.x, rider.y - c.y) < 36) {
        c.img.destroy();
        this.collectibles.splice(i, 1);
        this.counts[c.kind] += 1;
        this.score += c.kind === 'witchHat' ? 500 : c.kind === 'duck' ? 250 : 100;
      }
    }
  }

  private checkSprings(rider: RiderState) {
    if (rider.mode !== 'ground') return;
    for (const s of this.springs) {
      if (Math.hypot(rider.x - s.x, rider.y - s.y) < 40) {
        this.bounceSpring(rider, s.power);
        break;
      }
    }
  }

  private checkGhostHits(rider: RiderState) {
    for (const g of this.ghosts) {
      if (!g.sprite.active) continue;
      if (Math.hypot(rider.x - g.sprite.x, rider.y - g.sprite.y) < 34) {
        this.hitGhost(rider);
        break;
      }
    }
  }

  private bounceSpring(rider: RiderState, powerRaw: number) {
    if (rider.mode !== 'ground' || !rider.trackId) return;
    const power = Math.abs(powerRaw || 900);
    const sample = this.kit.tracks[rider.trackId].path.sample(rider.s);
    rider.mode = 'air';
    rider.vx = sample.tx * rider.gsp + sample.nx * power * 0.7;
    rider.vy = sample.ty * rider.gsp + sample.ny * power * 0.7;
    rider.trackId = null;
    rider.attachedTrackHint = null;
    rider.jumpGraceUntil = this.time.now + DEFAULT_RIDER_CONFIG.jumpGraceMs;
    this.dust.emitParticleAt(rider.x, rider.y, 10);
    this.cameras.main.shake(60, 0.002);
  }

  private hitGhost(rider: RiderState) {
    if (rider.mode === 'air' && this.time.now < rider.jumpGraceUntil) return;
    rider.gsp *= -0.4;
    rider.vx = -rider.facing * 200;
    rider.vy = -280;
    rider.mode = 'air';
    rider.trackId = null;
    rider.jumpGraceUntil = this.time.now + 400;
    this.score = Math.max(0, this.score - 50);
    this.cameras.main.shake(100, 0.004);
  }

  /** Primary always uses arrows/WASD. P2 uses J/L/I/K. */
  private inputFor(who: CharacterId): RiderInput {
    const solo = this.initData.playerCount === 1;
    const primary = this.initData.primaryCharacter;
    if (solo && who !== primary) {
      return { left: false, right: false, down: false, jumpPressed: false, jumpHeld: false };
    }

    const p1 = {
      left: this.keys.left || this.keys.a,
      right: this.keys.right || this.keys.d,
      down: this.keys.down || this.keys.s,
      jumpPressed: this.jumpPressedW,
      jumpHeld: this.keys.up || this.keys.w || this.keys.space,
    };

    if (solo || who === primary || who === 'Wideass') {
      // 1P: primary gets p1. 2P: Wideass always gets p1 (shared arrows/AD).
      if (solo) return p1;
      if (who === 'Wideass') return p1;
    }

    if (who === 'Tats') {
      if (solo && primary === 'Tats') return p1;
      return {
        left: this.keys.j,
        right: this.keys.l,
        down: this.keys.k,
        jumpPressed: this.jumpPressedT,
        jumpHeld: this.keys.i || this.keys.enter,
      };
    }

    return p1;
  }

  private applyBoostPads(rider: RiderState) {
    if (rider.mode !== 'ground' || rider.trackId !== 'MAIN') return;
    const { boostS } = this.kit;
    if (rider.s >= boostS.lo && rider.s <= boostS.hi && Math.abs(rider.gsp) < 600) {
      rider.gsp = 600 * Math.sign(rider.gsp || 1);
    }
    const loop2 = this.kit.tracks.MAIN.path.project(this.kit.jeepAtX + 700, 620).s;
    if (rider.s >= loop2 - 140 && rider.s <= loop2 - 10 && Math.abs(rider.gsp) < 600) {
      rider.gsp = 600 * Math.sign(rider.gsp || 1);
    }
  }

  private syncSprite(sprite: Phaser.GameObjects.Sprite, rider: RiderState, who: CharacterId) {
    sprite.setPosition(rider.x, rider.y);
    sprite.setAngle(Phaser.Math.RadToDeg(rider.angle));
    sprite.setFlipX(rider.facing < 0);

    const rolling = Math.abs(rider.gsp) > 420 || rider.spindashCharge > 0;
    const prefix = who === 'Wideass' ? 'wideass' : 'tats';
    const anim =
      rider.mode === 'air' || rolling
        ? `${prefix}-jump`
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

    if (rider.spindashCharge > 0) {
      const base = who === 'Wideass' ? 2.25 : 2.1;
      sprite.setScale(base, base * (0.72 + Math.min(0.2, rider.spindashCharge / 5000)));
    } else {
      sprite.setScale(who === 'Wideass' ? 2.25 : 2.1);
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
    const state = Math.abs(lead.gsp) > 40 ? 'run' : lead.mode === 'air' ? 'jump' : 'idle';
    const anim = `${prefix}-${state}`;
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
    const targetScrollY = Phaser.Math.Clamp(midY - 360, 0, 60);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, 0.12);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetScrollY, 0.1);
  }

  private checkTriggers(x: number) {
    for (const t of this.initData.level.triggers) {
      if (this.firedTriggers.has(t.id)) continue;
      if (x >= t.atX) {
        this.firedTriggers.add(t.id);
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
    if (finished) this.finished = true;
    this.initData.onProgress({
      x,
      counts: this.counts,
      score: this.score,
      finished: this.finished,
      timeSec: this.elapsed,
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

  private updateGhosts() {
    for (const g of this.ghosts) {
      if (!g.sprite.active) continue;
      if (g.sprite.x > g.homeX + g.patrol) g.dir = -1;
      if (g.sprite.x < g.homeX - g.patrol) g.dir = 1;
      g.sprite.x += 1.2 * g.dir;
      g.sprite.setFlipX(g.dir < 0);
    }
  }

  update(_time: number, delta: number) {
    this.elapsed += delta / 1000;
    const dt = Math.min(delta / 1000, 0.05);
    const now = this.time.now;
    const solo = this.initData.playerCount === 1;
    const primary = this.initData.primaryCharacter;

    const inW = this.inputFor('Wideass');
    const inT = this.inputFor('Tats');

    if (!solo || primary === 'Wideass') {
      stepRider(this.riderW, this.kit.tracks, inW, dt, now);
      this.applyBoostPads(this.riderW);
      this.pickupAt(this.riderW);
      this.checkSprings(this.riderW);
      this.checkGhostHits(this.riderW);
      this.syncSprite(this.wideass, this.riderW, 'Wideass');
    }
    if (!solo || primary === 'Tats') {
      stepRider(this.riderT, this.kit.tracks, solo ? inW : inT, dt, now);
      this.applyBoostPads(this.riderT);
      this.pickupAt(this.riderT);
      this.checkSprings(this.riderT);
      this.checkGhostHits(this.riderT);
      this.syncSprite(this.tats, this.riderT, 'Tats');
    }

    this.jumpPressedW = false;
    this.jumpPressedT = false;

    const lead = solo && primary === 'Tats' ? this.riderT : this.riderW;
    const ok = checkApproachSpeed(lead, this.kit.tracks, 80);
    if (!ok) this.needSpeed = 1;
    else this.needSpeed = Math.max(0, this.needSpeed - dt * 3);
    this.needSpeedText.setAlpha(this.needSpeed);

    const moving = inW.left || inW.right || inT.left || inT.right;
    this.debugText.setText(
      `SPEED ${Math.abs(lead.gsp).toFixed(0)}  ·  ${lead.mode.toUpperCase()}${moving ? '  ·  GO!' : ''}`,
    );

    this.soloFollow();
    this.updateGhosts();
    this.updateCamera();

    const leadX = lead.x;
    this.checkTriggers(leadX);
    this.reportProgress(leadX);

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
      }
    }
  }
}
