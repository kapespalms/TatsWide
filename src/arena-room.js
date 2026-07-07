import { DurableObject } from "cloudflare:workers";

export class ArenaRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.host = null;
    this.join = null;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.attach(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  replaceSlot(role, ws) {
    const existing = this[role];
    if (existing && existing !== ws) {
      try {
        existing.close(4001, "Replaced");
      } catch (e) {}
    }
    this[role] = ws;
  }

  attach(ws) {
    ws.accept();

    let role = null;
    if (!this.host || this.host.readyState !== WebSocket.OPEN) {
      role = "host";
      this.replaceSlot("host", ws);
    } else if (!this.join || this.join.readyState !== WebSocket.OPEN) {
      role = "join";
      this.replaceSlot("join", ws);
    } else {
      ws.close(4000, "Room full");
      return;
    }

    ws.send(JSON.stringify({ type: "assigned", payload: { role } }));

    ws.addEventListener("message", (event) => {
      const other = role === "host" ? this.join : this.host;
      if (other && other.readyState === WebSocket.OPEN) {
        other.send(event.data);
      }
    });

    ws.addEventListener("close", () => {
      if (this[role] === ws) {
        this[role] = null;
      }
      const other = role === "host" ? this.join : this.host;
      if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: "peerLeft" }));
      }
    });

    ws.addEventListener("error", () => {
      if (this[role] === ws) {
        this[role] = null;
      }
    });

    this.notifyReady();
  }

  notifyReady() {
    if (
      this.host &&
      this.join &&
      this.host.readyState === WebSocket.OPEN &&
      this.join.readyState === WebSocket.OPEN
    ) {
      const ready = JSON.stringify({ type: "relayReady" });
      this.host.send(ready);
      this.join.send(ready);
    }
  }
}
