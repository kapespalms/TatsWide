import { PlayerController } from "./PlayerController";
import { Grid } from "@react-three/drei";
import Flames from "./particles/drift/flames/Flames";
import {Track} from './models/Mario-circuit-test';
import { PlayroomStarter } from "./PlayroomStarter";
import { PeerRacers } from "./models/PeerRacers.jsx";
export const TrackScene = () => {
  return (
    <>
      <PlayerController />
      <PlayroomStarter />
      <PeerRacers />
      <Track />


      {/* <Flames /> */}

      {/* <Grid position={[0, -1.99, 0]} infiniteGrid/> */}
    </>
  );
};
