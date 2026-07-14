import Phaser from 'phaser';

/** Modern 16-bit palette — saturated arcade hilltop vibe */
export const PAL = {
  skyTop: '#3d8bff',
  skyBot: '#9ad0ff',
  cloud: '#ffffff',
  cloudShade: '#d4e8ff',
  farRock: '#e07848',
  farRockDeep: '#b04a28',
  farGreen: '#3caa55',
  pine: '#1f7a32',
  pineDark: '#0f4a1c',
  pineTrunk: '#6b3a1a',
  grass: '#48c03a',
  grassLight: '#7af05a',
  grassDark: '#2a8a28',
  dirt: '#c47838',
  dirtDark: '#8a4a18',
  dirtDeep: '#5c3010',
  stone: '#4a78d8',
  stoneLight: '#78a8f8',
  stoneDark: '#284898',
  checkerA: '#101018',
  checkerB: '#f0f0f8',
  flowerP: '#ff66aa',
  flowerY: '#ffe14a',
  wideass: '#ff3a4a',
  wideassDark: '#b01828',
  wideassAccent: '#ff8866',
  tats: '#00d8ff',
  tatsDark: '#007a99',
  tatsAccent: '#a8f0ff',
  ghost: '#d8c8ff',
  ghostEye: '#402060',
  pepper: '#7a1f3d',
  duck: '#ffd84a',
  hat: '#5a1a8a',
  gold: '#ffd020',
  white: '#ffffff',
  black: '#101018',
} as const;

type Ctx = CanvasRenderingContext2D;

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctxOf(c: HTMLCanvasElement): Ctx {
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function px(ctx: Ctx, x: number, y: number, color: string, s = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, s, s);
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function register(scene: Phaser.Scene, key: string, c: HTMLCanvasElement) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function drawSky(w: number, h: number, top = PAL.skyTop, bot = PAL.skyBot) {
  const c = canvas(w, h);
  const ctx = ctxOf(c);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mixHex(top, bot, 0.45));
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + (y / h) * 0.04})`;
    ctx.fillRect(0, y, w, 2);
  }
  return c;
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255;
  const ag = (pa >> 8) & 255;
  const ab = pa & 255;
  const br = (pb >> 16) & 255;
  const bg = (pb >> 8) & 255;
  const bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function themeSky(theme: string, sky: string): [string, string] {
  const bot = sky;
  switch (theme) {
    case 'haunted':
      return ['#120818', bot];
    case 'alien':
      return ['#050214', bot];
    case 'snow':
      return ['#6a9ad8', bot];
    case 'industrial':
      return ['#2a3440', bot];
    case 'jungle':
      return ['#1a5038', bot];
    case 'crystal':
      return ['#4080d0', bot];
    default:
      return [PAL.skyTop, bot || PAL.skyBot];
  }
}

function drawCloudStrip() {
  const c = canvas(256, 64);
  const ctx = ctxOf(c);
  const blobs = [
    [20, 36, 18],
    [40, 28, 22],
    [66, 34, 16],
    [120, 30, 20],
    [145, 24, 26],
    [175, 32, 18],
    [210, 36, 14],
  ];
  for (const [x, y, r] of blobs) {
    rect(ctx, x - r, y - r / 2, r * 2, r, PAL.cloudShade);
    rect(ctx, x - r + 2, y - r / 2 + 2, r * 2 - 4, r - 4, PAL.cloud);
  }
  return c;
}

function drawFarMountains() {
  const c = canvas(384, 140);
  const ctx = ctxOf(c);
  // distant haze ridge
  rect(ctx, 0, 110, 384, 30, '#6aaa78');
  const farPeaks = [
    [0, 70],
    [48, 90],
    [96, 60],
    [150, 95],
    [210, 55],
    [260, 85],
    [310, 65],
    [350, 80],
  ];
  for (const [x, h] of farPeaks) {
    rect(ctx, x, 140 - h, 44, h, '#c86838');
    rect(ctx, x + 6, 140 - h, 18, h, '#e88850');
    rect(ctx, x + 10, 140 - h + 4, 8, 10, '#fff8e0');
  }
  // mid green foothills
  for (let x = 0; x < 384; x += 36) {
    const h = 28 + ((x * 3) % 18);
    rect(ctx, x, 140 - h, 40, h, PAL.farGreen);
    rect(ctx, x + 4, 140 - h, 12, h, '#58c068');
  }
  // near dirt band
  rect(ctx, 0, 128, 384, 12, '#8a6038');
  return c;
}

function drawPine() {
  const c = canvas(48, 80);
  const ctx = ctxOf(c);
  rect(ctx, 20, 54, 8, 26, PAL.pineTrunk);
  rect(ctx, 18, 54, 2, 26, '#4a2810');
  const layers = [
    [24, 8, 20],
    [24, 22, 24],
    [24, 38, 28],
  ];
  for (const [cx, top, w] of layers) {
    for (let i = 0; i < 14; i += 1) {
      const t = i / 14;
      const hw = Math.floor(w * t);
      rect(ctx, cx - hw, top + i * 2, hw * 2, 2, i % 2 === 0 ? PAL.pine : PAL.pineDark);
    }
  }
  return c;
}

function drawGrassTile() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 32, 10, PAL.grassLight);
  rect(ctx, 0, 4, 32, 8, PAL.grass);
  rect(ctx, 0, 10, 32, 4, PAL.grassDark);
  rect(ctx, 0, 14, 32, 18, PAL.dirt);
  rect(ctx, 0, 22, 32, 10, PAL.dirtDark);
  // dither / pebbles
  for (let i = 0; i < 10; i += 1) {
    px(ctx, (i * 7) % 32, 16 + ((i * 3) % 10), PAL.dirtDeep);
  }
  // grass blades
  for (let x = 2; x < 32; x += 5) {
    rect(ctx, x, 0, 2, 5, PAL.grassLight);
  }
  return c;
}

function drawDirtTile() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 32, 32, PAL.dirt);
  rect(ctx, 0, 0, 32, 4, PAL.dirtDark);
  for (let i = 0; i < 18; i += 1) {
    px(ctx, (i * 11) % 32, (i * 5) % 32, i % 2 ? PAL.dirtDark : PAL.dirtDeep);
  }
  return c;
}

function drawStoneTile() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 32, 32, PAL.stone);
  rect(ctx, 0, 0, 32, 4, PAL.stoneLight);
  rect(ctx, 0, 28, 32, 4, PAL.stoneDark);
  rect(ctx, 0, 0, 4, 32, PAL.stoneLight);
  rect(ctx, 28, 0, 4, 32, PAL.stoneDark);
  // panel cut
  rect(ctx, 6, 8, 20, 2, PAL.stoneDark);
  rect(ctx, 6, 18, 20, 2, PAL.stoneDark);
  return c;
}

function drawCheckerStrip() {
  const c = canvas(16, 32);
  const ctx = ctxOf(c);
  for (let y = 0; y < 32; y += 8) {
    const even = (y / 8) % 2 === 0;
    rect(ctx, 0, y, 8, 8, even ? PAL.checkerA : PAL.checkerB);
    rect(ctx, 8, y, 8, 8, even ? PAL.checkerB : PAL.checkerA);
  }
  return c;
}

/** Top-down Sonic running lane — classic black/white checks + cyan rail edge */
function drawLaneTop() {
  const c = canvas(32, 24);
  const ctx = ctxOf(c);
  for (let x = 0; x < 32; x += 8) {
    for (let y = 0; y < 16; y += 8) {
      const even = ((x / 8) + (y / 8)) % 2 === 0;
      rect(ctx, x, y, 8, 8, even ? PAL.checkerA : PAL.checkerB);
    }
  }
  // Bright path edge (blue like Hill Top / Emerald Hill rails)
  rect(ctx, 0, 16, 32, 4, PAL.stoneLight);
  rect(ctx, 0, 20, 32, 4, PAL.stone);
  return c;
}

function drawLaneGold() {
  const c = canvas(32, 24);
  const ctx = ctxOf(c);
  for (let x = 0; x < 32; x += 8) {
    for (let y = 0; y < 16; y += 8) {
      const even = ((x / 8) + (y / 8)) % 2 === 0;
      rect(ctx, x, y, 8, 8, even ? '#2a2010' : '#f0d040');
    }
  }
  rect(ctx, 0, 16, 32, 4, '#ffe14a');
  rect(ctx, 0, 20, 32, 4, '#c49820');
  return c;
}

function drawLaneDash() {
  const c = canvas(32, 8);
  const ctx = ctxOf(c);
  rect(ctx, 0, 2, 18, 4, PAL.gold);
  rect(ctx, 0, 2, 18, 1, '#fff6a0');
  return c;
}

function drawRampFace() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  // Diagonal grass/dirt wedge feel
  for (let y = 0; y < 32; y += 1) {
    const fill = Math.floor((y / 32) * 32);
    rect(ctx, 0, y, fill, 1, y < 10 ? PAL.grass : PAL.dirt);
    if (y < 10) px(ctx, fill - 1, y, PAL.grassLight);
  }
  return c;
}

function drawFlower(pink: boolean) {
  const c = canvas(16, 16);
  const ctx = ctxOf(c);
  const petal = pink ? PAL.flowerP : PAL.flowerY;
  rect(ctx, 6, 2, 4, 4, petal);
  rect(ctx, 2, 6, 4, 4, petal);
  rect(ctx, 10, 6, 4, 4, petal);
  rect(ctx, 6, 10, 4, 4, petal);
  rect(ctx, 6, 6, 4, 4, PAL.gold);
  rect(ctx, 7, 12, 2, 4, PAL.grassDark);
  return c;
}

function drawSeesaw() {
  const c = canvas(96, 40);
  const ctx = ctxOf(c);
  // fulcrum
  rect(ctx, 36, 22, 24, 18, '#2ecc71');
  rect(ctx, 40, 22, 16, 12, '#58e890');
  // plank
  rect(ctx, 4, 14, 88, 10, '#3d7cff');
  rect(ctx, 4, 14, 88, 3, '#78a8ff');
  rect(ctx, 4, 21, 88, 3, '#2048b0');
  return c;
}

function drawSpring() {
  const c = canvas(32, 28);
  const ctx = ctxOf(c);
  rect(ctx, 4, 18, 24, 10, '#ff3366');
  rect(ctx, 2, 8, 28, 8, '#ffee55');
  rect(ctx, 6, 4, 20, 6, '#ffffff');
  rect(ctx, 8, 0, 16, 4, '#ff6688');
  return c;
}

function drawGhostFrame(frame: number) {
  const c = canvas(32, 36);
  const ctx = ctxOf(c);
  const bob = frame === 1 ? 1 : 0;
  rect(ctx, 6, 4 + bob, 20, 18, PAL.ghost);
  rect(ctx, 4, 14 + bob, 24, 14, PAL.ghost);
  // wavy bottom
  for (let i = 0; i < 4; i += 1) {
    const ox = 4 + i * 6;
    const oy = frame === 0 ? 28 : 30;
    rect(ctx, ox, oy + bob, 5, 4, PAL.ghost);
  }
  rect(ctx, 10, 12 + bob, 4, 5, PAL.ghostEye);
  rect(ctx, 18, 12 + bob, 4, 5, PAL.ghostEye);
  rect(ctx, 11, 13 + bob, 2, 2, PAL.white);
  rect(ctx, 19, 13 + bob, 2, 2, PAL.white);
  return c;
}

function drawPepper() {
  const c = canvas(20, 28);
  const ctx = ctxOf(c);
  rect(ctx, 4, 2, 12, 22, PAL.pepper);
  rect(ctx, 5, 4, 10, 4, '#a03050');
  rect(ctx, 5, 10, 10, 8, PAL.white);
  px(ctx, 7, 12, PAL.pepper);
  px(ctx, 9, 13, PAL.pepper);
  px(ctx, 11, 12, PAL.pepper);
  rect(ctx, 3, 22, 14, 4, '#333333');
  rect(ctx, 6, 0, 8, 3, '#dddddd');
  return c;
}

function drawDuck() {
  const c = canvas(28, 24);
  const ctx = ctxOf(c);
  rect(ctx, 4, 8, 14, 12, PAL.duck);
  rect(ctx, 14, 4, 10, 10, PAL.duck);
  rect(ctx, 22, 8, 6, 4, '#ff8800');
  rect(ctx, 18, 6, 3, 3, PAL.black);
  rect(ctx, 6, 18, 4, 4, '#e0a020');
  rect(ctx, 14, 18, 4, 4, '#e0a020');
  return c;
}

function drawHat() {
  const c = canvas(28, 24);
  const ctx = ctxOf(c);
  // brim
  rect(ctx, 2, 16, 24, 6, '#3a0a5a');
  // cone
  for (let i = 0; i < 12; i += 1) {
    const w = 2 + i * 2;
    rect(ctx, 14 - w / 2, 4 + i, w, 1, PAL.hat);
  }
  rect(ctx, 12, 10, 4, 4, PAL.gold);
  return c;
}

function inkOutline(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x - 1, y, w + 2, h, PAL.black);
  rect(ctx, x, y - 1, w, h + 2, PAL.black);
}

/**
 * Frame indices:
 * 0 idle · 1–4 run cycle · 5 crouch/charge · 6–7 roll ball spin
 */
function drawCharacterFrame(who: 'Wideass' | 'Tats', f: number) {
  const c = canvas(64, 64);
  const ctx = ctxOf(c);
  const primary = who === 'Wideass' ? PAL.wideass : PAL.tats;
  const dark = who === 'Wideass' ? PAL.wideassDark : PAL.tatsDark;
  const accent = who === 'Wideass' ? PAL.wideassAccent : PAL.tatsAccent;
  const wide = who === 'Wideass';
  const run = f >= 1 && f <= 4;
  const crouch = f === 5;
  const ball = f >= 6;
  const runPhase = f - 1;
  const legCycle = [-5, -2, 5, 2];
  const leg = run ? legCycle[runPhase] ?? 0 : 0;

  // soft contact shadow
  rect(ctx, 18, 58, 28, 4, 'rgba(0,0,0,0.32)');

  if (ball) {
    const spin = f === 7 ? 1 : 0;
    inkOutline(ctx, 16, 16, 32, 32);
    rect(ctx, 16, 16, 32, 32, primary);
    rect(ctx, 18, 18 + spin, 28, 8, accent);
    rect(ctx, 20, 28, 24, 14, dark);
    const spikes: [number, number, number, number][] = spin
      ? [
          [12, 14, 8, 6],
          [44, 18, 8, 6],
          [12, 40, 8, 6],
          [44, 38, 8, 6],
          [26, 8, 8, 6],
          [26, 50, 8, 6],
        ]
      : [
          [10, 22, 8, 6],
          [46, 24, 8, 6],
          [14, 42, 8, 6],
          [42, 42, 8, 6],
          [28, 10, 8, 6],
          [28, 48, 8, 6],
        ];
    for (const [sx, sy, sw, sh] of spikes) {
      inkOutline(ctx, sx, sy, sw, sh);
      rect(ctx, sx, sy, sw, sh, dark);
    }
    rect(ctx, 26, 24 + spin, 6, 6, PAL.white);
    rect(ctx, 36, 26 + spin, 4, 3, PAL.black);
    rect(ctx, 22, 34, 20, 3, accent);
    return c;
  }

  if (crouch) {
    const by = 36;
    const bw = wide ? 30 : 22;
    const bh = 14;
    const bx = 32 - bw / 2;
    inkOutline(ctx, bx + 2, by + bh, 8, 8);
    inkOutline(ctx, bx + bw - 10, by + bh, 8, 8);
    rect(ctx, bx + 2, by + bh, 8, 8, dark);
    rect(ctx, bx + bw - 10, by + bh, 8, 8, dark);
    inkOutline(ctx, bx, by, bw, bh);
    rect(ctx, bx, by, bw, bh, primary);
    rect(ctx, bx, by, bw, 4, accent);
    rect(ctx, bx + 3, by + 5, bw - 6, 5, '#ffe8d0');
    const hx = 20;
    const hy = by - 14;
    inkOutline(ctx, hx, hy, 24, 16);
    rect(ctx, hx, hy, 24, 16, primary);
    rect(ctx, hx + 2, hy + 2, 20, 5, accent);
    rect(ctx, hx + 5, hy + 7, 6, 5, PAL.white);
    rect(ctx, hx + 14, hy + 7, 6, 5, PAL.white);
    rect(ctx, hx + 7, hy + 9, 3, 3, PAL.black);
    rect(ctx, hx + 16, hy + 9, 3, 3, PAL.black);
    if (wide) {
      rect(ctx, hx - 4, hy, 6, 8, dark);
      rect(ctx, hx + 20, hy - 2, 6, 6, dark);
    } else {
      rect(ctx, hx + 20, hy - 2, 10, 5, accent);
    }
    return c;
  }

  const by = run ? 26 + (runPhase % 2 === 0 ? -1 : 1) : 28;
  const bw = wide ? 28 : 20;
  const bh = wide ? 20 : 18;
  const bx = 32 - bw / 2;

  // legs + shoes
  inkOutline(ctx, bx + 3, by + bh - 2, 7, 12 + leg);
  inkOutline(ctx, bx + bw - 10, by + bh - 2, 7, 12 - leg);
  rect(ctx, bx + 3, by + bh - 2, 7, 12 + leg, dark);
  rect(ctx, bx + bw - 10, by + bh - 2, 7, 12 - leg, dark);
  rect(ctx, bx + 2, by + bh + 9 + leg, 9, 4, PAL.black);
  rect(ctx, bx + bw - 11, by + bh + 9 - leg, 9, 4, PAL.black);
  rect(ctx, bx + 3, by + bh + 9 + leg, 7, 2, accent);

  // torso
  inkOutline(ctx, bx, by, bw, bh);
  rect(ctx, bx, by, bw, bh, primary);
  rect(ctx, bx, by, bw, 5, accent);
  rect(ctx, bx + 3, by + 6, bw - 6, 8, '#ffe8d0');
  rect(ctx, bx + 4, by + 8, bw - 8, 2, '#ffd0b0');
  rect(ctx, bx, by + bh - 5, bw, 5, dark);
  // belt buckle
  rect(ctx, bx + bw / 2 - 3, by + bh - 6, 6, 4, PAL.gold);

  // arms
  const armY = by + 5 + (run ? Math.sign(leg) * 2 : 0);
  inkOutline(ctx, bx - 7, armY, 7, 12);
  inkOutline(ctx, bx + bw, armY, 7, 12);
  rect(ctx, bx - 7, armY, 7, 12, primary);
  rect(ctx, bx + bw, armY, 7, 12, primary);
  rect(ctx, bx - 7, armY + 9, 7, 3, accent);
  rect(ctx, bx + bw, armY + 9, 7, 3, accent);

  // head
  const hx = 20;
  const hy = by - 18;
  inkOutline(ctx, hx, hy, 24, 20);
  rect(ctx, hx, hy, 24, 20, primary);
  rect(ctx, hx + 2, hy + 2, 20, 6, accent);
  if (wide) {
    // Wideass quills
    const qs: [number, number, number, number][] = [
      [hx - 6, hy + 2, 7, 10],
      [hx - 4, hy - 6, 8, 8],
      [hx + 18, hy - 5, 8, 7],
      [hx + 22, hy + 4, 6, 8],
    ];
    for (const [qx, qy, qw, qh] of qs) {
      inkOutline(ctx, qx, qy, qw, qh);
      rect(ctx, qx, qy, qw, qh, dark);
      rect(ctx, qx + 1, qy + 1, 2, qh - 2, accent);
    }
  } else {
    // Tats sleek crest
    inkOutline(ctx, hx + 18, hy - 4, 12, 6);
    rect(ctx, hx + 18, hy - 4, 12, 6, accent);
    inkOutline(ctx, hx + 22, hy + 2, 8, 12);
    rect(ctx, hx + 22, hy + 2, 8, 12, dark);
    rect(ctx, hx + 24, hy + 4, 3, 8, accent);
  }
  // eyes
  rect(ctx, hx + 5, hy + 8, 6, 6, PAL.white);
  rect(ctx, hx + 14, hy + 8, 6, 6, PAL.white);
  rect(ctx, hx + 7, hy + 10, 3, 3, PAL.black);
  rect(ctx, hx + 16, hy + 10, 3, 3, PAL.black);
  rect(ctx, hx + 5, hy + 8, 6, 2, 'rgba(255,255,255,0.55)');
  // smile
  rect(ctx, hx + 9, hy + 15, 8, 2, dark);
  rect(ctx, hx + 10, hy + 16, 6, 1, accent);

  return c;
}

function drawCharacterSheet(who: 'Wideass' | 'Tats') {
  const frameW = 64;
  const frameH = 64;
  const frames = 8;
  const c = canvas(frameW * frames, frameH);
  const ctx = ctxOf(c);
  for (let f = 0; f < frames; f += 1) {
    ctx.drawImage(drawCharacterFrame(who, f), f * frameW, 0);
  }
  return c;
}

function drawRingHudIcon() {
  const c = canvas(16, 16);
  const ctx = ctxOf(c);
  rect(ctx, 2, 2, 12, 12, PAL.gold);
  rect(ctx, 4, 4, 8, 8, PAL.skyTop);
  rect(ctx, 6, 6, 4, 4, PAL.gold);
  return c;
}

function drawGrindRail() {
  const c = canvas(32, 12);
  const ctx = ctxOf(c);
  rect(ctx, 0, 4, 32, 6, PAL.gold);
  rect(ctx, 0, 4, 32, 2, PAL.white);
  rect(ctx, 0, 8, 32, 2, '#b08000');
  for (let x = 0; x < 32; x += 8) px(ctx, x, 3, PAL.white);
  return c;
}

function drawLoopSegment() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  rect(ctx, 0, 12, 32, 10, '#1a2a44');
  rect(ctx, 0, 14, 32, 6, '#55ccff');
  rect(ctx, 0, 15, 32, 2, '#a8f0ff');
  return c;
}

/**
 * Register the modern 16-bit atlas and character animations.
 */
export function createModern16BitAtlas(
  scene: Phaser.Scene,
  theme = 'hills',
  skyColor = PAL.skyBot,
) {
  const [skyTop, skyBot] = themeSky(theme, skyColor);
  register(scene, 'px_sky', drawSky(8, 256, skyTop, skyBot));
  register(scene, 'px_clouds', drawCloudStrip());
  register(scene, 'px_mountains', drawFarMountains());
  register(scene, 'px_pine', drawPine());
  register(scene, 'px_grass', drawGrassTile());
  register(scene, 'px_dirt', drawDirtTile());
  register(scene, 'px_stone', drawStoneTile());
  register(scene, 'px_checker', drawCheckerStrip());
  register(scene, 'px_lane', drawLaneTop());
  register(scene, 'px_lane_gold', drawLaneGold());
  register(scene, 'px_lane_dash', drawLaneDash());
  register(scene, 'px_ramp', drawRampFace());
  register(scene, 'px_flower_p', drawFlower(true));
  register(scene, 'px_flower_y', drawFlower(false));
  register(scene, 'px_seesaw', drawSeesaw());
  register(scene, 'px_spring', drawSpring());
  register(scene, 'px_ghost_0', drawGhostFrame(0));
  register(scene, 'px_ghost_1', drawGhostFrame(1));
  register(scene, 'px_pepper', drawPepper());
  register(scene, 'px_duck', drawDuck());
  register(scene, 'px_hat', drawHat());
  register(scene, 'px_wideass', drawCharacterSheet('Wideass'));
  register(scene, 'px_tats', drawCharacterSheet('Tats'));
  for (let i = 0; i < 8; i += 1) {
    register(scene, `px_wideass_${i}`, drawCharacterFrame('Wideass', i));
    register(scene, `px_tats_${i}`, drawCharacterFrame('Tats', i));
  }
  register(scene, 'px_ring_icon', drawRingHudIcon());
  register(scene, 'px_rail', drawGrindRail());
  register(scene, 'px_loop', drawLoopSegment());

  ensureAnimsFromKeys(scene, 'wideass', 'px_wideass');
  ensureAnimsFromKeys(scene, 'tats', 'px_tats');
  ensureGhostAnim(scene);
}

function ensureAnimsFromKeys(scene: Phaser.Scene, prefix: string, base: string) {
  // Rebuild if we expanded frames
  for (const key of [`${prefix}-idle`, `${prefix}-run`, `${prefix}-jump`, `${prefix}-crouch`, `${prefix}-roll`]) {
    if (scene.anims.exists(key)) scene.anims.remove(key);
  }
  scene.anims.create({
    key: `${prefix}-idle`,
    frames: [{ key: `${base}_0` }],
    frameRate: 1,
  });
  scene.anims.create({
    key: `${prefix}-run`,
    frames: [
      { key: `${base}_1` },
      { key: `${base}_2` },
      { key: `${base}_3` },
      { key: `${base}_4` },
    ],
    frameRate: 16,
    repeat: -1,
  });
  scene.anims.create({
    key: `${prefix}-crouch`,
    frames: [{ key: `${base}_5` }],
    frameRate: 1,
  });
  scene.anims.create({
    key: `${prefix}-jump`,
    frames: [{ key: `${base}_6` }, { key: `${base}_7` }],
    frameRate: 14,
    repeat: -1,
  });
  scene.anims.create({
    key: `${prefix}-roll`,
    frames: [{ key: `${base}_6` }, { key: `${base}_7` }],
    frameRate: 18,
    repeat: -1,
  });
}

function ensureGhostAnim(scene: Phaser.Scene) {
  if (scene.anims.exists('ghost-float')) return;
  scene.anims.create({
    key: 'ghost-float',
    frames: [{ key: 'px_ghost_0' }, { key: 'px_ghost_1' }],
    frameRate: 4,
    repeat: -1,
  });
}
