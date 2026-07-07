import { create } from "zustand";

function normalizeChar(value) {
  return value === "wideass" ? "wideass" : "tats";
}

export const useArenaBridge = create((set) => ({
  driver: "tats",
  peer: null,
  peerPose: null,
  setArena: (driver, peer) =>
    set({
      driver: normalizeChar(driver),
      peer: peer ? normalizeChar(peer) : null,
    }),
  setPeerPose: (peerPose) => set({ peerPose }),
}));

export function readArenaDriver() {
  return useArenaBridge.getState().driver;
}

export function readArenaPeer() {
  return useArenaBridge.getState().peer;
}

export function driverLabel(driver) {
  if (typeof window !== "undefined" && window.mascotLabel) {
    return window.mascotLabel(driver);
  }
  return driver === "wideass" ? "Wideass" : "Tats";
}

export function mascotSVG(kind) {
  const key = kind === "wideass" ? "wideass" : "tats";
  if (typeof window !== "undefined" && window.mascotSVG) {
    return window.mascotSVG(key);
  }
  return "";
}

const ARENA_SOURCE = "wideass-arena";

export function initArenaBridge() {
  if (typeof window === "undefined") return;

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== ARENA_SOURCE) return;

    if (data.type === "arenaInit") {
      useArenaBridge.getState().setArena(data.driver, data.peer);
      return;
    }

    if (data.type === "peerPose" && data.payload) {
      useArenaBridge.getState().setPeerPose(data.payload);
    }
  });

  if (window.parent !== window) {
    window.parent.postMessage({ source: "arena-kart", type: "ready" }, "*");
  }
}

export function postPoseToArena(position, rotationY) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(
    {
      source: "arena-kart",
      type: "pose",
      position: { x: position.x, y: position.y, z: position.z },
      rotationY,
    },
    "*"
  );
}
