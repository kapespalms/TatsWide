import { Kart } from "./Kart";
import { MascotBillboard } from "./MascotBillboard.jsx";
import { readArenaParams } from "../arenaParams.js";

/** Local player kart with Tats or Wideass driver from arena URL params. */
export function ArenaDriver(props) {
  const { driver } = readArenaParams();
  return (
    <group>
      <Kart {...props} />
      <MascotBillboard driver={driver} scale={0.38} y={0.95} />
    </group>
  );
}
