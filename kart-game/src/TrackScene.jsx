import { PlayerController } from "./PlayerController";
import { Track } from "./models/Mario-circuit-test";
import { ArenaPeerRacer } from "./models/ArenaPeerRacer.jsx";
import { Collectibles } from "./Collectibles.jsx";
import { RaceProgress } from "./RaceProgress.jsx";

export const TrackScene = () => {
  return (
    <>
      <PlayerController />
      <ArenaPeerRacer />
      <Track />
      <Collectibles />
      <RaceProgress />
    </>
  );
};
