import { useArenaBridge, driverLabel, mascotSVG, syncSetupToArena, postToArena } from "./arenaBridge.js";
import { TRACKS, KARTS, KART_COLORS } from "./kartConfig.js";
import { useGameStore } from "./store.js";

export function KartLobby() {
  const raceStarted = useArenaBridge((s) => s.raceStarted);
  const trackId = useArenaBridge((s) => s.trackId);
  const myKartId = useArenaBridge((s) => s.myKartId);
  const myKartColor = useArenaBridge((s) => s.myKartColor);
  const peerKartId = useArenaBridge((s) => s.peerKartId);
  const peerKartColor = useArenaBridge((s) => s.peerKartColor);
  const driver = useArenaBridge((s) => s.driver);
  const peer = useArenaBridge((s) => s.peer);
  const isGameHost = useArenaBridge((s) => s.isGameHost);
  const requiresPartner = useArenaBridge((s) => s.requiresPartner);

  if (raceStarted) return null;

  const pickTrack = (id) => {
    if (!isGameHost) return;
    useArenaBridge.getState().setTrackId(id);
    syncSetupToArena();
  };

  const pickKart = (id) => {
    useArenaBridge.getState().setMyKartId(id);
    syncSetupToArena();
  };

  const pickColor = (hex) => {
    useArenaBridge.getState().setMyKartColor(hex);
    syncSetupToArena();
  };

  const startRace = () => {
    if (!isGameHost || requiresPartner) return;
    useGameStore.getState().resetRace();
    useArenaBridge.getState().setRaceStarted(true);
    syncSetupToArena();
    postToArena({ type: "kartStartRace" });
  };

  return (
    <div className="kart-lobby">
      <div className="kart-lobby-sheet">
        <h1 className="kart-lobby-title">🏎️ Kart Garage</h1>
        <p className="kart-lobby-sub">
          Pick a course, kart, and paint job. Host chooses the track — both players customize their ride.
        </p>

        <div className="kart-lobby-you">
          <div
            className="kart-lobby-char-svg"
            dangerouslySetInnerHTML={{ __html: mascotSVG(driver) }}
          />
          <span>
            Racing as <strong>{driverLabel(driver)}</strong>
          </span>
        </div>

        <section className="kart-lobby-section">
          <h2>Course {isGameHost ? "" : "(host picks)"}</h2>
          <div className="kart-lobby-grid kart-lobby-grid-tracks">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                className={
                  "kart-lobby-card" + (trackId === track.id ? " is-selected" : "")
                }
                disabled={!isGameHost}
                onClick={() => pickTrack(track.id)}
              >
                <span className="kart-lobby-card-icon">🏁</span>
                <span className="kart-lobby-card-name">{track.name}</span>
                <span className="kart-lobby-card-desc">{track.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="kart-lobby-section">
          <h2>Your kart</h2>
          <div className="kart-lobby-grid kart-lobby-grid-karts">
            {KARTS.map((kart) => (
              <button
                key={kart.id}
                type="button"
                className={
                  "kart-lobby-card" + (myKartId === kart.id ? " is-selected" : "")
                }
                onClick={() => pickKart(kart.id)}
              >
                <span className="kart-lobby-card-icon">{kart.icon}</span>
                <span className="kart-lobby-card-name">{kart.name}</span>
                <span className="kart-lobby-card-desc">{kart.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="kart-lobby-section">
          <h2>Paint job</h2>
          <div className="kart-lobby-colors">
            {KART_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                className={
                  "kart-color-swatch" +
                  (myKartColor.toLowerCase() === color.hex.toLowerCase()
                    ? " is-selected"
                    : "")
                }
                style={{ background: color.hex }}
                title={color.name}
                onClick={() => pickColor(color.hex)}
              />
            ))}
          </div>
        </section>

        {peer ? (
          <section className="kart-lobby-section kart-lobby-peer">
            <h2>Partner&apos;s garage</h2>
            <p className="kart-lobby-peer-line">
              {driverLabel(peer)} — {KARTS.find((k) => k.id === peerKartId)?.name || "Kart"}
              <span
                className="kart-lobby-peer-swatch"
                style={{ background: peerKartColor }}
              />
            </p>
          </section>
        ) : null}

        {requiresPartner ? (
          <p className="kart-lobby-tip">2-player mode — share your arena code or switch to 1 Player.</p>
        ) : null}

        <button
          type="button"
          className="kart-lobby-start"
          disabled={!isGameHost || requiresPartner}
          onClick={startRace}
        >
          {isGameHost ? "Start Race 🏁" : "Waiting for host…"}
        </button>
      </div>
    </div>
  );
}
