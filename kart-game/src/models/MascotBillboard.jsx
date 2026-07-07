import { Billboard, Html } from "@react-three/drei";
import { mascotSVG, driverLabel } from "../arenaBridge.js";

export function MascotBillboard({ driver, scale = 0.62, y = 1.15, label = false }) {
  const kind = driver === "tats" ? "tats" : "wideass";
  return (
    <Billboard position={[0, y, 0.2]} follow lockX lockZ>
      <Html
        transform
        center
        distanceFactor={4.5}
        scale={scale}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="arena-kart-mascot" aria-label={driverLabel(kind)}>
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
