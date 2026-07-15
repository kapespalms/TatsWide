import Phaser from 'phaser';

/** Classic Mega Drive act palette — restrained, not candy neon */
export const PAL = {
  skyTop: '#3880d8',
  skyBot: '#88c8f0',
  cloud: '#f0f4f8',
  cloudShade: '#c0d8e8',
  farRock: '#c86838',
  farRockDeep: '#884828',
  farGreen: '#289048',
  pine: '#186830',
  pineDark: '#0c4820',
  pineTrunk: '#684028',
  grass: '#38a038',
  grassLight: '#58c048',
  grassDark: '#207828',
  dirt: '#b07038',
  dirtDark: '#785028',
  dirtDeep: '#503018',
  stone: '#5878a8',
  stoneLight: '#7898c8',
  stoneDark: '#384868',
  checkerA: '#101018',
  checkerB: '#e8e8f0',
  flowerP: '#c05070',
  flowerY: '#d8b040',
  wideass: '#d03040',
  wideassDark: '#801020',
  wideassAccent: '#e07058',
  tats: '#2090b8',
  tatsDark: '#105868',
  tatsAccent: '#80c8d8',
  ghost: '#a090c0',
  ghostEye: '#302040',
  pepper: '#681828',
  duck: '#d8b030',
  hat: '#503070',
  gold: '#e8b820',
  white: '#f0f0f0',
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

/** 3×5 bitmap glyphs — no canvas text seams on NEAREST sprites */
const GLYPHS: Record<string, number[]> = {
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  G: [0b011, 0b100, 0b101, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111],
  J: [0b001, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b101, 0b110, 0b101, 0b101],
  L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101, 0b101],
  N: [0b101, 0b111, 0b111, 0b101, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100, 0b100],
  R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110],
  T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b101, 0b101, 0b111, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010],
  '>': [0b100, 0b010, 0b001, 0b010, 0b100],
  ':': [0b000, 0b010, 0b000, 0b010, 0b000],
  ' ': [0, 0, 0, 0, 0],
};

function drawPixelWord(
  ctx: Ctx,
  word: string,
  ox: number,
  oy: number,
  color: string,
  ink = '#101018',
  scale = 2,
) {
  let x = ox;
  for (const ch of word) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (g[row] & (1 << (2 - col))) {
          rect(ctx, x + col * scale + 1, oy + row * scale + 1, scale, scale, ink);
          rect(ctx, x + col * scale, oy + row * scale, scale, scale, color);
        }
      }
    }
    x += 4 * scale;
  }
}

/** Parallax brand clouds spelling WIDEASS / TATS — block pixels, no AA text. */
function drawBrandCloudStrip() {
  const c = canvas(512, 96);
  const ctx = ctxOf(c);
  const blob = (x: number, y: number, r: number) => {
    rect(ctx, x - r, y - r / 2, r * 2, r, PAL.cloudShade);
    rect(ctx, x - r + 2, y - r / 2 + 2, r * 2 - 4, r - 4, PAL.cloud);
  };
  for (const [x, y, r] of [
    [70, 48, 34],
    [110, 40, 40],
    [155, 50, 30],
    [320, 52, 28],
    [355, 42, 34],
    [395, 50, 26],
  ] as const) {
    blob(x, y, r);
  }
  drawPixelWord(ctx, 'WIDEASS', 56, 36, PAL.wideass);
  drawPixelWord(ctx, 'TATS', 330, 38, PAL.tats);
  return c;
}

function drawKeepLintel(accent: string) {
  const c = canvas(128, 48);
  const ctx = ctxOf(c);
  rect(ctx, 0, 20, 128, 18, '#284898');
  rect(ctx, 4, 22, 120, 14, '#4a78d8');
  rect(ctx, 8, 24, 112, 6, accent);
  for (let i = 0; i < 8; i += 1) {
    rect(ctx, i * 16, 0, 16, 20, i % 2 === 0 ? '#101018' : '#f0f0f8');
  }
  return c;
}

function drawFinishFlag() {
  const c = canvas(64, 160);
  const ctx = ctxOf(c);
  for (let y = 0; y < 160; y += 16) {
    for (let col = 0; col < 4; col += 1) {
      const even = (y / 16 + col) % 2 === 0;
      rect(ctx, col * 16, y, 16, 16, even ? '#101018' : '#f0f0f8');
    }
  }
  drawPixelWord(ctx, 'GOAL', 8, 8, PAL.gold);
  return c;
}

function drawSignBoost() {
  const c = canvas(96, 24);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 96, 24, '#101018');
  rect(ctx, 2, 2, 92, 20, '#3a2808');
  drawPixelWord(ctx, 'BOOST', 8, 6, '#ffb400', '#101018', 2);
  drawPixelWord(ctx, '>>>', 68, 6, '#ffe14a', '#101018', 2);
  return c;
}

function drawSignKeep() {
  const c = canvas(160, 24);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 160, 24, '#101018');
  rect(ctx, 2, 2, 156, 20, '#2a2010');
  drawPixelWord(ctx, 'KEEP AHEAD >>>', 6, 6, '#ffee88', '#101018', 2);
  return c;
}

function drawSignNeedSpeed() {
  const c = canvas(160, 32);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 160, 32, '#101018');
  drawPixelWord(ctx, 'NEED SPEED', 12, 8, '#ff3333', '#101018', 3);
  return c;
}

function drawPausePanel() {
  const c = canvas(288, 96);
  const ctx = ctxOf(c);
  rect(ctx, 0, 0, 288, 96, '#101018');
  rect(ctx, 4, 4, 280, 88, '#182848');
  rect(ctx, 8, 8, 272, 80, '#101828');
  drawPixelWord(ctx, 'PAUSED', 72, 22, '#ffe14a', '#101018', 4);
  drawPixelWord(ctx, 'ESC TO RESUME', 40, 62, '#f0f0f8', '#101018', 2);
  return c;
}

function drawFarMountains() {
  const c = canvas(384, 140);
  const ctx = ctxOf(c);
  rect(ctx, 0, 100, 384, 40, '#68a878');
  // Soft Green Hill–style hills (no cartoony peppermint stripes)
  const hills = [
    [0, 55],
    [50, 70],
    [110, 48],
    [170, 78],
    [230, 52],
    [290, 68],
    [340, 50],
  ];
  for (const [x, h] of hills) {
    rect(ctx, x, 140 - h, 70, h, '#2a7840');
    rect(ctx, x + 8, 140 - h + 6, 28, Math.max(8, h - 18), '#389848');
  }
  for (let x = 20; x < 360; x += 64) {
    rect(ctx, x, 118, 20, 22, '#a07040');
    rect(ctx, x + 4, 112, 12, 8, '#c09058');
  }
  rect(ctx, 0, 130, 384, 10, '#785828');
  return c;
}

/** Green Hill palm — not christmas tree candy */
function drawPine() {
  const c = canvas(48, 80);
  const ctx = ctxOf(c);
  rect(ctx, 21, 28, 6, 52, '#6a4828');
  rect(ctx, 19, 28, 2, 52, '#4a3018');
  const fronds = [
    [8, 22, 18],
    [24, 14, 16],
    [14, 30, 20],
    [28, 26, 14],
    [10, 36, 16],
  ];
  for (const [x, y, w] of fronds) {
    rect(ctx, x, y, w, 5, PAL.pine);
    rect(ctx, x + 2, y + 1, w - 4, 2, PAL.pineDark);
  }
  rect(ctx, 18, 18, 12, 10, PAL.pineDark);
  return c;
}

function drawGrassTile() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  // Sonic 1 checkered bank + dirt undercroft
  for (let y = 0; y < 12; y += 4) {
    for (let x = 0; x < 32; x += 8) {
      const on = ((x / 8) + (y / 4)) % 2 === 0;
      rect(ctx, x, y, 8, 4, on ? PAL.grassLight : PAL.grass);
    }
  }
  rect(ctx, 0, 12, 32, 4, PAL.grassDark);
  rect(ctx, 0, 16, 32, 10, PAL.dirt);
  rect(ctx, 0, 24, 32, 8, PAL.dirtDark);
  for (let i = 0; i < 8; i += 1) {
    px(ctx, (i * 9) % 32, 18 + (i % 5), PAL.dirtDeep);
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
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  // Sonic red/yellow spring plate
  rect(ctx, 2, 22, 28, 8, '#d01030');
  rect(ctx, 4, 20, 24, 4, '#ff3050');
  rect(ctx, 6, 10, 20, 12, '#ffe14a');
  rect(ctx, 8, 12, 16, 8, '#fff3a0');
  for (let i = 0; i < 4; i += 1) {
    rect(ctx, 8 + i * 4, 8, 2, 4, '#ffffff');
  }
  rect(ctx, 10, 2, 12, 8, '#ff4060');
  rect(ctx, 12, 0, 8, 4, '#ffffff');
  return c;
}

/** Classic badnik silhouette — spike orb you clearly want to avoid / stomp */
function drawGhostFrame(frame: number) {
  const c = canvas(36, 36);
  const ctx = ctxOf(c);
  const bob = frame === 1 ? 1 : 0;
  // body
  rect(ctx, 10, 10 + bob, 16, 16, '#e8e0ff');
  rect(ctx, 12, 12 + bob, 12, 12, '#b8a0e8');
  // red hazard spikes
  const spikes: [number, number, number, number][] = [
    [16, 2 + bob, 4, 8],
    [16, 26 + bob, 4, 8],
    [2, 16 + bob, 8, 4],
    [26, 16 + bob, 8, 4],
    [6, 6 + bob, 6, 6],
    [24, 6 + bob, 6, 6],
    [6, 24 + bob, 6, 6],
    [24, 24 + bob, 6, 6],
  ];
  for (const [sx, sy, sw, sh] of spikes) {
    rect(ctx, sx, sy, sw, sh, '#ff2244');
    rect(ctx, sx + 1, sy + 1, Math.max(1, sw - 2), Math.max(1, sh - 2), '#ff6688');
  }
  // angry eyes
  rect(ctx, 13, 14 + bob, 4, 5, PAL.white);
  rect(ctx, 19, 14 + bob, 4, 5, PAL.white);
  rect(ctx, 14, 16 + bob, 2, 3, '#201018');
  rect(ctx, 20, 16 + bob, 2, 3, '#201018');
  return c;
}

/** Classic pixel heart fill centered at (cx,cy). size ≈ half-width of lobes. */
function fillHeart(ctx: Ctx, cx: number, cy: number, size: number, fill: string, ink = PAL.black) {
  const s = Math.max(3, Math.floor(size));
  // outline then fill — lobe + V tip
  for (let pass = 0; pass < 2; pass += 1) {
    const col = pass === 0 ? ink : fill;
    const o = pass === 0 ? 1 : 0;
    // left lobe
    rect(ctx, cx - s - o, cy - s + 2 - o, s + o, s + o, col);
    // right lobe
    rect(ctx, cx + o, cy - s + 2 - o, s + o, s + o, col);
    // center bridge
    rect(ctx, cx - Math.floor(s * 0.35) - o, cy - Math.floor(s * 0.55) - o, Math.floor(s * 0.7) + o * 2, s, col);
    // tip V
    for (let i = 0; i < s + 2; i += 1) {
      const w = Math.max(2, (s + 2 - i) * 2);
      rect(ctx, cx - w / 2 - o, cy + s - 2 + i - o, w + o * 2, 1 + o, col);
    }
  }
  // highlight gloss
  rect(ctx, cx - s + 2, cy - s + 4, Math.max(2, Math.floor(s / 3)), Math.max(2, Math.floor(s / 3)), '#ffe8f0');
}

/** Small heart pickup (replaces gold rings) */
function drawPepper() {
  const c = canvas(28, 28);
  const ctx = ctxOf(c);
  fillHeart(ctx, 14, 12, 8, '#ff4a7a');
  fillHeart(ctx, 14, 12, 6, '#ff6a9a');
  // tiny W mark
  rect(ctx, 10, 11, 2, 5, PAL.white);
  rect(ctx, 12, 13, 2, 3, PAL.white);
  rect(ctx, 14, 11, 2, 5, PAL.white);
  rect(ctx, 16, 13, 2, 3, PAL.white);
  rect(ctx, 18, 11, 2, 5, PAL.white);
  return c;
}

/** WIDEASS word-heart — big branded bonus */
function drawDuck() {
  const c = canvas(72, 48);
  const ctx = ctxOf(c);
  fillHeart(ctx, 36, 22, 18, '#c02040');
  fillHeart(ctx, 36, 22, 15, PAL.wideass);
  fillHeart(ctx, 36, 22, 12, '#e85870');
  drawPixelWord(ctx, 'WIDEASS', 10, 18, '#fff0f4', PAL.black, 2);
  return c;
}

/** TATS word-heart — big branded bonus */
function drawHat() {
  const c = canvas(56, 48);
  const ctx = ctxOf(c);
  fillHeart(ctx, 28, 22, 16, '#0a5070');
  fillHeart(ctx, 28, 22, 13, PAL.tats);
  fillHeart(ctx, 28, 22, 10, '#40b0d0');
  drawPixelWord(ctx, 'TATS', 14, 18, '#e8f8ff', PAL.black, 2);
  return c;
}

function inkOutline(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x - 1, y, w + 2, h, PAL.black);
  rect(ctx, x, y - 1, w, h + 2, PAL.black);
}

/**
 * Frame indices:
 * 0 idle · 1–4 run cycle · 5 crouch/charge · 6–7 roll ball spin
 * Wideass = wide hips, heart quills, red · Tats = lean cyan runner with ink stripes
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
  const legCycle = [-6, -2, 6, 2];
  const leg = run ? legCycle[runPhase] ?? 0 : 0;
  const skin = '#ffe0c8';
  const skinShade = '#f0b898';

  rect(ctx, 16, 58, 32, 4, 'rgba(0,0,0,0.35)');

  if (ball) {
    const spin = f === 7 ? 1 : 0;
    // Spin dash = heart-shaped bounce ball with brand quills
    fillHeart(ctx, 32, 30 + spin, 16, dark);
    fillHeart(ctx, 32, 30 + spin, 13, primary);
    fillHeart(ctx, 32, 30 + spin, 9, accent);
    const spikes: [number, number, number, number][] = spin
      ? [
          [8, 12, 10, 8],
          [46, 14, 10, 8],
          [10, 40, 10, 8],
          [44, 38, 10, 8],
          [26, 4, 12, 8],
          [24, 48, 14, 8],
        ]
      : [
          [6, 20, 10, 8],
          [48, 22, 10, 8],
          [12, 42, 10, 8],
          [42, 42, 10, 8],
          [26, 6, 12, 8],
          [26, 48, 12, 8],
        ];
    for (const [sx, sy, sw, sh] of spikes) {
      inkOutline(ctx, sx, sy, sw, sh);
      rect(ctx, sx, sy, sw, sh, dark);
      rect(ctx, sx + 2, sy + 2, 3, sh - 4, accent);
    }
    rect(ctx, 24, 24 + spin, 7, 7, PAL.white);
    rect(ctx, 35, 26 + spin, 5, 4, PAL.black);
    drawPixelWord(ctx, wide ? 'W' : 'T', 28, 34 + spin, PAL.white, dark, 2);
    return c;
  }

  if (crouch) {
    const by = 38;
    const bw = wide ? 34 : 22;
    const bh = 12;
    const bx = 32 - bw / 2;
    inkOutline(ctx, bx + 2, by + bh, 9, 8);
    inkOutline(ctx, bx + bw - 11, by + bh, 9, 8);
    rect(ctx, bx + 2, by + bh, 9, 8, dark);
    rect(ctx, bx + bw - 11, by + bh, 9, 8, dark);
    inkOutline(ctx, bx, by, bw, bh);
    rect(ctx, bx, by, bw, bh, primary);
    rect(ctx, bx, by, bw, 3, accent);
    rect(ctx, bx + 4, by + 4, bw - 8, 5, skin);
    const hx = 20;
    const hy = by - 16;
    inkOutline(ctx, hx, hy, 24, 18);
    rect(ctx, hx, hy, 24, 18, primary);
    rect(ctx, hx + 2, hy + 2, 20, 5, accent);
    rect(ctx, hx + 5, hy + 8, 6, 5, PAL.white);
    rect(ctx, hx + 14, hy + 8, 6, 5, PAL.white);
    rect(ctx, hx + 7, hy + 10, 3, 3, PAL.black);
    rect(ctx, hx + 16, hy + 10, 3, 3, PAL.black);
    if (wide) {
      // heart-ear quills
      fillHeart(ctx, hx - 2, hy + 4, 5, dark);
      fillHeart(ctx, hx + 26, hy + 2, 5, dark);
    } else {
      inkOutline(ctx, hx + 20, hy - 4, 12, 6);
      rect(ctx, hx + 20, hy - 4, 12, 6, accent);
      // arm ink bars
      rect(ctx, hx + 22, hy + 10, 8, 2, dark);
      rect(ctx, hx + 22, hy + 14, 8, 2, dark);
    }
    return c;
  }

  const by = run ? 24 + (runPhase % 2 === 0 ? -1 : 1) : 26;
  const bw = wide ? 32 : 18;
  const bh = wide ? 18 : 20;
  const bx = 32 - bw / 2;

  // hips / legs — Wideass gets exaggerated hip flare
  const hipW = wide ? bw + 6 : bw;
  const hipX = 32 - hipW / 2;
  inkOutline(ctx, bx + 2, by + bh - 2, 8, 14 + leg);
  inkOutline(ctx, bx + bw - 10, by + bh - 2, 8, 14 - leg);
  rect(ctx, bx + 2, by + bh - 2, 8, 14 + leg, dark);
  rect(ctx, bx + bw - 10, by + bh - 2, 8, 14 - leg, dark);
  rect(ctx, bx + 1, by + bh + 11 + leg, 10, 4, PAL.black);
  rect(ctx, bx + bw - 11, by + bh + 11 - leg, 10, 4, PAL.black);
  rect(ctx, bx + 2, by + bh + 11 + leg, 8, 2, accent);

  // torso
  inkOutline(ctx, hipX, by + bh - 6, hipW, 8);
  rect(ctx, hipX, by + bh - 6, hipW, 8, dark);
  inkOutline(ctx, bx, by, bw, bh);
  rect(ctx, bx, by, bw, bh, primary);
  rect(ctx, bx, by, bw, 4, accent);
  rect(ctx, bx + 3, by + 5, bw - 6, 8, skin);
  rect(ctx, bx + 4, by + 7, bw - 8, 2, skinShade);
  // chest brand mark
  if (wide) {
    fillHeart(ctx, 32, by + 9, 4, '#ff88aa');
  } else {
    rect(ctx, 30, by + 6, 2, 8, dark);
    rect(ctx, 28, by + 6, 6, 2, dark);
  }
  rect(ctx, bx + bw / 2 - 3, by + bh - 5, 6, 4, PAL.gold);

  // arms
  const armY = by + 4 + (run ? Math.sign(leg) * 3 : 0);
  inkOutline(ctx, bx - 8, armY, 8, 14);
  inkOutline(ctx, bx + bw, armY, 8, 14);
  rect(ctx, bx - 8, armY, 8, 14, primary);
  rect(ctx, bx + bw, armY, 8, 14, primary);
  rect(ctx, bx - 8, armY + 11, 8, 3, accent);
  rect(ctx, bx + bw, armY + 11, 8, 3, accent);
  if (!wide) {
    // Tats ink sleeves
    rect(ctx, bx - 7, armY + 3, 6, 2, dark);
    rect(ctx, bx - 7, armY + 7, 6, 2, dark);
    rect(ctx, bx + bw + 1, armY + 3, 6, 2, dark);
    rect(ctx, bx + bw + 1, armY + 7, 6, 2, dark);
  }

  // head
  const hx = 19;
  const hy = by - 20;
  const hw = 26;
  const hh = 20;
  inkOutline(ctx, hx, hy, hw, hh);
  rect(ctx, hx, hy, hw, hh, primary);
  rect(ctx, hx + 2, hy + 2, hw - 4, 5, accent);
  // snout / muzzle
  rect(ctx, hx + 6, hy + 10, hw - 12, 8, skin);
  rect(ctx, hx + 8, hy + 12, hw - 16, 2, skinShade);

  if (wide) {
    // Wideass heart quills
    const qs: [number, number][] = [
      [hx - 4, hy + 2],
      [hx - 2, hy - 6],
      [hx + hw - 4, hy - 5],
      [hx + hw + 2, hy + 4],
      [hx + 8, hy - 8],
    ];
    for (const [qx, qy] of qs) {
      fillHeart(ctx, qx + 4, qy + 4, 5, dark);
      fillHeart(ctx, qx + 4, qy + 4, 3, accent);
    }
  } else {
    // Tats swept crest + ear fin
    inkOutline(ctx, hx + hw - 4, hy - 6, 14, 7);
    rect(ctx, hx + hw - 4, hy - 6, 14, 7, accent);
    inkOutline(ctx, hx + hw, hy + 2, 10, 14);
    rect(ctx, hx + hw, hy + 2, 10, 14, dark);
    rect(ctx, hx + hw + 2, hy + 4, 3, 10, accent);
    // jawline tattoo
    rect(ctx, hx + 2, hy + 14, 4, 2, dark);
    rect(ctx, hx + hw - 6, hy + 14, 4, 2, dark);
  }

  // eyes — big anime whites
  rect(ctx, hx + 5, hy + 7, 7, 7, PAL.white);
  rect(ctx, hx + 15, hy + 7, 7, 7, PAL.white);
  rect(ctx, hx + 7, hy + 9, 4, 4, PAL.black);
  rect(ctx, hx + 17, hy + 9, 4, 4, PAL.black);
  rect(ctx, hx + 5, hy + 7, 7, 2, 'rgba(255,255,255,0.65)');
  // blush
  rect(ctx, hx + 3, hy + 14, 4, 2, '#ff90a0');
  rect(ctx, hx + hw - 7, hy + 14, 4, 2, '#ff90a0');
  // smile
  rect(ctx, hx + 10, hy + 16, 8, 2, dark);
  rect(ctx, hx + 11, hy + 17, 6, 1, accent);

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
  fillHeart(ctx, 8, 7, 5, '#ff4a7a');
  fillHeart(ctx, 8, 7, 3, '#ff8ab0');
  return c;
}

function drawHazardOrb() {
  const c = canvas(32, 32);
  const ctx = ctxOf(c);
  // Spiked hazard ball — matches ring / ghost ink style
  rect(ctx, 6, 6, 20, 20, '#101018');
  rect(ctx, 8, 8, 16, 16, '#ff2244');
  rect(ctx, 10, 10, 12, 12, '#ff5566');
  rect(ctx, 12, 12, 4, 4, '#ffe8e8');
  const spikes: [number, number, number, number][] = [
    [13, 0, 6, 8],
    [13, 24, 6, 8],
    [0, 13, 8, 6],
    [24, 13, 8, 6],
    [3, 3, 6, 6],
    [23, 3, 6, 6],
    [3, 23, 6, 6],
    [23, 23, 6, 6],
  ];
  for (const [sx, sy, sw, sh] of spikes) {
    rect(ctx, sx, sy, sw, sh, '#b01028');
    rect(ctx, sx + 1, sy + 1, Math.max(1, sw - 2), Math.max(1, sh - 2), '#ff3344');
  }
  return c;
}

/** Classic floor spike strip — grey base, sharp tips */
function drawGroundSpikes() {
  const c = canvas(48, 24);
  const ctx = ctxOf(c);
  rect(ctx, 0, 16, 48, 8, '#2a2830');
  rect(ctx, 0, 16, 48, 3, '#4a4858');
  for (let i = 0; i < 6; i += 1) {
    const x = 2 + i * 8;
    rect(ctx, x + 2, 10, 4, 6, '#c0c0d0');
    rect(ctx, x + 3, 4, 2, 8, '#e8e8f0');
    rect(ctx, x + 3, 0, 2, 4, '#ff3050');
    rect(ctx, x + 2, 8, 4, 2, '#ff6688');
  }
  return c;
}

/** Heavy pressure switch — depresses 4px while stood on. */
function drawButton() {
  const c = canvas(32, 16);
  const ctx = ctxOf(c);
  rect(ctx, 2, 8, 28, 6, '#2a2830');
  rect(ctx, 4, 4, 24, 8, '#c8a040');
  rect(ctx, 4, 4, 24, 3, '#ffe14a');
  rect(ctx, 6, 6, 20, 4, '#e07020');
  return c;
}

function drawKeepPillar() {
  const c = canvas(48, 96);
  const ctx = ctxOf(c);
  rect(ctx, 8, 16, 32, 80, '#4a78d8');
  rect(ctx, 10, 18, 28, 76, '#78a8f8');
  rect(ctx, 12, 20, 24, 10, '#ffe14a');
  for (let y = 36; y < 90; y += 12) {
    rect(ctx, 14, y, 20, 8, y % 24 === 0 ? '#101018' : '#f0f0f8');
  }
  rect(ctx, 4, 8, 40, 12, '#284898');
  rect(ctx, 6, 4, 8, 10, '#4a78d8');
  rect(ctx, 34, 4, 8, 10, '#4a78d8');
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
  register(scene, 'px_brand_clouds', drawBrandCloudStrip());
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
  register(scene, 'px_hazard', drawHazardOrb());
  register(scene, 'px_spikes', drawGroundSpikes());
  register(scene, 'px_button', drawButton());
  register(scene, 'px_keep', drawKeepPillar());
  register(scene, 'px_keep_lintel', drawKeepLintel('#ffe14a'));
  register(scene, 'px_keep_lintel_orange', drawKeepLintel('#ff8844'));
  register(scene, 'px_keep_lintel_cyan', drawKeepLintel('#66ccff'));
  register(scene, 'px_keep_lintel_pink', drawKeepLintel('#ff66aa'));
  register(scene, 'px_finish', drawFinishFlag());
  register(scene, 'px_sign_boost', drawSignBoost());
  register(scene, 'px_sign_keep', drawSignKeep());
  register(scene, 'px_sign_need', drawSignNeedSpeed());
  register(scene, 'px_pause', drawPausePanel());
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
