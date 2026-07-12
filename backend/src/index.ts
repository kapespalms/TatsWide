const rooms = new Map<string, Set<WebSocket>>();

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (url.pathname === "/ws") {
			if (request.headers.get("Upgrade") !== "websocket") {
				return new Response("Expected WebSocket Upgrade", { status: 426 });
			}

			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);
			const room = url.searchParams.get("room") || "default";
			const character = url.searchParams.get("char") || "unknown";

			server.accept();

			if (!rooms.has(room)) {
				rooms.set(room, new Set());
			}

			const clientRoom = rooms.get(room)!;

			if (clientRoom.size >= 2) {
				server.send(
					JSON.stringify({
						type: "SYSTEM_ERROR",
						message: "Room is completely full!",
					}),
				);
				server.close(1008, "Room Full");
				return new Response(null, { status: 101, webSocket: client });
			}

			clientRoom.add(server);

			let partnerAlreadyPresent = false;
			for (const socket of clientRoom) {
				if (socket !== server && socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify({ type: "PARTNER_CONNECTED", char: character }));
					partnerAlreadyPresent = true;
				}
			}

			if (partnerAlreadyPresent) {
				server.send(
					JSON.stringify({
						type: "HANDSHAKE_ACK",
						message: "Connected to partner channel.",
					}),
				);
				server.send(JSON.stringify({ type: "PARTNER_CONNECTED", char: "partner" }));
			}

			server.addEventListener("message", (event) => {
				try {
					const rawData =
						typeof event.data === "string"
							? event.data
							: new TextDecoder().decode(event.data as ArrayBuffer);

					const parsed = JSON.parse(rawData) as { type?: string };

					if (parsed.type === "PING") {
						server.send(JSON.stringify({ type: "PONG" }));
						return;
					}

					for (const socket of clientRoom) {
						if (socket !== server && socket.readyState === WebSocket.OPEN) {
							socket.send(rawData);
						}
					}
				} catch (error) {
					console.error("Transmission relay malfunction:", error);
				}
			});

			server.addEventListener("close", () => {
				clientRoom.delete(server);

				for (const socket of clientRoom) {
					if (socket.readyState === WebSocket.OPEN) {
						socket.send(JSON.stringify({ type: "PARTNER_DISCONNECTED" }));
					}
				}

				if (clientRoom.size === 0) {
					rooms.delete(room);
				}
			});

			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname === "/save" && request.method === "POST") {
			const { room, level } = (await request.json()) as { room: string; level: number };
			await env.GAME_STATE.put(`room:${room}:level`, level.toString());
			return new Response(JSON.stringify({ success: true }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/load" && request.method === "GET") {
			const room = url.searchParams.get("room") || "default";
			const level = (await env.GAME_STATE.get(`room:${room}:level`)) || "1";
			return new Response(JSON.stringify({ level: parseInt(level) }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		return new Response("Not Found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
