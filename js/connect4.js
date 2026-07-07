/**
 * Connect 4 — two-player drop disc game with host-authoritative sync.
 */
window.Connect4Game = (function () {
  "use strict";

  const ROWS = 6;
  const COLS = 7;

  let api = null;
  let lastSoundMoveKey = null;
  let activeDropKey = null;
  const state = {
    started: false,
    board: null,
    turn: "host",
    winner: null,
    lastMove: null
  };

  function playSound(name) {
    if (!window.ArenaSounds || !ArenaSounds[name]) return;
    ArenaSounds[name]();
  }

  function moveKey(move) {
    if (!move) return null;
    return move.row + ":" + move.col + ":" + move.player;
  }

  function dropDuration(row) {
    return (0.18 + row * 0.05).toFixed(2) + "s";
  }

  function triggerMoveFx(move, won) {
    const key = moveKey(move);
    activeDropKey = key;
    if (key !== lastSoundMoveKey) {
      lastSoundMoveKey = key;
      playSound("slam");
      if (won) {
        setTimeout(function () { playSound("sparkle"); }, Math.round(parseFloat(dropDuration(move.row)) * 1000));
      }
    }
    setTimeout(function () {
      if (activeDropKey === key) {
        activeDropKey = null;
        render();
      }
    }, Math.round(parseFloat(dropDuration(move.row)) * 1000) + 40);
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, function () {
      return Array(COLS).fill(null);
    });
  }

  function myRole() { return api.myRole(); }
  function isMyTurn() { return state.turn === myRole() && !state.winner; }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function dropDisc(col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === null) {
        state.board[r][col] = player;
        return { row: r, col: col, player: player };
      }
    }
    return null;
  }

  function countLine(row, col, dr, dc, player) {
    let n = 0;
    let r = row;
    let c = col;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && state.board[r][c] === player) {
      n++;
      r += dr;
      c += dc;
    }
    return n;
  }

  function isWinningCell(row, col, player) {
    if (state.board[row][col] !== player) return false;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    return dirs.some(function (d) {
      const total = countLine(row, col, d[0], d[1], player) + countLine(row, col, -d[0], -d[1], player) - 1;
      return total >= 4;
    });
  }

  function detectWin(row, col, player) {
    return isWinningCell(row, col, player);
  }

  function boardFull() {
    return state.board[0].every(function (cell) { return cell !== null; });
  }

  function roleLabel(role) {
    if (role === myRole()) return "You";
    return role === "host" ? "Host" : "Partner";
  }

  function playerName(role) {
    return role === "host" ? "Red" : "Yellow";
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
    const btn = el("button", "c4-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    if (needsPartner()) {
      actions.appendChild(el("span", "c4-pro-tip", "Start unlocks when your partner joins."));
    }
    wrap.appendChild(actions);
  }

  function sync(extra) {
    send({
      type: "c4Sync",
      payload: Object.assign({
        board: state.board,
        turn: state.turn,
        winner: state.winner,
        lastMove: state.lastMove
      }, extra || {})
    });
  }

  function finishMove(move) {
    state.lastMove = move;
    const won = detectWin(move.row, move.col, move.player);
    const full = boardFull();
    if (won) state.winner = move.player;
    else if (full) state.winner = "draw";
    else state.turn = state.turn === "host" ? "joiner" : "host";
    sync();
    triggerMoveFx(move, won);
    render();
    if (won) {
      const who = move.player === myRole() ? "You win" : roleLabel(move.player) + " wins";
      celebrate(who + " Connect 4! 🔴", playerName(move.player) + " connected four in a row.");
      return;
    }
    if (full) {
      celebrate("Draw game", "The board is full — nobody connected four.");
    }
  }

  function tryMove(col) {
    if (!state.started || state.winner) return;
    if (!isMyTurn()) {
      toast("Not your turn.");
      return;
    }
    if (col < 0 || col >= COLS || state.board[0][col] !== null) {
      toast("That column is full.");
      return;
    }
    if (isGameHost()) {
      const move = dropDisc(col, myRole());
      if (!move) return;
      finishMove(move);
    } else {
      send({ type: "c4MoveRequest", payload: { col: col, from: myRole() } });
    }
  }

  function startGame() {
    if (!isGameHost()) {
      toast("Waiting for arena host to start.");
      return;
    }
    if (needsPartner()) {
      toast("Your partner must join the arena before starting.");
      return;
    }
    state.started = true;
    state.board = emptyBoard();
    state.turn = "host";
    state.winner = null;
    state.lastMove = null;
    lastSoundMoveKey = null;
    activeDropKey = null;
    sync({ started: true });
    render();
  }

  function newGame() {
    if (!isGameHost()) {
      toast("Only the host can start a new game.");
      return;
    }
    startGame();
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "c4Sync":
        state.started = true;
        state.board = msg.payload.board || emptyBoard();
        state.turn = msg.payload.turn;
        state.winner = msg.payload.winner;
        state.lastMove = msg.payload.lastMove || null;
        if (state.lastMove && moveKey(state.lastMove) !== lastSoundMoveKey) {
          triggerMoveFx(state.lastMove, state.winner && state.winner !== "draw" && state.winner === state.lastMove.player);
        }
        render();
        break;
      case "c4MoveRequest":
        if (!isGameHost()) return;
        if (!state.started || state.winner) return;
        if (msg.payload.from !== state.turn) return;
        const col = msg.payload.col;
        if (col < 0 || col >= COLS || state.board[0][col] !== null) return;
        const move = dropDisc(col, msg.payload.from);
        if (!move) return;
        finishMove(move);
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
    const boardWrap = el("div", "c4-pro-board-wrap");
    const cols = el("div", "c4-pro-cols");
    for (let c = 0; c < COLS; c++) {
      const btn = el("button", "c4-pro-col-btn" + (state.board[0][c] !== null ? " is-full" : ""));
      btn.type = "button";
      btn.title = "Drop in column " + (c + 1);
      btn.textContent = "▼";
      btn.disabled = !isMyTurn() || state.board[0][c] !== null;
      (function (col) {
        btn.addEventListener("click", function () { tryMove(col); });
      })(c);
      cols.appendChild(btn);
    }
    boardWrap.appendChild(cols);

    const grid = el("div", "c4-pro-grid");
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = el("div", "c4-pro-cell");
        const disc = state.board[r][c];
        if (disc) {
          const chip = el("div", "c4-pro-disc is-" + disc);
          if (state.winner && state.winner !== "draw" && isWinningCell(r, c, disc)) {
            chip.classList.add("is-winning");
          }
          if (state.lastMove && state.lastMove.row === r && state.lastMove.col === c) {
            chip.classList.add("is-last");
            if (activeDropKey === moveKey(state.lastMove)) {
              chip.classList.add("is-dropping");
              chip.style.setProperty("--drop-rows", String(r + 1));
              chip.style.setProperty("--drop-dur", dropDuration(r));
            }
          }
          cell.appendChild(chip);
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
      const wrap = el("div", "c4-pro");
      if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
      appendWaitBanner(wrap);
      wrap.appendChild(el("p", "c4-pro-hint", "Drop discs into the grid — first to connect four in a row wins. Host is red, partner is yellow."));
      const bar = el("div", "c4-pro-bar");
      bar.appendChild(el("span", "c4-pro-pill", "Preview · not started"));
      bar.appendChild(el("span", "c4-pro-pill c4-pro-legend-red", "Red · Host"));
      bar.appendChild(el("span", "c4-pro-pill c4-pro-legend-yellow", "Yellow · Partner"));
      wrap.appendChild(bar);
      const savedBoard = state.board;
      state.board = emptyBoard();
      renderBoard(wrap);
      state.board = savedBoard;
      appendStartActions(wrap, startGame);
      panel.appendChild(wrap);
      return;
    }

    const wrap = el("div", "c4-pro");
    const bar = el("div", "c4-pro-bar");
    if (state.winner === "draw") {
      bar.appendChild(el("span", "c4-pro-pill", "Draw game"));
    } else if (state.winner) {
      const w = state.winner === myRole() ? "You won!" : roleLabel(state.winner) + " won";
      bar.appendChild(el("span", "c4-pro-pill is-win", w));
    } else {
      bar.appendChild(el("span", "c4-pro-pill" + (isMyTurn() ? " is-active" : ""), isMyTurn() ? "Your turn · " + playerName(myRole()) : roleLabel(state.turn) + "'s turn · " + playerName(state.turn)));
    }
    bar.appendChild(el("span", "c4-pro-pill c4-pro-legend-red", "Red · Host"));
    bar.appendChild(el("span", "c4-pro-pill c4-pro-legend-yellow", "Yellow · Partner"));
    wrap.appendChild(bar);

    renderBoard(wrap);

    const actions = el("div", "c4-pro-actions");
    if (isGameHost()) {
      const ng = el("button", "c4-pro-btn secondary", "New Game");
      ng.addEventListener("click", newGame);
      actions.appendChild(ng);
    }
    if (!state.winner) {
      const hint = el("span", "c4-pro-tip", isMyTurn() ? "Tap ▼ above a column to drop your disc." : "Waiting for " + roleLabel(state.turn) + "…");
      actions.appendChild(hint);
    }
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) sync();
  }

  return {
    init: function (opts) {
      api = opts;
    },
    render: render,
    handleMessage: handleMessage,
    resync: resync
  };
})();
