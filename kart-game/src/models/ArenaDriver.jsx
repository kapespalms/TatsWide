import { Kart } from "./Kart";
import { WitchKart } from "./Witch.jsx";
import { MascotBillboard } from "./MascotBillboard.jsx";
import { useArenaBridge } from "../arenaBridge.js";

/** Local player kart — driver + customization from arena bridge. */
export function ArenaDriver(props) {
  const driver = useArenaBridge((state) => state.driver);
  const myKartId = useArenaBridge((state) => state.myKartId);
  const myKartColor = useArenaBridge((state) => state.myKartColor);

  if (myKartId === "witch") {
    return <WitchKart {...props} colorHex={myKartColor} />;
  }

  return (
    <Kart {...props} colorHex={myKartColor}>
      <MascotBillboard driver={driver} />
    </Kart>
  );
}
