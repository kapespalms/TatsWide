import { useEffect, useRef } from 'react';
import type { CharacterId } from '../types';

export interface Reticle {
  x: number;
  y: number;
}

export interface DualReticles {
  Wideass: Reticle;
  Tats: Reticle;
}

const DEFAULT: DualReticles = {
  Wideass: { x: 0.35, y: 0.5 },
  Tats: { x: 0.65, y: 0.5 },
};

function clamp01(v: number) {
  return Math.min(0.92, Math.max(0.08, v));
}

function pointerNorm(e: PointerEvent) {
  // Prefer the topmost / last WebGL canvas (R3F shooter when mounted)
  const canvases = document.querySelectorAll('canvas');
  const canvas = canvases.length ? canvases[canvases.length - 1] : null;
  const rect = canvas?.getBoundingClientRect();
  if (rect && rect.width > 8 && rect.height > 8) {
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  }
  return {
    x: clamp01(e.clientX / window.innerWidth),
    y: clamp01(e.clientY / window.innerHeight),
  };
}

/** Edge-triggered + light autofire (≈5/s while held) — arcade cadence, not spray. */
export function useShooterInput(
  active: boolean,
  playerCount: 1 | 2,
  primaryCharacter: CharacterId = 'Wideass',
) {
  const reticles = useRef<DualReticles>({
    Wideass: { ...DEFAULT.Wideass },
    Tats: { ...DEFAULT.Tats },
  });
  const held = useRef({ Wideass: false, Tats: false });
  const prevHeld = useRef({ Wideass: false, Tats: false });
  const fireAcc = useRef({ Wideass: 0, Tats: 0 });
  const pending = useRef({ Wideass: false, Tats: false });
  const pointerHeld = useRef({ Wideass: false, Tats: false });

  useEffect(() => {
    if (!active) return;
    const soloWho: CharacterId = primaryCharacter;
    const partner: CharacterId = soloWho === 'Wideass' ? 'Tats' : 'Wideass';

    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key === ' ') e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onPointerMove = (e: PointerEvent) => {
      const { x: nx, y: ny } = pointerNorm(e);
      if (playerCount === 1) {
        reticles.current[soloWho] = { x: nx, y: ny };
      } else if (nx < 0.5) {
        reticles.current.Wideass = { x: nx, y: ny };
      } else {
        reticles.current.Tats = { x: nx, y: ny };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x: nx } = pointerNorm(e);
      if (playerCount === 1) {
        pointerHeld.current[soloWho] = true;
      } else {
        if (nx < 0.5) pointerHeld.current.Wideass = true;
        if (nx >= 0.5) pointerHeld.current.Tats = true;
      }
    };
    const onPointerUp = () => {
      pointerHeld.current.Wideass = false;
      pointerHeld.current.Tats = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed = 0.03;
      const w = reticles.current.Wideass;
      const t = reticles.current.Tats;
      const p1 = reticles.current[soloWho];
      const p2 = reticles.current[partner];

      if (playerCount === 1) {
        if (keys.has('a') || keys.has('arrowleft')) p1.x -= speed;
        if (keys.has('d') || keys.has('arrowright')) p1.x += speed;
        if (keys.has('w') || keys.has('arrowup')) p1.y -= speed;
        if (keys.has('s') || keys.has('arrowdown')) p1.y += speed;
        // Cosmetic linked partner reticle — does NOT fire
        p2.x += (p1.x + (soloWho === 'Wideass' ? 0.12 : -0.12) - p2.x) * 0.06;
        p2.y += (p1.y - 0.04 - p2.y) * 0.06;
      } else {
        if (keys.has('a')) w.x -= speed;
        if (keys.has('d')) w.x += speed;
        if (keys.has('w')) w.y -= speed;
        if (keys.has('s')) w.y += speed;
        if (keys.has('j')) t.x -= speed;
        if (keys.has('l')) t.x += speed;
        if (keys.has('i')) t.y -= speed;
        if (keys.has('k')) t.y += speed;
      }
      w.x = clamp01(w.x);
      w.y = clamp01(w.y);
      t.x = clamp01(t.x);
      t.y = clamp01(t.y);

      const pad0 = navigator.getGamepads?.()[0];
      const pad1 = navigator.getGamepads?.()[1];
      let padFireW = false;
      let padFireT = false;
      if (playerCount === 1) {
        if (pad0) {
          p1.x = clamp01(p1.x + pad0.axes[0] * speed * 1.5);
          p1.y = clamp01(p1.y + pad0.axes[1] * speed * 1.5);
          const fire = !!(pad0.buttons[0]?.pressed || pad0.buttons[7]?.pressed);
          if (soloWho === 'Wideass') padFireW = fire;
          else padFireT = fire;
        }
      } else {
        const padW = soloWho === 'Wideass' ? pad0 : pad1;
        const padT = soloWho === 'Tats' ? pad0 : pad1;
        if (padW) {
          w.x = clamp01(w.x + padW.axes[0] * speed * 1.5);
          w.y = clamp01(w.y + padW.axes[1] * speed * 1.5);
          padFireW = !!(padW.buttons[0]?.pressed || padW.buttons[7]?.pressed);
        }
        if (padT) {
          t.x = clamp01(t.x + padT.axes[0] * speed * 1.5);
          t.y = clamp01(t.y + padT.axes[1] * speed * 1.5);
          padFireT = !!(padT.buttons[0]?.pressed || padT.buttons[7]?.pressed);
        }
      }

      const keyFire = keys.has(' ') || keys.has('f');
      const keyFire2 = keys.has('enter') || keys.has('g');

      if (playerCount === 1) {
        held.current.Wideass =
          soloWho === 'Wideass' && (keyFire || pointerHeld.current.Wideass || padFireW);
        held.current.Tats =
          soloWho === 'Tats' && (keyFire || pointerHeld.current.Tats || padFireT);
      } else {
        held.current.Wideass = keyFire || pointerHeld.current.Wideass || padFireW;
        held.current.Tats = keyFire2 || pointerHeld.current.Tats || padFireT;
      }

      for (const who of ['Wideass', 'Tats'] as const) {
        const isHeld = held.current[who];
        const was = prevHeld.current[who];
        if (isHeld && !was) {
          pending.current[who] = true;
          fireAcc.current[who] = 0;
        } else if (isHeld) {
          fireAcc.current[who] += dt;
          if (fireAcc.current[who] >= 0.2) {
            fireAcc.current[who] = 0;
            pending.current[who] = true;
          }
        } else {
          fireAcc.current[who] = 0;
        }
        prevHeld.current[who] = isHeld;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      cancelAnimationFrame(raf);
    };
  }, [active, playerCount, primaryCharacter]);

  return {
    getReticles: () => reticles.current,
    consumeFire: () => {
      const shot = { Wideass: pending.current.Wideass, Tats: pending.current.Tats };
      pending.current.Wideass = false;
      pending.current.Tats = false;
      return shot;
    },
  };
}
