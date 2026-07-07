import { useArenaBridge, driverLabel, mascotSVG } from "./arenaBridge.js";

/** Always-visible driver strip so you can see your arena character while racing. */
export function DriverHud() {
  const driver = useArenaBridge((state) => state.driver);
  const peer = useArenaBridge((state) => state.peer);

  return (
    <div className="arena-kart-hud" aria-live="polite">
      <div className="arena-kart-hud-card is-you">
        <div
          className="arena-kart-hud-svg"
          dangerouslySetInnerHTML={{ __html: mascotSVG(driver) }}
        />
        <span className="arena-kart-hud-name">{driverLabel(driver)}</span>
        <span className="arena-kart-hud-tag">You</span>
      </div>
      {peer ? (
        <>
          <span className="arena-kart-hud-vs">VS</span>
          <div className="arena-kart-hud-card is-peer">
            <div
              className="arena-kart-hud-svg"
              dangerouslySetInnerHTML={{ __html: mascotSVG(peer) }}
            />
            <span className="arena-kart-hud-name">{driverLabel(peer)}</span>
            <span className="arena-kart-hud-tag">Partner</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
