import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "./store";
import {
  START_LINE,
  START_RADIUS,
  MIN_LAP_DISTANCE,
  TOTAL_LAPS,
} from "./raceConfig";

/**
 * Geometry-agnostic lap tracking. Accumulates travelled distance (odometer) and
 * counts a lap each time the kart re-enters the start-line radius after covering
 * at least MIN_LAP_DISTANCE. Works without an authored racing line / waypoints.
 */
export function RaceProgress() {
  const last = useRef(null);
  const odometer = useRef(0);
  const inStartZone = useRef(true); // spawns on the line
  const started = useRef(false);

  const setLap = useGameStore((s) => s.setLap);
  const setTotalLaps = useGameStore((s) => s.setTotalLaps);
  const setFinished = useGameStore((s) => s.setFinished);
  const setRaceTime = useGameStore((s) => s.setRaceTime);
  const setItemFlash = useGameStore((s) => s.setItemFlash);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.totalLaps !== TOTAL_LAPS) setTotalLaps(TOTAL_LAPS);
    if (store.finished) return;

    const pos = store.playerPosition;
    if (!pos) return;

    // Odometer (XZ plane) + race clock — begins once the kart first moves off line.
    if (last.current) {
      const dx = pos.x - last.current.x;
      const dz = pos.z - last.current.z;
      const step = Math.hypot(dx, dz);
      odometer.current += step;
      if (started.current) setRaceTime(store.raceTime + delta);
    }
    last.current = { x: pos.x, z: pos.z };

    const dxs = pos.x - START_LINE.x;
    const dzs = pos.z - START_LINE.z;
    const distToStart = Math.hypot(dxs, dzs);

    if (distToStart < START_RADIUS) {
      if (!inStartZone.current) {
        inStartZone.current = true;
        if (odometer.current > MIN_LAP_DISTANCE) {
          const nextLap = store.lap + 1;
          odometer.current = 0;
          if (nextLap > store.totalLaps) {
            setFinished(true);
            setItemFlash("FINISH!");
          } else {
            setLap(nextLap);
            setItemFlash("LAP " + nextLap);
          }
        }
      }
    } else {
      inStartZone.current = false;
      started.current = true;
    }
  });

  return null;
}
