import { normalizeDriver } from "./mascotSvg.js";

export function readArenaParams() {
  if (typeof window === "undefined") {
    return { driver: "tats", peer: "wideass" };
  }
  const q = new URLSearchParams(window.location.search);
  const driver = normalizeDriver(q.get("driver"));
  const peerRaw = q.get("peer");
  const peer = peerRaw ? normalizeDriver(peerRaw) : null;
  return { driver, peer };
}
