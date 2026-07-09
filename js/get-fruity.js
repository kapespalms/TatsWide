/**
 * Get Fruity — Tats & Wideass battle for truth and fruit!
 * Monopoly-style 36-space board, 7 question types × 2 per lap, first to 10 wins.
 */
window.GetFruityGame = (function () {
  "use strict";

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  const WIN_SCORE = 10;
  const START_EGGPLANTS = 3;
  const PARTNER_PATH_CHANCE = 0.22;
  const REVEAL_ANSWERS_MS = 3000;
  const REVEAL_VERDICT_MS = 3200;
  const REVEAL_SCORE_MS = 2600;

  const FRUIT_META = {
    chaos: { icon: "🎴", label: "Chaos", color: "#e11d48" },
    brain: { icon: "🧠", label: "Same Brain", color: "#7c3aed" },
    lore: { icon: "🎙️", label: "Lore", color: "#2563eb" },
    thisorthat: { icon: "⚡", label: "This or That", color: "#d97706" },
    closer: { icon: "💬", label: "Closer", color: "#db2777" },
    neverever: { icon: "🙈", label: "Never Ever", color: "#059669" },
    wouldrather: { icon: "🤔", label: "Would You Rather", color: "#0891b2" }
  };

  const PIECES = [
    { id: "birkenstock", icon: "🩴", label: "Birkenstock" },
    { id: "book", icon: "📚", label: "Gay Book" },
    { id: "mouse", icon: "🖱️", label: "Computer Mouse" },
    { id: "tjbag", icon: "🛍️", label: "Trader Joe's Bag" },
    { id: "sock", icon: "🧦", label: "Sock" },
    { id: "fry", icon: "🍟", label: "French Fry" }
  ];

  const FLAIR_TEMPLATES = [
    "{name} Got a Fruit!!!",
    "So fruity! {name} scores!",
    "{name} is collecting!",
    "Juicy move by {name}!",
    "{name} grabbed a fruit! 🍇",
    "FRUIT ALERT: {name}!!!",
    "The fruitiest: {name}!"
  ];

  const SPACES = [
    { kind: "golden", label: "Golden Banana", icon: "🍌" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "chaos" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "brain" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "lore" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "thisorthat" },
    { kind: "rotten", label: "Rotten Apple", icon: "🍎" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "closer" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "neverever" },
    { kind: "path", label: "Stroll" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "wouldrather" },
    { kind: "path", label: "Stroll" },
    { kind: "golden", label: "Golden Banana", icon: "🍌" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "chaos" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "brain" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "lore" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "thisorthat" },
    { kind: "rotten", label: "Rotten Apple", icon: "🍎" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "closer" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "neverever" },
    { kind: "path", label: "Stroll" },
    { kind: "path", label: "Stroll" },
    { kind: "fruit", fruit: "wouldrather" },
    { kind: "path", label: "Stroll" }
  ];

  let api = null;
  let flairTimer = null;
  let activeFlair = null;

  /* ---- 3D board (iframe visualizer at /fruity/) ---- */
  const FRUITY_SRC = "/fruity/";
  const ARENA_SOURCE = "wideass-arena";
  let boardFrame = null;
  let boardHost = null;
  let uiLayer = null;
  let frameListener = null;
  let boardRollTick = 0;
  let lastMoveKey = "";
  let revealTimer = null;
  let landingTimer = null;
  let appliedQuestionSeed = null;

  const DICE_ANIM_MS = 1900;
  const HOP_ANIM_MS = 420;
  const LANDING_SETTLE_MS = 550;

  const state = {
    started: false,
    phase: "setup",
    turn: "host",
    teamScore: 0,
    scores: { host: 0, joiner: 0 },
    positions: { host: 0, joiner: 0 },
    pieces: { host: null, joiner: null },
    eggplants: { host: START_EGGPLANTS, joiner: START_EGGPLANTS },
    lastRoll: null,
    lastRolls: null,
    lastMover: null,
    activeCard: null,
    cardFor: null,
    cardMode: null,
    cardAnswers: { host: null, joiner: null },
    cardReveal: null,
    answered: { host: false, joiner: false },
    eggplantActive: false,
    eggplantPlayedBy: null,
    winner: null,
    flair: null,
    mode: "duo",
    soloPlayer: null,
    skipRollFor: null,
    isMoving: false,
    rollAnim: null,
    rollStep: null,
    cameraFollowIndex: null,
    questionSeed: null
  };

  function myRole() { return api.myRole(); }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }
  function nameFor(role) { return api.nameForRole(role); }
  function requiresPartner() { return api.requiresPartnerToStart && api.requiresPartnerToStart(); }
  function lobbySolo() { return api.isSoloPlay && api.isSoloPlay(); }
  function isSolo() { return state.started ? state.mode === "solo" : lobbySolo(); }
  function activeRoles() { return isSolo() ? [state.soloPlayer || myRole()] : ["host", "joiner"]; }

  function freshState() {
    return {
      started: false,
      phase: "setup",
      turn: "host",
      teamScore: 0,
      scores: { host: 0, joiner: 0 },
      positions: { host: 0, joiner: 0 },
      pieces: { host: null, joiner: null },
      eggplants: { host: START_EGGPLANTS, joiner: START_EGGPLANTS },
      lastRoll: null,
      lastRolls: null,
      lastMover: null,
      activeCard: null,
      cardFor: null,
      cardMode: null,
      cardAnswers: { host: null, joiner: null },
      cardReveal: null,
      answered: { host: false, joiner: false },
      eggplantActive: false,
      eggplantPlayedBy: null,
      winner: null,
      flair: null,
      mode: "duo",
      soloPlayer: null,
      skipRollFor: null,
      isMoving: false,
      rollAnim: null,
      rollStep: null,
      cameraFollowIndex: null,
      questionSeed: null,
      questionsAsked: 0,
      wagerSlot: 2,
      wagerUsed: false,
      wagerRole: null,
      pendingWager: null,
      cardWager: null,
      textMatchVotes: { host: null, joiner: null }
    };
  }

  function tatsRole() {
    const chars = arenaChars();
    if (chars.host === "tats") return "host";
    if (chars.joiner === "tats") return "joiner";
    return null;
  }

  function isQuestionCard(card) {
    if (!card) return false;
    if (card.cardKind === "question") return true;
    return card.type === "mc" || card.type === "text";
  }

  function isTextCardActive() {
    return !!(state.activeCard && state.activeCard.type === "text");
  }

  function wagerBonus() {
    return (state.cardWager && state.cardWager.amount) || 0;
  }

  function scoreDeltaForMatch(match) {
    const bonus = wagerBonus();
    return match ? 1 + bonus : -(1 + bonus);
  }

  function generateRpsReveal(seed) {
    const picks = ["rock", "paper", "scissors"];
    const hostPick = picks[Math.abs(seed) % 3];
    const joinerPick = picks[Math.abs(seed + 7) % 3];
    function winner(a, b) {
      if (a === b) return "tie";
      if (
        (a === "rock" && b === "scissors") ||
        (a === "scissors" && b === "paper") ||
        (a === "paper" && b === "rock")
      ) {
        return "host";
      }
      return "joiner";
    }
    return { hostPick: hostPick, joinerPick: joinerPick, winner: winner(hostPick, joinerPick) };
  }

  function bothTextVotesIn() {
    if (isSolo()) return true;
    return !!(state.textMatchVotes.host && state.textMatchVotes.joiner);
  }

  function applyQuestionShuffle() {
    if (!state.questionSeed || state.questionSeed === appliedQuestionSeed) return;
    appliedQuestionSeed = state.questionSeed;
    if (window.FruityQuestions && FruityQuestions.shuffleDecks) {
      FruityQuestions.shuffleDecks(state.questionSeed);
    }
  }

  function maskedCardAnswersForViewer() {
    const mine = myRole();
    if (isSolo()) {
      return Object.assign({}, state.cardAnswers);
    }
    if (state.phase === "textVote" || state.phase === "reveal" || state.phase === "ended") {
      return Object.assign({}, state.cardAnswers);
    }
    return {
      host: mine === "host" ? state.cardAnswers.host : null,
      joiner: mine === "joiner" ? state.cardAnswers.joiner : null
    };
  }

  function exportPayload() {
    return {
      started: state.started,
      phase: state.phase,
      turn: state.turn,
      teamScore: state.teamScore,
      scores: Object.assign({}, state.scores),
      positions: Object.assign({}, state.positions),
      pieces: Object.assign({}, state.pieces),
      eggplants: Object.assign({}, state.eggplants),
      lastRoll: state.lastRoll,
      lastRolls: state.lastRolls,
      lastMover: state.lastMover,
      activeCard: state.activeCard,
      cardFor: state.cardFor,
      cardMode: state.cardMode,
      cardAnswers: Object.assign({}, state.cardAnswers),
      cardReveal: state.cardReveal,
      answered: Object.assign({}, state.answered),
      eggplantActive: state.eggplantActive,
      eggplantPlayedBy: state.eggplantPlayedBy,
      winner: state.winner,
      flair: state.flair,
      mode: state.mode,
      soloPlayer: state.soloPlayer,
      skipRollFor: state.skipRollFor,
      isMoving: state.isMoving,
      rollAnim: state.rollAnim,
      rollStep: state.rollStep,
      cameraFollowIndex: state.cameraFollowIndex,
      questionSeed: state.questionSeed,
      questionsAsked: state.questionsAsked,
      wagerSlot: state.wagerSlot,
      wagerUsed: state.wagerUsed,
      wagerRole: state.wagerRole,
      pendingWager: state.pendingWager,
      cardWager: state.cardWager,
      textMatchVotes: Object.assign({}, state.textMatchVotes)
    };
  }

  function importPayload(p) {
    if (!p) return;
    Object.assign(state, freshState(), p);
    applyQuestionShuffle();
    if (typeof state.teamScore !== "number") {
      state.teamScore = Math.max(state.scores.host || 0, state.scores.joiner || 0);
    }
    state.scores.host = state.teamScore;
    state.scores.joiner = state.teamScore;
    if (!state.cardAnswers) state.cardAnswers = { host: null, joiner: null };
    if (!state.textMatchVotes) state.textMatchVotes = { host: null, joiner: null };
    if (!state.lastRolls && state.lastRoll) {
      state.lastRolls = { die1: state.lastRoll, die2: 0, total: state.lastRoll };
    }
  }

  function sync(extra) {
    send({ type: "gfSync", payload: Object.assign(exportPayload(), extra || {}) });
  }

  function pieceById(id) {
    return PIECES.find(function (p) { return p.id === id; }) || null;
  }

  function takenPieces() {
    const taken = [];
    if (state.pieces.host) taken.push(state.pieces.host);
    if (state.pieces.joiner) taken.push(state.pieces.joiner);
    return taken;
  }

  function bothPiecesPicked() {
    return !!(state.pieces.host && state.pieces.joiner);
  }

  function readyToStart() {
    if (lobbySolo()) return !!state.pieces[myRole()];
    return bothPiecesPicked();
  }

  function spaceGridPos(i) {
    if (i === 0) return { r: 9, c: 0 };
    if (i >= 1 && i <= 8) return { r: 9, c: i };
    if (i === 9) return { r: 9, c: 9 };
    if (i >= 10 && i <= 17) return { r: 17 - i, c: 9 };
    if (i === 18) return { r: 0, c: 9 };
    if (i >= 19 && i <= 26) return { r: 0, c: 27 - i };
    if (i === 27) return { r: 0, c: 0 };
    if (i >= 28 && i <= 35) return { r: i - 27, c: 0 };
    return { r: 0, c: 0 };
  }

  function movePosition(from, steps) {
    return (from + steps) % SPACES.length;
  }

  function hopCount(from, to) {
    let cur = from;
    let n = 0;
    while (cur !== to) {
      cur = (cur + 1) % SPACES.length;
      n++;
    }
    return n;
  }

  function landingAnimMs(from, to) {
    return DICE_ANIM_MS + hopCount(from, to) * HOP_ANIM_MS + LANDING_SETTLE_MS;
  }

  function rollAnimMovePiece() {
    landingTimer = null;
    if (!state.rollAnim) return;
    state.rollStep = "move";
    state.cameraFollowIndex = state.rollAnim.from;
    state.positions[state.rollAnim.role] = state.rollAnim.to;
    sync();
    render();
    const hops = hopCount(state.rollAnim.from, state.rollAnim.to);
    const moveMs = hops * HOP_ANIM_MS + LANDING_SETTLE_MS;
    landingTimer = setTimeout(function () {
      landingTimer = null;
      rollAnimFinish();
    }, moveMs);
  }

  function rollAnimFinish() {
    landingTimer = null;
    if (!state.rollAnim) {
      state.isMoving = false;
      state.rollStep = null;
      state.cameraFollowIndex = null;
      sync();
      render();
      return;
    }
    const role = state.rollAnim.role;
    const to = state.rollAnim.to;
    state.rollAnim = null;
    state.rollStep = null;
    state.isMoving = false;
    state.cameraFollowIndex = null;
    resolveLanding(role, to);
    sync();
    render();
  }

  function cancelLandingTimer() {
    if (landingTimer) {
      clearTimeout(landingTimer);
      landingTimer = null;
    }
  }

  function rollTwoDice() {
    const die1 = 1 + Math.floor(Math.random() * 6);
    const die2 = 1 + Math.floor(Math.random() * 6);
    return { die1: die1, die2: die2, total: die1 + die2 };
  }

  function bumpTeamScore(delta) {
    state.teamScore = Math.max(0, (state.teamScore || 0) + delta);
    state.scores.host = state.teamScore;
    state.scores.joiner = state.teamScore;
    if (state.teamScore >= WIN_SCORE) {
      state.winner = "team";
      state.phase = "ended";
    }
  }

  function bumpScore(role, delta) {
    bumpTeamScore(delta);
  }

  function flairText(name, idx) {
    const tpl = FLAIR_TEMPLATES[idx % FLAIR_TEMPLATES.length];
    return tpl.replace("{name}", name);
  }

  function showFlairOverlay(flair) {
    if (!flair || !flair.text) return;
    activeFlair = flair;
    if (flairTimer) clearTimeout(flairTimer);
    const existing = document.querySelector(".gf-flair-pop");
    if (existing) existing.remove();
    const pop = el("div", "gf-flair-pop");
    pop.appendChild(el("span", "gf-flair-emoji", "🍇"));
    pop.appendChild(el("strong", null, flair.text));
    if (flair.body) {
      pop.appendChild(el("p", "gf-flair-body", flair.body));
    }
    document.body.appendChild(pop);
    requestAnimationFrame(function () { pop.classList.add("is-visible"); });
    flairTimer = setTimeout(function () {
      pop.classList.remove("is-visible");
      setTimeout(function () { pop.remove(); }, 320);
    }, 2600);
    render();
  }

  function awardFruit(flairIdx) {
    bumpTeamScore(1);
    const idx = typeof flairIdx === "number" ? flairIdx : Math.floor(Math.random() * FLAIR_TEMPLATES.length);
    state.flair = { text: "Team Fruit +1! 🍇", idx: idx, role: "team" };
    sync();
    showFlairOverlay(state.flair);
    if (state.winner) {
      celebrate("You are the fruitiest team! 🍇", "First to " + WIN_SCORE + " shared fruits wins!");
    }
  }

  function drawSelfQuestion() {
    if (window.FruityQuestions && FruityQuestions.drawSelf) {
      return FruityQuestions.drawSelf();
    }
    return {
      mode: "self",
      type: "mc",
      id: "fallback_self",
      prompt: "What is my vibe when plans change at the last minute?",
      options: [
        { id: "A", text: "Thrive — chaos is my love language." },
        { id: "B", text: "Quietly spiral but pretend I'm fine." },
        { id: "C", text: "Immediately suggest a better plan." },
        { id: "D", text: "Cancel everything and go to bed." }
      ]
    };
  }

  function drawPartnerQuestion() {
    if (window.FruityQuestions && FruityQuestions.drawPartner) {
      return FruityQuestions.drawPartner();
    }
    return drawSelfQuestion();
  }

  function drawFruitCard() {
    if (window.FruityQuestions && FruityQuestions.drawFruitCard) {
      return FruityQuestions.drawFruitCard();
    }
    return drawSelfQuestion();
  }

  function answersMatch(a, b) {
    if (window.FruityQuestions && FruityQuestions.answersMatch) {
      return FruityQuestions.answersMatch(a, b, state.activeCard);
    }
    return a === b;
  }

  function resolveWatermelonEvent(role, event) {
    if (event.pointModifier) bumpTeamScore(event.pointModifier);
    if (event.spaceModifier) {
      state.positions[role] = movePosition(state.positions[role], event.spaceModifier);
    }
    if (event.skipNextRoll) state.skipRollFor = role;
    state.flair = {
      text: event.eventTitle || "🍉 Watermelon Event!",
      idx: 0,
      role: "team",
      body: event.eventText
    };
    sync();
    showFlairOverlay(state.flair);
    if (state.winner) {
      celebrate("You are the fruitiest team! 🍇", "First to " + WIN_SCORE + " shared fruits wins!");
      return;
    }
    clearCardPhase();
    sync();
  }

  function resolveUltimateOutcome() {
    const card = state.activeCard;
    if (!card || card.cardKind !== "ultimate" || !card.challenge) return;
    const c = card.challenge;
    const match = state.cardReveal && state.cardReveal.match;

    if (c.challengeType === "betrayal") {
      const h = state.cardAnswers.host;
      const j = state.cardAnswers.joiner;
      if (h === "SHARE" && j === "SHARE") {
        bumpTeamScore(4);
        state.flair = { text: "Both shared! +4 team fruit! 🍇", idx: 0, role: "team" };
        showFlairOverlay(state.flair);
      } else if (h === "STEAL" && j === "STEAL") {
        state.teamScore = 0;
        state.scores.host = 0;
        state.scores.joiner = 0;
        state.positions.host = 0;
        state.positions.joiner = 0;
        state.flair = { text: "Both stole! Score wiped — back to START! 💥", idx: 0, role: "team" };
        showFlairOverlay(state.flair);
      } else if (h && j) {
        bumpTeamScore(-2);
        state.flair = { text: "Betrayal! -2 team fruit. Chaos King crowned. 👑", idx: 0, role: "team" };
        showFlairOverlay(state.flair);
      }
      return;
    }

    if (c.challengeType === "roulette" && isGameHost()) {
      if (Math.random() < 0.17) {
        bumpTeamScore(-3);
        state.flair = { text: "SPLAT! -3 fruit! 🎰", idx: 0, role: "team" };
      } else {
        const role = state.cardFor || state.turn;
        state.positions[role] = movePosition(state.positions[role], 5);
        state.flair = { text: "Roulette win! Teleport +5 spaces! 🎲", idx: 0, role: "team" };
      }
      showFlairOverlay(state.flair);
      return;
    }

    if (c.challengeType === "social_hijack" && match) {
      bumpTeamScore(c.reward || 2);
      state.flair = { text: "Public exhibition cleared! +" + (c.reward || 2) + " fruit! 📸", idx: 0, role: "team" };
      showFlairOverlay(state.flair);
      return;
    }

    if (match) {
      const bonus = c.reward || (c.challengeType === "telepathy" ? 3 : 2);
      bumpTeamScore(bonus);
      state.flair = { text: "Ultimate cleared! +" + bonus + " fruit! ⚡", idx: 0, role: "team" };
      showFlairOverlay(state.flair);
      return;
    }

    if (c.penalty) {
      bumpTeamScore(c.penalty);
      state.flair = { text: "Ultimate failed! " + c.penalty + " fruit 💀", idx: 0, role: "team" };
      showFlairOverlay(state.flair);
    }
  }

  function cancelRevealTimer() {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  }

  function clearCardPhase() {
    cancelLandingTimer();
    cancelRevealTimer();
    state.rollAnim = null;
    state.rollStep = null;
    state.isMoving = false;
    state.cameraFollowIndex = null;
    state.activeCard = null;
    state.cardFor = null;
    state.cardMode = null;
    state.cardAnswers = { host: null, joiner: null };
    state.cardReveal = null;
    state.answered = { host: false, joiner: false };
    state.textMatchVotes = { host: null, joiner: null };
    state.pendingWager = null;
    state.wagerRole = null;
    state.cardWager = null;
    state.eggplantActive = false;
    state.eggplantPlayedBy = null;
    state.phase = state.winner ? "ended" : "playing";
    if (!isSolo()) {
      state.turn = state.turn === "host" ? "joiner" : "host";
    }
  }

  function beginQuestionCard(role, card) {
    state.phase = "card";
    state.cardFor = role;
    state.activeCard = card;
    state.cardMode = card.mode || "self";
    state.cardAnswers = { host: null, joiner: null };
    state.textMatchVotes = { host: null, joiner: null };
    state.answered = { host: false, joiner: false };
  }

  function maybeStartQuestionCard(role, card) {
    state.questionsAsked = (state.questionsAsked || 0) + 1;
    const tats = tatsRole();
    const needsWager =
      !isSolo() &&
      !state.wagerUsed &&
      tats &&
      isQuestionCard(card) &&
      state.questionsAsked >= (state.wagerSlot || 2);
    if (needsWager) {
      state.phase = "wager";
      state.wagerRole = tats;
      state.cardFor = role;
      state.pendingWager = { role: role, card: card };
      state.cardWager = null;
      sync();
      return;
    }
    beginQuestionCard(role, card);
  }

  function applyWagerAndStart(amount) {
    if (state.phase !== "wager" || !state.pendingWager) return;
    const maxWager = Math.min(5, state.teamScore || 0);
    const n = Math.max(0, Math.min(maxWager, Math.floor(Number(amount) || 0)));
    state.cardWager = { amount: n, role: state.wagerRole };
    state.wagerUsed = true;
    const pending = state.pendingWager;
    state.pendingWager = null;
    state.wagerRole = null;
    beginQuestionCard(pending.role, pending.card);
    sync();
    render();
  }

  function submitWager(amount) {
    if (state.phase !== "wager") return;
    if (myRole() !== state.wagerRole) {
      toast("Waiting for Tats to set the fruit wager…");
      return;
    }
    if (isGameHost()) {
      applyWagerAndStart(amount);
    } else {
      send({ type: "gfWagerRequest", payload: { amount: amount, from: myRole() } });
    }
  }

  function proceedAfterBothAnswered() {
    if (isTextCardActive() && !isSolo()) {
      state.phase = "textVote";
      state.textMatchVotes = { host: null, joiner: null };
      sync();
      render();
      return;
    }
    buildReveal();
    sync();
    scheduleRevealFinish();
  }

  function submitTextMatchVote(vote) {
    if (state.phase !== "textVote") return;
    const v = vote === "MATCH" ? "MATCH" : "NO_MATCH";
    const role = myRole();
    if (state.textMatchVotes[role]) return;
    state.textMatchVotes[role] = v;
    if (bothTextVotesIn()) {
      if (isGameHost()) {
        buildReveal();
        sync();
        scheduleRevealFinish();
      } else {
        send({
          type: "gfTextMatchVote",
          payload: { role: role, vote: v, complete: true }
        });
      }
    } else if (isGameHost()) {
      sync();
    } else {
      send({ type: "gfTextMatchVote", payload: { role: role, vote: v } });
    }
    render();
  }

  function bothPlayersAnswered() {
    if (isSolo()) {
      return !!state.cardAnswers[state.soloPlayer || myRole()];
    }
    return !!(state.cardAnswers.host && state.cardAnswers.joiner);
  }

  function answerLabel(role) {
    const choice = state.cardAnswers[role];
    if (!choice || !state.activeCard) return "?";
    if (window.FruityQuestions && FruityQuestions.optionLabel) {
      return FruityQuestions.optionLabel(state.activeCard, choice);
    }
    return choice;
  }

  function buildReveal() {
    const hostPick = state.cardAnswers.host;
    const joinerPick = state.cardAnswers.joiner;
    const match = isSolo()
      ? true
      : isTextCardActive()
        ? state.textMatchVotes.host === "MATCH" && state.textMatchVotes.joiner === "MATCH"
        : answersMatch(hostPick, joinerPick);
    const seed =
      (hostPick || "").charCodeAt(0) +
      (joinerPick || "").charCodeAt(0) +
      (state.activeCard && state.activeCard.id ? state.activeCard.id.length : 0);
    const delta = scoreDeltaForMatch(match);
    const bonus = wagerBonus();
    const flair =
      window.FruityQuestions && FruityQuestions.pickRevealFlair
        ? FruityQuestions.pickRevealFlair(match, seed)
        : {
            title: match ? "PERFECT MATCH!" : "CHAOTIC INCOMPATIBILITY!",
            sub: match
              ? "+1 gayness" + (bonus ? " (+" + bonus + " wager!)" : "") + "!"
              : "-" + (1 + bonus) + " gayness" + (bonus ? " (wager lost!)" : "") + "!",
            theme: match ? "pink" : "red"
          };
    const showRps = !isSolo() && (seed % 3 !== 1);
    state.cardReveal = {
      match: match,
      revealStep: "answers",
      hostPick: hostPick,
      joinerPick: joinerPick,
      hostLabel: isSolo() ? answerLabel(state.soloPlayer || "host") : answerLabel("host"),
      joinerLabel: isSolo() ? "" : answerLabel("joiner"),
      scoreBefore: state.teamScore || 0,
      scoreDelta: delta,
      scoreAfter: null,
      wager: bonus,
      rps: showRps ? generateRpsReveal(seed) : null,
      title: flair.title,
      sub: match
        ? flair.sub
        : flair.sub +
          " " +
          nameFor("host") +
          " picked " +
          (hostPick || "?") +
          " but " +
          nameFor("joiner") +
          " picked " +
          (joinerPick || "?") +
          ".",
      theme: flair.theme
    };
    state.phase = "reveal";
  }

  function applyRevealScoring() {
    if (!state.cardReveal || state.cardReveal.scoreApplied) return;
    if (state.cardReveal.match) {
      if (state.activeCard && state.activeCard.cardKind === "ultimate") {
        resolveUltimateOutcome();
      } else {
        bumpTeamScore(scoreDeltaForMatch(true));
      }
    } else if (state.activeCard && state.activeCard.cardKind === "ultimate") {
      resolveUltimateOutcome();
    } else {
      bumpTeamScore(scoreDeltaForMatch(false));
    }
    state.cardReveal.scoreApplied = true;
    state.cardReveal.scoreAfter = state.teamScore;
    if (state.winner) {
      celebrate("You are the fruitiest team! 🍇", "First to " + WIN_SCORE + " shared fruits wins!");
    }
  }

  function finishReveal() {
    cancelRevealTimer();
    if (!state.cardReveal) {
      clearCardPhase();
      sync();
      render();
      return;
    }
    if (!state.winner) {
      clearCardPhase();
    } else {
      state.activeCard = null;
      state.cardReveal = null;
      state.cardAnswers = { host: null, joiner: null };
    }
    sync();
    render();
  }

  function advanceRevealToVerdict() {
    if (!state.cardReveal) return;
    state.cardReveal.revealStep = "verdict";
    sync();
    render();
    revealTimer = setTimeout(advanceRevealToScore, REVEAL_VERDICT_MS);
  }

  function advanceRevealToScore() {
    if (!state.cardReveal) return;
    applyRevealScoring();
    state.cardReveal.revealStep = "score";
    sync();
    render();
    revealTimer = setTimeout(finishReveal, REVEAL_SCORE_MS);
  }

  function scheduleRevealFinish() {
    cancelRevealTimer();
    if (!isGameHost()) return;
    revealTimer = setTimeout(advanceRevealToVerdict, REVEAL_ANSWERS_MS);
  }

  function resolveLanding(role, pos) {
    const space = SPACES[pos];
    if (!space) return;
    if (space.kind === "path") {
      if (!isSolo() && Math.random() < PARTNER_PATH_CHANCE) {
        maybeStartQuestionCard(role, drawPartnerQuestion());
        sync();
        return;
      }
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "golden") {
      bumpTeamScore(1);
      const idx = Math.floor(Math.random() * FLAIR_TEMPLATES.length);
      state.flair = { text: "Golden Banana! +1 team fruit! 🍌", idx: idx, role: "team" };
      sync();
      showFlairOverlay(state.flair);
      if (state.winner) {
        celebrate("You are the fruitiest team! 🍇", "First to " + WIN_SCORE + " shared fruits wins!");
        return;
      }
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "rotten") {
      bumpTeamScore(-1);
      state.flair = { text: "Rotten Apple! -1 team fruit! 🍎", idx: 0, role: "team" };
      sync();
      showFlairOverlay(state.flair);
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "fruit") {
      const card = drawFruitCard();
      if (card.cardKind === "watermelon") {
        resolveWatermelonEvent(role, card);
        return;
      }
      if (
        card.cardKind === "ultimate" &&
        card.challenge &&
        card.challenge.challengeType === "roulette" &&
        isGameHost()
      ) {
        state.activeCard = card;
        state.cardFor = role;
        resolveUltimateOutcome();
        clearCardPhase();
        sync();
        return;
      }
      maybeStartQuestionCard(role, card);
      sync();
      return;
    }
  }

  function finishRoll(role, rolls) {
    cancelLandingTimer();
    const total = typeof rolls === "number" ? rolls : rolls.total;
    const from = state.positions[role];
    const to = movePosition(from, total);
    const die1 = typeof rolls === "object" && rolls != null ? rolls.die1 : total;
    const die2 = typeof rolls === "object" && rolls != null ? rolls.die2 : 0;

    /* Keep piece at start until dice result is shown, then hop, then land/card. */
    state.rollAnim = { role: role, from: from, to: to, die1: die1, die2: die2, total: total };
    state.rollStep = "dice";
    state.lastRolls = { die1: die1, die2: die2, total: total };
    state.lastRoll = total;
    state.lastMover = role;
    boardRollTick++;
    state.isMoving = true;
    lastMoveKey =
      role + ":" + total + ":" + from + ">" + to;

    if (state.phase === "card" || state.phase === "reveal") {
      state.activeCard = null;
      state.cardReveal = null;
      state.cardAnswers = { host: null, joiner: null };
      state.phase = "playing";
    }

    postToFrame({ type: "gfDiceSpin" });
    sync();
    render();

    landingTimer = setTimeout(function () {
      landingTimer = null;
      rollAnimMovePiece();
    }, DICE_ANIM_MS);
  }

  function rollDice() {
    if (!state.started || state.winner) return;
    if (state.isMoving) {
      toast("Wait for the dice and move to finish!");
      return;
    }
    if (state.phase === "card" || state.phase === "textVote" || state.phase === "wager" || state.phase === "reveal") {
      toast("Answer the card first!");
      return;
    }
    if (state.turn !== myRole()) {
      toast("Not your turn.");
      return;
    }
    if (state.skipRollFor === myRole()) {
      state.skipRollFor = null;
      toast("Skipped turn — couch browsing paralysis! 🛋️");
      if (!isSolo()) {
        state.turn = state.turn === "host" ? "joiner" : "host";
      }
      sync();
      render();
      return;
    }
    if (isGameHost()) {
      finishRoll(myRole(), rollTwoDice());
    } else {
      send({ type: "gfRollRequest", payload: { from: myRole() } });
    }
  }

  function submitCardAnswer(choice) {
    if (state.phase !== "card" || !choice) return;
    const role = myRole();
    if (state.cardAnswers[role]) return;

    state.cardAnswers[role] = choice;
    state.answered[role] = true;

    if (isSolo()) {
      if (isGameHost()) {
        proceedAfterBothAnswered();
      } else {
        send({ type: "gfSubmitAnswer", payload: { role: role, choice: choice } });
      }
      render();
      return;
    }

    if (bothPlayersAnswered()) {
      if (isGameHost()) {
        proceedAfterBothAnswered();
      } else {
        send({
          type: "gfSubmitAnswer",
          payload: { role: role, choice: choice, complete: true }
        });
      }
    } else if (isGameHost()) {
      sync();
    } else {
      send({ type: "gfSubmitAnswer", payload: { role: role, choice: choice } });
    }
    render();
  }

  function markAnswered() {
    submitCardAnswer("A");
  }

  function playEggplant() {
    if (!state.started || state.winner) return;
    if ((state.eggplants[myRole()] || 0) <= 0) {
      toast("No eggplant cards left!");
      return;
    }
    if (isGameHost()) {
      state.eggplants[myRole()]--;
      state.eggplantActive = true;
      state.eggplantPlayedBy = myRole();
      toast(nameFor(myRole()) + " played 🍆 — both must answer!");
      sync();
    } else {
      send({ type: "gfEggplantRequest", payload: { from: myRole() } });
    }
    render();
  }

  function pickPiece(pieceId) {
    if (state.started) return;
    const taken = takenPieces();
    if (taken.indexOf(pieceId) !== -1 && state.pieces[myRole()] !== pieceId) {
      toast("That piece is taken.");
      return;
    }
    if (isGameHost()) {
      state.pieces[myRole()] = pieceId;
      sync();
    } else {
      send({ type: "gfPieceRequest", payload: { role: myRole(), pieceId: pieceId } });
    }
    render();
  }

  function startGame() {
    if (!isGameHost()) {
      toast("Waiting for arena host to start.");
      return;
    }
    if (requiresPartner()) {
      toast("Switch to 1 Player, or wait for your partner to join.");
      return;
    }
    if (!readyToStart()) {
      toast(lobbySolo() ? "Pick a game piece to start." : "Both players need to pick a game piece.");
      return;
    }
    const solo = lobbySolo();
    const soloRole = myRole();
    const questionSeed = Math.floor(Math.random() * 2147483647);
    if (window.FruityQuestions && FruityQuestions.shuffleDecks) {
      FruityQuestions.shuffleDecks(questionSeed);
    }
    appliedQuestionSeed = questionSeed;
    Object.assign(state, freshState(), {
      started: true,
      phase: "playing",
      mode: solo ? "solo" : "duo",
      soloPlayer: solo ? soloRole : null,
      turn: solo ? soloRole : "host",
      pieces: Object.assign({}, state.pieces),
      positions: { host: 0, joiner: 0 },
      questionSeed: questionSeed,
      wagerSlot: 2 + Math.floor(Math.random() * 2),
      questionsAsked: 0,
      wagerUsed: false
    });
    sync();
    render();
  }

  function resetGame() {
    if (!isGameHost()) return;
    const pieces = Object.assign({}, state.pieces);
    Object.assign(state, freshState());
    state.pieces = pieces;
    sync();
    render();
  }

  function baseCharFor(role) {
    if (role === myRole()) {
      const c = api.myBaseChar && api.myBaseChar();
      return c === "wideass" ? "wideass" : "tats";
    }
    const c = api.peerBaseChar && api.peerBaseChar();
    if (!c) return role === "host" ? "tats" : "wideass";
    return c === "wideass" ? "wideass" : "tats";
  }

  function arenaChars() {
    return { host: baseCharFor("host"), joiner: baseCharFor("joiner") };
  }

  function postToFrame(msg) {
    if (!boardFrame || !boardFrame.contentWindow) return;
    boardFrame.contentWindow.postMessage(
      Object.assign({ source: ARENA_SOURCE }, msg),
      "*"
    );
  }

  function pieceIconsForSnapshot() {
    return {
      host: (pieceById(state.pieces.host) || {}).icon || "🍇",
      joiner: (pieceById(state.pieces.joiner) || {}).icon || "🍇"
    };
  }

  function pushArenaInit() {
    postToFrame({
      type: "arenaInit",
      chars: arenaChars(),
      activeRoles: activeRoles(),
      myRole: myRole(),
      names: { host: nameFor("host"), joiner: nameFor("joiner") },
      isSolo: isSolo()
    });
  }

  function snapshotFocusIndex() {
    if (state.rollAnim && state.isMoving && state.rollStep === "dice") {
      return state.rollAnim.from;
    }
    const focusRole =
      state.phase === "card" && state.cardFor
        ? state.cardFor
        : state.phase === "reveal" && state.cardFor
          ? state.cardFor
          : state.lastMover && state.isMoving
            ? state.lastMover
            : state.turn;
    return state.positions[focusRole] ?? 0;
  }

  function postBoard() {
    postToFrame({
      type: "gfBoard",
      snapshot: {
        started: state.started,
        phase: state.phase,
        turn: state.turn,
        cardFor: state.cardFor,
        cardMode:
          state.phase === "wager" && state.pendingWager
            ? state.pendingWager.card.mode || "self"
            : state.cardMode,
        focusIndex: snapshotFocusIndex(),
        positions: Object.assign({}, state.positions),
        pieces: Object.assign({}, state.pieces),
        pieceIcons: pieceIconsForSnapshot(),
        teamScore: state.teamScore,
        scores: Object.assign({}, state.scores),
        eggplants: Object.assign({}, state.eggplants),
        activeCard:
          state.phase === "card" ||
          state.phase === "textVote" ||
          state.phase === "wager" ||
          state.phase === "reveal"
            ? state.activeCard ||
              (state.pendingWager && state.pendingWager.card) ||
              null
            : null,
        cardAnswers:
          state.phase === "textVote"
            ? Object.assign({}, state.cardAnswers)
            : maskedCardAnswersForViewer(),
        cardReveal: state.phase === "reveal" ? state.cardReveal : null,
        answered: Object.assign({}, state.answered),
        eggplantActive: state.eggplantActive,
        lastRoll: state.lastRoll,
        lastRolls: state.lastRolls,
        lastMover: state.lastMover,
        rollTick: boardRollTick,
        winner: state.winner,
        activeRoles: activeRoles(),
        myRole: myRole(),
        names: { host: nameFor("host"), joiner: nameFor("joiner") },
        chars: arenaChars(),
        isSolo: isSolo(),
        isMoving: !!state.isMoving,
        rollAnim: state.rollAnim,
        rollStep: state.rollStep,
        cameraFollowIndex: state.cameraFollowIndex,
        wagerRole: state.phase === "wager" ? state.wagerRole : null,
        cardWager: state.cardWager,
        textMatchVotes:
          state.phase === "textVote"
            ? Object.assign({}, state.textMatchVotes)
            : null,
        pendingWagerPrompt: state.phase === "wager",
        lobby: {
          pieces: Object.assign({}, state.pieces),
          pieceOptions: PIECES,
          readyToStart: readyToStart(),
          isHost: isGameHost(),
          requiresPartner: requiresPartner(),
          lobbySolo: lobbySolo()
        }
      }
    });
  }

  function scheduleBoardPush() {
    pushArenaInit();
    postBoard();
    setTimeout(function () { pushArenaInit(); postBoard(); }, 150);
    setTimeout(function () { pushArenaInit(); postBoard(); }, 600);
  }

  function bindFrameRelay() {
    if (frameListener) return;
    frameListener = function (event) {
      const data = event.data;
      if (!data || data.source !== "arena-fruity") return;
      if (data.type === "ready") {
        scheduleBoardPush();
        return;
      }
      if (data.type === "gfAction") {
        if (data.action === "roll") rollDice();
        else if (data.action === "answered") markAnswered();
        else if (data.action === "submitAnswer") submitCardAnswer(data.choice);
        else if (data.action === "submitWager") submitWager(data.amount);
        else if (data.action === "submitTextMatchVote") submitTextMatchVote(data.vote);
        else if (data.action === "pickPiece") pickPiece(data.pieceId);
        else if (data.action === "startGame") startGame();
        else if (data.action === "eggplant") playEggplant();
      }
    };
    window.addEventListener("message", frameListener);
  }

  function unbindFrameRelay() {
    if (!frameListener) return;
    window.removeEventListener("message", frameListener);
    frameListener = null;
  }

  function ensureStage(panel) {
    if (
      boardHost && boardHost.parentNode === panel &&
      uiLayer && uiLayer.parentNode === panel &&
      boardFrame
    ) {
      return;
    }
    panel.innerHTML = "";
    boardHost = el("div", "gf-stage-wrap");
    boardFrame = el("iframe", "gf-3d-frame");
    boardFrame.src = FRUITY_SRC;
    boardFrame.title = "Get Fruity — 3D board";
    boardFrame.setAttribute("allow", "accelerometer; gyroscope; fullscreen");
    boardFrame.setAttribute("loading", "eager");
    boardFrame.addEventListener("load", scheduleBoardPush);
    boardHost.appendChild(boardFrame);
    panel.appendChild(boardHost);
    uiLayer = el("div", "gf-ui-layer");
    panel.appendChild(uiLayer);
    bindFrameRelay();
  }

  function destroyStage() {
    unbindFrameRelay();
    if (boardHost && boardHost.parentNode) {
      boardHost.parentNode.removeChild(boardHost);
    }
    boardFrame = null;
    boardHost = null;
    uiLayer = null;
    boardRollTick = 0;
    lastMoveKey = "";
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.classList.add("gf-pro", "gf-pro-3d");
    if (state.started) panel.classList.add("gf-pro-live");
    else panel.classList.remove("gf-pro-live");
    ensureStage(panel);
    pushArenaInit();
    postBoard();

    const ui = uiLayer;
    ui.innerHTML = "";

    if (state.started) return;

    if (api.appendPlayModePicker) api.appendPlayModePicker(ui);
    appendWaitBanner(ui);
  }

  function appendWaitBanner(wrap) {
    if (!requiresPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "2-player mode — share your arena code. The board is below while you wait."));
  }

  function appendStartActions(wrap, onStart) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "gf-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
    btn.disabled = !isGameHost() || requiresPartner() || !readyToStart();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    if (requiresPartner()) {
      actions.appendChild(el("span", "gf-pro-tip", "Start unlocks when your partner joins, or switch to 1 Player."));
    } else if (!readyToStart()) {
      actions.appendChild(el("span", "gf-pro-tip", lobbySolo() ? "Pick a piece to start." : "Both players must pick a piece."));
    }
    wrap.appendChild(actions);
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;
    const t = msg.type;
    const p = msg.payload || {};

    if (t === "gfSync") {
      /* Host ignores inbound sync while driving a roll animation sequence. */
      if (isGameHost() && landingTimer) {
        if (p.flair && (!activeFlair || activeFlair.text !== p.flair.text)) {
          showFlairOverlay(p.flair);
        } else {
          render();
        }
        return;
      }
      importPayload(p);
      if (p.flair && (!activeFlair || activeFlair.text !== p.flair.text)) {
        showFlairOverlay(p.flair);
      } else {
        render();
      }
      return;
    }
    if (t === "gfRollRequest") {
      if (!isGameHost()) return;
      if (state.isMoving || state.turn !== p.from || state.phase === "card" || state.phase === "reveal" || state.phase === "wager" || state.phase === "textVote") return;
      finishRoll(p.from, rollTwoDice());
      return;
    }
    if (t === "gfPieceRequest") {
      if (!isGameHost()) return;
      const taken = takenPieces();
      if (taken.indexOf(p.pieceId) !== -1 && state.pieces[p.role] !== p.pieceId) return;
      state.pieces[p.role] = p.pieceId;
      sync();
      return;
    }
    if (t === "gfEggplantRequest") {
      if (!isGameHost()) return;
      if ((state.eggplants[p.from] || 0) <= 0) return;
      state.eggplants[p.from]--;
      state.eggplantActive = true;
      state.eggplantPlayedBy = p.from;
      sync();
      return;
    }
    if (t === "gfSubmitAnswer") {
      if (!isGameHost()) return;
      if (state.phase !== "card") return;
      if (!p.role || !p.choice) return;
      state.cardAnswers[p.role] = p.choice;
      state.answered[p.role] = true;
      if (bothPlayersAnswered()) {
        proceedAfterBothAnswered();
      } else {
        sync();
      }
      return;
    }
    if (t === "gfWagerRequest") {
      if (!isGameHost()) return;
      if (state.phase !== "wager" || p.from !== state.wagerRole) return;
      applyWagerAndStart(p.amount);
      return;
    }
    if (t === "gfTextMatchVote") {
      if (!isGameHost()) return;
      if (state.phase !== "textVote") return;
      if (!p.role || !p.vote) return;
      state.textMatchVotes[p.role] = p.vote === "MATCH" ? "MATCH" : "NO_MATCH";
      if (p.complete && bothTextVotesIn()) {
        buildReveal();
        sync();
        scheduleRevealFinish();
      } else {
        sync();
      }
      return;
    }
    if (t === "gfAnswered") {
      if (!isGameHost()) return;
      state.answered[p.role] = true;
      if (p.complete && bothPlayersAnswered()) {
        buildReveal();
        sync();
        scheduleRevealFinish();
      } else {
        sync();
      }
    }
  }

  function resync() {
    if (isGameHost()) sync();
  }

  return {
    init: function (opts) {
      api = opts;
      Object.assign(state, freshState());
    },
    render: render,
    handleMessage: handleMessage,
    resync: resync,
    destroy: destroyStage
  };
})();
