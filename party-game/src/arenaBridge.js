import { getPartyHost } from "./partyHost.js";

const ARENA_SOURCE = "wideass-arena";
const PARTY_SOURCE = "arena-party";

let arenaConfig = null;

export function getArenaConfig() {
  return arenaConfig;
}

export function isArenaHost() {
  return !!(arenaConfig && arenaConfig.isHost);
}

export function isSoloMode() {
  return !!(arenaConfig && arenaConfig.solo);
}

export function myRole() {
  return arenaConfig && !arenaConfig.isHost ? "join" : "host";
}

export function postToParent(msg) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(Object.assign({ source: PARTY_SOURCE }, msg), "*");
}

export function initArenaBridge(onReady) {
  if (typeof window === "undefined") return;

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== ARENA_SOURCE) return;

    if (data.type === "arenaInit") {
      arenaConfig = {
        role: data.role === "joiner" ? "join" : "host",
        isHost: data.role !== "joiner",
        driver: data.driver || "tats",
        peer: data.peer || null,
        solo: data.solo != null ? !!data.solo : !data.peer,
      };
      if (onReady) onReady(arenaConfig);
      return;
    }

    if (data.type === "peerEmit") {
      const host = getPartyHost();
      if (host) {
        const from = data.from === "host" ? "host" : "join";
        Promise.resolve().then(function () {
          host.handleClientEvent(from, data.event, data.args || []);
        });
      }
    }
  });

  if (window.parent !== window) {
    postToParent({ type: "ready" });
  }
}

/** Relay a locally-emitted socket event to the peer client. */
export function relayEmitToPeer(event, args, from) {
  postToParent({ type: "emit", event: event, args: args, from: from });
}

export { ARENA_SOURCE, PARTY_SOURCE };
