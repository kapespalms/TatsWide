/**
 * Checkers — American 8×8 rules, host-authoritative sync.
 */
window.CheckersGame = (function () {
  "use strict";

  const SIZE = 8;
  const DIRS = { host: [[1, -1], [1, 1]], joiner: [[-1, -1], [-1, 1]], king: [[-1, -1], [-1, 1], [1, -1], [1, 1]] };

  let api = null;
  const state = {
    started: false,
    board: null,
    turn: "host",
    winner: null,
    jumpFrom: null,
    lastMove: null
  };

  function myRole() { return api.myRole(); }
  function isMyTurn() { return state.turn === myRole() && !state.winner; }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function isDark(r, c) { return (r + c) % 2 === 1; }
  function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }
  function isKing(p) { return p === "host-k" || p === "joiner-k"; }
  function owner(p) { if (!p) return null; return p.indexOf("host") === 0 ? "host" : "joiner"; }

  function emptyBoard() {
    const b = Array.from({ length: SIZE }, function () { return Array(SIZE).fill(null); });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (isDark(r, c)) b[r][c] = "host";
      }
    }
    for (let r = 5; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (isDark(r, c)) b[r][c] = "joiner";
      }
    }
    return b;
  }

  function moveDirs(piece) {
    if (isKing(piece)) return DIRS.king;
    return DIRS[owner(piece)];
  }

  function cloneBoard() {
    return state.board.map(function (row) { return row.slice(); });
  }

  function applyJump(board, fromR, fromC, toR, toC) {
    const piece = board[fromR][fromC];
    board[toR][toC] = piece;
    board[fromR][fromC] = null;
    board[fromR + (toR - fromR) / 2][fromC + (toC - fromC) / 2] = null;
    if (toR === 0 && owner(piece) === "joiner") board[toR][toC] = "joiner-k";
    if (toR === SIZE - 1 && owner(piece) === "host") board[toR][toC] = "host-k";
    return board;
  }

  function jumpsFrom(board, r, c, piece) {
    const moves = [];
    moveDirs(piece).forEach(function (d) {
      const midR = r + d[0];
      const midC = c + d[1];
      const toR = r + d[0] * 2;
      const toC = c + d[1] * 2;
      if (!inBounds(toR, toC) || !isDark(toR, toC)) return;
      const mid = board[midR][midC];
      if (!mid || owner(mid) === owner(piece)) return;
      if (board[toR][toC]) return;
      moves.push({ fromR: r, fromC: c, toR: toR, toC: toC, jump: true });
    });
    return moves;
  }

  function stepsFrom(board, r, c, piece) {
    const moves = [];
    moveDirs(piece).forEach(function (d) {
      const toR = r + d[0];
      const toC = c + d[1];
      if (!inBounds(toR, toC) || !isDark(toR, toC) || board[toR][toC]) return;
      moves.push({ fromR: r, fromC: c, toR: toR, toC: toC, jump: false });
    });
    return moves;
  }

  function allJumps(board, player, onlyFrom) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = board[r][c];
        if (!p || owner(p) !== player) continue;
        if (onlyFrom && (onlyFrom.r !== r || onlyFrom.c !== c)) continue;
        jumpsFrom(board, r, c, p).forEach(function (m) { moves.push(m); });
      }
    }
    return moves;
  }

  function allSteps(board, player) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = board[r][c];
        if (!p || owner(p) !== player) continue;
        stepsFrom(board, r, c, p).forEach(function (m) { moves.push(m); });
      }
    }
    return moves;
  }

  function legalMoves(board, player, jumpFrom) {
    if (jumpFrom) {
      const p = board[jumpFrom.r][jumpFrom.c];
      if (!p || owner(p) !== player) return [];
      return jumpsFrom(board, jumpFrom.r, jumpFrom.c, p);
    }
    const jumps = allJumps(board, player, null);
    if (jumps.length) return jumps;
    return allSteps(board, player);
  }

  function countPieces(board, player) {
    let n = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] && owner(board[r][c]) === player) n++;
      }
    }
    return n;
  }

  function roleLabel(role) {
    if (role === myRole()) return "You";
    return role === "host" ? "Host" : "Partner";
  }

  function sync() {
    send({
      type: "chSync",
      payload: {
        board: state.board,
        turn: state.turn,
        winner: state.winner,
        jumpFrom: state.jumpFrom,
        lastMove: state.lastMove
      }
    });
  }

  function finishTurn(board, player, move) {
    state.board = board;
    state.lastMove = move;
    const opp = player === "host" ? "joiner" : "host";
    if (countPieces(state.board, opp) === 0) {
      state.winner = player;
      state.jumpFrom = null;
      sync();
      celebrate((player === myRole() ? "You win" : roleLabel(player) + " wins") + " Checkers!", "All opponent pieces captured.");
      render();
      return;
    }
    const chain = move.jump ? allJumps(state.board, player, { r: move.toR, c: move.toC }) : [];
    if (move.jump && chain.length) {
      state.jumpFrom = { r: move.toR, c: move.toC };
      sync();
      render();
      return;
    }
    state.jumpFrom = null;
    const oppMoves = legalMoves(state.board, opp, null);
    if (!oppMoves.length) {
      state.winner = player;
      sync();
      celebrate((player === myRole() ? "You win" : roleLabel(player) + " wins") + " Checkers!", "Opponent has no legal moves.");
      render();
      return;
    }
    state.turn = opp;
    sync();
    render();
  }

  function applyMove(fromR, fromC, toR, toC, player) {
    const moves = legalMoves(state.board, player, state.jumpFrom);
    const move = moves.find(function (m) {
      return m.fromR === fromR && m.fromC === fromC && m.toR === toR && m.toC === toC;
    });
    if (!move || player !== state.turn) return false;
    const board = cloneBoard();
    const piece = board[fromR][fromC];
    if (move.jump) {
      applyJump(board, fromR, fromC, toR, toC);
    } else {
      board[toR][toC] = piece;
      board[fromR][fromC] = null;
      if (toR === 0 && owner(piece) === "joiner") board[toR][toC] = "joiner-k";
      if (toR === SIZE - 1 && owner(piece) === "host") board[toR][toC] = "host-k";
    }
    finishTurn(board, player, { fromR: fromR, fromC: fromC, toR: toR, toC: toC, player: player, jump: move.jump });
    return true;
  }

  function tryMove(fromR, fromC, toR, toC) {
    if (!state.started || state.winner) return;
    if (!isMyTurn()) { toast("Not your turn."); return; }
    if (isGameHost()) {
      if (!applyMove(fromR, fromC, toR, toC, myRole())) toast("Illegal move.");
    } else {
      send({ type: "chMoveRequest", payload: { fromR: fromR, fromC: fromC, toR: toR, toC: toC, from: myRole() } });
    }
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (!api.hasPartner || !api.hasPartner()) { toast("Checkers needs a partner in the arena."); return; }
    state.started = true;
    state.board = emptyBoard();
    state.turn = "host";
    state.winner = null;
    state.jumpFrom = null;
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
      case "chSync":
        state.started = true;
        state.board = msg.payload.board;
        state.turn = msg.payload.turn;
        state.winner = msg.payload.winner;
        state.jumpFrom = msg.payload.jumpFrom || null;
        state.lastMove = msg.payload.lastMove || null;
        render();
        break;
      case "chMoveRequest":
        if (!isGameHost() || !state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        applyMove(msg.payload.fromR, msg.payload.fromC, msg.payload.toR, msg.payload.toC, msg.payload.from);
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
    const boardWrap = el("div", "ch-pro-board-wrap");
    const grid = el("div", "ch-pro-grid");
    const myMoves = isMyTurn() ? legalMoves(state.board, myRole(), state.jumpFrom) : [];
    const selected = state.selected || null;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = el("div", "ch-pro-cell" + (isDark(r, c) ? " is-dark" : " is-light"));
        const piece = state.board[r][c];
        if (piece) {
          const chip = el("div", "ch-pro-piece is-" + owner(piece) + (isKing(piece) ? " is-king" : ""));
          if (state.lastMove && ((state.lastMove.fromR === r && state.lastMove.fromC === c) || (state.lastMove.toR === r && state.lastMove.toC === c))) {
            chip.classList.add("is-last");
          }
          cell.appendChild(chip);
        }
        if (isDark(r, c) && piece && owner(piece) === myRole() && isMyTurn()) {
          const canSelect = !state.jumpFrom || (state.jumpFrom.r === r && state.jumpFrom.c === c);
          if (canSelect) {
            cell.classList.add("is-clickable");
            cell.addEventListener("click", function () {
              state.selected = { r: r, c: c };
              render();
            });
          }
        }
        if (selected && isDark(r, c) && !piece) {
          const dest = myMoves.some(function (m) {
            return m.fromR === selected.r && m.fromC === selected.c && m.toR === r && m.toC === c;
          });
          if (dest) {
            cell.classList.add("is-target");
            cell.addEventListener("click", function () {
              tryMove(selected.r, selected.c, r, c);
              state.selected = null;
            });
          }
        }
        if (selected && selected.r === r && selected.c === c) cell.classList.add("is-selected");
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
      const intro = el("div", "ch-pro-intro");
      intro.innerHTML = "<h3 class=\"ch-pro-title\">⬤ Checkers</h3><p>Move diagonally on dark squares. Jump to capture — <strong>jumps are mandatory</strong>. Reach the far row to king. Host is <strong>red</strong>, partner is <strong>black</strong>. Host moves first.</p>";
      const needPartner = api.hasPartner && !api.hasPartner();
      if (needPartner) intro.appendChild(el("p", "ch-pro-hint", "Share your arena code and wait for your partner to join before starting."));
      const btn = el("button", "ch-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
      btn.disabled = !isGameHost() || needPartner;
      btn.addEventListener("click", startGame);
      intro.appendChild(btn);
      panel.appendChild(intro);
      return;
    }

    const wrap = el("div", "ch-pro");
    const bar = el("div", "ch-pro-bar");
    if (state.winner) {
      bar.appendChild(el("span", "ch-pro-pill is-win", state.winner === myRole() ? "You won!" : roleLabel(state.winner) + " won"));
    } else if (state.jumpFrom && state.turn === myRole()) {
      bar.appendChild(el("span", "ch-pro-pill is-active", "Keep jumping!"));
    } else {
      bar.appendChild(el("span", "ch-pro-pill" + (isMyTurn() ? " is-active" : ""), isMyTurn() ? "Your turn" : roleLabel(state.turn) + "'s turn"));
    }
    bar.appendChild(el("span", "ch-pro-pill ch-pro-legend-red", "Red · Host"));
    bar.appendChild(el("span", "ch-pro-pill ch-pro-legend-black", "Black · Partner"));
    wrap.appendChild(bar);

    state.selected = state.selected || null;
    if (state.jumpFrom && state.turn === myRole()) state.selected = { r: state.jumpFrom.r, c: state.jumpFrom.c };
    renderBoard(wrap);

    const actions = el("div", "ch-pro-actions");
    if (isGameHost()) {
      const ng = el("button", "ch-pro-btn secondary", "New Game");
      ng.addEventListener("click", newGame);
      actions.appendChild(ng);
    }
    if (!state.winner) {
      actions.appendChild(el("span", "ch-pro-tip", isMyTurn() ? "Tap your piece, then tap where to move." : "Waiting for " + roleLabel(state.turn) + "…"));
    }
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) sync();
  }

  return { init: function (opts) { api = opts; }, render: render, handleMessage: handleMessage, resync: resync };
})();
