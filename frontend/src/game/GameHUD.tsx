interface GameHUDProps {
  status: string;
  volume: number;
  remoteVolume: number;
  bins: Uint8Array;
  level: number;
  mediaActive: boolean;
  mediaError: string | null;
  onEnableMedia: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function GameHUD({
  status,
  volume,
  remoteVolume,
  bins,
  level,
  mediaActive,
  mediaError,
  onEnableMedia,
  videoRef,
}: GameHUDProps) {
  const modifiers = [
    level % 2 === 0 ? 'UFO BOSS' : null,
    level % 3 === 0 ? 'DR PEPPER CANS' : 'SCATTERED CANS',
    level >= 4 ? 'T-REX CHARGE' : null,
  ].filter(Boolean);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-4 font-mono text-xs">
        <div className="rounded border border-amber-500/40 bg-black/80 px-4 py-2 text-amber-300">
          LEVEL {level} — {modifiers.join(' · ')}
        </div>
        <div className="flex h-16 items-end gap-1 rounded border border-cyan-500/30 bg-black/70 px-3 py-2">
          {Array.from({ length: 8 }, (_, index) => {
            const binValue = bins[index] ?? 0;
            const height = Math.max(4, (binValue / 255) * 48);
            const hot = binValue > 180;
            return (
              <div
                key={index}
                className={`w-3 rounded-t transition-all ${hot ? 'bg-pink-500' : 'bg-cyan-400'}`}
                style={{ height }}
              />
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute left-4 top-28 z-20 max-w-xs space-y-2 font-mono text-xs">
        <div className="rounded border border-cyan-500/40 bg-black/80 px-3 py-2 text-cyan-300">
          {status}
        </div>
        <div className="rounded border border-pink-500/40 bg-black/80 px-3 py-2 text-pink-300">
          VOICE: {Math.round(volume)} | PARTNER: {Math.round(remoteVolume)}
        </div>
        <div className="rounded border border-slate-600 bg-black/80 px-3 py-2 text-slate-300">
          Move mouse to steer · Shout to jump · Both shout = super jump · Knock cans into
          the void
        </div>
        {mediaError && (
          <div className="rounded border border-red-500/40 bg-black/80 px-3 py-2 text-red-300">
            {mediaError}
          </div>
        )}
      </div>

      {!mediaActive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <button
            type="button"
            onClick={onEnableMedia}
            className="rounded-lg border-2 border-cyan-400 bg-slate-900 px-8 py-4 font-mono text-lg font-black tracking-wider text-cyan-300 shadow-lg shadow-cyan-500/30 transition hover:scale-105"
          >
            ENABLE WEBCAM + MIC
          </button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-20 overflow-hidden rounded-lg border-2 border-cyan-400/50 bg-black shadow-lg shadow-cyan-500/20">
        <video
          ref={videoRef}
          className="h-40 w-52 object-cover"
          autoPlay
          playsInline
          muted
        />
        <div className="bg-black/80 px-2 py-1 text-center font-mono text-[10px] text-cyan-300">
          {mediaActive ? 'WEBCAM LIVE' : 'WAITING FOR PERMISSION'}
        </div>
      </div>
    </>
  );
}
