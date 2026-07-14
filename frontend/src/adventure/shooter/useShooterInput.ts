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
  const reticles = useRef<DualReticles>({ ...DEFAULT });
  const firing = useRef({ Wideass: false, Tats: false });
  const held = useRef({ Wideass: false, Tats: false });

  useEffect(() => {
    if (!active) return;

    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
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
      if (nx < 0.5 || playerCount === 1) held.current.Wideass = true;
      if (nx >= 0.5 && playerCount === 2) held.current.Tats = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth;
      if (nx < 0.5 || playerCount === 1) held.current.Wideass = false;
      if (nx >= 0.5 && playerCount === 2) held.current.Tats = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    let raf = 0;
    const tick = () => {
      const speed = 0.028;
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
      }
      w.x = clamp01(w.x);
      w.y = clamp01(w.y);
      t.x = clamp01(t.x);
      t.y = clamp01(t.y);

      const pad0 = navigator.getGamepads?.()[0];
      if (pad0) {
        w.x = clamp01(w.x + pad0.axes[0] * speed * 1.4);
        w.y = clamp01(w.y + pad0.axes[1] * speed * 1.4);
        if (pad0.buttons[0]?.pressed || pad0.buttons[7]?.pressed) firing.current.Wideass = true;
      }
      const pad1 = navigator.getGamepads?.()[1];
      if (pad1 && playerCount === 2) {
        t.x = clamp01(t.x + pad1.axes[0] * speed * 1.4);
        t.y = clamp01(t.y + pad1.axes[1] * speed * 1.4);
        if (pad1.buttons[0]?.pressed || pad1.buttons[7]?.pressed) firing.current.Tats = true;
      }

      if (keys.has(' ') || keys.has('f')) held.current.Wideass = true;
      else if (!held.current.Wideass) held.current.Wideass = false;
      if (keys.has('enter') || keys.has('g')) held.current.Tats = true;

      firing.current.Wideass = held.current.Wideass;
      firing.current.Tats = held.current.Tats;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(raf);
    };
  }, [active, playerCount]);

  return {
    getReticles: () => reticles.current,
    consumeFire: () => {
      const shot = { ...firing.current };
      firing.current.Wideass = false;
      firing.current.Tats = false;
      return shot;
    },
  };
}
