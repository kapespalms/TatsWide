import { getPartyHost } from "./partyHost.js";
import { relayEmitToPeer, myRole } from "./arenaBridge.js";

let socketInstance = null;

/**
 * Drop-in replacement for socket.io-client used by the ported Quarantine Party
 * scenes. Peer-to-peer symmetric model: every client runs its own authoritative
 * party-host. `emit` processes the event through the local host (deferred, to
 * emulate socket.io's async round-trip so "emit() then on()" patterns work) and
 * relays the raw event to the peer, whose host processes it identically.
 */
class ArenaSocket {
  constructor() {
    this.id = "local";
    this.listeners = {};
    this.role = "host";
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this.listeners[event]) return;
    if (!cb) {
      delete this.listeners[event];
      return;
    }
    this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb);
  }

  _dispatch(event, ...args) {
    const list = this.listeners[event];
    if (!list) return;
    list.slice().forEach((cb) => {
      try {
        cb(...args);
      } catch (e) {
        console.error("Arena party socket listener error:", event, e);
      }
    });
  }

  emit(event, ...args) {
    const from = myRole();
    const host = getPartyHost();
    if (host) {
      Promise.resolve().then(function () {
        host.handleClientEvent(from, event, args);
      });
    }
    relayEmitToPeer(event, args, from);
  }

  /** Called by the local party-host to deliver results to this client's scenes. */
  local(event, ...args) {
    const self = this;
    Promise.resolve().then(function () {
      self._dispatch(event, ...args);
    });
  }

  setRole(role, id) {
    this.role = role;
    this.id = id || role;
  }
}

export function createSocket() {
  socketInstance = new ArenaSocket();
  return socketInstance;
}

export function getSocket() {
  if (!socketInstance) socketInstance = new ArenaSocket();
  return socketInstance;
}

export const socket = getSocket();
