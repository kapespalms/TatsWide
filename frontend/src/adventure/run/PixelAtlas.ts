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

function drawSky(w: number, h: number) {
  const c = canvas(w, h);
  const ctx = ctxOf(c);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, PAL.skyTop);
  g.addColorStop(0.55, '#6eb4ff');
  g.addColorStop(1, PAL.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // soft banding for 16-bit sky feel
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + (y / h) * 0.04})`;
    ctx.fillRect(0, y, w, 2);
  }
  return c;
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
  const c = canvas(320, 120);
  const ctx = ctxOf(c);
  // orange rock columns
  const peaks = [20, 55, 90, 130, 170, 210, 250, 290];
  for (const x of peaks) {
    const h = 50 + ((x * 7) % 40);
    rect(ctx, x, 120 - h, 28, h, PAL.farRockDeep);
    rect(ctx, x + 4, 120 - h, 14, h, PAL.farRock);
    // white cloud band
    rect(ctx, x - 6, 120 - h + 18, 40, 10, PAL.cloud);
  }
  // green distant hills
  rect(ctx, 0, 100, 320, 20, PAL.farGreen);
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

function drawCharacterFrame(who: 'Wideass' | 'Tats', f: number) {
  const c = canvas(48, 48);
  const ctx = ctxOf(c);
  const primary = who === 'Wideass' ? PAL.wideass : PAL.tats;
  const dark = who === 'Wideass' ? PAL.wideassDark : PAL.tatsDark;
  const accent = who === 'Wideass' ? PAL.wideassAccent : PAL.tatsAccent;
  const wide = who === 'Wideass';
  const run = f === 1 || f === 2;
  const jump = f === 3;
  const leg = f === 1 ? -3 : f === 2 ? 3 : 0;

  // soft shadow
  rect(ctx, 14, 42, 20, 3, 'rgba(0,0,0,0.28)');

  if (jump) {
    // ball / spindash silhouette
    rect(ctx, 12, 12, 24, 24, primary);
    rect(ctx, 14, 14, 20, 6, accent);
    rect(ctx, 16, 22, 16, 10, dark);
    // spike tufts
    rect(ctx, 8, 16, 6, 4, dark);
    rect(ctx, 34, 18, 6, 4, dark);
    rect(ctx, 10, 28, 5, 4, dark);
    rect(ctx, 33, 28, 5, 4, dark);
    rect(ctx, 20, 18, 4, 4, PAL.white);
    rect(ctx, 28, 20, 3, 2, PAL.black);
    return c;
  }

  const by = run ? 18 + (f === 1 ? -1 : 1) : 20;
  const bw = wide ? 22 : 16;
  const bh = wide ? 16 : 14;
  const bx = 24 - bw / 2;

  // legs
  rect(ctx, bx + 2, by + bh - 2, 5, 10 + leg, dark);
  rect(ctx, bx + bw - 7, by + bh - 2, 5, 10 - leg, dark);
  rect(ctx, bx + 1, by + bh + 7 + leg, 7, 3, PAL.black);
  rect(ctx, bx + bw - 8, by + bh + 7 - leg, 7, 3, PAL.black);

  // torso
  rect(ctx, bx, by, bw, bh, primary);
  rect(ctx, bx, by, bw, 4, accent);
  rect(ctx, bx + 2, by + 5, bw - 4, 6, '#ffe0c8');
  rect(ctx, bx, by + bh - 4, bw, 4, dark);

  // arms
  const armY = by + 4 + (run ? leg * 0.3 : 0);
  rect(ctx, bx - 5, armY, 5, 10, primary);
  rect(ctx, bx + bw, armY, 5, 10, primary);

  // head
  const hx = 15;
  const hy = by - 14;
  rect(ctx, hx, hy, 18, 16, primary);
  rect(ctx, hx + 1, hy + 1, 16, 5, accent);
  // quills / hair spikes
  if (wide) {
    rect(ctx, hx - 4, hy + 2, 5, 8, dark);
    rect(ctx, hx - 2, hy - 4, 6, 6, dark);
    rect(ctx, hx + 14, hy - 3, 6, 5, dark);
  } else {
    rect(ctx, hx + 14, hy - 2, 8, 4, accent);
    rect(ctx, hx + 16, hy + 2, 6, 8, dark);
  }
  // eyes + smile
  rect(ctx, hx + 4, hy + 7, 4, 4, PAL.white);
  rect(ctx, hx + 11, hy + 7, 4, 4, PAL.white);
  rect(ctx, hx + 5, hy + 8, 2, 2, PAL.black);
  rect(ctx, hx + 12, hy + 8, 2, 2, PAL.black);
  rect(ctx, hx + 7, hy + 12, 6, 2, dark);

  return c;
}

function drawCharacterSheet(who: 'Wideass' | 'Tats') {
  const frameW = 48;
  const frameH = 48;
  const frames = 4;
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
export function createModern16BitAtlas(scene: Phaser.Scene) {
  register(scene, 'px_sky', drawSky(8, 256));
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
  for (let i = 0; i < 4; i += 1) {
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
  if (scene.anims.exists(`${prefix}-run`)) return;
  scene.anims.create({
    key: `${prefix}-idle`,
    frames: [{ key: `${base}_0` }],
    frameRate: 1,
  });
  scene.anims.create({
    key: `${prefix}-run`,
    frames: [{ key: `${base}_1` }, { key: `${base}_2` }],
    frameRate: 14,
    repeat: -1,
  });
  scene.anims.create({
    key: `${prefix}-jump`,
    frames: [{ key: `${base}_3` }],
    frameRate: 1,
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
