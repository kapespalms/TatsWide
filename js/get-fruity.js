/**
 * Get Fruity — Tats & Wideass battle for truth and fruit!
 * Monopoly-style 36-space board, 7 question types × 2 per lap, first to 10 wins.
 */
window.GetFruityGame = (function () {
  "use strict";

  const WIN_SCORE = 10;
  const START_EGGPLANTS = 3;

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

  const state = {
    started: false,
    phase: "setup",
    turn: "host",
    scores: { host: 0, joiner: 0 },
    positions: { host: 0, joiner: 0 },
    pieces: { host: null, joiner: null },
    eggplants: { host: START_EGGPLANTS, joiner: START_EGGPLANTS },
    lastRoll: null,
    lastMover: null,
    activeCard: null,
    cardFor: null,
    answered: { host: false, joiner: false },
    eggplantActive: false,
    eggplantPlayedBy: null,
    winner: null,
    flair: null,
    mode: "duo",
    soloPlayer: null
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
      scores: { host: 0, joiner: 0 },
      positions: { host: 0, joiner: 0 },
      pieces: { host: null, joiner: null },
      eggplants: { host: START_EGGPLANTS, joiner: START_EGGPLANTS },
      lastRoll: null,
      lastMover: null,
      activeCard: null,
      cardFor: null,
      answered: { host: false, joiner: false },
      eggplantActive: false,
      eggplantPlayedBy: null,
      winner: null,
      flair: null,
      mode: "duo",
      soloPlayer: null
    };
  }

  function exportPayload() {
    return {
      started: state.started,
      phase: state.phase,
      turn: state.turn,
      scores: Object.assign({}, state.scores),
      positions: Object.assign({}, state.positions),
      pieces: Object.assign({}, state.pieces),
      eggplants: Object.assign({}, state.eggplants),
      lastRoll: state.lastRoll,
      lastMover: state.lastMover,
      activeCard: state.activeCard,
      cardFor: state.cardFor,
      answered: Object.assign({}, state.answered),
      eggplantActive: state.eggplantActive,
      eggplantPlayedBy: state.eggplantPlayedBy,
      winner: state.winner,
      flair: state.flair,
      mode: state.mode,
      soloPlayer: state.soloPlayer
    };
  }

  function importPayload(p) {
    if (!p) return;
    Object.assign(state, freshState(), p);
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

  function bumpScore(role, delta) {
    state.scores[role] = Math.max(0, (state.scores[role] || 0) + delta);
    if (state.scores[role] >= WIN_SCORE) {
      state.winner = role;
      state.phase = "ended";
    }
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
    document.body.appendChild(pop);
    requestAnimationFrame(function () { pop.classList.add("is-visible"); });
    flairTimer = setTimeout(function () {
      pop.classList.remove("is-visible");
      setTimeout(function () { pop.remove(); }, 320);
    }, 2600);
    render();
  }

  function awardFruit(role, flairIdx) {
    bumpScore(role, 1);
    const idx = typeof flairIdx === "number" ? flairIdx : Math.floor(Math.random() * FLAIR_TEMPLATES.length);
    state.flair = { text: flairText(nameFor(role), idx), idx: idx, role: role };
    sync();
    showFlairOverlay(state.flair);
    if (state.winner) {
      celebrate(nameFor(state.winner) + " is the fruitiest! 🍇", "First to " + WIN_SCORE + " fruits wins!");
    }
  }

  function drawCard(fruitKey) {
    if (window.PartyGames && PartyGames.drawPrompt) {
      return PartyGames.drawPrompt(fruitKey);
    }
    return { type: fruitKey, text: "Share something fruity about yourself!" };
  }

  function clearCardPhase() {
    state.activeCard = null;
    state.cardFor = null;
    state.answered = { host: false, joiner: false };
    state.eggplantActive = false;
    state.eggplantPlayedBy = null;
    state.phase = "playing";
    if (!isSolo()) {
      state.turn = state.turn === "host" ? "joiner" : "host";
    }
  }

  function resolveLanding(role, pos) {
    const space = SPACES[pos];
    if (!space) return;
    if (space.kind === "path") {
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "golden") {
      if (isSolo()) {
        bumpScore(state.soloPlayer || role, 1);
      } else {
        bumpScore("host", 1);
        bumpScore("joiner", 1);
      }
      const idx = Math.floor(Math.random() * FLAIR_TEMPLATES.length);
      state.flair = { text: "Golden Banana! Everyone Got a Fruit!!!", idx: idx, role: "both" };
      sync();
      showFlairOverlay(state.flair);
      if (state.winner) {
        celebrate(nameFor(state.winner) + " is the fruitiest! 🍇", "First to " + WIN_SCORE + " fruits wins!");
        return;
      }
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "rotten") {
      if (isSolo()) {
        bumpScore(state.soloPlayer || role, -1);
      } else {
        bumpScore("host", -1);
        bumpScore("joiner", -1);
      }
      state.flair = { text: "Rotten Apple! Everyone lost a fruit! 🍎", idx: 0, role: "both" };
      sync();
      showFlairOverlay(state.flair);
      clearCardPhase();
      sync();
      return;
    }
    if (space.kind === "fruit") {
      state.phase = "card";
      state.cardFor = role;
      state.activeCard = drawCard(space.fruit);
      state.answered = { host: false, joiner: false };
      if (state.eggplantActive) {
        /* eggplant already armed — both must answer */
      }
      sync();
      return;
    }
  }

  function finishRoll(role, roll) {
    const from = state.positions[role];
    const to = movePosition(from, roll);
    state.positions[role] = to;
    state.lastRoll = roll;
    state.lastMover = role;
    resolveLanding(role, to);
    sync();
    render();
  }

  function rollDice() {
    if (!state.started || state.winner) return;
    if (state.phase === "card") {
      toast("Answer the card first!");
      return;
    }
    if (state.turn !== myRole()) {
      toast("Not your turn.");
      return;
    }
    if (isGameHost()) {
      const roll = 1 + Math.floor(Math.random() * 6);
      finishRoll(myRole(), roll);
    } else {
      send({ type: "gfRollRequest", payload: { from: myRole() } });
    }
  }

  function markAnswered() {
    if (state.phase !== "card") return;
    state.answered[myRole()] = true;

    const bothNeeded = state.eggplantActive && !isSolo();
    const roller = state.cardFor;
    const rollerDone = state.answered[roller];
    const other = roller === "host" ? "joiner" : "host";
    const otherDone = !bothNeeded || state.answered[other];

    if (rollerDone && otherDone) {
      if (isGameHost()) {
        awardFruit(roller);
        if (!state.winner) clearCardPhase();
        sync();
      } else {
        send({ type: "gfAnswered", payload: { role: myRole(), complete: true } });
      }
    } else if (isGameHost()) {
      sync();
    } else {
      send({ type: "gfAnswered", payload: { role: myRole() } });
    }
    render();
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
    Object.assign(state, freshState(), {
      started: true,
      phase: "playing",
      mode: solo ? "solo" : "duo",
      soloPlayer: solo ? soloRole : null,
      turn: solo ? soloRole : "host",
      pieces: Object.assign({}, state.pieces),
      positions: { host: 0, joiner: 0 }
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

  function renderCard(panel) {
    const box = el("div", "gf-card-overlay");
    const meta = FRUIT_META[state.activeCard.type] || { icon: "🍇", label: "Fruit Card" };
    box.appendChild(el("h4", "gf-card-title", meta.icon + " " + meta.label));
    const body = el("div", "gf-card-body");
    const card = state.activeCard;
    if (card.type === "brain") {
      body.appendChild(el("p", null, card.question));
      const opts = el("ul", "gf-card-options");
      (card.options || []).forEach(function (o) {
        opts.appendChild(el("li", null, o));
      });
      body.appendChild(opts);
    } else if (card.type === "thisorthat") {
      body.appendChild(el("p", null, card.a + "  vs  " + card.b));
    } else if (card.type === "lore") {
      body.appendChild(el("p", null, "Drop some lore about: "));
      body.appendChild(el("strong", "gf-lore-cat", card.category));
    } else {
      body.appendChild(el("p", null, card.text));
    }
    box.appendChild(body);

    const who = nameFor(state.cardFor);
    box.appendChild(el("p", "gf-card-who", who + " landed here — answer to claim the fruit!"));

    if (state.eggplantActive) {
      box.appendChild(el("p", "gf-eggplant-hint", "🍆 Eggplant active — both players must participate!"));
    }

    const actions = el("div", "gf-card-actions");
    const doneBtn = el("button", "gf-pro-btn", state.answered[myRole()] ? "Answered ✓" : "I answered!");
    doneBtn.disabled = state.answered[myRole()];
    doneBtn.addEventListener("click", markAnswered);
    actions.appendChild(doneBtn);
    box.appendChild(actions);

    const status = el("p", "gf-answer-status");
    activeRoles().forEach(function (r) {
      if (state.eggplantActive || r === state.cardFor) {
        status.appendChild(el("span", "gf-ans-chip" + (state.answered[r] ? " is-done" : ""), nameFor(r) + (state.answered[r] ? " ✓" : " …")));
      }
    });
    box.appendChild(status);
    panel.appendChild(box);
  }

  function renderBoard(wrap) {
    const board = el("div", "gf-board");
    const grid = el("div", "gf-board-grid");
    const cells = {};
    SPACES.forEach(function (sp, i) {
      const pos = spaceGridPos(i);
      const key = pos.r + "," + pos.c;
      cells[key] = { space: sp, index: i };
    });

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r >= 1 && r <= 8 && c >= 1 && c <= 8) continue;
        const key = r + "," + c;
        const info = cells[key];
        const cell = el("div", "gf-cell");
        cell.style.gridRow = String(r + 1);
        cell.style.gridColumn = String(c + 1);
        if (!info) {
          cell.classList.add("gf-cell-empty");
          grid.appendChild(cell);
          continue;
        }
        const sp = info.space;
        const idx = info.index;
        if (sp.kind === "golden") {
          cell.classList.add("gf-cell-corner", "gf-cell-golden");
          cell.appendChild(el("span", "gf-corner-icon", sp.icon));
          cell.appendChild(el("span", "gf-corner-label", "Golden\nBanana"));
        } else if (sp.kind === "rotten") {
          cell.classList.add("gf-cell-corner", "gf-cell-rotten");
          cell.appendChild(el("span", "gf-corner-icon", sp.icon));
          cell.appendChild(el("span", "gf-corner-label", "Rotten\nApple"));
        } else if (sp.kind === "fruit") {
          const meta = FRUIT_META[sp.fruit];
          cell.classList.add("gf-cell-fruit");
          cell.style.borderColor = meta.color;
          cell.appendChild(el("span", "gf-fruit-icon", meta.icon));
          cell.appendChild(el("span", "gf-fruit-label", meta.label));
        } else {
          cell.classList.add("gf-cell-path");
          cell.appendChild(el("span", "gf-path-dot", "·"));
        }
        cell.dataset.index = String(idx);

        ["host", "joiner"].forEach(function (role) {
          if (activeRoles().indexOf(role) === -1) return;
          if (state.positions[role] === idx) {
            const piece = pieceById(state.pieces[role]);
            const tok = el("span", "gf-token gf-token-" + role);
            tok.title = nameFor(role);
            tok.textContent = piece ? piece.icon : "🍇";
            cell.appendChild(tok);
          }
        });
        grid.appendChild(cell);
      }
    }

    const center = el("div", "gf-board-center");
    if (typeof mascotSVG === "function") {
      center.innerHTML =
        '<div class="gf-mascot gf-mascot-tats">' + mascotSVG("tats") + '</div>' +
        '<div class="gf-vs">VS</div>' +
        '<div class="gf-mascot gf-mascot-wideass">' + mascotSVG("wideass") + '</div>';
    } else {
      center.appendChild(el("p", null, "Tats vs Wideass"));
    }
    grid.appendChild(center);
    board.appendChild(grid);
    wrap.appendChild(board);
  }

  function renderScoreboard(wrap) {
    const bar = el("div", "gf-scoreboard");
    activeRoles().forEach(function (role) {
      const row = el("div", "gf-score-row" + (state.turn === role && state.started && !state.winner ? " is-turn" : ""));
      const piece = pieceById(state.pieces[role]);
      row.appendChild(el("span", "gf-score-piece", piece ? piece.icon : "❓"));
      row.appendChild(el("span", "gf-score-name", nameFor(role) + (role === myRole() ? " (you)" : "")));
      const fruits = el("span", "gf-score-fruits");
      for (let i = 0; i < WIN_SCORE; i++) {
        fruits.appendChild(el("span", "gf-fruit-pip" + (i < state.scores[role] ? " is-filled" : ""), "🍇"));
      }
      row.appendChild(fruits);
      row.appendChild(el("strong", "gf-score-num", String(state.scores[role])));
      bar.appendChild(row);
    });
    wrap.appendChild(bar);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";
    panel.classList.add("gf-pro");

    const intro = el("div", "gf-pro-intro");
    intro.appendChild(el("h3", "gf-pro-title", "🍇 Get Fruity"));
    intro.appendChild(el("p", null, "The arena conversation game — roll the board, land on fruit spaces, and answer cards. First to 10 fruits wins!"));
    panel.appendChild(intro);

    if (api.appendPlayModePicker) api.appendPlayModePicker(panel);
    appendWaitBanner(panel);

    if (!state.started) {
      const pick = el("div", "gf-piece-picker");
      pick.appendChild(el("h4", null, lobbySolo() ? "Pick your game piece" : "Each player picks a piece"));
      const grid = el("div", "gf-piece-grid");
      PIECES.forEach(function (p) {
        const taken = takenPieces();
        const mine = state.pieces[myRole()] === p.id;
        const takenByOther = !lobbySolo() && taken.indexOf(p.id) !== -1 && !mine;
        const btn = el("button", "gf-piece-btn" + (mine ? " is-mine" : "") + (takenByOther ? " is-taken" : ""));
        btn.type = "button";
        btn.disabled = takenByOther;
        btn.appendChild(el("span", "gf-piece-icon", p.icon));
        btn.appendChild(el("span", "gf-piece-name", p.label));
        btn.addEventListener("click", function () { pickPiece(p.id); });
        grid.appendChild(btn);
      });
      pick.appendChild(grid);
      panel.appendChild(pick);
      appendStartActions(panel, startGame);
      renderBoard(panel);
      return;
    }

    renderScoreboard(panel);

    const bar = el("div", "gf-pro-bar");
    const turnPill = el("span", "gf-pro-pill" + (state.turn === myRole() ? " is-active" : ""), "Turn: " + nameFor(state.turn));
    bar.appendChild(turnPill);
    if (state.lastRoll) {
      bar.appendChild(el("span", "gf-pro-pill", "Last roll: " + state.lastRoll));
    }
    const eg = el("span", "gf-pro-pill gf-eggplant-pill", "🍆 × " + (state.eggplants[myRole()] || 0));
    bar.appendChild(eg);
    panel.appendChild(bar);

    const actions = el("div", "gf-pro-actions");
    const rollBtn = el("button", "gf-pro-btn", "🎲 Roll Dice");
    rollBtn.disabled = state.turn !== myRole() || state.phase === "card" || !!state.winner;
    rollBtn.addEventListener("click", rollDice);
    actions.appendChild(rollBtn);

    const egBtn = el("button", "gf-pro-btn secondary gf-eggplant-btn", "🍆 Play Eggplant");
    egBtn.disabled = !state.started || !!state.winner || (state.eggplants[myRole()] || 0) <= 0 || isSolo();
    egBtn.addEventListener("click", playEggplant);
    if (!isSolo()) actions.appendChild(egBtn);

    if (isGameHost() && state.started) {
      const resetBtn = el("button", "gf-pro-btn ghost", "New Game");
      resetBtn.addEventListener("click", resetGame);
      actions.appendChild(resetBtn);
    }
    panel.appendChild(actions);

    renderBoard(panel);

    if (state.phase === "card" && state.activeCard) {
      renderCard(panel);
    }

    if (state.winner) {
      panel.appendChild(el("p", "gf-win-banner", "🏆 " + nameFor(state.winner) + " is the fruitiest!"));
    }
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
      importPayload(p);
      if (p.flair && (!activeFlair || activeFlair.text !== p.flair.text)) {
        showFlairOverlay(p.flair);
      }
      return;
    }
    if (t === "gfRollRequest") {
      if (!isGameHost()) return;
      if (state.turn !== p.from || state.phase === "card") return;
      finishRoll(p.from, 1 + Math.floor(Math.random() * 6));
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
    if (t === "gfAnswered") {
      if (!isGameHost()) return;
      state.answered[p.role] = true;
      const bothNeeded = state.eggplantActive && !isSolo();
      const roller = state.cardFor;
      const rollerDone = state.answered[roller];
      const other = roller === "host" ? "joiner" : "host";
      const otherDone = !bothNeeded || state.answered[other];
      if (rollerDone && otherDone) {
        awardFruit(roller);
        if (!state.winner) clearCardPhase();
      }
      sync();
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
    resync: resync
  };
})();
