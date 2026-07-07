/**
 * Rummikub — premium tile rummy with open-source-style validation logic.
 * Runs/groups with joker backtracking; sortable hand; polished table UI.
 */
window.RummikubGame = (function () {
  "use strict";

  const RK_COLORS = ["red", "blue", "black", "orange"];
  let uidCounter = 1;
  function uid() { return "rk" + uidCounter++ + "_" + Math.random().toString(36).slice(2, 6); }

  let api = null;
  let handSortable = null;
  const state = {
    started: false,
    pool: [],
    poolCount: 0,
    hand: [],
    table: [],
    turn: "host",
    selected: [],
    playedThisTurn: false,
    turnPlayedValue: 0,
    meldDone: { host: false, joiner: false },
    sortMode: "color"
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildDeck() {
    const deck = [];
    RK_COLORS.forEach(function (color) {
      for (let n = 1; n <= 13; n++) {
        deck.push({ id: uid(), color: color, num: n });
        deck.push({ id: uid(), color: color, num: n });
      }
    });
    deck.push({ id: uid(), isJoker: true });
    deck.push({ id: uid(), isJoker: true });
    return shuffle(deck);
  }

  function myRole() { return api.myRole(); }
  function oppRole() { return myRole() === "host" ? "joiner" : "host"; }
  function isMyTurn() { return state.turn === myRole(); }
  function isGameHost() { return api.isGameHost(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }

  /** Validate set with joker assignment via search. */
  function validateSet(tiles) {
    if (tiles.length < 3) return { valid: false };
    const jokers = tiles.filter(function (t) { return t.isJoker; });
    const reals = tiles.filter(function (t) { return !t.isJoker; });
    if (jokers.length > 2) return { valid: false };

    if (reals.length) {
      const num = reals[0].num;
      if (reals.every(function (t) { return t.num === num; })) {
        const colors = reals.map(function (t) { return t.color; });
        if (new Set(colors).size === colors.length && tiles.length <= 4) {
          return { valid: true, type: "group", value: num * tiles.length };
        }
      }
    }

    if (reals.length) {
      const color = reals[0].color;
      if (reals.every(function (t) { return t.color === color; })) {
        const nums = reals.map(function (t) { return t.num; });
        if (new Set(nums).size !== nums.length) return { valid: false };
        const len = tiles.length;
        const lo = Math.min.apply(null, nums);
        const hi = Math.max.apply(null, nums);
        const span = hi - lo + 1;
        if (span <= len && span + jokers.length >= len) {
          let sum = 0;
          for (let n = lo; n <= hi; n++) sum += n;
          const missing = len - reals.length;
          if (missing <= jokers.length) {
            for (let start = Math.max(1, hi - len + 1); start <= Math.min(lo, 13 - len + 1); start++) {
              const end = start + len - 1;
              if (end > 13) continue;
              let ok = true;
              for (let n = start; n <= end; n++) {
                if (!nums.includes(n) && jokers.length === 0) ok = false;
              }
              if (ok) {
                let runSum = 0;
                for (let n = start; n <= end; n++) runSum += n;
                return { valid: true, type: "run", value: runSum };
              }
            }
            return { valid: true, type: "run", value: sum + (missing * (lo + hi) / 2) };
          }
        }
      }
    }
    return { valid: false };
  }

  function validateTable() {
    return state.table.every(function (set) { return validateSet(set).valid; });
  }

  function sortHand() {
    state.hand.sort(function (a, b) {
      if (a.isJoker && !b.isJoker) return 1;
      if (!a.isJoker && b.isJoker) return -1;
      if (a.isJoker && b.isJoker) return 0;
      if (state.sortMode === "number") {
        if (a.num !== b.num) return a.num - b.num;
        return RK_COLORS.indexOf(a.color) - RK_COLORS.indexOf(b.color);
      }
      if (a.color !== b.color) return RK_COLORS.indexOf(a.color) - RK_COLORS.indexOf(b.color);
      return a.num - b.num;
    });
    render();
  }

  function toggleSortMode() {
    state.sortMode = state.sortMode === "color" ? "number" : "color";
    sortHand();
  }

  function syncTable() {
    send({
      type: "rkSync",
      payload: {
        table: state.table,
        poolCount: state.poolCount,
        turn: state.turn,
        meldDone: state.meldDone
      }
    });
  }

  function startGame() {
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (api.requiresPartnerToStart && api.requiresPartnerToStart()) {
      toast("Your partner must join the arena before starting.");
      return;
    }
    const deck = buildDeck();
    const hostHand = deck.splice(0, 14);
    const joinerHand = deck.splice(0, 14);
    state.pool = deck;
    state.poolCount = deck.length;
    state.hand = hostHand;
    state.table = [];
    state.turn = "host";
    state.started = true;
    state.meldDone = { host: false, joiner: false };
    state.playedThisTurn = false;
    state.turnPlayedValue = 0;
    state.selected = [];
    send({ type: "rkStart", payload: { yourHand: joinerHand, poolCount: state.poolCount, turn: "host" } });
    render();
  }

  function toggleSelect(idx) {
    const pos = state.selected.indexOf(idx);
    if (pos === -1) state.selected.push(idx);
    else state.selected.splice(pos, 1);
    render();
  }

  function playSelected() {
    if (!isMyTurn()) { toast("Not your turn."); return; }
    if (state.selected.length < 3) { toast("Select at least 3 tiles."); return; }
    const tiles = state.selected.map(function (i) { return state.hand[i]; });
    const result = validateSet(tiles);
    if (!result.valid) { toast("Not a valid run or group."); return; }
    const role = myRole();
    if (!state.meldDone[role]) {
      state.turnPlayedValue += result.value;
      if (state.turnPlayedValue >= 30) state.meldDone[role] = true;
    }
    state.table.push(tiles);
    state.selected.slice().sort(function (a, b) { return b - a; }).forEach(function (i) { state.hand.splice(i, 1); });
    state.selected = [];
    state.playedThisTurn = true;
    syncTable();
    render();
    if (state.hand.length === 0) {
      send({ type: "rkWin", payload: { by: api.myName() } });
      celebrate(api.myName() + " wins Rummikub! 🀄", "Table cleared — flawless run.");
    }
  }

  function endTurn() {
    if (!isMyTurn()) { toast("Not your turn."); return; }
    const role = myRole();
    if (!state.meldDone[role] && state.turnPlayedValue > 0 && state.turnPlayedValue < 30) {
      toast("First meld must total 30+ (currently " + state.turnPlayedValue + ").");
      return;
    }
    if (!state.playedThisTurn) {
      drawTile(true);
      return;
    }
    state.turn = oppRole();
    state.playedThisTurn = false;
    state.turnPlayedValue = 0;
    syncTable();
    render();
  }

  function drawTile(fromEndTurn) {
    if (!isMyTurn()) { toast("Not your turn."); return; }
    if (isGameHost()) {
      if (state.pool.length === 0) {
        toast("Pool empty!");
        if (fromEndTurn) { state.turn = oppRole(); state.playedThisTurn = false; state.turnPlayedValue = 0; syncTable(); render(); }
        return;
      }
      state.hand.push(state.pool.pop());
      state.poolCount = state.pool.length;
      state.turn = oppRole();
      state.playedThisTurn = false;
      state.turnPlayedValue = 0;
      syncTable();
      render();
    } else {
      send({ type: "rkDrawRequest" });
    }
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "rkStart":
        if (isGameHost()) return;
        state.hand = msg.payload.yourHand;
        state.poolCount = msg.payload.poolCount;
        state.table = [];
        state.turn = msg.payload.turn;
        state.started = true;
        state.meldDone = { host: false, joiner: false };
        state.playedThisTurn = false;
        state.turnPlayedValue = 0;
        state.selected = [];
        render();
        toast("Rummikub started!");
        break;
      case "rkSync":
        state.table = msg.payload.table;
        state.poolCount = msg.payload.poolCount;
        state.turn = msg.payload.turn;
        state.meldDone = msg.payload.meldDone;
        render();
        break;
      case "rkDrawRequest":
        if (isGameHost()) {
          if (state.pool.length === 0) {
            send({ type: "rkDrawGrant", payload: { tile: null, poolCount: 0, turn: "host" } });
            state.turn = "host";
            render();
          } else {
            const tile = state.pool.pop();
            state.poolCount = state.pool.length;
            state.turn = "host";
            send({ type: "rkDrawGrant", payload: { tile: tile, poolCount: state.poolCount, turn: "host" } });
            render();
          }
        }
        break;
      case "rkDrawGrant":
        if (msg.payload.tile) state.hand.push(msg.payload.tile);
        state.poolCount = msg.payload.poolCount;
        state.turn = msg.payload.turn;
        state.playedThisTurn = false;
        state.turnPlayedValue = 0;
        render();
        break;
      case "rkWin":
        celebrate(msg.payload.by + " wins Rummikub! 🀄", "Every tile placed.");
        break;
    }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function tileClass(t) {
    if (t.isJoker) return "rk-pro-tile is-joker";
    return "rk-pro-tile is-" + t.color;
  }

  function tileLabel(t) { return t.isJoker ? "★" : String(t.num); }

  function renderPreview() {
    if (state.selected.length < 3) return null;
    const tiles = state.selected.map(function (i) { return state.hand[i]; });
    const result = validateSet(tiles);
    return result.valid ? "Valid " + result.type + " · " + result.value + " pts" : "Invalid set";
  }

  function needsPartner() {
    return api.requiresPartnerToStart && api.requiresPartnerToStart();
  }

  function appendWaitBanner(wrap) {
    if (!needsPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "Waiting for your partner — share your arena code. Explore the table below while you wait."));
  }

  function appendStartActions(wrap, onStart) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "rk-pro-btn", isGameHost() ? "Start Game" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    if (needsPartner()) {
      actions.appendChild(el("span", "rk-pro-tip", "Start unlocks when your partner joins."));
    }
    wrap.appendChild(actions);
  }

  function renderLobby(wrap) {
    if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
    appendWaitBanner(wrap);
    wrap.appendChild(el("p", "rk-pro-hint", "Form runs or groups on the table. First meld must total 30+ points. First to empty your rack wins."));
    const bar = el("div", "rk-pro-bar");
    bar.appendChild(el("span", "rk-pro-pill", "Preview · not started"));
    bar.appendChild(el("span", "rk-pro-pill", "Pool · —"));
    bar.appendChild(el("span", "rk-pro-pill", "Your hand · —"));
    wrap.appendChild(bar);

    const opp = el("div", "rk-pro-opponent");
    opp.appendChild(el("div", "rk-pro-opponent-label", "Opponent's hand"));
    opp.appendChild(el("p", null, "Hidden until the game starts — you'll only see tiles they play on the table."));
    wrap.appendChild(opp);

    const tableWrap = el("div", "rk-pro-table");
    tableWrap.appendChild(el("div", "rk-pro-table-label", "Table"));
    const tableInner = el("div", "rk-pro-table-inner");
    tableInner.appendChild(el("p", "rk-pro-empty", "Sets you play will appear here."));
    tableWrap.appendChild(tableInner);
    wrap.appendChild(tableWrap);

    const handWrap = el("div", "rk-pro-hand-wrap");
    handWrap.appendChild(el("div", "rk-pro-hand-head", "Your hand"));
    const hand = el("div", "rk-pro-hand");
    hand.appendChild(el("p", "rk-pro-empty", "Your tiles appear here when the host starts."));
    handWrap.appendChild(hand);
    wrap.appendChild(handWrap);

    appendStartActions(wrap, startGame);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    panel.innerHTML = "";

    if (!state.started) {
      const wrap = el("div", "rk-pro");
      renderLobby(wrap);
      panel.appendChild(wrap);
      return;
    }

    const wrap = el("div", "rk-pro");
    const bar = el("div", "rk-pro-bar");
    bar.appendChild(el("span", "rk-pro-pill" + (isMyTurn() ? " is-active" : ""), isMyTurn() ? "Your turn" : "Opponent's turn"));
    bar.appendChild(el("span", "rk-pro-pill", "Pool · " + state.poolCount));
    bar.appendChild(el("span", "rk-pro-pill", "Your hand · " + state.hand.length));
    if (!state.meldDone[myRole()]) {
      bar.appendChild(el("span", "rk-pro-pill", "Meld · " + state.turnPlayedValue + "/30"));
    }
    wrap.appendChild(bar);

    const opp = el("div", "rk-pro-opponent");
    opp.appendChild(el("div", "rk-pro-opponent-label", "Opponent's hand"));
    opp.appendChild(el("p", null, "Hidden — you only see tiles they play on the table below."));
    wrap.appendChild(opp);

    const tableWrap = el("div", "rk-pro-table");
    tableWrap.appendChild(el("div", "rk-pro-table-label", "Table"));
    const tableInner = el("div", "rk-pro-table-inner");
    if (!state.table.length) {
      tableInner.appendChild(el("p", "rk-pro-empty", "No sets yet — play 3+ tiles from your hand."));
    }
    state.table.forEach(function (set, si) {
      const row = el("div", "rk-pro-set");
      set.forEach(function (t) {
        row.appendChild(el("div", tileClass(t), tileLabel(t)));
      });
      tableInner.appendChild(row);
    });
    tableWrap.appendChild(tableInner);
    wrap.appendChild(tableWrap);

    const handWrap = el("div", "rk-pro-hand-wrap");
    const handHead = el("div", "rk-pro-hand-head");
    handHead.appendChild(el("span", null, "Your hand"));
    const sortBtn = el("button", "rk-pro-sort", "Sort · " + (state.sortMode === "color" ? "color" : "#"));
    sortBtn.addEventListener("click", toggleSortMode);
    handHead.appendChild(sortBtn);
    handWrap.appendChild(handHead);

    const hand = el("div", "rk-pro-hand");
    state.hand.forEach(function (t, idx) {
      const sel = state.selected.indexOf(idx) !== -1;
      const chip = el("div", tileClass(t) + (sel ? " is-selected" : ""));
      chip.textContent = tileLabel(t);
      chip.draggable = true;
      chip.addEventListener("click", function () { toggleSelect(idx); });
      hand.appendChild(chip);
    });
    handWrap.appendChild(hand);

    if (window.Sortable && hand.children.length) {
      if (handSortable) handSortable.destroy();
      handSortable = Sortable.create(hand, {
        animation: 160,
        delay: 100,
        delayOnTouchOnly: true,
        draggable: ".rk-pro-tile",
        onEnd: function (evt) {
          if (evt.oldIndex === evt.newIndex) return;
          const moved = state.hand.splice(evt.oldIndex, 1)[0];
          state.hand.splice(evt.newIndex, 0, moved);
          state.selected = [];
        }
      });
    }

    const preview = renderPreview();
    if (preview) {
      handWrap.appendChild(el("div", "rk-pro-preview" + (preview.indexOf("Valid") === 0 ? " is-valid" : " is-invalid"), preview));
    }
    wrap.appendChild(handWrap);

    const actions = el("div", "rk-pro-actions");
    [
      ["Play set", playSelected, !isMyTurn() || state.selected.length < 3],
      ["Draw", function () { drawTile(false); }, !isMyTurn()],
      ["End turn", endTurn, !isMyTurn()]
    ].forEach(function (spec) {
      const b = el("button", "rk-pro-btn" + (spec[0] === "Play set" ? "" : " secondary"), spec[0]);
      b.disabled = spec[2];
      b.addEventListener("click", spec[1]);
      actions.appendChild(b);
    });
    wrap.appendChild(actions);
    panel.appendChild(wrap);
  }

  function resync() {
    if (state.started) syncTable();
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
