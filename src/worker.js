import { ArenaRoom } from "./arena-room.js";

export { ArenaRoom };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws/arena") {
      const room = url.searchParams.get("room");
      if (!room) {
        return new Response("Missing room code", { status: 400 });
      }
      const id = env.ARENA_ROOM.idFromName(room.toLowerCase().slice(0, 32));
      return env.ARENA_ROOM.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
