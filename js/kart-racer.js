/**
 * Arena Kart — embeds Mario-Kart-3.js (Three.js/WebGL) in the arena lobby flow.
 */
window.KartRacerGame = (function () {
  "use strict";

  let api = null;
  let iframe = null;
  let started = false;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function isGameHost() { return api.isGameHost(); }
  function needsPartner() { return api.requiresPartnerToStart && api.requiresPartnerToStart(); }
  function toast(msg) { api.toast(msg); }
  function send(msg) { api.send(msg); }

  function destroyIframe() {
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
    wrap.appendChild(el("p", "kart-pro-hint", "Mario Kart 3.js — full 3D WebGL racing. W to accelerate, mouse to steer, Space to drift, E for items, R to reset."));
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill", "🏎️ Mario-Kart-3.js"));
    bar.appendChild(el("span", "c4-pro-pill", "3D track · drift · boost"));
    wrap.appendChild(bar);
    appendStartActions(wrap, startGame);
    panel.appendChild(wrap);
  }

  function renderGame(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro is-racing");
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill is-active", "Mario Kart 3.js"));
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
    iframe.title = "Mario Kart 3.js";
    iframe.setAttribute("allow", "accelerometer; gamepad; fullscreen");
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
    }
  }

  function destroy() {
    destroyIframe();
    started = false;
  }

  return {
    init: function (opts) { api = opts; },
    render: render,
    handleMessage: handleMessage,
    resync: function () {},
    destroy: destroy
  };
})();
