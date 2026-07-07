import { Kart } from "./Kart";
import { MascotBillboard } from "./MascotBillboard.jsx";
import { useArenaBridge } from "../arenaBridge.js";

/** Local player kart — driver comes from arena parent via postMessage. */
export function ArenaDriver(props) {
  const driver = useArenaBridge((state) => state.driver);
  return (
    <group>
      <Kart {...props} />
      <MascotBillboard driver={driver} scale={0.38} y={0.95} />
    </group>
  );
}
