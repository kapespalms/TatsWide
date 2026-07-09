import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "./store.js";

const WIN_SCORE = 10;

const UP_PHRASES = [
  "SLAY INCREASED",
  "GAYGER DETECTED",
  "FRUIT UP!!",
  "YASSSS",
  "ALIGNMENT ACHIEVED",
  "CHAOTICALLY GAY",
];

const DOWN_PHRASES = [
  "GAYNESS LEAK",
  "FRUIT RUG PULLED",
  "DEVASTATING",
  "NOT ALIGNING",
  "ROTTEN VIBES",
  "METER CRASH",
];

const UP_EMOJIS = ["🏳️‍🌈", "💅", "✨", "🍇", "💖", "🌈", "💋", "🔥", "🦄"];
const DOWN_EMOJIS = ["💀", "😭", "📉", "🍎", "🥀", "⚰️", "🧊"];

function pick(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function makeParticles(delta, dir, seed) {
  const emojis = dir === "up" ? UP_EMOJIS : DOWN_EMOJIS;
  const count = Math.min(14, Math.max(5, Math.abs(delta) * 4));
  return Array.from({ length: count }, (_, i) => ({
    id: seed + i,
    emoji: pick(emojis, seed + i * 7),
    left: 8 + ((seed + i * 13) % 84),
    delay: (i * 0.05) % 0.35,
    rot: ((seed + i * 11) % 80) - 40,
    scale: 0.85 + ((seed + i) % 5) * 0.12,
  }));
}

export function GaynessMeter({ winScore = WIN_SCORE }) {
  const teamScore = useBoardStore((s) => s.teamScore);
  const prevScore = useRef(teamScore);
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    const prev = prevScore.current;
    if (teamScore === prev) return;

    const delta = teamScore - prev;
    const dir = delta >= 0 ? "up" : "down";
    const seed = Date.now();
    const phrases = dir === "up" ? UP_PHRASES : DOWN_PHRASES;

    setBurst({
      key: seed,
      dir,
      delta,
      phrase: pick(phrases, seed + delta),
      particles: makeParticles(delta, dir, seed),
    });

    prevScore.current = teamScore;

    const ms = Math.min(2800, 1600 + Math.abs(delta) * 180);
    const timer = setTimeout(() => setBurst(null), ms);
    return () => clearTimeout(timer);
  }, [teamScore]);

  const pct = Math.min(100, Math.max(0, (teamScore / winScore) * 100));
  const burstClass = burst ? ` is-burst-${burst.dir}` : "";
  const bigSwing = burst && Math.abs(burst.delta) >= 3;

  return (
    <div
      className={"gayness-meter" + burstClass + (bigSwing ? " is-mega-swing" : "")}
      aria-live="polite"
      aria-label={`Gayness meter ${teamScore} out of ${winScore}`}
    >
      {burst ? (
        <div className="gayness-meter-strobe" aria-hidden key={burst.key} />
      ) : null}

      <div className="gayness-meter-inner">
        <div className="gayness-meter-head">
          <span className="gayness-meter-label">Gayness Meter</span>
          <span className="gayness-meter-score">
            {teamScore}
            <span className="gayness-meter-of">/{winScore}</span>
          </span>
        </div>

        <div className="gayness-meter-track">
          <div
            className="gayness-meter-fill"
            style={{ width: `${pct}%` }}
          />
          <div className="gayness-meter-sparkle" aria-hidden />
        </div>

        <div className="gayness-meter-grapes">
          {"🍇".repeat(Math.min(teamScore, winScore))}
          {teamScore === 0 ? (
            <span className="gayness-meter-empty">…crickets…</span>
          ) : null}
        </div>
      </div>

      {burst ? (
        <>
          <div className={"gayness-meter-burst gayness-meter-burst-" + burst.dir}>
            <span className="gayness-meter-burst-delta">
              {burst.delta > 0 ? "+" : ""}
              {burst.delta}
            </span>
            <span className="gayness-meter-burst-phrase">{burst.phrase}</span>
          </div>
          <div className="gayness-meter-particles" aria-hidden>
            {burst.particles.map((p) => (
              <span
                key={p.id}
                className="gayness-meter-particle"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  transform: `rotate(${p.rot}deg) scale(${p.scale})`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
