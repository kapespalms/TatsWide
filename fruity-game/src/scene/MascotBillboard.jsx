import { Billboard, Html } from "@react-three/drei";

function mascotSVG(kind) {
  if (typeof window !== "undefined" && typeof window.mascotSVG === "function") {
    return window.mascotSVG(kind);
  }
  return "";
}

function mascotLabel(kind) {
  if (typeof window !== "undefined" && typeof window.mascotLabel === "function") {
    return window.mascotLabel(kind);
  }
  return kind === "wideass" ? "Wideass" : "Tats";
}

/**
 * Fallback token face: the arena mascot SVG rendered as a camera-facing
 * billboard. Used when no custom character GLB is supplied in modelConfig.
 */
export function MascotBillboard({ kind, y = 1.7, scale = 0.6, label = true }) {
  const safe = kind === "wideass" ? "wideass" : "tats";
  return (
    <Billboard position={[0, y, 0]} follow lockX lockZ>
      <Html
        transform
        center
        distanceFactor={8}
        scale={scale}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="fruity-mascot" aria-label={mascotLabel(safe)}>
          <div
            className="fruity-mascot-svg"
            dangerouslySetInnerHTML={{ __html: mascotSVG(safe) }}
          />
          {label ? <div className="fruity-mascot-label">{mascotLabel(safe)}</div> : null}
        </div>
      </Html>
    </Billboard>
  );
}
