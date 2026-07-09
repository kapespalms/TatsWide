import { useBoardStore } from "./store.js";
import { RpsShowdown } from "./RpsShowdown.jsx";

const WIN_SCORE = 10;

export function RevealScreen() {
  const cardReveal = useBoardStore((s) => s.cardReveal);
  const names = useBoardStore((s) => s.names);
  const isSolo = useBoardStore((s) => s.isSolo);
  const teamScore = useBoardStore((s) => s.teamScore);

  if (!cardReveal) return null;

  const step = cardReveal.revealStep || "answers";
  const match = cardReveal.match;
  const hostLabel = cardReveal.hostLabel || cardReveal.hostPick || "?";
  const joinerLabel = cardReveal.joinerLabel || cardReveal.joinerPick || "?";
  const scoreBefore =
    typeof cardReveal.scoreBefore === "number" ? cardReveal.scoreBefore : teamScore;
  const scoreAfter =
    typeof cardReveal.scoreAfter === "number" ? cardReveal.scoreAfter : teamScore;
  const delta =
    typeof cardReveal.scoreDelta === "number"
      ? cardReveal.scoreDelta
      : scoreAfter - scoreBefore;

  if (step === "answers") {
    return (
      <div className="reveal-screen reveal-answers">
        <div className="reveal-card reveal-card-compact animate-pop">
          <p className="reveal-step-label">Both answers revealed!</p>
          {!isSolo ? (
            <div className="reveal-picks reveal-picks-hero">
              <div className="reveal-pick">
                <span className="reveal-pick-label">{names.host || "Player 1"}</span>
                <span className="reveal-pick-value">{hostLabel}</span>
              </div>
              <div className="reveal-pick">
                <span className="reveal-pick-label">{names.joiner || "Player 2"}</span>
                <span className="reveal-pick-value">{joinerLabel}</span>
              </div>
            </div>
          ) : (
            <div className="reveal-picks reveal-picks-solo">
              <div className="reveal-pick">
                <span className="reveal-pick-label">Your answer</span>
                <span className="reveal-pick-value">{hostLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "score") {
    return (
      <div className={"reveal-screen reveal-score" + (match ? " reveal-match" : " reveal-mismatch")}>
        <div className="reveal-card reveal-card-compact animate-pop">
          <p className="reveal-step-label">Gayness Meter</p>
          <div className="reveal-score-row">
            <span className="reveal-score-before">{scoreBefore}</span>
            <span className="reveal-score-arrow">→</span>
            <span className={"reveal-score-after" + (delta > 0 ? " is-up" : delta < 0 ? " is-down" : "")}>
              {scoreAfter}
            </span>
            <span className="reveal-score-of">/{WIN_SCORE}</span>
          </div>
          <p className="reveal-score-delta">
            {delta > 0
              ? `+${delta} gayness this round 🍇`
              : delta < 0
                ? `${delta} gayness this round`
                : "No change this round"}
          </p>
          {cardReveal.wager ? (
            <p className="reveal-score-wager">Tats wagered {cardReveal.wager} 🍇</p>
          ) : null}
          <div className="reveal-score-grapes">{"🍇".repeat(Math.min(scoreAfter, 10))}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "reveal-screen" +
        (match ? " reveal-match theme-" + (cardReveal.theme || "pink") : " reveal-mismatch theme-" + (cardReveal.theme || "red"))
      }
    >
      <div className={"reveal-card reveal-card-compact" + (match ? " animate-pop" : " animate-shake")}>
        {cardReveal.rps ? <RpsShowdown rps={cardReveal.rps} names={names} /> : null}
        {match ? (
          <>
            <div className="reveal-emoji">🥵🔥🚨</div>
            <h1 className="reveal-title">{cardReveal.title || "PERFECT MATCH!"}</h1>
            <p className="reveal-sub">{cardReveal.sub || "You synched up!"}</p>
            <div className="reveal-fruit">MATCH! 🍓</div>
          </>
        ) : (
          <>
            <div className="reveal-strobe" aria-hidden />
            <div className="reveal-emoji">🥶💤📉</div>
            <h1 className="reveal-title mismatch">{cardReveal.title || "CHAOTIC INCOMPATIBILITY!"}</h1>
            <p className="reveal-sub">{cardReveal.sub || "Not quite aligned this round."}</p>
            <div className="reveal-fruit zero">NO MATCH — FRUIT DEDUCTED</div>
          </>
        )}
      </div>
    </div>
  );
}
