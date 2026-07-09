import { useBoardStore } from "./store.js";

/**
 * postMessage bridge to the parent arena (js/get-fruity.js).
 *
 * Messages IN: arenaInit, gfBoard, gfDiceSpin
 * Messages OUT: ready, gfAction (roll | answered | eggplant)
 */

const ARENA_SOURCE = "wideass-arena";
const SELF_SOURCE = "arena-fruity";

export function initArenaBridge() {
  const store = useBoardStore.getState();

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== ARENA_SOURCE) return;

    if (data.type === "arenaInit") {
      const chars = data.chars || {};
      store.setSession({
        chars: {
          host: chars.host === "wideass" ? "wideass" : "tats",
          joiner: chars.joiner === "wideass" ? "wideass" : "tats",
        },
        activeRoles: data.activeRoles,
        myRole: data.myRole === "joiner" ? "joiner" : "host",
        names: data.names || { host: "Host", joiner: "Partner" },
        isSolo: data.isSolo,
      });
      store.setReady(true);
      return;
    }

    if (data.type === "gfBoard" && data.snapshot) {
      store.applyBoard(data.snapshot);
      store.setReady(true);
      return;
    }

    if (data.type === "gfDiceSpin") {
      store.bumpSpin();
    }
  });

  const tellReady = () => postToParent({ type: "ready" });
  tellReady();
  setTimeout(tellReady, 150);
  setTimeout(tellReady, 600);
}

export function postToParent(msg) {
  try {
    window.parent.postMessage({ source: SELF_SOURCE, ...msg }, "*");
  } catch (e) {
    /* no parent */
  }
}
