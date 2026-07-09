import { useBoardStore } from "./store.js";

export function RevealScreen() {
  const cardReveal = useBoardStore((s) => s.cardReveal);
  const names = useBoardStore((s) => s.names);
  const isSolo = useBoardStore((s) => s.isSolo);

  if (!cardReveal) return null;

  const match = cardReveal.match;
  const hostLabel = cardReveal.hostLabel || cardReveal.hostPick || "?";
  const joinerLabel = cardReveal.joinerLabel || cardReveal.joinerPick || "?";

  return (
    <div
      className={
        "reveal-screen" +
        (match ? " reveal-match theme-" + (cardReveal.theme || "pink") : " reveal-mismatch theme-" + (cardReveal.theme || "red"))
      }
    >
      <div className={"reveal-card" + (match ? " animate-pop" : " animate-shake")}>
        {match ? (
          <>
            <div className="reveal-emoji">🥵🔥🚨</div>
            <h1 className="reveal-title">{cardReveal.title || "PERFECT MATCH!"}</h1>
            <p className="reveal-sub">{cardReveal.sub || "+1 team fruit!"}</p>
            <div className="reveal-fruit">+1 FRUIT 🍓</div>
          </>
        ) : (
          <>
            <div className="reveal-strobe" aria-hidden />
            <div className="reveal-emoji">🥶💤📉</div>
            <h1 className="reveal-title mismatch">{cardReveal.title || "CHAOTIC INCOMPATIBILITY!"}</h1>
            <p className="reveal-sub">{cardReveal.sub || "0 fruit this round."}</p>
            <div className="reveal-fruit zero">0 FRUIT</div>
          </>
        )}

        {!isSolo ? (
          <div className="reveal-picks">
            <div className="reveal-pick">
              <span className="reveal-pick-label">{names.host || "Player 1"}</span>
              <span className="reveal-pick-value">{hostLabel}</span>
            </div>
            <div className="reveal-pick">
              <span className="reveal-pick-label">{names.joiner || "Player 2"}</span>
              <span className="reveal-pick-value">{joinerLabel}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
