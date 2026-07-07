/**
 * Yahtzee — turn-based dice scoring for two players, host-authoritative sync.
 */
window.YahtzeeGame = (function () {
  "use strict";

  const CATS = [
    { id: "ones", label: "Ones", upper: true },
    { id: "twos", label: "Twos", upper: true },
    { id: "threes", label: "Threes", upper: true },
    { id: "fours", label: "Fours", upper: true },
    { id: "fives", label: "Fives", upper: true },
    { id: "sixes", label: "Sixes", upper: true },
    { id: "threeKind", label: "3 of a Kind", upper: false },
    { id: "fourKind", label: "4 of a Kind", upper: false },
    { id: "fullHouse", label: "Full House", upper: false },
    { id: "smallStraight", label: "Sm Straight", upper: false },
    { id: "largeStraight", label: "Lg Straight", upper: false },
    { id: "yahtzee", label: "Yahtzee", upper: false },
    { id: "chance", label: "Chance", upper: false }
  ];

  let api = null;
  const state = {
    started: false,
    turn: "host",
    scores: { host: {}, joiner: {} },
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    phase: "roll",
    winner: null
  };

  function myRole() { return api.myRole(); }
  function isMyTurn() { return state.turn === myRole() && !state.winner; }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function emptyScores() {
    const s = {};
    CATS.forEach(function (c) { s[c.id] = null; });
    return s;
  }

  function rollDie() { return Math.floor(Math.random() * 6) + 1; }

  function counts(dice) {
    const m = {};
    dice.forEach(function (d) { m[d] = (m[d] || 0) + 1; });
    return m;
  }

  function sum(dice) { return dice.reduce(function (a, b) { return a + b; }, 0); }

  function isStraight(dice, len) {
    const uniq = Object.keys(counts(dice)).map(Number).sort(function (a, b) { return a - b; });
    if (uniq.length < len) return false;
    for (let i = 0; i <= uniq.length - len; i++) {
      let ok = true;
      for (let j = 1; j < len; j++) {
        if (uniq[i + j] !== uniq[i] + j) ok = false;
      }
      if (ok) return true;
    }
    if (len === 4 && uniq.join(",") === "2,3,4,5,6") return true;
    return false;
  }

  function scoreCategory(catId, dice) {
    const c = counts(dice);
    const vals = Object.keys(c).map(Number);
    switch (catId) {
      case "ones": return (c[1] || 0) * 1;
      case "twos": return (c[2] || 0) * 2;
      case "threes": return (c[3] || 0) * 3;
      case "fours": return (c[4] || 0) * 4;
      case "fives": return (c[5] || 0) * 5;
      case "sixes": return (c[6] || 0) * 6;
      case "threeKind": return vals.some(function (v) { return c[v] >= 3; }) ? sum(dice) : 0;
      case "fourKind": return vals.some(function (v) { return c[v] >= 4; }) ? sum(dice) : 0;
      case "fullHouse": {
        const has3 = vals.some(function (v) { return c[v] >= 3; });
        const has2 = vals.some(function (v) { return c[v] >= 2; });
        return has3 && has2 && vals.length <= 2 ? 25 : 0;
      }
      case "smallStraight": return isStraight(dice, 4) ? 30 : 0;
      case "largeStraight": return isStraight(dice, 5) ? 40 : 0;
      case "yahtzee": return vals.some(function (v) { return c[v] === 5; }) ? 50 : 0;
      case "chance": return sum(dice);
      default: return 0;
    }
  }

  function upperTotal(role) {
    return CATS.filter(function (c) { return c.upper; }).reduce(function (t, c) {
      return t + (state.scores[role][c.id] || 0);
    }, 0);
  }

  function totalScore(role) {
    let t = CATS.reduce(function (acc, c) { return acc + (state.scores[role][c.id] || 0); }, 0);
    if (upperTotal(role) >= 63) t += 35;
    return t;
  }

  function categoriesLeft(role) {
    return CATS.filter(function (c) { return state.scores[role][c.id] === null; });
  }

  function gameComplete() {
    return categoriesLeft("host").length === 0 && categoriesLeft("joiner").length === 0;
  }

  function roleLabel(role) {
    if (role === myRole()) return "You";
    return role === "host" ? "Host" : "Partner";
  }

  function sync() {
    send({
      type: "yzSync",
      payload: {
        turn: state.turn,
        scores: state.scores,
        dice: state.dice,
        held: state.held,
        rollsLeft: state.rollsLeft,
        phase: state.phase,
        winner: state.winner
      }
    });
  }

  function finishGame() {
    const h = totalScore("host");
    const j = totalScore("joiner");
    if (h > j) state.winner = "host";
    else if (j > h) state.winner = "joiner";
    else state.winner = "draw";
    sync();
    if (state.winner === "draw") celebrate("Draw game", h + " points each.");
    else {
      const who = state.winner === myRole() ? "You win" : roleLabel(state.winner) + " wins";
      celebrate(who + " Yahtzee!", totalScore(state.winner) + " vs " + totalScore(state.winner === "host" ? "joiner" : "host") + " points.");
    }
    render();
  }

  function resetTurnDice() {
    state.dice = [1, 1, 1, 1, 1];
    state.held = [false, false, false, false, false];
    state.rollsLeft = 3;
    state.phase = "roll";
  }

  function doRoll() {
    if (state.rollsLeft <= 0) return;
    for (let i = 0; i < 5; i++) {
      if (!state.held[i]) state.dice[i] = rollDie();
    }
    state.rollsLeft--;
    state.phase = state.rollsLeft > 0 ? "roll" : "score";
    sync();
    render();
  }

  function toggleHold(idx) {
    if (!isMyTurn() || state.phase !== "roll" || state.rollsLeft >= 3) return;
    state.held[idx] = !state.held[idx];
    sync();
    render();
  }

  function pickCategory(catId) {
    if (!isMyTurn() || state.phase !== "score") return;
    if (state.scores[myRole()][catId] !== null) { toast("Category already scored."); return; }
    const pts = scoreCategory(catId, state.dice);
    state.scores[myRole()][catId] = pts;
    if (gameComplete()) {
      finishGame();
      return;
    }
    state.turn = state.turn === "host" ? "joiner" : "host";
    resetTurnDice();
    sync();
    render();
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (!api.hasPartner || !api.hasPartner()) { toast("Yahtzee needs a partner in the arena."); return; }
    state.started = true;
    state.turn = "host";
    state.scores = { host: emptyScores(), joiner: emptyScores() };
    state.winner = null;
    resetTurnDice();
    sync();
    render();
  }

  function newGame() {
    if (!isGameHost()) { toast("Only the host can start a new game."); return; }
    startGame();
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "yzSync":
        state.started = true;
        state.turn = msg.payload.turn;
        state.scores = msg.payload.scores;
        state.dice = msg.payload.dice;
        state.held = msg.payload.held;
        state.rollsLeft = msg.payload.rollsLeft;
        state.phase = msg.payload.phase;
        state.winner = msg.payload.winner;
        render();
        break;
      case "yzRollRequest":
        if (!isGameHost() || !state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        doRoll();
        break;
      case "yzHoldRequest":
        if (!isGameHost() || !state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        state.held[msg.payload.idx] = !state.held[msg.payload.idx];
        sync();
        render();
        break;
      case "yzScoreRequest":
        if (!isGameHost() || !state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        if (state.scores[msg.payload.from][msg.payload.catId] !== null) return;
        state.scores[msg.payload.from][msg.payload.catId] = scoreCategory(msg.payload.catId, state.dice);
        if (gameComplete()) { finishGame(); return; }
        state.turn = state.turn === "host" ? "joiner" : "host";
        resetTurnDice();
        sync();
        render();
        break;
    }
  }

  function requestRoll() {
    if (!isMyTurn() || state.phase !== "roll" || state.rollsLeft <= 0) return;
    if (isGameHost()) doRoll();
    else send({ type: "yzRollRequest", payload: { from: myRole() } });
  }

  function requestHold(idx) {
    if (!isMyTurn()) return;
    if (isGameHost()) toggleHold(idx);
    else send({ type: "yzHoldRequest", payload: { idx: idx, from: myRole() } });
  }

  function requestScore(catId) {
    if (!isMyTurn() || state.phase !== "score") return;
    if (isGameHost()) pickCategory(catId);
    else send({ type: "yzScoreRequest", payload: { catId: catId, from: myRole() } });
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderDice(wrap) {
    const row = el("div", "yz-pro-dice");
    state.dice.forEach(function (v, i) {
      const die = el("button", "yz-pro-die" + (state.held[i] ? " is-held" : ""));
      die.type = "button";
      die.textContent = String(v);
      die.disabled = !isMyTurn() || state.phase !== "roll" || state.rollsLeft >= 3;
      (function (idx) {
        die.addEventListener("click", function () { requestHold(idx); });
      })(i);
      row.appendChild(die);
    });
    wrap.appendChild(row);
  }

  function renderScorecard(wrap) {
    const table = el("div", "yz-pro-scores");
    ["host", "joiner"].forEach(function (role) {
      const col = el("div", "yz-pro-score-col" + (role === myRole() ? " is-me" : ""));
      col.appendChild(el("div", "yz-pro-score-head", roleLabel(role) + " · " + totalScore(role)));
      CATS.forEach(function (cat) {
        const row = el("div", "yz-pro-score-row" + (state.scores[role][cat.id] === null ? " is-open" : ""));
        row.appendChild(el("span", null, cat.label));
        const val = state.scores[role][cat.id];
        row.appendChild(el("strong", null, val === null ? "—" : String(val)));
        col.appendChild(row);
      });
      const bonus = upperTotal(role) >= 63 ? "+35 bonus" : "Upper: " + upperTotal(role) + "/63";
      col.appendChild(el("div", "yz-pro-bonus", bonus));
      table.appendChild(col);
    });
    wrap.appendChild(table);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";

    if (!state.started) {
      const intro = el("div", "yz-pro-intro");
      intro.innerHTML = "<h3 class=\"yz-pro-title\">🎲 Yahtzee</h3><p>Take turns rolling five dice up to <strong>three times</strong>, holding any dice between rolls. Score each category once — upper section bonus at 63+. Highest total wins.</p>";
      const needPartner = api.hasPartner && !api.hasPartner();
      if (needPartner) intro.appendChild(el("p", "yz-pro-hint", "Share your arena code and wait for your partner to join before starting."));
      const btn = el("button", "yz-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
      btn.disabled = !isGameHost() || needPartner;
      btn.addEventListener("click", startGame);
      intro.appendChild(btn);
      panel.appendChild(intro);
      return;
    }

    const wrap = el("div", "yz-pro");
    const bar = el("div", "yz-pro-bar");
    if (state.winner === "draw") {
      bar.appendChild(el("span", "yz-pro-pill", "Draw · " + totalScore("host") + "–" + totalScore("joiner")));
    } else if (state.winner) {
      bar.appendChild(el("span", "yz-pro-pill is-win", state.winner === myRole() ? "You won!" : roleLabel(state.winner) + " won"));
    } else {
      bar.appendChild(el("span", "yz-pro-pill" + (isMyTurn() ? " is-active" : ""), isMyTurn() ? "Your turn" : roleLabel(state.turn) + "'s turn"));
    }
    bar.appendChild(el("span", "yz-pro-pill", "Rolls left · " + state.rollsLeft));
    wrap.appendChild(bar);

    renderDice(wrap);
    renderScorecard(wrap);

    const actions = el("div", "yz-pro-actions");
    if (!state.winner && isMyTurn()) {
      if (state.phase === "roll" && state.rollsLeft > 0) {
        const rollBtn = el("button", "yz-pro-btn", state.rollsLeft === 3 ? "Roll Dice" : "Roll Again");
        rollBtn.addEventListener("click", requestRoll);
        actions.appendChild(rollBtn);
      }
      if (state.phase === "score") {
        const pickLabel = el("span", "yz-pro-tip", "Pick a category to score:");
        actions.appendChild(pickLabel);
        CATS.forEach(function (cat) {
          if (state.scores[myRole()][cat.id] !== null) return;
          const pts = scoreCategory(cat.id, state.dice);
          const b = el("button", "yz-pro-btn secondary yz-cat-btn", cat.label + " · " + pts);
          b.addEventListener("click", function () { requestScore(cat.id); });
          actions.appendChild(b);
        });
      }
    }
    if (isGameHost()) {
      const ng = el("button", "yz-pro-btn secondary", "New Game");
      ng.addEventListener("click", newGame);
      actions.appendChild(ng);
    }
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) sync();
  }

  return { init: function (opts) { api = opts; }, render: render, handleMessage: handleMessage, resync: resync };
})();
