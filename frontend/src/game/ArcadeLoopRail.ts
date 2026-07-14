import Phaser from 'phaser';

export type LoopCharacter = 'Wideass' | 'Tats';

export interface LoopRailOptions {
  centerX: number;
  centerY: number;
  radius: number;
  character: LoopCharacter;
  minimumEntrySpeed?: number;
  exitOffsetX?: number;
  debugVisible?: boolean;
}

interface LoopProfile {
  minimumEntrySpeed: number;
  minimumAttachedSpeed: number;
  maximumSpeed: number;
  inputAcceleration: number;
  gravityInfluence: number;
  momentumRetention: number;
}

const LOOP_PROFILES: Record<LoopCharacter, LoopProfile> = {
  Wideass: {
    minimumEntrySpeed: 410,
    minimumAttachedSpeed: 245,
    maximumSpeed: 900,
    inputAcceleration: 170,
    gravityInfluence: 0.82,
    momentumRetention: 0.995,
  },
  Tats: {
    minimumEntrySpeed: 330,
    minimumAttachedSpeed: 205,
    maximumSpeed: 760,
    inputAcceleration: 270,
    gravityInfluence: 0.68,
    momentumRetention: 0.989,
  },
};

export class ArcadeLoopRail {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private readonly options: Required<LoopRailOptions>;
  private readonly trigger: Phaser.GameObjects.Zone;
  private readonly profile: LoopProfile;

  private active = false;
  private progress = 0;
  private pathSpeed = 0;
  private entryDirection: -1 | 1 = 1;
  private cooldownUntil = 0;
  private previousAllowGravity = true;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    options: LoopRailOptions,
  ) {
    this.scene = scene;
    this.player = player;
    this.profile = LOOP_PROFILES[options.character];

    this.options = {
      centerX: options.centerX,
      centerY: options.centerY,
      radius: options.radius,
      character: options.character,
      minimumEntrySpeed:
        options.minimumEntrySpeed ?? this.profile.minimumEntrySpeed,
      exitOffsetX: options.exitOffsetX ?? 86,
      debugVisible: options.debugVisible ?? true,
    };

    this.drawTrack();

    this.trigger = scene.add.zone(
      this.options.centerX - this.options.radius * 0.72,
      this.options.centerY + this.options.radius - 34,
      this.options.radius * 1.1,
      120,
    );

    scene.physics.add.existing(this.trigger, true);
    scene.physics.add.overlap(
      player,
      this.trigger,
      () => this.tryEnter(),
      undefined,
      this,
    );
  }

  public get isActive(): boolean {
    return this.active;
  }

  public getPathVelocity(): { vx: number; vy: number } {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!this.active) {
      return {
        vx: body.velocity.x,
        vy: body.velocity.y,
      };
    }

    const theta = this.thetaAt(this.progress);
    const tangent = this.tangentAt(theta);

    return {
      vx: tangent.x * this.pathSpeed * this.entryDirection,
      vy: tangent.y * this.pathSpeed * this.entryDirection,
    };
  }

  public update(deltaMs: number, horizontalInput: -1 | 0 | 1): void {
    if (!this.active) {
      return;
    }

    const dt = Math.min(deltaMs / 1000, 0.05);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const theta = this.thetaAt(this.progress);
    const tangent = this.tangentAt(theta);

    const gravityY = body.gravity.y + this.scene.physics.world.gravity.y;
    const gravityAlongPath =
      gravityY * tangent.y * this.profile.gravityInfluence * this.entryDirection;

    const inputAlongPath =
      horizontalInput *
      this.profile.inputAcceleration *
      this.entryDirection;

    this.pathSpeed += (gravityAlongPath + inputAlongPath) * dt;
    this.pathSpeed *= Math.pow(this.profile.momentumRetention, deltaMs / 16.667);
    this.pathSpeed = Phaser.Math.Clamp(
      this.pathSpeed,
      0,
      this.profile.maximumSpeed,
    );

    const stillClimbing = this.progress > 0.12 && this.progress < 0.52;
    if (stillClimbing && this.pathSpeed < this.profile.minimumAttachedSpeed) {
      this.detachFromTrack(theta, tangent);
      return;
    }

    const circumference = Math.PI * 2 * this.options.radius;
    this.progress += (this.pathSpeed / circumference) * dt;

    if (this.progress >= 1) {
      this.completeLoop();
      return;
    }

    this.placePlayerOnPath();
  }

  public destroy(): void {
    this.trigger.destroy();
  }

  private tryEnter(): void {
    if (
      this.active ||
      this.scene.time.now < this.cooldownUntil ||
      !this.player.active
    ) {
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const velocityX = body.velocity.x;
    const speed = Math.abs(velocityX);

    if (speed < this.options.minimumEntrySpeed) {
      return;
    }

    this.active = true;
    this.progress = 0;
    this.pathSpeed = speed;
    this.entryDirection = velocityX >= 0 ? 1 : -1;
    this.previousAllowGravity = body.allowGravity;

    this.player
      .setAcceleration(0)
      .setVelocity(0)
      .setDrag(0)
      .setFlipX(this.entryDirection < 0);

    body.setAllowGravity(false);
    body.checkCollision.none = true;
    this.placePlayerOnPath();
  }

  private placePlayerOnPath(): void {
    const theta = this.thetaAt(this.progress);
    const x = this.options.centerX + Math.cos(theta) * this.options.radius;
    const y = this.options.centerY + Math.sin(theta) * this.options.radius;
    const tangent = this.tangentAt(theta);

    this.player.setPosition(x, y);

    const tangentAngle = Phaser.Math.RadToDeg(Math.atan2(tangent.y, tangent.x));
    this.player.setAngle(tangentAngle);

    this.player.setData('animationState', 'run');
    this.player.setData('onLoopRail', true);
  }

  private completeLoop(): void {
    const exitSpeed = Phaser.Math.Clamp(
      this.pathSpeed,
      this.profile.minimumAttachedSpeed,
      this.profile.maximumSpeed,
    );

    this.active = false;
    this.progress = 0;
    this.cooldownUntil = this.scene.time.now + 550;

    this.restoreArcadeBody();

    const exitX =
      this.options.centerX +
      this.options.exitOffsetX * this.entryDirection;
    const exitY = this.options.centerY + this.options.radius - 4;

    this.player
      .setPosition(exitX, exitY)
      .setAngle(0)
      .setVelocityX(exitSpeed * this.entryDirection)
      .setVelocityY(-35)
      .setFlipX(this.entryDirection < 0);

    this.player.setData('onLoopRail', false);
  }

  private detachFromTrack(
    theta: number,
    tangent: Phaser.Math.Vector2,
  ): void {
    this.active = false;
    this.cooldownUntil = this.scene.time.now + 700;

    const fallbackSpeed = Math.max(this.pathSpeed, 120);
    this.restoreArcadeBody();

    this.player
      .setAngle(0)
      .setVelocity(
        tangent.x * fallbackSpeed * this.entryDirection,
        tangent.y * fallbackSpeed * this.entryDirection,
      );

    const normal = new Phaser.Math.Vector2(
      Math.cos(theta),
      Math.sin(theta),
    );

    this.player.x += normal.x * 12;
    this.player.y += normal.y * 12;
    this.player.setData('onLoopRail', false);
  }

  private restoreArcadeBody(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(this.previousAllowGravity);
    body.checkCollision.none = false;
  }

  private thetaAt(progress: number): number {
    return (
      Math.PI * 2 * 0.25 -
      Math.PI * 2 * progress * this.entryDirection
    );
  }

  private tangentAt(theta: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      Math.sin(theta),
      -Math.cos(theta),
    ).normalize();
  }

  private drawTrack(): void {
    if (!this.options.debugVisible) {
      return;
    }

    const graphics = this.scene.add.graphics();
    graphics.setDepth(2);

    graphics.lineStyle(34, 0x15171c, 1);
    graphics.strokeCircle(
      this.options.centerX,
      this.options.centerY,
      this.options.radius,
    );

    graphics.lineStyle(
      6,
      this.options.character === 'Tats' ? 0x00ffff : 0xc9512f,
      0.9,
    );
    graphics.strokeCircle(
      this.options.centerX,
      this.options.centerY,
      this.options.radius,
    );

    graphics.lineStyle(24, 0x15171c, 1);
    graphics.beginPath();
    graphics.moveTo(
      this.options.centerX - this.options.radius * 1.45,
      this.options.centerY + this.options.radius,
    );
    graphics.lineTo(
      this.options.centerX,
      this.options.centerY + this.options.radius,
    );
    graphics.lineTo(
      this.options.centerX + this.options.radius * 1.45,
      this.options.centerY + this.options.radius,
    );
    graphics.strokePath();
  }
}
