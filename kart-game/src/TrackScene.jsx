import { PlayerController } from "./PlayerController";
import { TrackSwitch } from "./models/TrackSwitch.jsx";
import { ArenaPeerRacer } from "./models/ArenaPeerRacer.jsx";
import { Collectibles } from "./Collectibles.jsx";
import { RaceProgress } from "./RaceProgress.jsx";
import { useArenaBridge } from "./arenaBridge.js";

export const TrackScene = () => {
  const raceStarted = useArenaBridge((s) => s.raceStarted);

  if (!raceStarted) return null;

  return (
    <>
      <PlayerController />
      <ArenaPeerRacer />
      <TrackSwitch />
      <Collectibles />
      <RaceProgress />
    </>
  );
};
