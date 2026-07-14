/**
 * TrackRider.ts — GSP path physics. Replaces flat AABB + ArcadeLoopRail.
 * slopeGravity ≠ airGravity; detachGraceMs prevents ground/air flicker.
 */

import { TrackPath, isInverted } from './SonicTrack';

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
}

export const DEFAULT_RIDER_CONFIG: RiderConfig = {
  accel: 1100,
  brake: 2100,
  friction: 140,
  topSpeed: 780,
  slopeFactor: 1.0,
  slopeGravity: 200,
  airAccel: 800,
  airGravity: 2200,
  airDrag: 0.999,
  jumpSpeed: 660,
  detachSpeedInverted: 240,
  invertThreshold: 0.3,
  snapDistance: 56,
  jumpGraceMs: 120,
  detachGraceMs: 220,
  hysteresisMargin: 8,
  spindashChargeRate: 1600,
  spindashMax: 980,
  spindashMinDuckSpeed: 40,
};

/** Per-character feel — Wideass heavy/strong, Tats snappy/fast. */
export function riderConfigFor(who: 'Wideass' | 'Tats'): RiderConfig {
  if (who === 'Tats') {
    return {
      ...DEFAULT_RIDER_CONFIG,
      accel: 1280,
      brake: 2300,
      friction: 120,
      topSpeed: 860,
      airAccel: 960,
      airGravity: 2050,
      jumpSpeed: 640,
      spindashChargeRate: 1900,
      spindashMax: 1100,
    };
  }
  return {
    ...DEFAULT_RIDER_CONFIG,
    accel: 1050,
    brake: 2000,
    friction: 155,
    topSpeed: 760,
    airAccel: 760,
    airGravity: 2280,
    jumpSpeed: 700,
    spindashChargeRate: 1500,
    spindashMax: 1020,
  };
}

export type RiderEvent =
  | { type: 'jump' }
  | { type: 'land'; trackId: string }
  | { type: 'detachInverted' }
  | { type: 'spindashRelease'; speed: number }
  | { type: 'join'; toTrackId: string }
  | { type: 'endOfPath'; trackId: string; atStart: boolean }
  | { type: 'needSpeed' };

export interface RiderState {
  mode: RiderMode;
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
  return {
    mode: 'ground',
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

export function stepRider(
  state: RiderState,
  tracks: TrackRegistry,
  input: RiderInput,
  dt: number,
  nowMs: number,
  config: RiderConfig = DEFAULT_RIDER_CONFIG,
): RiderState {
  state.events = [];
  if (state.mode === 'ground') stepGround(state, tracks, input, dt, nowMs, config);
  else stepAir(state, tracks, input, dt, nowMs, config);
  return state;
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
    state.mode = 'air';
    return;
  }

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
    state.trackId = join.toTrackId;
    state.s = join.toS;
    state.attachedTrackHint = join.toTrackId;
    state.events.push({ type: 'join', toTrackId: join.toTrackId });
    break;
  }

  const track = tracks[state.trackId as string];
  const sample = track.path.sample(state.s);

  // --- 2. Spindash charge (blocks jump while crouched) ---
  if (input.down && Math.abs(state.gsp) < config.spindashMinDuckSpeed) {
    if (input.jumpHeld) {
      state.spindashCharge = Math.min(
        config.spindashMax,
        state.spindashCharge + config.spindashChargeRate * dt,
      );
    }
    // Still apply gentle slope while charged duck
    state.gsp += config.slopeGravity * sample.ty * config.slopeFactor * dt * 0.25;
    const nextDuck = track.path.sample(state.s);
    state.x = nextDuck.x;
    state.y = nextDuck.y;
    state.angle = nextDuck.angle;
    return;
  }

  if (state.spindashCharge > 0) {
    const dir = state.facing;
    state.gsp = dir * Math.min(config.spindashMax, state.spindashCharge);
    state.events.push({ type: 'spindashRelease', speed: state.gsp });
    state.spindashCharge = 0;
  }

  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0) {
    const sameDir = Math.sign(state.gsp || moveDir) === moveDir;
    const rate = sameDir ? config.accel : config.brake;
    state.gsp += moveDir * rate * dt;
    state.facing = moveDir as 1 | -1;
  } else {
    const decel = Math.min(Math.abs(state.gsp), config.friction * dt);
    state.gsp -= Math.sign(state.gsp) * decel;
  }

  if (Math.abs(state.gsp) > config.topSpeed && moveDir !== 0) {
    state.gsp = Math.sign(state.gsp) * config.topSpeed;
  }

  state.gsp += config.slopeGravity * sample.ty * config.slopeFactor * dt;

  if (isInverted(sample, config.invertThreshold) && Math.abs(state.gsp) < config.detachSpeedInverted) {
    state.mode = 'air';
    state.vx = sample.tx * state.gsp;
    state.vy = sample.ty * state.gsp;
    state.trackId = null;
    state.attachedTrackHint = track.id;
    state.jumpGraceUntil = nowMs + config.detachGraceMs;
    state.events.push({ type: 'detachInverted' });
    return;
  }

  // Jump only when not holding down (spindash owns down+jump)
  if (input.jumpPressed && !input.down) {
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
  const next = track.path.sample(state.s);
  state.x = next.x;
  state.y = next.y;
  state.angle = next.angle;

  if (adv.hitEnd || adv.hitStart) {
    state.mode = 'air';
    state.vx = next.tx * state.gsp;
    state.vy = next.ty * state.gsp;
    state.trackId = null;
    state.attachedTrackHint = null;
    state.jumpGraceUntil = nowMs + config.detachGraceMs;
    state.events.push({ type: 'endOfPath', trackId: track.id, atStart: adv.hitStart });
  }
}

function stepAir(
  state: RiderState,
  tracks: TrackRegistry,
  input: RiderInput,
  dt: number,
  nowMs: number,
  config: RiderConfig,
): void {
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  state.vx += moveDir * config.airAccel * dt;
  state.vx *= Math.pow(config.airDrag, dt * 60);
  state.vy += config.airGravity * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  const canLand = nowMs >= state.jumpGraceUntil && state.vy > 0;
  if (!canLand) return;

  const candidates = Object.values(tracks)
    .map((t) => ({ track: t, proj: t.path.project(state.x, state.y) }))
    .filter((c) => c.proj.dist <= config.snapDistance);
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
  state.mode = 'ground';
  state.trackId = chosen.track.id;
  state.s = chosen.proj.s;
  state.x = sample.x;
  state.y = sample.y;
  state.angle = sample.angle;
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
  if (!isInverted(sample, config.invertThreshold)) return true;
  return Math.abs(state.gsp) >= config.detachSpeedInverted;
}
