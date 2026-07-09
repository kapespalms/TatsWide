import { Kart } from "./Kart";
import { MascotBillboard } from "./MascotBillboard.jsx";
import { useArenaBridge } from "../arenaBridge.js";

/** Local player kart — driver comes from arena parent via postMessage. */
export function ArenaDriver(props) {
  const driver = useArenaBridge((state) => state.driver);
  return (
    <Kart {...props}>
      <MascotBillboard driver={driver} />
    </Kart>
  );
}
