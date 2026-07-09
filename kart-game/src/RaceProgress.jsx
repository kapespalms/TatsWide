import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "./store";
import { useArenaBridge } from "./arenaBridge.js";
import { getRaceConfigForTrack } from "./kartConfig";

export function RaceProgress() {
  const trackId = useArenaBridge((s) => s.trackId);
  const raceConfig = useMemo(() => getRaceConfigForTrack(trackId), [trackId]);

  const last = useRef(null);
  const odometer = useRef(0);
  const inStartZone = useRef(true);
  const started = useRef(false);

  const setLap = useGameStore((s) => s.setLap);
  const setTotalLaps = useGameStore((s) => s.setTotalLaps);
  const setFinished = useGameStore((s) => s.setFinished);
  const setRaceTime = useGameStore((s) => s.setRaceTime);
  const setItemFlash = useGameStore((s) => s.setItemFlash);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.totalLaps !== raceConfig.TOTAL_LAPS) setTotalLaps(raceConfig.TOTAL_LAPS);
    if (store.finished) return;

    const pos = store.playerPosition;
    if (!pos) return;

    if (last.current) {
      const dx = pos.x - last.current.x;
      const dz = pos.z - last.current.z;
      const step = Math.hypot(dx, dz);
      odometer.current += step;
      if (started.current) setRaceTime(store.raceTime + delta);
    }
    last.current = { x: pos.x, z: pos.z };

    const distToStart = Math.hypot(
      pos.x - raceConfig.START_LINE.x,
      pos.z - raceConfig.START_LINE.z
    );

    if (distToStart < raceConfig.START_RADIUS) {
      if (!inStartZone.current) {
        inStartZone.current = true;
        if (odometer.current > raceConfig.MIN_LAP_DISTANCE) {
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
