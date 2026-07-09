import { useState } from "react";
import { useBoardStore } from "./store.js";
import { postToParent } from "./arenaBridge.js";
import { GaynessMeter } from "./GaynessMeter.jsx";
import { RevealScreen } from "./RevealScreen.jsx";
import { RollResultOverlay } from "./RollResultOverlay.jsx";
import { useCardPresentation } from "./useCardPresentation.js";

const WIN_SCORE = 10;

function LobbyHud() {
  const lobby = useBoardStore((s) => s.lobby);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);

  if (!lobby) return null;

  const pieces = lobby.pieces || {};
  const options = lobby.pieceOptions || [];
  const mine = pieces[myRole];

  return (
    <div className="lobby-hud">
      <div className="lobby-sheet">
        <h1 className="lobby-title">🍇 Get Fruity</h1>
        <p className="lobby-sub">
          Choose your character, then hit Start. You'll spawn at the Golden Banana 🍌 corner.
        </p>
        <p className="lobby-you">
          Playing as <strong>{names[myRole] || myRole}</strong>
        </p>

        <h2 className="lobby-heading">
          {lobby.lobbySolo ? "Pick your game piece" : "Each player picks a piece"}
        </h2>
        <div className="lobby-piece-grid">
          {options.map((p) => {
            const taken = Object.values(pieces).filter(Boolean);
            const isMine = mine === p.id;
            const takenByOther =
              !lobby.lobbySolo && taken.includes(p.id) && !isMine;
            return (
              <button
                key={p.id}
                type="button"
                className={
                  "lobby-piece-btn" +
                  (isMine ? " is-mine" : "") +
                  (takenByOther ? " is-taken" : "")
                }
                disabled={takenByOther}
                onClick={() =>
                  postToParent({
                    type: "gfAction",
                    action: "pickPiece",
                    pieceId: p.id,
                  })
                }
              >
                <span className="lobby-piece-icon">{p.icon}</span>
                <span className="lobby-piece-name">{p.label}</span>
              </button>
            );
          })}
        </div>

        {lobby.requiresPartner ? (
          <p className="lobby-tip">
            2-player mode — share your arena code or switch to 1 Player.
          </p>
        ) : !lobby.readyToStart ? (
          <p className="lobby-tip">
            {lobby.lobbySolo
              ? "Pick a piece to unlock Start."
              : "Both players must pick a piece."}
          </p>
        ) : null}

        <button
          type="button"
          className="hud-btn hud-btn-roll lobby-start"
          disabled={
            !lobby.isHost || lobby.requiresPartner || !lobby.readyToStart
          }
          onClick={() =>
            postToParent({ type: "gfAction", action: "startGame" })
          }
        >
          {lobby.isHost ? "Get Fruity — Start Game 🍌" : "Waiting for host…"}
        </button>
      </div>
    </div>
  );
}

function WagerModal() {
  const phase = useBoardStore((s) => s.phase);
  const myRole = useBoardStore((s) => s.myRole);
  const wagerRole = useBoardStore((s) => s.wagerRole);
  const teamScore = useBoardStore((s) => s.teamScore);
  const activeCard = useBoardStore((s) => s.activeCard);
  const names = useBoardStore((s) => s.names);
  const chars = useBoardStore((s) => s.chars);

  if (phase !== "wager") return null;

  const tatsName =
    wagerRole && chars[wagerRole] === "tats"
      ? names[wagerRole] || "Tats"
      : "Tats";
  const maxWager = Math.min(5, teamScore || 0);
  const isTats = myRole === wagerRole;

  return (
    <div className="hud-card-modal">
      <div className="hud-card-sheet wager-sheet animate-pop">
        <div className="hud-card-audience is-wager">
          <span className="hud-card-audience-kicker">One-time chaos</span>
          <span className="hud-card-audience-main">TATS WAGERS 🍇</span>
          <span className="hud-card-audience-sub">{tatsName} bets fruit on this card</span>
        </div>
        {activeCard ? (
          <p className="hud-card-prompt wager-preview">
            {activeCard.prompt || activeCard.text}
          </p>
        ) : null}
        {isTats ? (
          <>
            <p className="wager-help">
              Pick how much team fruit to risk. Match = gain it back +1. Miss = lose it +1.
            </p>
            <div className="wager-options">
              {Array.from({ length: maxWager + 1 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  className="hud-mc-btn wager-btn"
                  onClick={() =>
                    postToParent({
                      type: "gfAction",
                      action: "submitWager",
                      amount: n,
                    })
                  }
                >
                  <span className="hud-mc-letter">{n}</span>
                  <span className="hud-mc-text">
                    {n === 0 ? "No wager (coward)" : `Wager ${n} 🍇`}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="hud-wait-reveal">Waiting for {tatsName} to set the wager…</p>
        )}
      </div>
    </div>
  );
}

function TextMatchVoteModal() {
  const phase = useBoardStore((s) => s.phase);
  const activeCard = useBoardStore((s) => s.activeCard);
  const cardAnswers = useBoardStore((s) => s.cardAnswers);
  const textMatchVotes = useBoardStore((s) => s.textMatchVotes);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);
  const activeRoles = useBoardStore((s) => s.activeRoles);

  if (phase !== "textVote" || !activeCard) return null;

  const myVote = textMatchVotes?.[myRole];

  return (
    <div className="hud-card-modal">
      <div className="hud-card-sheet text-vote-sheet animate-pop">
        <h2 className="hud-card-title">✍️ Do these answers match?</h2>
        <p className="hud-card-prompt">{activeCard.prompt}</p>
        <div className="text-vote-answers">
          {activeRoles.map((role) => (
            <div key={role} className="text-vote-answer">
              <span className="text-vote-label">{names[role] || role}</span>
              <span className="text-vote-value">{cardAnswers[role] || "…"}</span>
            </div>
          ))}
        </div>
        <p className="text-vote-help">
          Both pick <strong>MATCH</strong> for +gayness. Otherwise the meter drops.
        </p>
        <div className="hud-mc-options">
          <button
            type="button"
            className={"hud-mc-btn" + (myVote === "MATCH" ? " is-picked" : "")}
            disabled={!!myVote}
            onClick={() =>
              postToParent({
                type: "gfAction",
                action: "submitTextMatchVote",
                vote: "MATCH",
              })
            }
          >
            <span className="hud-mc-letter">✓</span>
            <span className="hud-mc-text">Same vibe — MATCH!</span>
          </button>
          <button
            type="button"
            className={"hud-mc-btn" + (myVote === "NO_MATCH" ? " is-picked" : "")}
            disabled={!!myVote}
            onClick={() =>
              postToParent({
                type: "gfAction",
                action: "submitTextMatchVote",
                vote: "NO_MATCH",
              })
            }
          >
            <span className="hud-mc-letter">✗</span>
            <span className="hud-mc-text">Nah — no match</span>
          </button>
        </div>
        {myVote ? (
          <p className="hud-wait-reveal">Waiting for partner's match vote…</p>
        ) : null}
      </div>
    </div>
  );
}

function CardModal() {
  const activeCard = useBoardStore((s) => s.activeCard);
  const cardMode = useBoardStore((s) => s.cardMode);
  const cardFor = useBoardStore((s) => s.cardFor);
  const cardAnswers = useBoardStore((s) => s.cardAnswers);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);
  const isSolo = useBoardStore((s) => s.isSolo);
  const activeRoles = useBoardStore((s) => s.activeRoles);
  const cardPresentStep = useBoardStore((s) => s.cardPresentStep);

  if (!activeCard || cardPresentStep !== "ready") return null;

  const picked = cardAnswers[myRole];
  const isUltimate = activeCard.cardKind === "ultimate";
  const challenge = activeCard.challenge;
  const isBetrayal = challenge?.challengeType === "betrayal";
  const isConfirm = activeCard.type === "confirm";
  const isText = activeCard.type === "text";
  const isMc = activeCard.type === "mc" || Array.isArray(activeCard.options);

  const partnerRole = activeRoles.find((r) => r !== myRole);
  const partnerName = partnerRole ? names[partnerRole] || partnerRole : "Partner";
  const isPartner = cardMode === "partner";

  const title = isUltimate
    ? challenge?.title || "⚡ Ultimate Challenge"
    : isPartner
      ? "💞 Partner Card"
      : isText
        ? "✍️ Open Answer"
        : "🪞 Self Card";

  return (
    <div className="hud-card-modal">
      <div
        className={
          "hud-card-sheet card-enter" +
          (isUltimate ? " ultimate-card-glow" : "") +
          (isPartner ? " is-partner-card" : " is-self-card")
        }
      >
        <div
          className={
            "hud-card-audience" + (isPartner ? " is-partner" : " is-self")
          }
        >
          {isUltimate ? (
            <>
              <span className="hud-card-audience-kicker">Both players</span>
              <span className="hud-card-audience-main">Ultimate challenge!</span>
            </>
          ) : isPartner ? (
            <>
              <span className="hud-card-audience-kicker">Answer about</span>
              <span className="hud-card-audience-main">YOUR PARTNER</span>
              <span className="hud-card-audience-sub">{partnerName}</span>
            </>
          ) : (
            <>
              <span className="hud-card-audience-kicker">Answer about</span>
              <span className="hud-card-audience-main">YOURSELF</span>
              <span className="hud-card-audience-sub">
                {names[myRole] || myRole} (you)
              </span>
            </>
          )}
        </div>

        <h2 className="hud-card-title">{title}</h2>
        <div className="hud-card-body">
          <p className="hud-card-prompt">
            {activeCard.prompt || activeCard.text || challenge?.prompt}
          </p>
          {isConfirm ? (
            <>
              <p className="hud-card-mechanic">{challenge?.mechanic}</p>
              <button
                type="button"
                className={
                  "hud-btn hud-btn-primary" +
                  (picked === "CONFIRM" ? " is-picked" : "")
                }
                disabled={!!picked}
                onClick={() =>
                  postToParent({
                    type: "gfAction",
                    action: "submitAnswer",
                    choice: "CONFIRM",
                  })
                }
              >
                {picked === "CONFIRM" ? "Confirmed ✓" : "We actually did it!"}
              </button>
            </>
          ) : isBetrayal ? (
            <div className="hud-mc-options">
              {[
                { id: "SHARE", text: "🤝 SHARE THE FRUIT" },
                { id: "STEAL", text: "😈 STEAL THE HOARD" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={
                    "hud-mc-btn" + (picked === opt.id ? " is-picked" : "")
                  }
                  disabled={!!picked}
                  onClick={() =>
                    postToParent({
                      type: "gfAction",
                      action: "submitAnswer",
                      choice: opt.id,
                    })
                  }
                >
                  <span className="hud-mc-letter">{opt.id[0]}</span>
                  <span className="hud-mc-text">{opt.text}</span>
                </button>
              ))}
            </div>
          ) : isText ? (
            <TextAnswerForm disabled={!!picked} />
          ) : isMc && activeCard.options ? (
            <div className="hud-mc-options">
              {activeCard.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={
                    "hud-mc-btn" + (picked === opt.id ? " is-picked" : "")
                  }
                  disabled={!!picked}
                  onClick={() =>
                    postToParent({
                      type: "gfAction",
                      action: "submitAnswer",
                      choice: opt.id,
                    })
                  }
                >
                  <span className="hud-mc-letter">{opt.id}</span>
                  <span className="hud-mc-text">{opt.text}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {!isUltimate ? (
          <p className="hud-card-who">
            {names[cardFor] || cardFor} landed here — both answer to score!
          </p>
        ) : null}
        <div className="hud-answer-chips">
          {activeRoles.map((r) => (
            <span
              key={r}
              className={"hud-chip" + (cardAnswers[r] ? " is-done" : "")}
            >
              {names[r] || r}
              {cardAnswers[r] ? " — locked in ✓" : " — thinking…"}
            </span>
          ))}
        </div>
        {picked && !isSolo ? (
          <p className="hud-wait-reveal">Waiting for partner…</p>
        ) : null}
      </div>
    </div>
  );
}

function TextAnswerForm({ disabled }) {
  const [text, setText] = useState("");

  return (
    <div className="hud-text-form">
      <textarea
        className="hud-text-input"
        rows={3}
        maxLength={280}
        placeholder="Type your answer…"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="hud-btn hud-btn-primary"
        disabled={disabled || !text.trim()}
        onClick={() =>
          postToParent({
            type: "gfAction",
            action: "submitAnswer",
            choice: text.trim(),
          })
        }
      >
        Submit answer
      </button>
    </div>
  );
}

function CardDrawHint() {
  const phase = useBoardStore((s) => s.phase);
  const isMoving = useBoardStore((s) => s.isMoving);
  const cardPresentStep = useBoardStore((s) => s.cardPresentStep);

  if (phase !== "card" || isMoving || !cardPresentStep || cardPresentStep === "ready") {
    return null;
  }

  const label =
    cardPresentStep === "approach"
      ? "Piece landed — drawing a card…"
      : "Flipping from the deck…";

  return (
    <div className="card-draw-hint" aria-live="polite">
      <span className="card-draw-hint-pill">{label}</span>
    </div>
  );
}

export function GameHud() {
  useCardPresentation();

  const started = useBoardStore((s) => s.started);
  const phase = useBoardStore((s) => s.phase);
  const turn = useBoardStore((s) => s.turn);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);
  const pieceIcons = useBoardStore((s) => s.pieceIcons);
  const activeRoles = useBoardStore((s) => s.activeRoles);
  const winner = useBoardStore((s) => s.winner);
  const lastRolls = useBoardStore((s) => s.lastRolls);
  const isSolo = useBoardStore((s) => s.isSolo);
  const isMoving = useBoardStore((s) => s.isMoving);

  if (!started) {
    return <LobbyHud />;
  }

  const myTurn = turn === myRole;
  const rollLabel = lastRolls
    ? `${lastRolls.die1} + ${lastRolls.die2} = ${lastRolls.total}`
    : null;

  return (
    <div className="game-hud">
      <GaynessMeter winScore={WIN_SCORE} />

      <div className="hud-top">
        {activeRoles.map((role) => (
          <div
            key={role}
            className={"hud-player" + (turn === role && !winner ? " is-turn" : "")}
          >
            <span className="hud-piece">{pieceIcons[role] || "🍇"}</span>
            <span className="hud-name">
              {names[role] || role}
              {role === myRole ? " (you)" : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="hud-status">
        {winner ? (
          <span className="hud-pill hud-pill-win">🏆 Max gayness at {WIN_SCORE}!</span>
        ) : phase === "reveal" ? (
          <span className="hud-pill hud-pill-card">✨ Revealing answers…</span>
        ) : phase === "textVote" ? (
          <span className="hud-pill hud-pill-card">✍️ Vote if answers match!</span>
        ) : phase === "wager" ? (
          <span className="hud-pill hud-pill-card">🎰 Tats is wagering fruit!</span>
        ) : phase === "card" ? (
          <span className="hud-pill hud-pill-card">🃏 Answer the card!</span>
        ) : isMoving ? (
          <span className="hud-pill hud-pill-active">🎲 Rolling & moving…</span>
        ) : myTurn ? (
          <span className="hud-pill hud-pill-active">Your turn — roll both dice!</span>
        ) : (
          <span className="hud-pill">Waiting for {names[turn] || turn}…</span>
        )}
        {rollLabel ? (
          <span className="hud-pill">🎲 {rollLabel}</span>
        ) : null}
      </div>

      {phase === "wager" && !isMoving ? <WagerModal /> : null}
      {phase === "textVote" && !isMoving ? <TextMatchVoteModal /> : null}
      {phase === "card" && !isMoving ? <CardModal /> : null}
      {phase === "card" && !isMoving ? <CardDrawHint /> : null}
      {phase === "reveal" && !isMoving ? <RevealScreen /> : null}
      <RollResultOverlay />

      <div className="hud-bottom">
        {!winner && phase !== "card" && phase !== "reveal" && phase !== "wager" && phase !== "textVote" ? (
          <button
            type="button"
            className={"hud-btn hud-btn-roll" + (myTurn && !isMoving ? " is-ready" : "")}
            disabled={!myTurn || isMoving}
            onClick={() => postToParent({ type: "gfAction", action: "roll" })}
          >
            🎲🎲 Roll Dice
          </button>
        ) : null}
      </div>
    </div>
  );
}
