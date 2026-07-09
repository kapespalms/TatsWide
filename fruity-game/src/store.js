import { create } from "zustand";

export const useBoardStore = create((set) => ({
  ready: false,

  chars: { host: "tats", joiner: "wideass" },
  activeRoles: ["host", "joiner"],
  myRole: "host",
  names: { host: "Host", joiner: "Partner" },
  isSolo: false,

  started: false,
  phase: "setup",
  turn: "host",
  cardFor: null,
  cardMode: null,
  focusIndex: 0,
  positions: { host: 0, joiner: 0 },
  pieces: { host: null, joiner: null },
  pieceIcons: { host: "🍇", joiner: "🍇" },
  teamScore: 0,
  scores: { host: 0, joiner: 0 },
  eggplants: { host: 3, joiner: 3 },
  activeCard: null,
  cardAnswers: { host: null, joiner: null },
  cardReveal: null,
  answered: { host: false, joiner: false },
  eggplantActive: false,
  lastRoll: null,
  lastRolls: null,
  lastMover: null,
  rollTick: 0,
  rollSeq: 0,
  spinSeq: 0,
  winner: null,
  lobby: null,
  isMoving: false,
  rollAnim: null,
  rollStep: null,
  cameraFollowIndex: null,
  cardPresentStep: null,
  chars: { host: "tats", joiner: "wideass" },
  wagerRole: null,
  cardWager: null,
  textMatchVotes: null,
  pendingWagerPrompt: false,

  setReady: (ready) => set({ ready }),
  setSession: (data) =>
    set((s) => ({
      ...s,
      chars: data.chars || s.chars,
      activeRoles: data.activeRoles || s.activeRoles,
      myRole: data.myRole || s.myRole,
      names: data.names || s.names,
      isSolo: !!data.isSolo,
    })),
  bumpSpin: () => set((s) => ({ spinSeq: s.spinSeq + 1 })),
  applyBoard: (snap) =>
    set((s) => {
      const tick = typeof snap.rollTick === "number" ? snap.rollTick : s.rollTick;
      const rollChanged = tick > s.rollTick;

      const inCardFlow =
        snap.phase === "card" || snap.phase === "reveal" || snap.phase === "textVote" || snap.phase === "wager";

      const next = {
        ...s,
        started: !!snap.started,
        phase: snap.phase || s.phase,
        turn: snap.turn || s.turn,
        cardFor: inCardFlow ? snap.cardFor ?? s.cardFor : null,
        cardMode: inCardFlow ? snap.cardMode ?? s.cardMode : null,
        focusIndex:
          typeof snap.focusIndex === "number" ? snap.focusIndex : s.focusIndex,
        positions: snap.positions || s.positions,
        pieces: snap.pieces || s.pieces,
        pieceIcons: snap.pieceIcons || s.pieceIcons,
        teamScore: typeof snap.teamScore === "number" ? snap.teamScore : s.teamScore,
        scores: snap.scores || s.scores,
        eggplants: snap.eggplants || s.eggplants,
        activeCard: inCardFlow ? snap.activeCard || s.activeCard : null,
        cardAnswers: inCardFlow
          ? snap.cardAnswers || s.cardAnswers
          : { host: null, joiner: null },
        cardReveal: snap.phase === "reveal" ? snap.cardReveal || s.cardReveal : null,
        answered: snap.answered || s.answered,
        eggplantActive: !!snap.eggplantActive,
        winner: snap.winner ?? s.winner,
        activeRoles: snap.activeRoles || s.activeRoles,
        myRole: snap.myRole || s.myRole,
        names: snap.names || s.names,
        chars: snap.chars || s.chars,
        isSolo: snap.isSolo != null ? !!snap.isSolo : s.isSolo,
        lobby: snap.lobby || s.lobby,
        isMoving: !!snap.isMoving,
        rollAnim: snap.rollAnim || null,
        rollStep: snap.rollStep || null,
        cameraFollowIndex: snap.isMoving
          ? snap.cameraFollowIndex ?? s.cameraFollowIndex
          : null,
        cardPresentStep:
          snap.phase === "card" ? s.cardPresentStep : null,
        wagerRole: snap.wagerRole ?? null,
        cardWager: snap.cardWager ?? null,
        textMatchVotes: snap.textMatchVotes || null,
        pendingWagerPrompt: !!snap.pendingWagerPrompt,
      };

      if (rollChanged) {
        next.lastRoll = snap.lastRoll;
        next.lastRolls = snap.lastRolls || null;
        next.lastMover = snap.lastMover;
        next.rollTick = tick;
        next.rollSeq = s.rollSeq + 1;
      }

      return next;
    }),
}));
