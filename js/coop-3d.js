/**
 * Wideass & Tats Adventure — 20-level Sonic run + space/jeep shooter detours via iframe.
 */
window.Coop3DGame = (function () {
  "use strict";

  let api = null;
  let iframe = null;
  let started = false;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function isGameHost() {
    return api.isGameHost();
  }

  function needsPartner() {
    return api.requiresPartnerToStart && api.requiresPartnerToStart();
  }

  function toast(msg) {
    api.toast(msg);
  }

  function send(msg) {
    api.send(msg);
  }

  function myChar() {
    const character = api.myBaseChar && api.myBaseChar();
    return character === "wideass" ? "wideass" : "tats";
  }

  function charLabel(id) {
    if (window.mascotLabel) return window.mascotLabel(id);
    return id === "wideass" ? "Wideass" : "Tats";
  }

  function roomCode() {
    return api.roomCode ? api.roomCode() : "arena-room";
  }

  function destroyIframe() {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    iframe = null;
  }

  function renderLobby(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro");
    wrap.appendChild(
      el(
        "p",
        "kart-pro-hint",
        "Wideass & Tats — 20 Sonic zones, loop runs, random space alien attacks & jungle jeep T-Rex hunts. 1–2 players.",
      ),
    );
    appendPlayModePicker(wrap);
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill", "Playing as " + charLabel(myChar())));
    wrap.appendChild(bar);

    const start = el("button", "c4-pro-btn", "Launch Adventure");
    start.addEventListener("click", startGame);
    if (!isGameHost()) {
      start.disabled = true;
      start.textContent = "Waiting for host…";
    } else if (needsPartner()) {
      start.textContent = "Waiting for partner…";
    }
    wrap.appendChild(start);
    panel.appendChild(wrap);
  }

  function appendPlayModePicker(wrap) {
    if (api.appendPlayModePicker) {
      api.appendPlayModePicker(wrap);
    }
  }

  function renderGame(panel) {
    panel.innerHTML = "";
    const wrap = el("div", "kart-pro is-racing");
    const bar = el("div", "c4-pro-bar");
    bar.appendChild(el("span", "c4-pro-pill is-active", charLabel(myChar()) + " — Wideass & Tats"));
    if (isGameHost()) {
      const back = el("button", "c4-pro-btn secondary", "← Lobby");
      back.addEventListener("click", function () {
        started = false;
        destroyIframe();
        send({ type: "cpNewGame", payload: {} });
        renderLobby(panel);
      });
      bar.appendChild(back);
    }
    wrap.appendChild(bar);

    iframe = el("iframe", "coop-3d-frame party-frame");
    const params = new URLSearchParams({
      embed: "1",
      room: roomCode(),
      character: myChar(),
      autostart: "1",
    });
    iframe.src = "/coop/index.html?" + params.toString();
    iframe.title = "Wideass & Tats Adventure";
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; camera; microphone; fullscreen",
    );
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
      toast("Switch to 2 Players, or wait for your partner to join.");
      return;
    }
    started = true;
    send({ type: "cpStart", payload: {} });
    render();
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "cpStart" || msg.type === "cpNewGame") {
      started = msg.type === "cpStart";
      if (msg.type === "cpNewGame") {
        destroyIframe();
      }
      render();
    }
  }

  function destroy() {
    started = false;
    destroyIframe();
  }

  return {
    init: function (arenaApi) {
      api = arenaApi;
    },
    render: render,
    handleMessage: handleMessage,
    destroy: destroy,
    resync: function () {
      if (started) render();
    },
  };
})();
