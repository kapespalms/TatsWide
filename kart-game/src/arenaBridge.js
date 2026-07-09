import { create } from "zustand";
import { KART_COLORS, getTrack, getColor } from "./kartConfig.js";
import { useGameStore } from "./store.js";

function normalizeChar(value) {
  return value === "wideass" ? "wideass" : "tats";
}

const defaultColor = KART_COLORS[0].hex;

export const useArenaBridge = create((set, get) => ({
  driver: "tats",
  peer: null,
  peerPose: null,
  role: "host",
  isGameHost: true,
  requiresPartner: false,

  raceStarted: false,
  trackId: "mario",
  myKartId: "standard",
  myKartColor: defaultColor,
  peerKartId: "standard",
  peerKartColor: defaultColor,

  setArena: (driver, peer, extras = {}) =>
    set({
      driver: normalizeChar(driver),
      peer: peer ? normalizeChar(peer) : null,
      role: extras.role === "joiner" ? "joiner" : "host",
      isGameHost: extras.isGameHost !== false,
      requiresPartner: !!extras.requiresPartner,
      ...(extras.raceStarted != null ? { raceStarted: !!extras.raceStarted } : {}),
      ...(extras.trackId ? { trackId: extras.trackId } : {}),
      ...(extras.myKartId ? { myKartId: extras.myKartId } : {}),
      ...(extras.myKartColor ? { myKartColor: extras.myKartColor } : {}),
      ...(extras.peerKartId ? { peerKartId: extras.peerKartId } : {}),
      ...(extras.peerKartColor ? { peerKartColor: extras.peerKartColor } : {}),
    }),

  setPeerPose: (peerPose) => set({ peerPose }),

  setTrackId: (trackId) => set({ trackId }),
  setMyKartId: (myKartId) => set({ myKartId }),
  setMyKartColor: (myKartColor) => set({ myKartColor: getColor(myKartColor).hex }),
  setRaceStarted: (raceStarted) => set({ raceStarted }),

  applySetupPayload: (payload) => {
    if (!payload) return;
    const state = get();
    const mine = state.role;
    const next = {};

    if (payload.trackId) next.trackId = payload.trackId;

    if (payload.host) {
      if (mine === "host") {
        next.myKartId = payload.host.kartId || state.myKartId;
        next.myKartColor = getColor(payload.host.kartColor || state.myKartColor).hex;
        if (payload.joiner) {
          next.peerKartId = payload.joiner.kartId || state.peerKartId;
          next.peerKartColor = getColor(payload.joiner.kartColor || state.peerKartColor).hex;
        }
      } else {
        next.peerKartId = payload.host.kartId || state.peerKartId;
        next.peerKartColor = getColor(payload.host.kartColor || state.peerKartColor).hex;
        if (payload.joiner) {
          next.myKartId = payload.joiner.kartId || state.myKartId;
          next.myKartColor = getColor(payload.joiner.kartColor || state.myKartColor).hex;
        }
      }
    }

    if (payload.raceStarted != null) next.raceStarted = !!payload.raceStarted;
    set(next);
  },

  buildSetupPayload: () => {
    const s = get();
    const host =
      s.role === "host"
        ? { kartId: s.myKartId, kartColor: s.myKartColor }
        : { kartId: s.peerKartId, kartColor: s.peerKartColor };
    const joiner =
      s.role === "joiner"
        ? { kartId: s.myKartId, kartColor: s.myKartColor }
        : s.peer
          ? { kartId: s.peerKartId, kartColor: s.peerKartColor }
          : null;
    return {
      trackId: s.trackId,
      raceStarted: s.raceStarted,
      host,
      joiner,
    };
  },
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

export function postToArena(message) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(Object.assign({ source: "arena-kart" }, message), "*");
}

export function initArenaBridge() {
  if (typeof window === "undefined") return;

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== ARENA_SOURCE) return;

    if (data.type === "arenaInit") {
      useArenaBridge.getState().setArena(data.driver, data.peer, {
        role: data.role,
        isGameHost: data.isGameHost,
        requiresPartner: data.requiresPartner,
        raceStarted: data.raceStarted,
        trackId: data.setup?.trackId,
        myKartId: data.setup?.myKartId,
        myKartColor: data.setup?.myKartColor,
        peerKartId: data.setup?.peerKartId,
        peerKartColor: data.setup?.peerKartColor,
      });
      if (data.setup) {
        useArenaBridge.getState().applySetupPayload(data.setup);
      }
      return;
    }

    if (data.type === "kartSetup" && data.payload) {
      useArenaBridge.getState().applySetupPayload(data.payload);
      if (data.payload.raceStarted) {
        useGameStore.getState().resetRace();
      }
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
  postToArena({
    type: "pose",
    position: { x: position.x, y: position.y, z: position.z },
    rotationY,
  });
}

export function syncSetupToArena() {
  postToArena({
    type: "kartSetupChange",
    role: useArenaBridge.getState().role,
    payload: useArenaBridge.getState().buildSetupPayload(),
  });
}

export function getActiveTrack() {
  return getTrack(useArenaBridge.getState().trackId);
}
