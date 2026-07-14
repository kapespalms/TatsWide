import { useEffect, useRef } from 'react';

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

export function useShooterInput(active: boolean, playerCount: 1 | 2) {
  const reticles = useRef<DualReticles>({
    Wideass: { ...DEFAULT.Wideass },
    Tats: { ...DEFAULT.Tats },
  });
  const firing = useRef({ Wideass: false, Tats: false });
  const pointerHeld = useRef({ Wideass: false, Tats: false });

  useEffect(() => {
    if (!active) return;

    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key === ' ') e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onPointerMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      if (nx < 0.5 || playerCount === 1) {
        reticles.current.Wideass = { x: clamp01(nx), y: clamp01(ny) };
      } else {
        reticles.current.Tats = { x: clamp01(nx), y: clamp01(ny) };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth;
      if (nx < 0.5 || playerCount === 1) pointerHeld.current.Wideass = true;
      if (nx >= 0.5 && playerCount === 2) pointerHeld.current.Tats = true;
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
    const tick = () => {
      const speed = 0.03;
      const w = reticles.current.Wideass;
      const t = reticles.current.Tats;
      if (keys.has('a')) w.x -= speed;
      if (keys.has('d')) w.x += speed;
      if (keys.has('w')) w.y -= speed;
      if (keys.has('s')) w.y += speed;
      if (playerCount === 2) {
        if (keys.has('j')) t.x -= speed;
        if (keys.has('l')) t.x += speed;
        if (keys.has('i')) t.y -= speed;
        if (keys.has('k')) t.y += speed;
      } else {
        // 1P: Tats AI gently tracks near P1 reticle with lag
        t.x += (w.x + 0.12 - t.x) * 0.06;
        t.y += (w.y - 0.04 - t.y) * 0.06;
      }
      w.x = clamp01(w.x);
      w.y = clamp01(w.y);
      t.x = clamp01(t.x);
      t.y = clamp01(t.y);

      const pad0 = navigator.getGamepads?.()[0];
      let padFireW = false;
      if (pad0) {
        w.x = clamp01(w.x + pad0.axes[0] * speed * 1.5);
        w.y = clamp01(w.y + pad0.axes[1] * speed * 1.5);
        padFireW = !!(pad0.buttons[0]?.pressed || pad0.buttons[7]?.pressed);
      }
      const pad1 = navigator.getGamepads?.()[1];
      let padFireT = false;
      if (pad1 && playerCount === 2) {
        t.x = clamp01(t.x + pad1.axes[0] * speed * 1.5);
        t.y = clamp01(t.y + pad1.axes[1] * speed * 1.5);
        padFireT = !!(pad1.buttons[0]?.pressed || pad1.buttons[7]?.pressed);
      }

      const keyFireW = keys.has(' ') || keys.has('f');
      const keyFireT = keys.has('enter') || keys.has('g');
      firing.current.Wideass = keyFireW || pointerHeld.current.Wideass || padFireW;
      firing.current.Tats =
        playerCount === 2
          ? keyFireT || pointerHeld.current.Tats || padFireT
          : keyFireW || pointerHeld.current.Wideass; // 1P twin guns

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
  }, [active, playerCount]);

  return {
    getReticles: () => reticles.current,
    consumeFire: () => {
      const shot = { Wideass: firing.current.Wideass, Tats: firing.current.Tats };
      return shot;
    },
  };
}
