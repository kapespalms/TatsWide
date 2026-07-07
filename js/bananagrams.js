/**
 * Bananagrams — premium board + open-source dictionary validation.
 * Based on standard Bananagrams rules; dictionary from redbo/scrabble (MIT).
 */
window.BananagramsGame = (function () {
  "use strict";

  const BG_DIST = { A:13,B:3,C:3,D:6,E:18,F:3,G:4,H:3,I:12,J:2,K:2,L:5,M:3,N:8,O:11,P:3,Q:2,R:9,S:6,T:9,U:6,V:3,W:3,X:2,Y:3,Z:2 };
  const COLS = 15;
  const ROWS = 15;
  const SIZE = COLS * ROWS;

  let api = null;
  const state = {
    started: false,
    pool: [],
    poolCount: 0,
    rack: [],
    grid: new Array(SIZE).fill(null),
    peerGrid: new Array(SIZE).fill(null),
    peerRackCount: null,
    selectedRackIdx: null,
    dragPayload: null,
    dictReady: false
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildPool() {
    const pool = [];
    Object.keys(BG_DIST).forEach(function (letter) {
      for (let i = 0; i < BG_DIST[letter]; i++) pool.push(letter);
    });
    return shuffle(pool);
  }

  function isGameHost() { return api.isGameHost(); }
  function myRole() { return api.myRole ? api.myRole() : (isGameHost() ? "host" : "joiner"); }
  function peerRole() { return myRole() === "host" ? "joiner" : "host"; }
  function opponentName() { return api.peerName ? api.peerName() : "Opponent"; }

  function needsPartner() {
    return api.requiresPartnerToStart && api.requiresPartnerToStart();
  }

  function appendWaitBanner(wrap) {
    if (!needsPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "Waiting for your partner — share your arena code. Explore the boards below while you wait."));
  }

  function appendStartActions(wrap) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "bg-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", startGame);
    actions.appendChild(btn);
    if (needsPartner()) {
      actions.appendChild(el("span", "bg-pro-tip", "Start unlocks when your partner joins."));
    }
    wrap.appendChild(actions);
  }

  function renderGameBody(wrap, opts) {
    const myColor = myRole();
    const peerColor = peerRole();
    const grid = opts.grid;
    const peerGrid = opts.peerGrid;
    const rack = opts.rack;
    const poolCount = opts.poolCount;
    const peerRackCount = opts.peerRackCount;
    const showActions = opts.showActions;

    const legend = el("div", "bg-pro-legend");
    legend.innerHTML = "<span class=\"bg-pro-legend-chip is-host\">Gold · Host</span><span class=\"bg-pro-legend-chip is-joiner\">Blue · Partner</span><span class=\"bg-pro-legend-note\">Racks stay hidden</span>";
    wrap.appendChild(legend);

    const top = el("div", "bg-pro-toolbar");
    top.appendChild(el("span", "bg-pro-stat", "Bunch · " + poolCount));
    top.appendChild(el("span", "bg-pro-stat", "Your rack · " + rack.length));
    if (peerRackCount !== null) {
      top.appendChild(el("span", "bg-pro-stat", opponentName() + " rack · " + peerRackCount + " hidden"));
    }

    if (showActions) {
      const v = validateGrid();
      const wordBadge = el("span", "bg-pro-stat bg-pro-words " + (v.ok && v.words.length ? "is-valid" : v.invalid.length ? "is-invalid" : ""));
      wordBadge.textContent = v.words.length ? v.words.length + " word" + (v.words.length === 1 ? "" : "s") : "No words yet";
      top.appendChild(wordBadge);
    } else {
      top.appendChild(el("span", "bg-pro-stat", "Preview · not started"));
    }
    wrap.appendChild(top);

    const boards = el("div", "bg-pro-boards");
    const peerSection = el("div", "bg-pro-board-section");
    const peerHead = el("div", "bg-pro-board-head");
    peerHead.appendChild(el("span", "bg-pro-board-label", opponentName() + " · laid out"));
    peerHead.appendChild(el("span", "bg-pro-board-swatch is-" + peerColor, peerColor === "host" ? "Gold" : "Blue"));
    peerSection.appendChild(peerHead);
    peerSection.appendChild(renderBoardGrid(peerGrid, { editable: false, colorRole: peerColor, compact: true }));
    boards.appendChild(peerSection);

    const mySection = el("div", "bg-pro-board-section is-mine");
    const myHead = el("div", "bg-pro-board-head");
    myHead.appendChild(el("span", "bg-pro-board-label", (api.myName ? api.myName() : "You") + " · your board"));
    myHead.appendChild(el("span", "bg-pro-board-swatch is-" + myColor, myColor === "host" ? "Gold" : "Blue"));
    mySection.appendChild(myHead);

    if (showActions) {
      const rackEl = el("div", "bg-pro-rack");
      rackEl.appendChild(el("div", "bg-pro-rack-label", "Your rack (only you see this)"));
      const rackTiles = el("div", "bg-pro-rack-tiles");
      rack.forEach(function (letter, idx) {
        rackTiles.appendChild(makeTile(letter, { from: "rack", index: idx, selected: state.selectedRackIdx === idx, colorRole: myColor }));
      });
      rackEl.appendChild(rackTiles);
      mySection.appendChild(rackEl);
    } else {
      mySection.appendChild(el("p", "bg-pro-lobby-note", "Your letter rack appears here when the host starts."));
    }

    mySection.appendChild(renderBoardGrid(grid, { editable: showActions, colorRole: myColor, compact: false }));
    boards.appendChild(mySection);
    wrap.appendChild(boards);

    if (showActions) {
      const v = validateGrid();
      if (v.invalid.length) {
        wrap.appendChild(el("div", "bg-pro-wordlist is-invalid", "Unknown: " + v.invalid.join(", ")));
      } else if (v.words.length) {
        wrap.appendChild(el("div", "bg-pro-wordlist is-valid", v.words.join(" · ")));
      }

      const actions = el("div", "bg-pro-actions");
      [["Peel!", requestPeel, state.rack.length !== 0], ["Dump (1→3)", requestDump, state.selectedRackIdx === null], ["Bananas!", callBananas, !(state.poolCount === 0 && state.rack.length === 0)]].forEach(function (spec) {
        const b = el("button", "bg-pro-btn secondary", spec[0]);
        b.disabled = spec[2];
        b.addEventListener("click", spec[1]);
        actions.appendChild(b);
      });
      wrap.appendChild(actions);
    }
  }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  function broadcastGrid() {
    if (!state.started) return;
    send({ type: "bgGridSync", payload: { grid: state.grid.slice(), rackCount: state.rack.length } });
  }

  function extractWords() {
    const words = [];
    for (let r = 0; r < ROWS; r++) {
      let w = "";
      for (let c = 0; c < COLS; c++) {
        const ch = state.grid[r * COLS + c];
        if (ch) w += ch;
        else {
          if (w.length > 1) words.push(w.toLowerCase());
          w = "";
        }
      }
      if (w.length > 1) words.push(w.toLowerCase());
    }
    for (let c = 0; c < COLS; c++) {
      let w = "";
      for (let r = 0; r < ROWS; r++) {
        const ch = state.grid[r * COLS + c];
        if (ch) w += ch;
        else {
          if (w.length > 1) words.push(w.toLowerCase());
          w = "";
        }
      }
      if (w.length > 1) words.push(w.toLowerCase());
    }
    return words;
  }

  function validateGrid() {
    if (!WordDict.ready()) return { ok: true, words: [], invalid: [], note: "Dictionary loading…" };
    const words = extractWords();
    const invalid = words.filter(function (w) { return !WordDict.has(w); });
    const used = state.grid.filter(Boolean).length;
    if (used === 0) return { ok: false, words: [], invalid: [], note: "Place at least one word on your board." };
    return { ok: invalid.length === 0, words: words, invalid: invalid, note: null };
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (api.requiresPartnerToStart && api.requiresPartnerToStart()) {
      toast("Your partner must join the arena before starting.");
      return;
    }
    const pool = buildPool();
    const hostTiles = pool.splice(0, 21);
    const joinerTiles = pool.splice(0, 21);
    state.pool = pool;
    state.poolCount = pool.length;
    state.rack = hostTiles;
    state.grid = new Array(SIZE).fill(null);
    state.peerGrid = new Array(SIZE).fill(null);
    state.peerRackCount = 21;
    state.started = true;
    state.selectedRackIdx = null;
    send({ type: "bgStart", payload: { yourTiles: joinerTiles, poolCount: pool.length } });
    broadcastGrid();
    render();
  }

  function doPeel() {
    if (state.pool.length < 2) {
      toast(state.pool.length ? "Not enough tiles in the bunch to peel." : "Pool empty — call Bananas!");
      return;
    }
    const joinerTile = state.pool.pop();
    const hostTile = state.pool.pop();
    state.poolCount = state.pool.length;
    state.rack.push(hostTile);
    send({ type: "bgPeel", payload: { tile: joinerTile, poolCount: state.poolCount } });
    broadcastGrid();
    render();
  }

  function requestPeel() {
    if (state.rack.length !== 0) { toast("Place all tiles first, then Peel!"); return; }
    if (isGameHost()) doPeel();
    else { send({ type: "bgPeelRequest" }); toast("Peel requested…"); }
  }

  function requestDump() {
    if (state.selectedRackIdx === null) { toast("Select a rack tile to dump."); return; }
    const tile = state.rack[state.selectedRackIdx];
    if (isGameHost()) {
      if (state.pool.length < 3) { toast("Not enough tiles in the pool."); return; }
      state.rack.splice(state.selectedRackIdx, 1);
      state.pool.push(tile);
      state.pool = shuffle(state.pool);
      state.rack.push.apply(state.rack, state.pool.splice(0, 3));
      state.poolCount = state.pool.length;
      state.selectedRackIdx = null;
      send({ type: "bgPoolCount", payload: { poolCount: state.poolCount } });
      broadcastGrid();
      render();
    } else {
      state.rack.splice(state.selectedRackIdx, 1);
      state.selectedRackIdx = null;
      send({ type: "bgDumpRequest", payload: { tile: tile } });
      broadcastGrid();
      render();
      toast("Dump requested…");
    }
  }

  function callBananas() {
    const v = validateGrid();
    if (!v.ok) {
      if (v.invalid.length) toast("Invalid words: " + v.invalid.slice(0, 4).join(", ") + (v.invalid.length > 4 ? "…" : ""));
      else toast(v.note || "Board not ready.");
      return;
    }
    if (state.poolCount !== 0 || state.rack.length !== 0) {
      toast("Empty your rack when the pool is dry before calling Bananas!");
      return;
    }
    send({ type: "bgBananas", payload: { by: api.myName() } });
    celebrate(api.myName() + " called Bananas! 🍌", v.words.length + " valid words — honor-check your opponent's grid!");
  }

  function placeLetter(idx, letter) {
    state.grid[idx] = letter;
    broadcastGrid();
    render();
  }

  function pickFromRack(idx) {
    return state.rack.splice(idx, 1)[0];
  }

  function returnToRack(idx) {
    const letter = state.grid[idx];
    if (!letter) return;
    state.grid[idx] = null;
    state.rack.push(letter);
    state.selectedRackIdx = null;
    broadcastGrid();
    render();
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "bgStart":
        if (isGameHost()) return;
        state.rack = msg.payload.yourTiles;
        state.poolCount = msg.payload.poolCount;
        state.grid = new Array(SIZE).fill(null);
        state.peerGrid = new Array(SIZE).fill(null);
        state.peerRackCount = 21;
        state.started = true;
        render();
        broadcastGrid();
        toast("Bananagrams started!");
        break;
      case "bgGridSync":
        if (msg.payload.grid && msg.payload.grid.length === SIZE) {
          state.peerGrid = msg.payload.grid.slice();
        }
        if (typeof msg.payload.rackCount === "number") {
          state.peerRackCount = msg.payload.rackCount;
        }
        render();
        break;
      case "bgPeelRequest":
        doPeel();
        break;
      case "bgPeel":
        state.rack.push(msg.payload.tile);
        state.poolCount = msg.payload.poolCount;
        broadcastGrid();
        render();
        toast("Peel! Everyone draws a tile.");
        break;
      case "bgDumpRequest":
        if (isGameHost()) {
          if (state.pool.length < 3) {
            send({ type: "bgDumpReject", payload: { tile: msg.payload.tile } });
          } else {
            state.pool.push(msg.payload.tile);
            state.pool = shuffle(state.pool);
            const newTiles = state.pool.splice(0, 3);
            state.poolCount = state.pool.length;
            send({ type: "bgDumpResult", payload: { tiles: newTiles, poolCount: state.poolCount } });
            render();
          }
        }
        break;
      case "bgDumpResult":
        state.rack.push.apply(state.rack, msg.payload.tiles);
        state.poolCount = msg.payload.poolCount;
        broadcastGrid();
        render();
        toast("Dump complete — 3 new tiles.");
        break;
      case "bgDumpReject":
        state.rack.push(msg.payload.tile);
        broadcastGrid();
        render();
        toast("Pool too low to dump.");
        break;
      case "bgPoolCount":
        state.poolCount = msg.payload.poolCount;
        render();
        break;
      case "bgBananas":
        celebrate(msg.payload.by + " called Bananas! 🍌", "Verify both grids — dictionary-checked on their side.");
        break;
    }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function makeTile(letter, opts) {
    const colorClass = opts.colorRole === "joiner" ? " is-joiner" : " is-host";
    const t = el("div", "bg-tile" + colorClass + (opts.selected ? " is-selected" : "") + (opts.readonly ? " is-readonly" : ""), letter);
    if (opts.readonly) return t;
    t.draggable = true;
    t.addEventListener("dragstart", function (e) {
      const payload = { letter: letter, from: opts.from, index: opts.index };
      state.dragPayload = payload;
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
      t.classList.add("is-dragging");
    });
    t.addEventListener("dragend", function () {
      t.classList.remove("is-dragging");
      state.dragPayload = null;
    });
    if (opts.from === "rack") {
      t.addEventListener("click", function () {
        state.selectedRackIdx = state.selectedRackIdx === opts.index ? null : opts.index;
        render();
      });
    }
    return t;
  }

  function renderBoardGrid(gridData, opts) {
    const board = el("div", "bg-pro-board-wrap" + (opts.compact ? " is-compact" : ""));
    const grid = el("div", "bg-pro-grid");
    for (let i = 0; i < SIZE; i++) {
      const letter = gridData[i];
      const cell = el("div", "bg-pro-cell" + (letter ? " is-filled" : ""));
      if (opts.editable) {
        cell.dataset.idx = String(i);
        cell.addEventListener("dragover", function (e) { e.preventDefault(); cell.classList.add("is-drop-target"); });
        cell.addEventListener("dragleave", function () { cell.classList.remove("is-drop-target"); });
        cell.addEventListener("drop", function (e) {
          e.preventDefault();
          cell.classList.remove("is-drop-target");
          let payload;
          try { payload = JSON.parse(e.dataTransfer.getData("application/json")); } catch (err) { return; }
          const idx = parseInt(cell.dataset.idx, 10);
          if (state.grid[idx]) return;
          if (payload.from === "rack") {
            placeLetter(idx, pickFromRack(payload.index));
          } else if (payload.from === "board") {
            if (payload.index === idx) return;
            const ch = state.grid[payload.index];
            state.grid[payload.index] = null;
            placeLetter(idx, ch);
          }
        });
      }
      if (letter) {
        if (opts.editable) {
          const bt = makeTile(letter, { from: "board", index: i, selected: false, colorRole: opts.colorRole });
          bt.addEventListener("dblclick", function () { returnToRack(i); });
          cell.appendChild(bt);
        } else {
          cell.appendChild(makeTile(letter, { readonly: true, colorRole: opts.colorRole }));
        }
      }
      grid.appendChild(cell);
    }
    board.appendChild(grid);
    return board;
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";

    if (!state.dictReady) {
      WordDict.load().then(function () {
        state.dictReady = true;
        render();
      });
    }

    if (!state.started) {
      const wrap = el("div", "bg-pro");
      if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
      appendWaitBanner(wrap);
      renderGameBody(wrap, {
        grid: new Array(SIZE).fill(null),
        peerGrid: new Array(SIZE).fill(null),
        rack: [],
        poolCount: "—",
        peerRackCount: "—",
        showActions: false
      });
      appendStartActions(wrap);
      panel.appendChild(wrap);
      return;
    }

    const wrap = el("div", "bg-pro");
    renderGameBody(wrap, {
      grid: state.grid,
      peerGrid: state.peerGrid,
      rack: state.rack,
      poolCount: state.poolCount,
      peerRackCount: state.peerRackCount,
      showActions: true
    });
    panel.appendChild(wrap);
  }

  function resync() {
    broadcastGrid();
  }

  return {
    init: function (opts) {
      api = opts;
      WordDict.load().then(function () { state.dictReady = true; render(); });
    },
    render: render,
    handleMessage: handleMessage,
    resync: resync
  };
})();
