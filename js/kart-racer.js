/**
 * Arena Kart — 3D racer using arena characters + WebSocket relay (no PlayroomKit).
 */
window.KartRacerGame = (function () {
  "use strict";

  const SYNC_MS = 50;
  const ARENA_SOURCE = "wideass-arena";

  let api = null;
  let iframe = null;
  let started = false;
  let lastPoseAt = 0;
  let poseListener = null;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function isGameHost() { return api.isGameHost(); }
  function myRole() { return api.myRole ? api.myRole() : (isGameHost() ? "host" : "joiner"); }
  function needsPartner() { return api.requiresPartnerToStart && api.requiresPartnerToStart(); }
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
      driver: myChar(),
      peer: peerChar()
    });
  }

  function bindPoseRelay() {
    if (poseListener) return;
    poseListener = function (event) {
      const data = event.data;
      if (!data || data.source !== "arena-kart" || data.type !== "pose") return;
      if (!started) return;
      const now = Date.now();
      if (now - lastPoseAt < SYNC_MS) return;
      lastPoseAt = now;
      send({
        type: "krPose",
        payload: {
          role: myRole(),
          position: data.position,
          rotationY: data.rotationY
        }
      });
    };
    window.addEventListener("message", poseListener);
  }

  function unbindPoseRelay() {
    if (!poseListener) return;
    window.removeEventListener("message", poseListener);
    poseListener = null;
  }

  function destroyIframe() {
    unbindPoseRelay();
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    iframe = null;
  }

  function appendWaitBanner(wrap) {
    if (!needsPartner()) return;
    wrap.appendChild(el("p", "game-wait-banner", "2-player mode — share your arena code, then both launch the race."));
  }

  function appendStartActions(wrap, onStart) {
    const actions = el("div", "game-lobby-actions");
    const btn = el("button", "c4-pro-btn", isGameHost() ? "Launch Race" : "Waiting for host…");
    btn.disabled = !isGameHost() || needsPartner();
    btn.addEventListener("click", onStart);
    actions.appendChild(btn);
    wrap.appendChild(actions);
  }

  function renderLobby(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro");
    if (api.appendPlayModePicker) api.appendPlayModePicker(wrap);
    appendWaitBanner(wrap);
    const peer = peerChar();
    const vs = peer ? charLabel(myChar()) + " vs " + charLabel(peer) : charLabel(myChar()) + " solo run";
    wrap.appendChild(el("p", "kart-pro-hint", "You race as " + charLabel(myChar()) + " — same character as your arena pick. W accelerate, mouse steer, Space drift."));
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill", "🏎️ " + vs));
    bar.appendChild(el("span", "c4-pro-pill", "Arena character"));
    wrap.appendChild(bar);
    appendStartActions(wrap, startGame);
    panel.appendChild(wrap);
  }

  function renderGame(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro is-racing");
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill is-active", "Racing as " + charLabel(myChar())));
    if (isGameHost()) {
      const back = el("button", "c4-pro-btn secondary", "← Lobby");
      back.addEventListener("click", function () {
        started = false;
        destroyIframe();
        send({ type: "krNewGame", payload: {} });
        renderLobby(panel);
      });
      bar.appendChild(back);
    }
    wrap.appendChild(bar);
    iframe = el("iframe", "kart-mk3-frame");
    iframe.src = "/kart/index.html";
    iframe.title = "Arena Kart — " + charLabel(myChar());
    iframe.setAttribute("allow", "accelerometer; gamepad; fullscreen");
    iframe.addEventListener("load", pushArenaInit);
    bindPoseRelay();
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
    if (!isGameHost()) { toast("Waiting for arena host to start."); return; }
    if (needsPartner()) { toast("Switch to 1 Player, or wait for your partner."); return; }
    started = true;
    send({ type: "krStart", payload: {} });
    render();
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "krStart" || msg.type === "krNewGame") {
      if (msg.type === "krNewGame") {
        started = false;
        destroyIframe();
      } else {
        started = true;
      }
      render();
      return;
    }
    if (msg.type === "krPose") {
      const payload = msg.payload || {};
      if (payload.role === myRole()) return;
      postToIframe({ type: "peerPose", payload: payload });
    }
  }

  function syncArenaChars() {
    pushArenaInit();
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
    resync: function () { if (started) pushArenaInit(); },
    destroy: destroy
  };
})();
