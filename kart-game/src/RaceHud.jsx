import { useEffect, useRef, useState } from "react";
import { useGameStore } from "./store";

function formatTime(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(1);
  return `${m}:${rem.padStart(4, "0")}`;
}

/** On-track HUD: lap counter, coin tally, transient flash, and finish banner. */
export function RaceHud() {
  const lap = useGameStore((s) => s.lap);
  const totalLaps = useGameStore((s) => s.totalLaps);
  const coins = useGameStore((s) => s.coins);
  const finished = useGameStore((s) => s.finished);
  const itemFlash = useGameStore((s) => s.itemFlash);
  const raceTime = useGameStore((s) => s.raceTime);
  const setItemFlash = useGameStore((s) => s.setItemFlash);

  const [flashVisible, setFlashVisible] = useState(false);
  const flashTimer = useRef(null);

  useEffect(() => {
    if (!itemFlash) return;
    setFlashVisible(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFlashVisible(false);
      setItemFlash(null);
    }, 1400);
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [itemFlash, setItemFlash]);

  return (
    <div className="race-hud" aria-live="polite">
      <div className="race-hud-stat race-hud-lap">
        <span className="race-hud-label">LAP</span>
        <span className="race-hud-value">
          {Math.min(lap, totalLaps)}
          <span className="race-hud-sub">/{totalLaps}</span>
        </span>
      </div>
      <div className="race-hud-stat race-hud-coins">
        <span className="race-hud-coin-icon">🪙</span>
        <span className="race-hud-value">{coins}</span>
      </div>
      <div className="race-hud-stat race-hud-time">
        <span className="race-hud-label">TIME</span>
        <span className="race-hud-value race-hud-time-value">{formatTime(raceTime)}</span>
      </div>

      {flashVisible && itemFlash ? (
        <div className="race-flash">{itemFlash}</div>
      ) : null}

      {finished ? (
        <div className="race-finish">
          <div className="race-finish-title">🏁 FINISH!</div>
          <div className="race-finish-sub">
            {coins} coins · {formatTime(raceTime)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
