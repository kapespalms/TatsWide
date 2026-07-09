import { Billboard, Html } from "@react-three/drei";
import { mascotSVG, driverLabel } from "../arenaBridge.js";

/** In-kart mascot: half height, anchored in the driver seat (body-local space). */
export const SEATED_MASCOT = {
  scale: 0.2,
  y: 0.34,
  z: 0.22,
};

/** Peer kart uses the raw GLB root — seat offset differs from Kart body space. */
export const PEER_SEATED_MASCOT = {
  scale: 0.2,
  y: 0.08,
  z: 0.05,
};

export function MascotBillboard({
  driver,
  scale = SEATED_MASCOT.scale,
  y = SEATED_MASCOT.y,
  z = SEATED_MASCOT.z,
  seated = true,
  label = false,
}) {
  const kind = driver === "tats" ? "tats" : "wideass";
  return (
    <Billboard position={[0, y, z]} follow lockX lockZ>
      <Html
        transform
        center
        distanceFactor={4.5}
        scale={scale}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className={"arena-kart-mascot" + (seated ? " is-seated" : "")}
          aria-label={driverLabel(kind)}
        >
          <div
            className="arena-kart-mascot-svg"
            dangerouslySetInnerHTML={{ __html: mascotSVG(kind) }}
          />
          {label ? (
            <div className="arena-kart-mascot-label">{driverLabel(kind)}</div>
          ) : null}
        </div>
      </Html>
    </Billboard>
  );
}
