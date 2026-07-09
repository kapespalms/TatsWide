import { useState } from "react";
import { useBoardStore } from "./store.js";
import { postToParent } from "./arenaBridge.js";
import { RevealScreen } from "./RevealScreen.jsx";

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

function CardModal() {
  const activeCard = useBoardStore((s) => s.activeCard);
  const cardMode = useBoardStore((s) => s.cardMode);
  const cardFor = useBoardStore((s) => s.cardFor);
  const cardAnswers = useBoardStore((s) => s.cardAnswers);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);
  const isSolo = useBoardStore((s) => s.isSolo);
  const activeRoles = useBoardStore((s) => s.activeRoles);

  if (!activeCard) return null;

  const picked = cardAnswers[myRole];
  const isUltimate = activeCard.cardKind === "ultimate";
  const challenge = activeCard.challenge;
  const isBetrayal = challenge?.challengeType === "betrayal";
  const isConfirm = activeCard.type === "confirm";
  const isText = activeCard.type === "text";
  const isMc = activeCard.type === "mc" || Array.isArray(activeCard.options);

  let modeLabel = "Answer about yourself";
  if (cardMode === "partner") modeLabel = "Answer about your partner";
  if (isUltimate) modeLabel = "Ultimate challenge — both participate!";
  if (isBetrayal) modeLabel = "Choose secretly — reveal together!";

  const title = isUltimate
    ? challenge?.title || "⚡ Ultimate Challenge"
    : cardMode === "partner"
      ? "💞 Partner Card"
      : isText
        ? "✍️ Open Answer"
        : "🪞 Self Card";

  return (
    <div className="hud-card-modal">
      <div
        className={
          "hud-card-sheet card-enter" + (isUltimate ? " ultimate-card-glow" : "")
        }
      >
        <p className="hud-card-mode">{modeLabel}</p>
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
              {cardAnswers[r]
                ? isText
                  ? " ✓"
                  : ` (${cardAnswers[r]}) ✓`
                : " …"}
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

export function GameHud() {
  const started = useBoardStore((s) => s.started);
  const phase = useBoardStore((s) => s.phase);
  const turn = useBoardStore((s) => s.turn);
  const myRole = useBoardStore((s) => s.myRole);
  const names = useBoardStore((s) => s.names);
  const teamScore = useBoardStore((s) => s.teamScore);
  const pieceIcons = useBoardStore((s) => s.pieceIcons);
  const activeRoles = useBoardStore((s) => s.activeRoles);
  const winner = useBoardStore((s) => s.winner);
  const lastRolls = useBoardStore((s) => s.lastRolls);
  const isSolo = useBoardStore((s) => s.isSolo);

  if (!started) {
    return <LobbyHud />;
  }

  const myTurn = turn === myRole;
  const rollLabel = lastRolls
    ? `${lastRolls.die1} + ${lastRolls.die2} = ${lastRolls.total}`
    : null;

  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="hud-team-score">
          <span className="hud-team-label">Team Fruit</span>
          <span className="hud-team-grapes">
            {"🍇".repeat(Math.min(teamScore || 0, 12))}
          </span>
          <span className="hud-score-num">
            {teamScore || 0}/{WIN_SCORE}
          </span>
        </div>
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
          <span className="hud-pill hud-pill-win">🏆 Team wins at {WIN_SCORE} fruit!</span>
        ) : phase === "reveal" ? (
          <span className="hud-pill hud-pill-card">✨ Revealing answers…</span>
        ) : phase === "card" ? (
          <span className="hud-pill hud-pill-card">🃏 Answer the card!</span>
        ) : myTurn ? (
          <span className="hud-pill hud-pill-active">Your turn — roll both dice!</span>
        ) : (
          <span className="hud-pill">Waiting for {names[turn] || turn}…</span>
        )}
        {rollLabel ? (
          <span className="hud-pill">🎲 {rollLabel}</span>
        ) : null}
      </div>

      {phase === "card" ? <CardModal /> : null}
      {phase === "reveal" ? <RevealScreen /> : null}

      <div className="hud-bottom">
        {!winner && phase !== "card" && phase !== "reveal" ? (
          <button
            type="button"
            className={"hud-btn hud-btn-roll" + (myTurn ? " is-ready" : "")}
            disabled={!myTurn}
            onClick={() => postToParent({ type: "gfAction", action: "roll" })}
          >
            🎲🎲 Roll Dice
          </button>
        ) : null}
      </div>
    </div>
  );
}
