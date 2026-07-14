import type { CharacterId } from '../types';

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Classic Sonic-style run/jump numbers (px/s, px/s²). */
export interface SonicProfile {
  accel: number;
  airAccel: number;
  decel: number;
  friction: number;
  topSpeed: number;
  jumpSpeed: number;
  gravity: number;
  airDrag: number;
  rollFriction: number;
  spindashChargeRate: number;
  spindashMax: number;
  spindashMin: number;
}

export const SONIC_PROFILES: Record<CharacterId, SonicProfile> = {
  Wideass: {
    accel: 3000,
    airAccel: 1700,
    decel: 5200,
    friction: 850,
    topSpeed: 680,
    jumpSpeed: -760,
    gravity: 2400,
    airDrag: 100,
    rollFriction: 280,
    spindashChargeRate: 900,
    spindashMax: 1100,
    spindashMin: 420,
  },
  Tats: {
    accel: 3600,
    airAccel: 2100,
    decel: 5600,
    friction: 650,
    topSpeed: 760,
    jumpSpeed: -720,
    gravity: 2200,
    airDrag: 80,
    rollFriction: 220,
    spindashChargeRate: 1100,
    spindashMax: 1200,
    spindashMin: 460,
  },
};

/**
 * Velocity-based Sonic step (not sticky acceleration+drag).
 */
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
    if (Math.sign(vx) === input || Math.abs(vx) < 12) {
      vx += input * accel * dt;
    } else {
      vx += input * profile.decel * dt;
    }
  } else if (onGround) {
    if (Math.abs(vx) <= profile.friction * dt) vx = 0;
    else vx -= Math.sign(vx) * profile.friction * dt;
  } else if (Math.abs(vx) > profile.airDrag * dt) {
    vx -= Math.sign(vx) * profile.airDrag * dt;
  }

  return clamp(vx, -profile.topSpeed, profile.topSpeed);
}
