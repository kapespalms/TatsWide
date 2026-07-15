/**
 * SonicPhysics.ts — true 16-bit angular-momentum platformer math.
 * No AABB platformer defaults: GSP + surface theta + grip + explicit states.
 */

import type { CharacterId } from '../types';

/** Classic Genesis-style player states. */
export type PlayerPhysState =
  | 'NORMAL_RUN'
  | 'ROLLING_SLIDE'
  | 'IN_AIR'
  | 'SKID'
  | 'INVINCIBLE';

/**
 * Grip Mode degrees relative to tile surface (screen, y-down).
 * Floor 0° · Right Wall 90° · Ceiling 180° · Left Wall 270°.
 */
export type GripMode = 0 | 90 | 180 | 270;

export interface SonicProfile {
  accel: number;
  airAccel: number;
  decel: number;
  friction: number;
  topSpeed: number;
  jumpSpeed: number;
  gravity: number;
  airDrag: number;
  /** Rolling horizontal friction (lower = slide farther). */
  rollFriction: number;
  /** Rolling opposing-input multiplier (reduced control). */
  rollControl: number;
  /** Multiplier on down-slope gravity while rolling (prompt: 3×). */
  rollSlopeMul: number;
  skidDecel: number;
  rollEnterSpeed: number;
  rollExitSpeed: number;
  spindashChargeRate: number;
  spindashMax: number;
  spindashMin: number;
  /** Stand / run collision sphere radius (px). */
  radiusStand: number;
  /** Rolling collision sphere radius (px). */
  radiusRoll: number;
  /** Classic SlopeFactor applied as: gsp -= SlopeFactor * sin(theta). */
  slopeFactor: number;
  /** Extra gravity accel along slope while grounded (px/s²). */
  slopeGravity: number;
  /**
   * Min |gsp| while on Ceiling/Wall before detach.
   * Prompt: 2.5 units / frame @ 60fps → 150 px/s.
   */
  minGripSpeed: number;
  invincibleFrames: number;
}

export const SONIC_TICK_HZ = 60;
/** Exact prompt threshold: 2.5 units per frame. */
export const MIN_GRIP_SPEED_PER_FRAME = 2.5;
export const MIN_GRIP_SPEED = MIN_GRIP_SPEED_PER_FRAME * SONIC_TICK_HZ;

export const SONIC_PROFILES: Record<CharacterId, SonicProfile> = {
  Wideass: {
    accel: 720,
    airAccel: 480,
    decel: 1500,
    friction: 175,
    topSpeed: 500,
    jumpSpeed: 760,
    gravity: 1950,
    airDrag: 0.998,
    rollFriction: 95,
    rollControl: 0.35,
    rollSlopeMul: 3,
    skidDecel: 2800,
    rollEnterSpeed: 220,
    rollExitSpeed: 80,
    spindashChargeRate: 1400,
    spindashMax: 740,
    spindashMin: 40,
    radiusStand: 20,
    radiusRoll: 14,
    slopeFactor: 1.35,
    slopeGravity: 380,
    minGripSpeed: MIN_GRIP_SPEED,
    invincibleFrames: 60,
  },
  Tats: {
    accel: 820,
    airAccel: 600,
    decel: 1700,
    friction: 140,
    topSpeed: 560,
    jumpSpeed: 800,
    gravity: 1880,
    airDrag: 0.998,
    rollFriction: 80,
    rollControl: 0.4,
    rollSlopeMul: 3,
    skidDecel: 3000,
    rollEnterSpeed: 200,
    rollExitSpeed: 70,
    spindashChargeRate: 1600,
    spindashMax: 840,
    spindashMin: 40,
    radiusStand: 18,
    radiusRoll: 12,
    slopeFactor: 1.4,
    slopeGravity: 400,
    minGripSpeed: MIN_GRIP_SPEED,
    invincibleFrames: 60,
  },
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Surface angle from a two-point sample at the player's feet (rad). */
export function surfaceThetaFromRaycast(
  footAx: number,
  footAy: number,
  footBx: number,
  footBy: number,
): number {
  return Math.atan2(footBy - footAy, footBx - footAx);
}

/**
 * Theta of the ground surface (0 = flat floor, increasing clockwise in y-down).
 * Prefer two-point raycast; fallback to path tangent angle.
 */
export function resolveSurfaceTheta(
  pathAngle: number,
  feetA?: { x: number; y: number },
  feetB?: { x: number; y: number },
): number {
  if (feetA && feetB) {
    return surfaceThetaFromRaycast(feetA.x, feetA.y, feetB.x, feetB.y);
  }
  return pathAngle;
}

/**
 * Vector force on ground velocity (y-down Phaser space).
 * Classic: GroundVelocity -= SlopeFactor * sin(Angle) with Angle=0 on floor.
 * In y-down path space theta = atan2(ty,tx), downhill-right has sin(theta)>0,
 * so we ADD: GroundVelocity += SlopeFactor * sin(theta) * slopeGravity * dt.
 * Downhill feeds speed; uphill bleeds it to a stop. Rolling multiplies by 3×.
 */
export function applySlopeForce(
  gsp: number,
  theta: number,
  profile: SonicProfile,
  dt: number,
  rolling: boolean,
): number {
  const mul = rolling ? profile.rollSlopeMul : 1;
  return gsp + profile.slopeFactor * Math.sin(theta) * profile.slopeGravity * mul * dt;
}

/** Grip mode from surface normal pointing "outward" from the track into free space. */
export function gripModeFromNormal(nx: number, ny: number): GripMode {
  // Track normal points "up" relative to surface; invert for gravity-relative grip.
  const ang = ((Math.atan2(-nx, -ny) * 180) / Math.PI + 360) % 360;
  if (ang >= 315 || ang < 45) return 0;
  if (ang >= 45 && ang < 135) return 90;
  if (ang >= 135 && ang < 225) return 180;
  return 270;
}

export function isWallOrCeiling(grip: GripMode): boolean {
  return grip === 90 || grip === 180 || grip === 270;
}

/** Detach when |gsp| drops below 2.5 units/frame while on ceiling/wall. */
export function shouldDetachFromGrip(gsp: number, grip: GripMode, minGripSpeed: number): boolean {
  return isWallOrCeiling(grip) && Math.abs(gsp) < minGripSpeed;
}

export function collisionRadius(state: PlayerPhysState, profile: SonicProfile): number {
  return state === 'ROLLING_SLIDE' ? profile.radiusRoll : profile.radiusStand;
}

export interface GroundStepInput {
  left: boolean;
  right: boolean;
  down: boolean;
}

export interface GroundStepResult {
  gsp: number;
  facing: 1 | -1;
  state: PlayerPhysState;
  skidTriggered: boolean;
}

/**
 * NORMAL_RUN / ROLLING_SLIDE / SKID ground horizontal integration.
 * Opposite input while moving → SKID (no instant turns).
 */
export function stepGroundMomentum(
  gsp: number,
  facing: 1 | -1,
  state: PlayerPhysState,
  input: GroundStepInput,
  profile: SonicProfile,
  dt: number,
  theta: number,
): GroundStepResult {
  let next = gsp;
  let nextFacing = facing;
  let nextState: PlayerPhysState =
    state === 'INVINCIBLE' ? 'INVINCIBLE' : state === 'IN_AIR' ? 'NORMAL_RUN' : state;
  let skidTriggered = false;

  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const speed = Math.abs(next);
  const rolling =
    nextState === 'ROLLING_SLIDE' ||
    (input.down && speed >= profile.rollEnterSpeed && nextState !== 'SKID');

  if (rolling && nextState !== 'INVINCIBLE') {
    nextState = 'ROLLING_SLIDE';
  } else if (nextState === 'ROLLING_SLIDE' && speed < profile.rollExitSpeed && !input.down) {
    nextState = 'NORMAL_RUN';
  } else if (nextState === 'SKID' && (speed < 40 || moveDir === 0 || Math.sign(next) === moveDir)) {
    nextState = rolling ? 'ROLLING_SLIDE' : 'NORMAL_RUN';
  }

  const isRoll = nextState === 'ROLLING_SLIDE';

  if (moveDir !== 0) {
    const sameDir = Math.sign(next || moveDir) === moveDir;
    if (!sameDir && speed > 60 && !isRoll) {
      // SKID: high deceleration, no instant reverse
      if (nextState !== 'SKID') skidTriggered = true;
      nextState = nextState === 'INVINCIBLE' ? 'INVINCIBLE' : 'SKID';
      next -= Math.sign(next) * profile.skidDecel * dt;
      if (Math.sign(next) !== Math.sign(gsp) && Math.abs(next) < 12) next = 0;
    } else if (isRoll) {
      // Reduced horizontal control while rolling
      next += moveDir * profile.accel * profile.rollControl * dt;
      nextFacing = moveDir as 1 | -1;
    } else {
      next += moveDir * (sameDir ? profile.accel : profile.decel) * dt;
      nextFacing = moveDir as 1 | -1;
      if (nextState !== 'INVINCIBLE' && nextState !== 'SKID') nextState = 'NORMAL_RUN';
    }
  } else {
    const fric = isRoll ? profile.rollFriction : profile.friction;
    const decel = Math.min(Math.abs(next), fric * dt);
    next -= Math.sign(next) * decel;
  }

  // Slope vector force (rolling multiplies downslope feed)
  next = applySlopeForce(next, theta, profile, dt, isRoll);

  const cap = isRoll ? profile.topSpeed * 1.45 : profile.topSpeed;
  if (moveDir !== 0 || isRoll) {
    next = clamp(next, -cap, cap);
  } else if (Math.abs(next) > cap) {
    next = Math.sign(next) * cap;
  }

  if (Math.abs(next) > 8) nextFacing = Math.sign(next) as 1 | -1;

  return { gsp: next, facing: nextFacing, state: nextState, skidTriggered };
}

export function stepAirVelocity(
  vx: number,
  vy: number,
  holdLeft: boolean,
  holdRight: boolean,
  profile: SonicProfile,
  dt: number,
): { vx: number; vy: number } {
  const moveDir = (holdRight ? 1 : 0) - (holdLeft ? 1 : 0);
  let nx = vx + moveDir * profile.airAccel * dt;
  nx *= Math.pow(profile.airDrag, dt * SONIC_TICK_HZ);
  const ny = vy + profile.gravity * dt;
  return { vx: nx, vy: ny };
}

/** Legacy helper kept for free-X tests; prefers accel + friction over sticky drag. */
export function sonicStepVx(
  vx: number,
  onGround: boolean,
  holdLeft: boolean,
  holdRight: boolean,
  profile: SonicProfile,
  dt: number,
  rolling = false,
): number {
  const input = holdLeft === holdRight ? 0 : holdRight ? 1 : -1;
  if (rolling && onGround) {
    if (input !== 0 && Math.sign(vx) !== 0 && Math.sign(vx) !== input) {
      vx += input * profile.decel * 0.55 * dt;
    }
    if (Math.abs(vx) <= profile.rollFriction * dt) vx = 0;
    else vx -= Math.sign(vx) * profile.rollFriction * dt;
    return clamp(vx, -profile.topSpeed * 1.35, profile.topSpeed * 1.35);
  }
  const accel = onGround ? profile.accel : profile.airAccel;
  if (input !== 0) {
    if (Math.sign(vx) === input || Math.abs(vx) < 12) vx += input * accel * dt;
    else vx += input * profile.decel * dt;
  } else if (onGround) {
    if (Math.abs(vx) <= profile.friction * dt) vx = 0;
    else vx -= Math.sign(vx) * profile.friction * dt;
  } else if (Math.abs(vx) > 12) {
    vx *= Math.pow(profile.airDrag, dt * SONIC_TICK_HZ);
  }
  return clamp(vx, -profile.topSpeed, profile.topSpeed);
}

// ─── Interactive tiles ───────────────────────────────────────────────────────

export interface SpikeHitResult {
  kind: 'scatter' | 'death' | 'ignored';
  ringsLost: number;
  invincibleFrames: number;
  scatterVelocities: Array<{ vx: number; vy: number }>;
}

/**
 * SPIKES TILE: if not invincible, scatter all rings (60f invuln) or death at 0 rings.
 */
export function resolveSpikeCollision(
  rings: number,
  state: PlayerPhysState,
  invincibleFramesRemaining: number,
  rng: () => number = Math.random,
): SpikeHitResult {
  if (state === 'INVINCIBLE' || invincibleFramesRemaining > 0) {
    return { kind: 'ignored', ringsLost: 0, invincibleFrames: 0, scatterVelocities: [] };
  }
  if (rings <= 0) {
    return { kind: 'death', ringsLost: 0, invincibleFrames: 0, scatterVelocities: [] };
  }
  const scatterVelocities: Array<{ vx: number; vy: number }> = [];
  for (let i = 0; i < rings; i += 1) {
    const ang = rng() * Math.PI * 2;
    const spd = 180 + rng() * 320;
    scatterVelocities.push({
      vx: Math.cos(ang) * spd * (rng() > 0.5 ? 1 : -1),
      vy: -Math.abs(Math.sin(ang) * spd) - 80,
    });
  }
  return {
    kind: 'scatter',
    ringsLost: rings,
    invincibleFrames: 60,
    scatterVelocities,
  };
}

export interface ButtonTile {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Unpressed top Y. */
  restY: number;
  /** Depressed offset in px (prompt: 4). */
  pressDepth: number;
  pressed: boolean;
  listeners: Array<() => void>;
}

export function createButtonTile(
  x: number,
  y: number,
  w = 40,
  h = 12,
  pressDepth = 4,
): ButtonTile {
  return { x, y, w, h, restY: y, pressDepth, pressed: false, listeners: [] };
}

export type ButtonHoldListener = (pressed: boolean, justPressed: boolean) => void;

/** Heavy switch: AABB lowers 4px only while player sphere intersects. */
export function updateButtonTile(
  button: ButtonTile,
  playerX: number,
  playerY: number,
  radius: number,
  onHold?: ButtonHoldListener,
): boolean {
  const bx = button.x - button.w * 0.5;
  const by = button.restY - button.h * 0.5;
  const intersects =
    playerX + radius > bx &&
    playerX - radius < bx + button.w &&
    playerY + radius > by &&
    playerY - radius < by + button.h;

  const was = button.pressed;
  button.pressed = intersects;
  button.y = button.restY + (intersects ? button.pressDepth : 0);
  const justPressed = intersects && !was;
  if (justPressed) {
    for (const fn of button.listeners) fn();
  }
  if (intersects || was) {
    onHold?.(intersects, justPressed);
  }
  return intersects;
}

export interface SpringImpulse {
  vx: number;
  vy: number;
}

/**
 * SPRING TILE: override all velocities to the spring constants; force IN_AIR.
 */
export function springOverride(
  springVx: number,
  springVy: number,
): SpringImpulse {
  return { vx: springVx, vy: springVy };
}
