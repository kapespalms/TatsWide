/**
 * Mancala (Kalah) — classic 6-pit sowing game, host-authoritative sync.
 */
window.MancalaGame = (function () {
  "use strict";

  const PITS = 6;
  const START_STONES = 4;
  const SOW_MS = 105;

  let api = null;
  let anim = null;
  let lastAnimKey = null;

  const state = {
    started: false,
    host: null,
    joiner: null,
    hostStore: 0,
    joinerStore: 0,
    turn: "host",
    winner: null,
    lastMove: null
  };

  function myRole() { return api.myRole(); }
  function isMyTurn() { return state.turn === myRole() && !state.winner; }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function playSound(name) {
    if (!window.ArenaSounds || !ArenaSounds[name]) return;
    ArenaSounds[name]();
  }

  function opp(role) { return role === "host" ? "joiner" : "host"; }

  function emptyBoard() {
    return {
      host: Array(PITS).fill(START_STONES),
      joiner: Array(PITS).fill(START_STONES),
      hostStore: 0,
      joinerStore: 0
    };
  }

  function cloneBoard(from) {
    const src = from || state;
    return {
      host: src.host.slice(),
      joiner: src.joiner.slice(),
      hostStore: src.hostStore,
      joinerStore: src.joinerStore
    };
  }

  function applyBoard(b) {
    state.host = b.host;
    state.joiner = b.joiner;
    state.hostStore = b.hostStore;
    state.joinerStore = b.joinerStore;
  }

  function boardSig(b) {
    const src = b || state;
    return src.host.join(",") + "|" + src.joiner.join(",") + "|" + src.hostStore + "|" + src.joinerStore;
  }

  function animKey() {
    if (!state.lastMove) return null;
    return state.lastMove.player + ":" + state.lastMove.pit + ":" + boardSig();
  }

  function oppositePit(pit) { return PITS - 1 - pit; }

  function buildPath(player, pit) {
    const path = [];
    if (player === "host") {
      for (let k = pit + 1; k < PITS; k++) path.push({ side: "host", pit: k });
      path.push({ side: "store", player: "host" });
      for (let k = 0; k < PITS; k++) path.push({ side: "joiner", pit: k });
      for (let k = 0; k <= pit; k++) path.push({ side: "host", pit: k });
    } else {
      for (let k = pit + 1; k < PITS; k++) path.push({ side: "joiner", pit: k });
      path.push({ side: "store", player: "joiner" });
      for (let k = PITS - 1; k >= 0; k--) path.push({ side: "host", pit: k });
      for (let k = 0; k <= pit; k++) path.push({ side: "joiner", pit: k });
    }
    return path;
  }

  function sideEmpty(board, side) {
    return board[side].every(function (n) { return n === 0; });
  }

  function sweepRemaining(board) {
    const b = {
      host: board.host.slice(),
      joiner: board.joiner.slice(),
      hostStore: board.hostStore,
      joinerStore: board.joinerStore
    };
    if (sideEmpty(b, "host")) {
      b.joinerStore += b.joiner.reduce(function (a, n) { return a + n; }, 0);
      b.joiner = Array(PITS).fill(0);
    } else if (sideEmpty(b, "joiner")) {
      b.hostStore += b.host.reduce(function (a, n) { return a + n; }, 0);
      b.host = Array(PITS).fill(0);
    }
    return b;
  }

  function simulateMove(fromBoard, player, pit) {
    const pits = fromBoard[player];
    if (pit < 0 || pit >= PITS || pits[pit] === 0) return null;

    const board = cloneBoard(fromBoard);
    let stones = board[player][pit];
    board[player][pit] = 0;
    const path = buildPath(player, pit);
    const steps = [];
    let last = null;
    let idx = 0;
    while (stones > 0) {
      const loc = path[idx % path.length];
      if (loc.side === "store") board[loc.player + "Store"]++;
      else board[loc.side][loc.pit]++;
      steps.push(loc);
      last = loc;
      stones--;
      idx++;
    }

    let extraTurn = false;
    if (last && last.side === "store" && last.player === player) extraTurn = true;

    let capture = null;
    if (!extraTurn && last && last.side === player && last.pit !== undefined) {
      const p = last.pit;
      const oppSide = opp(player);
      if (board[player][p] === 1) {
        const oppPit = oppositePit(p);
        if (board[oppSide][oppPit] > 0) {
          capture = { player: player, pit: p, oppPit: oppPit };
          board[player + "Store"] += board[player][p] + board[oppSide][oppPit];
          board[player][p] = 0;
          board[oppSide][oppPit] = 0;
        }
      }
    }

    return { board: board, steps: steps, capture: capture, extraTurn: extraTurn };
  }

  function roleLabel(role) {
    if (role === myRole()) return "You";
    return role === "host" ? "Host" : "Partner";
  }

  function sync() {
    send({
      type: "maSync",
      payload: {
        host: state.host,
        joiner: state.joiner,
        hostStore: state.hostStore,
        joinerStore: state.joinerStore,
        turn: state.turn,
        winner: state.winner,
        lastMove: state.lastMove
      }
    });
  }

  function finishGame(board) {
    const swept = sweepRemaining(board);
    applyBoard(swept);
    if (swept.hostStore > swept.joinerStore) state.winner = "host";
    else if (swept.joinerStore > swept.hostStore) state.winner = "joiner";
    else state.winner = "draw";
    sync();
    if (state.winner === "draw") {
      celebrate("Draw game", swept.hostStore + " stones each.");
    } else {
      const who = state.winner === myRole() ? "You win" : roleLabel(state.winner) + " wins";
      celebrate(who + " Mancala!", swept[state.winner + "Store"] + " vs " + swept[opp(state.winner) + "Store"] + " stones.");
    }
    render();
  }

  function stopAnim() {
    if (anim && anim.timer) clearTimeout(anim.timer);
    if (anim && anim.watchdog) clearTimeout(anim.watchdog);
    anim = null;
  }

  function runSowAnimation(startBoard, steps, capture, finalBoard, onComplete) {
    stopAnim();
    const board = cloneBoard(startBoard);
    if (state.lastMove) board[state.lastMove.player][state.lastMove.pit] = 0;

    anim = {
      board: board,
      highlight: null,
      captureFlash: null,
      timer: null,
      watchdog: setTimeout(function () {
        stopAnim();
        render();
      }, 8000),
      step: 0
    };
    lastAnimKey = animKey();
    render();

    let i = 0;
    function finishCapture() {
      anim.board = cloneBoard(finalBoard);
      if (capture) {
        anim.captureFlash = capture;
        anim.highlight = null;
        render();
        playSound("slam");
        anim.timer = setTimeout(function () {
          stopAnim();
          render();
          if (onComplete) onComplete();
        }, 520);
        return;
      }
      stopAnim();
      render();
      if (onComplete) onComplete();
    }

    function nextStep() {
      if (i >= steps.length) {
        finishCapture();
        return;
      }
      const loc = steps[i];
      if (loc.side === "store") anim.board[loc.player + "Store"]++;
      else anim.board[loc.side][loc.pit]++;
      anim.highlight = loc;
      anim.board = cloneBoard(anim.board);
      render();
      playSound("chip");
      i++;
      anim.timer = setTimeout(nextStep, SOW_MS);
    }

    anim.timer = setTimeout(nextStep, 60);
  }

  function maybeAnimateMove(prevBoard, onComplete) {
    if (!state.lastMove) {
      render();
      if (onComplete) onComplete();
      return;
    }
    const key = animKey();
    if (key === lastAnimKey) {
      render();
      if (onComplete) onComplete();
      return;
    }
    const sim = simulateMove(prevBoard, state.lastMove.player, state.lastMove.pit);
    if (!sim || !sim.steps.length) {
      render();
      if (onComplete) onComplete();
      return;
    }
    runSowAnimation(prevBoard, sim.steps, sim.capture, cloneBoard(state), onComplete);
  }

  function applyMove(player, pit) {
    if (player !== state.turn || state.winner) return false;
    const prev = cloneBoard();
    const sim = simulateMove(prev, player, pit);
    if (!sim) return false;

    applyBoard(sim.board);
    state.lastMove = { player: player, pit: pit };

    if (sideEmpty(sim.board, "host") || sideEmpty(sim.board, "joiner")) {
      sync();
      runSowAnimation(prev, sim.steps, sim.capture, sim.board, function () {
        finishGame(sim.board);
      });
      return true;
    }

    if (!sim.extraTurn) state.turn = opp(player);
    sync();
    runSowAnimation(prev, sim.steps, sim.capture, cloneBoard(state));
    return true;
  }

  function tryMove(pit) {
    if (!state.started || state.winner || anim) return;
    if (!isMyTurn()) { toast("Not your turn."); return; }
    if (isGameHost()) {
      if (!applyMove(myRole(), pit)) toast("Pick a pit with stones on your side.");
    } else {
      send({ type: "maMoveRequest", payload: { pit: pit, from: myRole() } });
    }
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (api.requiresPartnerToStart && api.requiresPartnerToStart()) {
      toast("Your partner must join the arena before starting.");
      return;
    }
    stopAnim();
    lastAnimKey = null;
    const b = emptyBoard();
    state.started = true;
    state.host = b.host;
    state.joiner = b.joiner;
    state.hostStore = 0;
    state.joinerStore = 0;
    state.turn = "host";
    state.winner = null;
    state.lastMove = null;
    sync();
    render();
  }

  function newGame() {
    if (!isGameHost()) { toast("Only the host can start a new game."); return; }
    startGame();
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "maSync":
        const prev = cloneBoard();
        state.started = true;
        state.host = msg.payload.host;
        state.joiner = msg.payload.joiner;
        state.hostStore = msg.payload.hostStore;
        state.joinerStore = msg.payload.joinerStore;
        state.turn = msg.payload.turn;
        state.winner = msg.payload.winner;
        state.lastMove = msg.payload.lastMove || null;
        maybeAnimateMove(prev);
        break;
      case "maMoveRequest":
        if (!isGameHost() || !state.started || state.winner || anim) return;
        if (msg.payload.from !== state.turn) return;
        applyMove(msg.payload.from, msg.payload.pit);
        break;
    }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function needsPartner() {
    return api.requiresPartnerToStart && api.requiresPartnerToStart();
  }

  function appendWaitBanner(wrap) {
    if (!needsPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "Waiting for your partner — share your arena code. Explore the board below while you wait."));
  }

  function appendStartActions(wrap, onStart) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "mc-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    if (needsPartner()) {
      actions.appendChild(el("span", "mc-pro-tip", "Start unlocks when your partner joins."));
    }
    wrap.appendChild(actions);
  }

  function displayBoard() {
    if (anim && anim.board) return anim.board;
    return state;
  }

  function pitExtraCls(side, pit, isStore, storePlayer) {
    const parts = [];
    if (state.lastMove && !isStore && state.lastMove.player === side && state.lastMove.pit === pit) {
      parts.push("is-last");
    }
    if (anim && anim.highlight) {
      const h = anim.highlight;
      if (isStore && h.side === "store" && h.player === storePlayer) parts.push("is-sowing");
      else if (!isStore && h.side === side && h.pit === pit) parts.push("is-sowing");
    }
    if (anim && anim.captureFlash) {
      const c = anim.captureFlash;
      if (isStore && c.player === storePlayer) parts.push("is-capture");
      else if (!isStore && ((side === c.player && pit === c.pit) || (side === opp(c.player) && pit === c.oppPit))) {
        parts.push("is-capture");
      }
    }
    return parts.join(" ");
  }

  function renderStoneChips(container, count) {
    container.innerHTML = "";
    if (count <= 0) return;
    const show = Math.min(count, 12);
    for (let i = 0; i < show; i++) {
      container.appendChild(el("span", "mc-pro-stone"));
    }
  }

  function renderPit(parent, count, label, clickable, onClick, extraCls) {
    const safeCount = Math.max(0, Number(count) || 0);
    const pit = el("button", "mc-pro-pit" + (clickable ? " is-clickable" : "") + (extraCls ? " " + extraCls : "") + (safeCount ? " has-stones" : ""));
    pit.type = "button";
    pit.disabled = !clickable;
    const stones = el("div", "mc-pro-stones");
    renderStoneChips(stones, safeCount);
    pit.appendChild(stones);
    pit.appendChild(el("span", "mc-pro-count", String(safeCount)));
    if (label) pit.appendChild(el("span", "mc-pro-label", label));
    if (clickable && onClick) pit.addEventListener("click", onClick);
    parent.appendChild(pit);
  }

  function renderBoard(wrap, boardView) {
    const view = boardView || displayBoard();
    const hostCounts = view.host || Array(PITS).fill(0);
    const joinerCounts = view.joiner || Array(PITS).fill(0);
    const hostStoreCount = Math.max(0, Number(view.hostStore) || 0);
    const joinerStoreCount = Math.max(0, Number(view.joinerStore) || 0);
    const board = el("div", "mc-pro-board");
    const joinerRow = el("div", "mc-pro-row mc-pro-row-top");
    const joinerStoreCls = pitExtraCls(null, null, true, "joiner");
    const joinerStore = el("div", "mc-pro-store is-joiner" + (joinerStoreCls ? " " + joinerStoreCls : "") + (joinerStoreCount ? " has-stones" : ""));
    const joinerStoreStones = el("div", "mc-pro-stones mc-pro-stones-store");
    renderStoneChips(joinerStoreStones, joinerStoreCount);
    joinerStore.appendChild(joinerStoreStones);
    joinerStore.appendChild(el("span", "mc-pro-store-count", String(joinerStoreCount)));
    joinerStore.appendChild(el("span", "mc-pro-store-label", "Partner"));
    joinerRow.appendChild(joinerStore);
    const joinerPitsEl = el("div", "mc-pro-pits");
    for (let j = PITS - 1; j >= 0; j--) {
      const canPlay = !anim && isMyTurn() && myRole() === "joiner" && (state.joiner ? state.joiner[j] : joinerCounts[j]) > 0;
      (function (pit) {
        renderPit(joinerPitsEl, joinerCounts[pit], null, canPlay, function () { tryMove(pit); }, pitExtraCls("joiner", pit));
      })(j);
    }
    joinerRow.appendChild(joinerPitsEl);
    board.appendChild(joinerRow);

    const hostRow = el("div", "mc-pro-row mc-pro-row-bottom");
    const hostPitsEl = el("div", "mc-pro-pits");
    for (let h = 0; h < PITS; h++) {
      const canPlay = !anim && isMyTurn() && myRole() === "host" && (state.host ? state.host[h] : hostCounts[h]) > 0;
      (function (pit) {
        renderPit(hostPitsEl, hostCounts[pit], null, canPlay, function () { tryMove(pit); }, pitExtraCls("host", pit));
      })(h);
    }
    hostRow.appendChild(hostPitsEl);
    const hostStoreCls = pitExtraCls(null, null, true, "host");
    const hostStore = el("div", "mc-pro-store is-host" + (hostStoreCls ? " " + hostStoreCls : "") + (hostStoreCount ? " has-stones" : ""));
    const hostStoreStones = el("div", "mc-pro-stones mc-pro-stones-store");
    renderStoneChips(hostStoreStones, hostStoreCount);
    hostStore.appendChild(hostStoreStones);
    hostStore.appendChild(el("span", "mc-pro-store-count", String(hostStoreCount)));
    hostStore.appendChild(el("span", "mc-pro-store-label", "Host"));
    hostRow.appendChild(hostStore);
    board.appendChild(hostRow);

    wrap.appendChild(board);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";

    if (!state.started) {
      const wrap = el("div", "mc-pro");
      if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
      appendWaitBanner(wrap);
      wrap.appendChild(el("p", "mc-pro-hint", "Sow stones counter-clockwise. Land in your store for an extra turn. Most stones in your store wins."));
      const bar = el("div", "mc-pro-bar");
      bar.appendChild(el("span", "mc-pro-pill", "Preview · not started"));
      bar.appendChild(el("span", "mc-pro-pill", "Host store · 0"));
      bar.appendChild(el("span", "mc-pro-pill", "Partner store · 0"));
      wrap.appendChild(bar);
      renderBoard(wrap, emptyBoard());
      appendStartActions(wrap, startGame);
      panel.appendChild(wrap);
      return;
    }

    const wrap = el("div", "mc-pro");
    const bar = el("div", "mc-pro-bar");
    if (state.winner === "draw") {
      bar.appendChild(el("span", "mc-pro-pill", "Draw · " + state.hostStore + "–" + state.joinerStore));
    } else if (state.winner) {
      bar.appendChild(el("span", "mc-pro-pill is-win", state.winner === myRole() ? "You won!" : roleLabel(state.winner) + " won"));
    } else {
      bar.appendChild(el("span", "mc-pro-pill" + (isMyTurn() && !anim ? " is-active" : ""), anim ? "Sowing…" : (isMyTurn() ? "Your turn" : roleLabel(state.turn) + "'s turn")));
    }
    bar.appendChild(el("span", "mc-pro-pill", "Host store · " + state.hostStore));
    bar.appendChild(el("span", "mc-pro-pill", "Partner store · " + state.joinerStore));
    wrap.appendChild(bar);

    renderBoard(wrap);

    const actions = el("div", "mc-pro-actions");
    if (isGameHost()) {
      const ng = el("button", "mc-pro-btn secondary", "New Game");
      ng.addEventListener("click", newGame);
      actions.appendChild(ng);
    }
    if (!state.winner) {
      const hint = anim
        ? "Stones sowing around the board…"
        : (myRole() === "host"
          ? (isMyTurn() ? "Tap one of your bottom pits to sow." : "Waiting for " + roleLabel(state.turn) + "…")
          : (isMyTurn() ? "Tap one of your top pits to sow." : "Waiting for " + roleLabel(state.turn) + "…"));
      actions.appendChild(el("span", "mc-pro-tip", hint));
    }
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) sync();
  }

  return { init: function (opts) { api = opts; }, render: render, handleMessage: handleMessage, resync: resync };
})();
