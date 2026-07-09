/**
 * Arena Party — Mario Party-style board game via iframe + WebSocket relay.
 */
window.ArenaPartyGame = (function () {
  "use strict";

  const ARENA_SOURCE = "wideass-arena";
  const PARTY_SOURCE = "arena-party";

  let api = null;
  let iframe = null;
  let started = false;
  let partyListener = null;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function isGameHost() { return api.isGameHost(); }
  function myRole() { return api.myRole ? api.myRole() : (isGameHost() ? "host" : "joiner"); }
  function needsPartner() { return api.requiresPartnerToStart && api.requiresPartnerToStart(); }
  function isSolo() { return api.isSoloPlay && api.isSoloPlay(); }
  function toast(msg) { api.toast(msg); }
  function send(msg) { api.send(msg); }

  function myChar() {
    const c = api.myBaseChar && api.myBaseChar();
    return c === "wideass" ? "wideass" : "tats";
  }

  function peerChar() {
    const c = api.peerBaseChar && api.peerBaseChar();
    if (!c) return null;
    return c === "wideass" ? "wideass" : "tats";
  }

  function charLabel(id) {
    if (window.mascotLabel) return window.mascotLabel(id);
    return id === "wideass" ? "Wideass" : "Tats";
  }

  function postToIframe(msg) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(Object.assign({ source: ARENA_SOURCE }, msg), "*");
  }

  function pushArenaInit() {
    postToIframe({
      type: "arenaInit",
      role: myRole(),
      driver: myChar(),
      peer: isSolo() ? null : peerChar(),
      solo: isSolo(),
    });
  }

  function scheduleArenaInit() {
    pushArenaInit();
    setTimeout(pushArenaInit, 120);
    setTimeout(pushArenaInit, 600);
  }

  function bindPartyRelay() {
    if (partyListener) return;
    partyListener = function (event) {
      const data = event.data;
      if (!data || data.source !== PARTY_SOURCE) return;

      if (data.type === "ready") {
        scheduleArenaInit();
        return;
      }

      if (data.type === "emit") {
        // Relay this client's raw game event to the peer client.
        if (isSolo()) return;
        send({
          type: "mpEmit",
          payload: {
            from: data.from === "host" ? "host" : "join",
            event: data.event,
            args: data.args || [],
          },
        });
        return;
      }

      if (data.type === "playAgain") {
        if (!isGameHost()) return;
        started = false;
        destroyIframe();
        send({ type: "mpNewGame", payload: {} });
        render();
        return;
      }
    };
    window.addEventListener("message", partyListener);
  }

  function unbindPartyRelay() {
    if (!partyListener) return;
    window.removeEventListener("message", partyListener);
    partyListener = null;
  }

  function destroyIframe() {
    unbindPartyRelay();
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    iframe = null;
  }

  function appendWaitBanner(wrap) {
    if (!needsPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "2-player mode — share your arena code, then both launch the party."));
  }

  function appendStartActions(wrap, onStart) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "c4-pro-btn", isGameHost() ? "Launch Party" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    wrap.appendChild(actions);
  }

  function renderCharPreview(wrap) {
    if (!window.mascotSVG) return;
    const row = el("div", "kart-char-preview");
    const you = el("div", "kart-char-card is-you");
    you.innerHTML =
      '<div class="kart-char-svg">' + window.mascotSVG(myChar()) + "</div>" +
      '<span class="kart-char-name">' + charLabel(myChar()) + "</span>" +
      '<span class="kart-char-tag">You</span>';
    row.appendChild(you);
    const peer = peerChar();
    if (peer && !isSolo()) {
      row.appendChild(el("span", "kart-char-vs", "VS"));
      const them = el("div", "kart-char-card is-peer");
      them.innerHTML =
        '<div class="kart-char-svg">' + window.mascotSVG(peer) + "</div>" +
        '<span class="kart-char-name">' + charLabel(peer) + "</span>" +
        '<span class="kart-char-tag">Partner</span>';
      row.appendChild(them);
    }
    wrap.appendChild(row);
  }

  function renderLobby(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro party-pro");
    if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
    appendWaitBanner(wrap);
    renderCharPreview(wrap);
    const peer = peerChar();
    const vs = isSolo()
      ? charLabel(myChar()) + " solo party"
      : peer
        ? charLabel(myChar()) + " vs " + charLabel(peer)
        : charLabel(myChar());
    wrap.appendChild(el("p", "kart-pro-hint", "Roll the dice, move on the board, and trigger minigames on coin spaces! Arrow keys in the waiting room and minigames."));
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill", "🎲 " + vs));
    bar.appendChild(el("span", "c4-pro-pill", "Arena Party"));
    wrap.appendChild(bar);
    appendStartActions(wrap, startGame);
    panel.appendChild(wrap);
  }

  function renderGame(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro is-racing party-pro");
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill is-active", "Playing as " + charLabel(myChar())));
    if (isGameHost()) {
      const back = el("button", "c4-pro-btn secondary", "← Lobby");
      back.addEventListener("click", function () {
        started = false;
        destroyIframe();
        send({ type: "mpNewGame", payload: {} });
        renderLobby(panel);
      });
      bar.appendChild(back);
    }
    wrap.appendChild(bar);
    iframe = el("iframe", "kart-mk3-frame party-frame");
    iframe.src = "/party/index.html";
    iframe.title = "Arena Party — " + charLabel(myChar());
    iframe.setAttribute("allow", "gamepad; fullscreen");
    iframe.addEventListener("load", scheduleArenaInit);
    bindPartyRelay();
    wrap.appendChild(iframe);
    panel.appendChild(wrap);
  }

  function render() {
    const panel = api.panel();
    if (!panel) return;
    if (started && iframe) return;
    if (!started) {
      destroyIframe();
      renderLobby(panel);
      return;
    }
    renderGame(panel);
  }

  function startGame() {
    if (!isGameHost()) {
      toast("Waiting for arena host to start.");
      return;
    }
    if (needsPartner()) {
      toast("Switch to 1 Player, or wait for your partner.");
      return;
    }
    started = true;
    send({ type: "mpStart", payload: {} });
    render();
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === "mpStart" || msg.type === "mpNewGame") {
      if (msg.type === "mpNewGame") {
        started = false;
        destroyIframe();
      } else {
        started = true;
      }
      render();
      return;
    }

    if (msg.type === "mpEmit") {
      const payload = msg.payload || {};
      postToIframe({
        type: "peerEmit",
        from: payload.from === "host" ? "host" : "join",
        event: payload.event,
        args: payload.args || [],
      });
    }
  }

  function syncArenaChars() {
    scheduleArenaInit();
  }

  function destroy() {
    destroyIframe();
    started = false;
  }

  return {
    init: function (opts) { api = opts; },
    render: render,
    handleMessage: handleMessage,
    syncArenaChars: syncArenaChars,
    resync: function () { if (started) scheduleArenaInit(); },
    destroy: destroy,
  };
})();
