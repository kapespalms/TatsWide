/**
 * SonicTrack.ts — authored ground-path geometry (GSP path follower).
 * Loops are ArcSegments in the same path; no separate loop mode.
 */

export interface SurfaceSample {
  x: number;
  y: number;
  angle: number;
  nx: number;
  ny: number;
  tx: number;
  ty: number;
}

export interface ProjectResult {
  s: number;
  dist: number;
}

export interface TrackSegment {
  readonly type: 'line' | 'arc';
  readonly length: number;
  sample(t: number): SurfaceSample;
  project(px: number, py: number): ProjectResult;
  bounds(): { minX: number; minY: number; maxX: number; maxY: number };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export class LineSegment implements TrackSegment {
  readonly type = 'line' as const;
  readonly length: number;
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  private readonly tx: number;
  private readonly ty: number;
  private readonly nx: number;
  private readonly ny: number;
  private readonly angle: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    const dx = x1 - x0;
    const dy = y1 - y0;
    this.length = Math.hypot(dx, dy);
    if (this.length < 1e-9) {
      throw new Error(`LineSegment(${x0},${y0} -> ${x1},${y1}) has zero length`);
    }
    this.tx = dx / this.length;
    this.ty = dy / this.length;
    this.nx = this.ty;
    this.ny = -this.tx;
    this.angle = Math.atan2(this.ty, this.tx);
  }

  sample(t: number): SurfaceSample {
    const ct = clamp(t, 0, this.length);
    const frac = ct / this.length;
    return {
      x: this.x0 + (this.x1 - this.x0) * frac,
      y: this.y0 + (this.y1 - this.y0) * frac,
      angle: this.angle,
      nx: this.nx,
      ny: this.ny,
      tx: this.tx,
      ty: this.ty,
    };
  }

  project(px: number, py: number): ProjectResult {
    const t = clamp((px - this.x0) * this.tx + (py - this.y0) * this.ty, 0, this.length);
    const p = this.sample(t);
    return { s: t, dist: Math.hypot(px - p.x, py - p.y) };
  }

  bounds() {
    return {
      minX: Math.min(this.x0, this.x1),
      minY: Math.min(this.y0, this.y1),
      maxX: Math.max(this.x0, this.x1),
      maxY: Math.max(this.y0, this.y1),
    };
  }
}

export class ArcSegment implements TrackSegment {
  readonly type = 'arc' as const;
  readonly length: number;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly a0: number;
  readonly a1: number;
  private readonly dirSign: 1 | -1;
  private readonly isFullLoop: boolean;

  constructor(cx: number, cy: number, r: number, a0: number, a1: number) {
    this.cx = cx;
    this.cy = cy;
    this.r = r;
    this.a0 = a0;
    this.a1 = a1;
    if (r <= 0) throw new Error('ArcSegment radius must be positive');
    const sweep = Math.abs(a1 - a0);
    this.length = r * sweep;
    if (this.length < 1e-9) throw new Error('ArcSegment has zero sweep/length');
    this.dirSign = a1 > a0 ? 1 : -1;
    this.isFullLoop = sweep >= Math.PI * 2 - 1e-6;
  }

  sample(t: number): SurfaceSample {
    const ct = clamp(t, 0, this.length);
    const theta = this.a0 + (this.a1 - this.a0) * (ct / this.length);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const tx = this.dirSign * -sinT;
    const ty = this.dirSign * cosT;
    return {
      x: this.cx + this.r * cosT,
      y: this.cy + this.r * sinT,
      angle: Math.atan2(ty, tx),
      nx: -cosT,
      ny: -sinT,
      tx,
      ty,
    };
  }

  project(px: number, py: number): ProjectResult {
    let theta = Math.atan2(py - this.cy, px - this.cx);
    if (!this.isFullLoop) {
      const lo = Math.min(this.a0, this.a1);
      const hi = Math.max(this.a0, this.a1);
      while (theta < lo) theta += Math.PI * 2;
      while (theta > hi) theta -= Math.PI * 2;
      theta = clamp(theta, lo, hi);
    }
    const t = clamp(Math.abs(theta - this.a0) * this.r, 0, this.length);
    const p = this.sample(t);
    return { s: t, dist: Math.hypot(px - p.x, py - p.y) };
  }

  bounds() {
    return {
      minX: this.cx - this.r,
      minY: this.cy - this.r,
      maxX: this.cx + this.r,
      maxY: this.cy + this.r,
    };
  }
}

interface Bucket {
  minX: number;
  maxX: number;
  segIndices: number[];
}

export interface PathSample extends SurfaceSample {
  s: number;
  segIndex: number;
}

export interface PathProjectResult {
  s: number;
  dist: number;
  segIndex: number;
}

export class TrackPath {
  readonly segments: TrackSegment[];
  readonly offsets: number[];
  readonly length: number;
  private readonly buckets: Bucket[];
  private readonly bucketWidth: number;
  private readonly minX: number;

  constructor(segments: TrackSegment[], bucketWidth = 200) {
    if (segments.length === 0) throw new Error('TrackPath requires at least one segment');
    this.segments = segments;
    const offsets: number[] = [];
    let total = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const seg of segments) {
      offsets.push(total);
      total += seg.length;
      const b = seg.bounds();
      minX = Math.min(minX, b.minX);
      maxX = Math.max(maxX, b.maxX);
    }
    this.offsets = offsets;
    this.length = total;
    this.minX = minX;
    this.bucketWidth = bucketWidth;

    const bucketCount = Math.max(1, Math.ceil((maxX - minX) / bucketWidth) + 1);
    this.buckets = Array.from({ length: bucketCount }, (_, i) => ({
      minX: minX + i * bucketWidth,
      maxX: minX + (i + 1) * bucketWidth,
      segIndices: [] as number[],
    }));
    segments.forEach((seg, idx) => {
      const b = seg.bounds();
      const lo = Math.max(0, Math.floor((b.minX - minX) / bucketWidth) - 1);
      const hi = Math.min(bucketCount - 1, Math.ceil((b.maxX - minX) / bucketWidth) + 1);
      for (let i = lo; i <= hi; i += 1) this.buckets[i].segIndices.push(idx);
    });
  }

  private segIndexAt(s: number): number {
    for (let i = 0; i < this.segments.length; i += 1) {
      if (s < this.offsets[i] + this.segments[i].length) return i;
    }
    return this.segments.length - 1;
  }

  sample(s: number): PathSample {
    const cs = clamp(s, 0, this.length);
    const idx = this.segIndexAt(cs);
    const local = cs - this.offsets[idx];
    const r = this.segments[idx].sample(local);
    return { ...r, s: cs, segIndex: idx };
  }

  project(px: number, py: number): PathProjectResult {
    const bucketIdx = clamp(
      Math.floor((px - this.minX) / this.bucketWidth),
      0,
      this.buckets.length - 1,
    );
    const candidates = this.buckets[bucketIdx].segIndices;
    const indices = candidates.length > 0 ? candidates : this.segments.map((_, i) => i);

    let best: PathProjectResult | null = null;
    for (const idx of indices) {
      const r = this.segments[idx].project(px, py);
      if (!best || r.dist < best.dist) {
        best = { s: this.offsets[idx] + r.s, dist: r.dist, segIndex: idx };
      }
    }
    return best as PathProjectResult;
  }

  advance(s: number, ds: number): { s: number; hitStart: boolean; hitEnd: boolean } {
    const next = s + ds;
    if (next < 0) return { s: 0, hitStart: true, hitEnd: false };
    if (next > this.length) return { s: this.length, hitStart: false, hitEnd: true };
    return { s: next, hitStart: false, hitEnd: false };
  }
}

export function linePath(points: Array<{ x: number; y: number }>): LineSegment[] {
  if (points.length < 2) throw new Error('linePath requires at least 2 points');
  const segs: LineSegment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    segs.push(new LineSegment(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y));
  }
  return segs;
}

export function curvePath(
  fn: (t: number) => { x: number; y: number },
  segments: number,
): LineSegment[] {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= segments; i += 1) pts.push(fn(i / segments));
  return linePath(pts);
}

/** Full loop; direction -1 = enter L→R. Starts/ends at bottom. */
export function loopArc(cx: number, cy: number, r: number, direction: 1 | -1 = -1): ArcSegment {
  const a0 = Math.PI / 2;
  const a1 = a0 + direction * Math.PI * 2;
  return new ArcSegment(cx, cy, r, a0, a1);
}

export function isInverted(sample: SurfaceSample, threshold = 0.3): boolean {
  return sample.ny > threshold;
}
