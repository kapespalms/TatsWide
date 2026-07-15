/**
 * TrackRider.ts — GSP path physics with Sonic state machine + grip modes.
 * Perimeter velocity along authored tracks; no AABB floor stick / animation locks.
 */

import { TrackPath, isInverted } from './SonicTrack';
import {
  SONIC_PROFILES,
  collisionRadius,
  gripModeFromNormal,
  resolveSurfaceTheta,
  shouldDetachFromGrip,
  stepAirVelocity,
  stepGroundMomentum,
  type GripMode,
  type PlayerPhysState,
  type SonicProfile,
} from './SonicPhysics';
import type { CharacterId } from '../types';

export interface TrackJoin {
  sMin: number;
  sMax: number;
  toTrackId: string;
  toS: number;
  trigger: 'duck' | 'auto' | 'jump';
}

export interface TrackDef {
  id: string;
  path: TrackPath;
  joins?: TrackJoin[];
}

export type TrackRegistry = Record<string, TrackDef>;

/** @deprecated Prefer physState — kept synced for scene code. */
export type RiderMode = 'ground' | 'air';

export interface RiderInput {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export interface RiderConfig {
  accel: number;
  brake: number;
  friction: number;
  topSpeed: number;
  slopeFactor: number;
  slopeGravity: number;
  airAccel: number;
  airGravity: number;
  airDrag: number;
  jumpSpeed: number;
  detachSpeedInverted: number;
  invertThreshold: number;
  snapDistance: number;
  jumpGraceMs: number;
  detachGraceMs: number;
  hysteresisMargin: number;
  spindashChargeRate: number;
  spindashMax: number;
  spindashMinDuckSpeed: number;
  rollEnterSpeed: number;
  rollExitSpeed: number;
  rollFriction: number;
  rollControl: number;
  rollSlopeMul: number;
  skidDecel: number;
  radiusStand: number;
  radiusRoll: number;
  minGripSpeed: number;
  invincibleFrames: number;
}

export const DEFAULT_RIDER_CONFIG: RiderConfig = profileToRiderConfig(SONIC_PROFILES.Wideass);

function profileToRiderConfig(p: SonicProfile): RiderConfig {
  return {
    accel: p.accel,
    brake: p.decel,
    friction: p.friction,
    topSpeed: p.topSpeed,
    slopeFactor: p.slopeFactor,
    slopeGravity: p.slopeGravity,
    airAccel: p.airAccel,
    airGravity: p.gravity,
    airDrag: p.airDrag,
    jumpSpeed: p.jumpSpeed,
    detachSpeedInverted: p.minGripSpeed,
    invertThreshold: 0.3,
    snapDistance: 72,
    jumpGraceMs: 120,
    detachGraceMs: 220,
    hysteresisMargin: 8,
    spindashChargeRate: p.spindashChargeRate,
    spindashMax: p.spindashMax,
    spindashMinDuckSpeed: p.spindashMin,
    rollEnterSpeed: p.rollEnterSpeed,
    rollExitSpeed: p.rollExitSpeed,
    rollFriction: p.rollFriction,
    rollControl: p.rollControl,
    rollSlopeMul: p.rollSlopeMul,
    skidDecel: p.skidDecel,
    radiusStand: p.radiusStand,
    radiusRoll: p.radiusRoll,
    minGripSpeed: p.minGripSpeed,
    invincibleFrames: p.invincibleFrames,
  };
}

/** Per-character feel — Wideass heavy/strong, Tats snappy/fast. */
export function riderConfigFor(who: CharacterId): RiderConfig {
  return profileToRiderConfig(SONIC_PROFILES[who]);
}

export function riderConfigToProfile(config: RiderConfig): SonicProfile {
  return {
    accel: config.accel,
    airAccel: config.airAccel,
    decel: config.brake,
    friction: config.friction,
    topSpeed: config.topSpeed,
    jumpSpeed: config.jumpSpeed,
    gravity: config.airGravity,
    airDrag: config.airDrag,
    rollFriction: config.rollFriction,
    rollControl: config.rollControl,
    rollSlopeMul: config.rollSlopeMul,
    skidDecel: config.skidDecel,
    rollEnterSpeed: config.rollEnterSpeed,
    rollExitSpeed: config.rollExitSpeed,
    spindashChargeRate: config.spindashChargeRate,
    spindashMax: config.spindashMax,
    spindashMin: config.spindashMinDuckSpeed,
    radiusStand: config.radiusStand,
    radiusRoll: config.radiusRoll,
    slopeFactor: config.slopeFactor,
    slopeGravity: config.slopeGravity,
    minGripSpeed: config.minGripSpeed,
    invincibleFrames: config.invincibleFrames,
  };
}

export type RiderEvent =
  | { type: 'jump' }
  | { type: 'land'; trackId: string }
  | { type: 'detachInverted' }
  | { type: 'spindashRelease'; speed: number }
  | { type: 'join'; toTrackId: string }
  | { type: 'endOfPath'; trackId: string; atStart: boolean }
  | { type: 'needSpeed' }
  | { type: 'skid' }
  | { type: 'rollEnter' }
  | { type: 'rollExit' };

export interface RiderState {
  mode: RiderMode;
  physState: PlayerPhysState;
  gripMode: GripMode;
  collisionRadius: number;
  invincibleFrames: number;
  trackId: string | null;
  s: number;
  gsp: number;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  jumpGraceUntil: number;
  spindashCharge: number;
  attachedTrackHint: string | null;
  events: RiderEvent[];
}

export function createRiderState(trackId: string, s: number, path: TrackPath): RiderState {
  const sample = path.sample(s);
  const profile = SONIC_PROFILES.Wideass;
  return {
    mode: 'ground',
    physState: 'NORMAL_RUN',
    gripMode: gripModeFromNormal(sample.nx, sample.ny),
    collisionRadius: profile.radiusStand,
    invincibleFrames: 0,
    trackId,
    s,
    gsp: 0,
    x: sample.x,
    y: sample.y,
    angle: sample.angle,
    vx: 0,
    vy: 0,
    facing: 1,
    jumpGraceUntil: 0,
    spindashCharge: 0,
    attachedTrackHint: trackId,
    events: [],
  };
}

function syncModeFromPhys(state: RiderState): void {
  state.mode = state.physState === 'IN_AIR' ? 'air' : 'ground';
}

function applyProfileRadius(state: RiderState, config: RiderConfig): void {
  state.collisionRadius = collisionRadius(state.physState, riderConfigToProfile(config));
}

export function stepRider(
  state: RiderState,
  tracks: TrackRegistry,
  input: RiderInput,
  dt: number,
  nowMs: number,
  config: RiderConfig = DEFAULT_RIDER_CONFIG,
): RiderState {
  state.events = [];
  if (state.invincibleFrames > 0) {
    state.invincibleFrames = Math.max(0, state.invincibleFrames - dt * 60);
    if (state.physState === 'INVINCIBLE' && state.invincibleFrames <= 0) {
      state.physState = state.mode === 'air' ? 'IN_AIR' : 'NORMAL_RUN';
    }
  }

  if (state.physState === 'IN_AIR' || state.mode === 'air') {
    stepAir(state, tracks, input, dt, nowMs, config);
  } else {
    stepGround(state, tracks, input, dt, nowMs, config);
  }
  applyProfileRadius(state, config);
  syncModeFromPhys(state);
  return state;
}

function twoPointFeet(
  path: TrackPath,
  s: number,
  span = 10,
): { a: { x: number; y: number }; b: { x: number; y: number } } {
  const a = path.sample(Math.max(0, s - span));
  const b = path.sample(Math.min(path.length, s + span));
  return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
}

function detachToAir(
  state: RiderState,
  sample: { tx: number; ty: number; nx?: number; ny?: number },
  nowMs: number,
  config: RiderConfig,
  reason: 'detachInverted' | 'endOfPath',
  trackId?: string,
  atStart?: boolean,
): void {
  state.physState = 'IN_AIR';
  state.mode = 'air';
  state.vx = sample.tx * state.gsp;
  state.vy = sample.ty * state.gsp;
  state.trackId = null;
  state.jumpGraceUntil = nowMs + config.detachGraceMs;
  if (reason === 'detachInverted') {
    state.events.push({ type: 'detachInverted' });
  } else {
    state.events.push({ type: 'endOfPath', trackId: trackId ?? '', atStart: !!atStart });
  }
}

function stepGround(
  state: RiderState,
  tracks: TrackRegistry,
  input: RiderInput,
  dt: number,
  nowMs: number,
  config: RiderConfig,
): void {
  const track0 = state.trackId ? tracks[state.trackId] : undefined;
  if (!track0) {
    state.physState = 'IN_AIR';
    state.mode = 'air';
    return;
  }

  let joinedViaJump = false;
  const joins = track0.joins ?? [];
  for (const join of joins) {
    if (state.s < join.sMin || state.s > join.sMax) continue;
    const fire =
      join.trigger === 'auto' ||
      (join.trigger === 'duck' && input.down) ||
      (join.trigger === 'jump' && input.jumpPressed && !input.down);
    if (!fire) continue;
    const target = tracks[join.toTrackId];
    if (!target) continue;
    if (join.trigger === 'jump') joinedViaJump = true;
    state.trackId = join.toTrackId;
    state.s = join.toS;
    state.attachedTrackHint = join.toTrackId;
    state.events.push({ type: 'join', toTrackId: join.toTrackId });
    break;
  }

  const track = tracks[state.trackId as string];
  const sample = track.path.sample(state.s);
  const feet = twoPointFeet(track.path, state.s);
  const theta = resolveSurfaceTheta(sample.angle, feet.a, feet.b);
  state.gripMode = gripModeFromNormal(sample.nx, sample.ny);
  state.angle = sample.angle;

  // Spindash charge while crouched + nearly stopped
  if (input.down && Math.abs(state.gsp) < config.spindashMinDuckSpeed) {
    if (input.jumpHeld) {
      state.spindashCharge = Math.min(
        config.spindashMax,
        state.spindashCharge + config.spindashChargeRate * dt,
      );
    }
    const profile = riderConfigToProfile(config);
    state.gsp = applyIdleSlope(state.gsp, theta, profile, dt);
    const nextDuck = track.path.sample(state.s);
    state.x = nextDuck.x;
    state.y = nextDuck.y;
    state.angle = nextDuck.angle;
    state.gripMode = gripModeFromNormal(nextDuck.nx, nextDuck.ny);
    return;
  }

  if (state.spindashCharge > 0) {
    const dir = state.facing;
    state.gsp = dir * Math.min(config.spindashMax, state.spindashCharge);
    state.events.push({ type: 'spindashRelease', speed: state.gsp });
    state.spindashCharge = 0;
    state.physState = 'ROLLING_SLIDE';
  }

  const prevPhys = state.physState;
  const profile = riderConfigToProfile(config);
  const groundedPhys: PlayerPhysState =
    state.physState === 'INVINCIBLE'
      ? 'INVINCIBLE'
      : state.physState === 'IN_AIR'
        ? 'NORMAL_RUN'
        : state.physState;

  const stepped = stepGroundMomentum(
    state.gsp,
    state.facing,
    groundedPhys,
    { left: input.left, right: input.right, down: input.down },
    profile,
    dt,
    theta,
  );
  state.gsp = stepped.gsp;
  state.facing = stepped.facing;
  if (state.physState !== 'INVINCIBLE') {
    state.physState = stepped.state;
  }
  if (stepped.skidTriggered) state.events.push({ type: 'skid' });
  if (prevPhys !== 'ROLLING_SLIDE' && state.physState === 'ROLLING_SLIDE') {
    state.events.push({ type: 'rollEnter' });
  }
  if (prevPhys === 'ROLLING_SLIDE' && state.physState !== 'ROLLING_SLIDE') {
    state.events.push({ type: 'rollExit' });
  }

  // Grip falloff on Ceiling / Walls — 2.5 units/frame minimum
  if (shouldDetachFromGrip(state.gsp, state.gripMode, config.minGripSpeed)) {
    state.attachedTrackHint = track.id;
    detachToAir(state, sample, nowMs, config, 'detachInverted');
    return;
  }
  // Legacy inverted normal check (loops that sample slightly off grip bins)
  if (isInverted(sample, config.invertThreshold) && Math.abs(state.gsp) < config.detachSpeedInverted) {
    state.attachedTrackHint = track.id;
    detachToAir(state, sample, nowMs, config, 'detachInverted');
    return;
  }

  if (input.jumpPressed && !input.down && !joinedViaJump) {
    state.physState = 'IN_AIR';
    state.mode = 'air';
    state.vx = sample.tx * state.gsp + sample.nx * config.jumpSpeed;
    state.vy = sample.ty * state.gsp + sample.ny * config.jumpSpeed;
    state.trackId = null;
    state.attachedTrackHint = null;
    state.jumpGraceUntil = nowMs + config.jumpGraceMs;
    state.events.push({ type: 'jump' });
    return;
  }

  const adv = track.path.advance(state.s, state.gsp * dt);
  state.s = adv.s;

  const afterJoins = tracks[state.trackId as string]?.joins ?? [];
  for (const join of afterJoins) {
    if (join.trigger !== 'auto') continue;
    if (state.s < join.sMin - 20 || state.s > join.sMax) continue;
    const target = tracks[join.toTrackId];
    if (!target) continue;
    state.trackId = join.toTrackId;
    state.s = join.toS;
    state.attachedTrackHint = join.toTrackId;
    state.events.push({ type: 'join', toTrackId: join.toTrackId });
    break;
  }

  const ridden = tracks[state.trackId as string] ?? track;
  const prevX = state.x;
  const prevY = state.y;
  const next = ridden.path.sample(state.s);
  const jumpDist = Math.hypot(next.x - prevX, next.y - prevY);
  const expected = Math.abs(state.gsp) * dt + 28;
  // Authored path gaps (death pits) — don't teleport across the void
  if (jumpDist > Math.max(120, expected * 3.5)) {
    state.mode = 'air';
    // Push into the void so gravity can drop you (classic bottomless pit)
    const dir = Math.sign(state.gsp || state.facing || 1) || 1;
    state.x = prevX + dir * 90;
    state.y = prevY + 16;
    state.vx = dir * Math.max(160, Math.abs(state.gsp) * 0.35);
    state.vy = 200;
    state.trackId = null;
    state.attachedTrackHint = null;
    state.jumpGraceUntil = nowMs + 60;
    state.events.push({ type: 'endOfPath', trackId: ridden.id, atStart: false });
    return;
  }
  state.x = next.x;
  state.y = next.y;
  state.angle = next.angle;
  state.gripMode = gripModeFromNormal(next.nx, next.ny);

  if (adv.hitEnd || adv.hitStart) {
    if (adv.hitStart && ridden.id !== 'MAIN' && tracks.MAIN) {
      const proj = tracks.MAIN.path.project(state.x, state.y);
      const landed = tracks.MAIN.path.sample(proj.s);
      state.physState = state.physState === 'INVINCIBLE' ? 'INVINCIBLE' : 'NORMAL_RUN';
      state.mode = 'ground';
      state.trackId = 'MAIN';
      state.s = proj.s;
      state.x = landed.x;
      state.y = landed.y;
      state.angle = landed.angle;
      state.gripMode = gripModeFromNormal(landed.nx, landed.ny);
      state.gsp = Math.abs(state.gsp) * (state.facing || 1);
      state.attachedTrackHint = 'MAIN';
      state.events.push({ type: 'join', toTrackId: 'MAIN' });
      return;
    }
    const merge = (ridden.joins ?? []).find((j) => j.trigger === 'auto' && tracks[j.toTrackId]);
    if (merge && ridden.id !== 'MAIN') {
      const target = tracks[merge.toTrackId];
      state.trackId = merge.toTrackId;
      state.s = merge.toS;
      state.attachedTrackHint = merge.toTrackId;
      const landed = target.path.sample(merge.toS);
      state.x = landed.x;
      state.y = landed.y;
      state.angle = landed.angle;
      state.gripMode = gripModeFromNormal(landed.nx, landed.ny);
      state.events.push({ type: 'join', toTrackId: merge.toTrackId });
      return;
    }
    state.attachedTrackHint = 'MAIN';
    detachToAir(state, next, nowMs, config, 'endOfPath', ridden.id, adv.hitStart);
  }
}

function applyIdleSlope(gsp: number, theta: number, profile: SonicProfile, dt: number): number {
  return gsp + profile.slopeFactor * Math.sin(theta) * profile.slopeGravity * dt * 0.25;
}

function stepAir(
  state: RiderState,
  tracks: TrackRegistry,
  input: RiderInput,
  dt: number,
  nowMs: number,
  config: RiderConfig,
): void {
  state.physState = state.physState === 'INVINCIBLE' ? 'INVINCIBLE' : 'IN_AIR';
  state.mode = 'air';
  const profile = riderConfigToProfile(config);
  const air = stepAirVelocity(state.vx, state.vy, input.left, input.right, profile, dt);
  state.vx = air.vx;
  state.vy = air.vy;
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  const canLand = nowMs >= state.jumpGraceUntil && state.vy > 0;
  if (!canLand) return;

  // Never snap onto lips while falling through a bottomless pit mid-gap
  // (caller can also kill; this stops "catch" on far cliff while still descending)

  const candidates = Object.values(tracks)
    .map((t) => ({ track: t, proj: t.path.project(state.x, state.y) }))
    .filter((c) => {
      if (c.proj.dist > config.snapDistance) return false;
      const sample = c.track.path.sample(c.proj.s);
      // Approach from above — don't latch far cliffs while deep in a death pit
      return state.y <= sample.y + 20;
    });
  if (candidates.length === 0) return;

  let chosen = candidates[0];
  for (const c of candidates) {
    if (c.proj.dist < chosen.proj.dist) chosen = c;
  }
  if (state.attachedTrackHint) {
    const hinted = candidates.find((c) => c.track.id === state.attachedTrackHint);
    if (hinted && hinted.proj.dist <= chosen.proj.dist + config.hysteresisMargin) {
      chosen = hinted;
    }
  }

  const sample = chosen.track.path.sample(chosen.proj.s);
  state.physState = state.physState === 'INVINCIBLE' ? 'INVINCIBLE' : 'NORMAL_RUN';
  state.mode = 'ground';
  state.trackId = chosen.track.id;
  state.s = chosen.proj.s;
  state.x = sample.x;
  state.y = sample.y;
  state.angle = sample.angle;
  state.gripMode = gripModeFromNormal(sample.nx, sample.ny);
  state.gsp = state.vx * sample.tx + state.vy * sample.ty;
  state.attachedTrackHint = chosen.track.id;
  state.events.push({ type: 'land', trackId: chosen.track.id });
}

export function checkApproachSpeed(
  state: RiderState,
  tracks: TrackRegistry,
  lookaheadS: number,
  config: RiderConfig = DEFAULT_RIDER_CONFIG,
): boolean {
  if (state.mode !== 'ground' || !state.trackId) return true;
  const track = tracks[state.trackId];
  const checkS = state.s + Math.sign(state.gsp || 1) * lookaheadS;
  const sample = track.path.sample(checkS);
  const grip = gripModeFromNormal(sample.nx, sample.ny);
  if (shouldDetachFromGrip(state.gsp, grip, config.minGripSpeed)) return false;
  if (!isInverted(sample, config.invertThreshold)) return true;
  return Math.abs(state.gsp) >= config.detachSpeedInverted;
}

/** Force INVINCIBLE physState for N frames (spike hit). */
export function applyInvincibility(state: RiderState, frames: number): void {
  state.invincibleFrames = frames;
  state.physState = 'INVINCIBLE';
}

/** SPRING: override all velocities and force IN_AIR. */
export function applySpringLaunch(
  state: RiderState,
  vx: number,
  vy: number,
  nowMs: number,
  graceMs = 140,
): void {
  state.physState = state.physState === 'INVINCIBLE' ? 'INVINCIBLE' : 'IN_AIR';
  state.mode = 'air';
  state.vx = vx;
  state.vy = vy;
  state.gsp = 0;
  state.trackId = null;
  state.jumpGraceUntil = nowMs + graceMs;
}
