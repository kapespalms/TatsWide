import { PlayerController } from "./PlayerController";
import { Track } from "./models/Mario-circuit-test";
import { ArenaPeerRacer } from "./models/ArenaPeerRacer.jsx";

export const TrackScene = () => {
  return (
    <>
      <PlayerController />
      <ArenaPeerRacer />
      <Track />
    </>
  );
};
