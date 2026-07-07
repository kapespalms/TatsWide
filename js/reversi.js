/**
 * Reversi (Othello) — 8×8 flip discs, host-authoritative sync.
 */
window.ReversiGame = (function () {
  "use strict";

  const SIZE = 8;
  const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  let api = null;
  const state = {
    started: false,
    board: null,
    turn: "host",
    winner: null,
    passed: { host: false, joiner: false },
    lastMove: null
  };

  function myRole() { return api.myRole(); }
  function isMyTurn() { return state.turn === myRole() && !state.winner; }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function opp(role) { return role === "host" ? "joiner" : "host"; }
  function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

  function emptyBoard() {
    const b = Array.from({ length: SIZE }, function () { return Array(SIZE).fill(null); });
    b[3][3] = "joiner";
    b[3][4] = "host";
    b[4][3] = "host";
    b[4][4] = "joiner";
    return b;
  }

  function getFlips(board, r, c, player) {
    if (board[r][c]) return [];
    const flips = [];
    DIRS.forEach(function (d) {
      const line = [];
      let nr = r + d[0];
      let nc = c + d[1];
      while (inBounds(nr, nc) && board[nr][nc] === opp(player)) {
        line.push([nr, nc]);
        nr += d[0];
        nc += d[1];
      }
      if (line.length && inBounds(nr, nc) && board[nr][nc] === player) flips.push.apply(flips, line);
    });
    return flips;
  }

  function validMoves(board, player) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const flips = getFlips(board, r, c, player);
        if (flips.length) moves.push({ r: r, c: c, flips: flips });
      }
    }
    return moves;
  }

  function countDiscs(board) {
    let host = 0;
    let joiner = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === "host") host++;
        else if (board[r][c] === "joiner") joiner++;
      }
    }
    return { host: host, joiner: joiner };
  }

  function roleLabel(role) {
    if (role === myRole()) return "You";
    return role === "host" ? "Host" : "Partner";
  }

  function sync() {
    send({
      type: "rvSync",
      payload: {
        board: state.board,
        turn: state.turn,
        winner: state.winner,
        passed: state.passed,
        lastMove: state.lastMove
      }
    });
  }

  function endIfDone() {
    const hMoves = validMoves(state.board, "host").length;
    const jMoves = validMoves(state.board, "joiner").length;
    if (hMoves || jMoves) return false;
    const counts = countDiscs(state.board);
    if (counts.host > counts.joiner) state.winner = "host";
    else if (counts.joiner > counts.host) state.winner = "joiner";
    else state.winner = "draw";
    sync();
    if (state.winner === "draw") celebrate("Draw game", "Tied at " + counts.host + " discs each.");
    else {
      const who = state.winner === myRole() ? "You win" : roleLabel(state.winner) + " wins";
      celebrate(who + " Reversi!", counts[state.winner] + " vs " + counts[opp(state.winner)] + " discs.");
    }
    render();
    return true;
  }

  function advanceTurn() {
    state.passed = { host: false, joiner: false };
    const next = opp(state.turn);
    if (validMoves(state.board, next).length) {
      state.turn = next;
      sync();
      render();
      return;
    }
    if (validMoves(state.board, state.turn).length) {
      state.passed[next] = true;
      toast(roleLabel(next) + " has no moves — pass.");
      sync();
      render();
      return;
    }
    endIfDone();
  }

  function applyMove(r, c, player) {
    const moves = validMoves(state.board, player);
    const move = moves.find(function (m) { return m.r === r && m.c === c; });
    if (!move || player !== state.turn) return false;
    state.board[r][c] = player;
    move.flips.forEach(function (f) { state.board[f[0]][f[1]] = player; });
    state.lastMove = { r: r, c: c, player: player };
    state.passed = { host: false, joiner: false };
    const next = opp(player);
    if (validMoves(state.board, next).length) {
      state.turn = next;
      sync();
      render();
      return true;
    }
    if (validMoves(state.board, player).length) {
      state.passed[next] = true;
      toast(roleLabel(next) + " has no moves — you go again.");
      sync();
      render();
      return true;
    }
    endIfDone();
    return true;
  }

  function tryMove(r, c) {
    if (!state.started || state.winner) return;
    if (!isMyTurn()) { toast("Not your turn."); return; }
    if (isGameHost()) {
      if (!applyMove(r, c, myRole())) toast("Illegal move.");
    } else {
      send({ type: "rvMoveRequest", payload: { r: r, c: c, from: myRole() } });
    }
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (!api.hasPartner || !api.hasPartner()) { toast("Reversi needs a partner in the arena."); return; }
    state.started = true;
    state.board = emptyBoard();
    state.turn = "host";
    state.winner = null;
    state.passed = { host: false, joiner: false };
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
      case "rvSync":
        state.started = true;
        state.board = msg.payload.board;
        state.turn = msg.payload.turn;
        state.winner = msg.payload.winner;
        state.passed = msg.payload.passed || { host: false, joiner: false };
        state.lastMove = msg.payload.lastMove || null;
        render();
        break;
      case "rvMoveRequest":
        if (!isGameHost() || !state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        applyMove(msg.payload.r, msg.payload.c, msg.payload.from);
        break;
    }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderBoard(wrap) {
    const boardWrap = el("div", "rv-pro-board-wrap");
    const grid = el("div", "rv-pro-grid");
    const moves = isMyTurn() ? validMoves(state.board, myRole()) : [];
    const validSet = {};
    moves.forEach(function (m) { validSet[m.r + "," + m.c] = true; });

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = el("div", "rv-pro-cell");
        const disc = state.board[r][c];
        if (disc) {
          const chip = el("div", "rv-pro-disc is-" + disc);
          if (state.lastMove && state.lastMove.r === r && state.lastMove.c === c) chip.classList.add("is-last");
          cell.appendChild(chip);
        } else if (validSet[r + "," + c]) {
          cell.classList.add("is-valid");
          cell.addEventListener("click", function () { tryMove(r, c); });
        }
        grid.appendChild(cell);
      }
    }
    boardWrap.appendChild(grid);
    wrap.appendChild(boardWrap);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";

    if (!state.started) {
      const intro = el("div", "rv-pro-intro");
      intro.innerHTML = "<h3 class=\"rv-pro-title\">⚫ Reversi</h3><p>Place a disc to sandwich opponent discs — they flip to your color. Most discs when neither player can move wins. Host is <strong>black</strong>, partner is <strong>white</strong>. Host goes first.</p>";
      const needPartner = api.hasPartner && !api.hasPartner();
      if (needPartner) intro.appendChild(el("p", "rv-pro-hint", "Share your arena code and wait for your partner to join before starting."));
      const btn = el("button", "rv-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
      btn.disabled = !isGameHost() || needPartner;
      btn.addEventListener("click", startGame);
      intro.appendChild(btn);
      panel.appendChild(intro);
      return;
    }

    const counts = countDiscs(state.board);
    const wrap = el("div", "rv-pro");
    const bar = el("div", "rv-pro-bar");
    if (state.winner === "draw") {
      bar.appendChild(el("span", "rv-pro-pill", "Draw · " + counts.host + "–" + counts.joiner));
    } else if (state.winner) {
      bar.appendChild(el("span", "rv-pro-pill is-win", state.winner === myRole() ? "You won!" : roleLabel(state.winner) + " won"));
    } else {
      bar.appendChild(el("span", "rv-pro-pill" + (isMyTurn() ? " is-active" : ""), isMyTurn() ? "Your turn" : roleLabel(state.turn) + "'s turn"));
    }
    bar.appendChild(el("span", "rv-pro-pill rv-pro-legend-black", "Black · Host · " + counts.host));
    bar.appendChild(el("span", "rv-pro-pill rv-pro-legend-white", "White · Partner · " + counts.joiner));
    if (state.passed.host || state.passed.joiner) {
      const p = state.passed.host ? "Host" : "Partner";
      bar.appendChild(el("span", "rv-pro-pill", p + " passed"));
    }
    wrap.appendChild(bar);

    renderBoard(wrap);

    const actions = el("div", "rv-pro-actions");
    if (isGameHost()) {
      const ng = el("button", "rv-pro-btn secondary", "New Game");
      ng.addEventListener("click", newGame);
      actions.appendChild(ng);
    }
    if (!state.winner) {
      const hint = isMyTurn()
        ? (validMoves(state.board, myRole()).length ? "Tap a highlighted square to place a disc." : "No moves — waiting for pass…")
        : "Waiting for " + roleLabel(state.turn) + "…";
      actions.appendChild(el("span", "rv-pro-tip", hint));
    }
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) sync();
  }

  return { init: function (opts) { api = opts; }, render: render, handleMessage: handleMessage, resync: resync };
})();
