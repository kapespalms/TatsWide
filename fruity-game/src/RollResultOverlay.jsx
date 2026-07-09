import { useBoardStore } from "./store.js";

export function RollResultOverlay() {
  const lastRolls = useBoardStore((s) => s.lastRolls);
  const rollStep = useBoardStore((s) => s.rollStep);
  const isMoving = useBoardStore((s) => s.isMoving);
  const names = useBoardStore((s) => s.names);
  const lastMover = useBoardStore((s) => s.lastMover);

  if (!isMoving || !lastRolls || rollStep !== "dice") return null;

  const mover = names[lastMover] || lastMover || "Player";

  return (
    <div className="roll-result-overlay" aria-live="polite">
      <div className="roll-result-card animate-pop">
        <p className="roll-result-label">{mover} rolled</p>
        <div className="roll-result-dice">
          <span className="roll-die">{lastRolls.die1}</span>
          <span className="roll-plus">+</span>
          <span className="roll-die">{lastRolls.die2}</span>
        </div>
        <p className="roll-result-total">
          = <strong>{lastRolls.total}</strong> spaces
        </p>
      </div>
    </div>
  );
}
