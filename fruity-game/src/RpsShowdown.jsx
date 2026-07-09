const RPS_EMOJI = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

const RPS_LABEL = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};

export function RpsShowdown({ rps, names }) {
  if (!rps) return null;

  const hostName = names?.host || "Player 1";
  const joinerName = names?.joiner || "Player 2";
  const outcome =
    rps.winner === "tie"
      ? "TIE — chaotic neutral energy"
      : rps.winner === "host"
        ? hostName + " wins the throw!"
        : joinerName + " wins the throw!";

  return (
    <div className="rps-showdown" aria-label="Rock paper scissors">
      <p className="rps-showdown-kicker">Chaos breaker!</p>
      <div className="rps-showdown-row">
        <div className="rps-showdown-player">
          <span className="rps-showdown-name">{hostName}</span>
          <span className="rps-showdown-hand rps-pop-left">
            {RPS_EMOJI[rps.hostPick] || "✊"}
          </span>
          <span className="rps-showdown-pick">{RPS_LABEL[rps.hostPick]}</span>
        </div>
        <span className="rps-showdown-vs">VS</span>
        <div className="rps-showdown-player">
          <span className="rps-showdown-name">{joinerName}</span>
          <span className="rps-showdown-hand rps-pop-right">
            {RPS_EMOJI[rps.joinerPick] || "✋"}
          </span>
          <span className="rps-showdown-pick">{RPS_LABEL[rps.joinerPick]}</span>
        </div>
      </div>
      <p className="rps-showdown-outcome">{outcome}</p>
    </div>
  );
}
