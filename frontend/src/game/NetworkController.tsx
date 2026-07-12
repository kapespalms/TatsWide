import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { PublicApi } from '@react-three/cannon';
import * as THREE from 'three';

type CharacterId = 'Wideass' | 'Tats';

export function NetworkController({
  playerBodyApi,
  roomID,
  chosenCharacter,
  volume,
  workerOrigin,
  onPartnerUpdate,
  onStatus,
}: {
  playerBodyApi: PublicApi;
  roomID: string;
  chosenCharacter: CharacterId;
  volume: number;
  workerOrigin: string;
  onPartnerUpdate: (position: THREE.Vector3, volume: number) => void;
  onStatus: (status: string) => void;
}) {
  const socketRef = useRef<WebSocket | null>(null);
  const pos = useRef<[number, number, number]>([0, 0, 0]);
  const lastSendAt = useRef(0);

  useEffect(() => {
    const wsProtocol = workerOrigin.startsWith('https') ? 'wss' : 'ws';
    const wsHost = workerOrigin.replace(/^https?:\/\//, '');
    const socket = new WebSocket(`${wsProtocol}://${wsHost}/ws?room=${encodeURIComponent(roomID)}&char=${chosenCharacter}`);
    socketRef.current = socket;
    socket.onopen = () => onStatus('PARTNER CHANNEL ONLINE');
    socket.onclose = () => onStatus('PARTNER CHANNEL OFFLINE');
    socket.onerror = () => onStatus('PARTNER CHANNEL ERROR');
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as { type: string; x?: number; y?: number; z?: number; volume?: number; message?: string };
        if (message.type === 'SYSTEM_ERROR') { onStatus(message.message ?? 'ROOM FULL'); return; }
        if (message.type === 'PARTNER_CONNECTED') { onStatus('PARTNER CONNECTED'); return; }
        if (message.type === 'PARTNER_DISCONNECTED') { onStatus('PARTNER DISCONNECTED'); return; }
        if (message.type === '3D_PHYSICS_SYNC' && message.x !== undefined) {
          onPartnerUpdate(new THREE.Vector3(message.x, message.y ?? 0, message.z ?? 0), message.volume ?? 0);
        }
      } catch { /* ignore */ }
    };
    return () => { socket.close(); socketRef.current = null; };
  }, [roomID, chosenCharacter, workerOrigin, onPartnerUpdate, onStatus]);

  useEffect(() => {
    return playerBodyApi.position.subscribe((value) => { pos.current = value; });
  }, [playerBodyApi]);

  useFrame((state) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (state.clock.elapsedTime * 1000 - lastSendAt.current < 50) return;
    lastSendAt.current = state.clock.elapsedTime * 1000;
    socket.send(JSON.stringify({ type: '3D_PHYSICS_SYNC', x: pos.current[0], y: pos.current[1], z: pos.current[2], char: chosenCharacter, volume }));
  });

  return null;
}
