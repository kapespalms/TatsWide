const MUTE_KEY = 'wa-adv-muted';

/** Tiny WebAudio SFX + looping chiptune bed — no asset downloads. */
export class AdventureAudio {
  private ctx: AudioContext | null = null;
  private muted = AdventureAudio.readSessionMuted();
  private musicNodes: AudioNode[] = [];
  private musicTimer: number | null = null;
  private musicOn = false;
  private pendingTimers: number[] = [];
  private disposed = false;

  static readSessionMuted() {
    try {
      return sessionStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(next: boolean) {
    this.muted = next;
    try {
      sessionStorage.setItem(MUTE_KEY, next ? '1' : '0');
    } catch {
      /* private mode */
    }
    if (next) this.stopMusic();
    else if (!this.disposed) this.startMusic();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensure() {
    if (this.muted || this.disposed) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  startMusic() {
    if (this.musicOn) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.musicOn = true;

    const master = ctx.createGain();
    master.gain.value = 0.045;
    master.connect(ctx.destination);
    this.musicNodes.push(master);

    const progression = [196, 220, 246.94, 261.63, 293.66, 261.63, 246.94, 220];
    let step = 0;
    const beat = () => {
      if (!this.musicOn || !this.ctx || this.disposed) return;
      const t0 = this.ctx.currentTime;
      const note = progression[step % progression.length];
      step += 1;

      const bass = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(note / 2, t0);
      bg.gain.setValueAtTime(0.7, t0);
      bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      bass.connect(bg);
      bg.connect(master);
      bass.start(t0);
      bass.stop(t0 + 0.3);

      const lead = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lead.type = 'square';
      lead.frequency.setValueAtTime(note * 2, t0 + 0.02);
      lg.gain.setValueAtTime(0.35, t0 + 0.02);
      lg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      lead.connect(lg);
      lg.connect(master);
      lead.start(t0 + 0.02);
      lead.stop(t0 + 0.2);
    };

    beat();
    this.musicTimer = window.setInterval(beat, 260);
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer != null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    for (const n of this.musicNodes) {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.musicNodes = [];
  }

  jump() {
    this.tone(420, 0.12, 'square', 0.06, 680);
  }
  spindash() {
    this.tone(180, 0.08, 'sawtooth', 0.05);
  }
  spindashRelease() {
    this.tone(220, 0.22, 'sawtooth', 0.09, 520);
  }
  collect() {
    // Classic ring ping
    this.tone(980, 0.06, 'square', 0.055, 1400);
    this.tone(1480, 0.09, 'triangle', 0.04, 1880);
  }
  spring() {
    this.tone(300, 0.16, 'square', 0.07, 900);
  }
  hurt() {
    this.tone(160, 0.2, 'sawtooth', 0.08, 70);
  }
  loopEnter() {
    this.tone(260, 0.25, 'triangle', 0.05, 400);
  }
  shoot() {
    this.tone(720, 0.05, 'square', 0.04, 180);
  }
  kill() {
    this.tone(140, 0.14, 'sawtooth', 0.07, 60);
  }
  needSpeed() {
    this.tone(110, 0.18, 'square', 0.05);
  }
  boost() {
    this.tone(360, 0.2, 'sawtooth', 0.06, 720);
  }
  duckChime() {
    this.tone(880, 0.08, 'triangle', 0.05, 1320);
    this.tone(1320, 0.1, 'square', 0.035, 1760);
  }
  pepperFizz() {
    this.tone(190, 0.12, 'sawtooth', 0.055, 520);
    this.tone(640, 0.18, 'square', 0.04, 980);
  }
  cupidPop() {
    this.tone(520, 0.05, 'triangle', 0.045, 920);
    this.tone(980, 0.07, 'sine', 0.035, 1400);
  }
  wipeWhoosh() {
    this.tone(140, 0.28, 'sawtooth', 0.04, 60);
    this.tone(420, 0.18, 'triangle', 0.03, 180);
  }
  sectorBed(sector: 'SAFARI' | 'NEBULA' | 'CUPID' | 'CYBER') {
    const ctx = this.ensure();
    if (!ctx) return;
    const beds: Record<typeof sector, number[]> = {
      SAFARI: [196, 220, 247, 262],
      NEBULA: [165, 196, 233, 294],
      CUPID: [262, 330, 392, 523],
      CYBER: [220, 277, 330, 440],
    };
    const notes = beds[sector];
    notes.forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = sector === 'CUPID' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.028, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  }

  clear() {
    // Schedule on AudioContext time — no window timers that outlive dispose()
    const ctx = this.ensure();
    if (!ctx) return;
    const play = (delay: number, freq: number, dur: number, gain: number) => {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };
    play(0, 523, 0.12, 0.07);
    play(0.1, 659, 0.12, 0.07);
    play(0.2, 784, 0.22, 0.08);
  }

  dispose() {
    this.disposed = true;
    // Do NOT write session mute — disposal must not sticky-mute the next scene
    for (const id of this.pendingTimers) window.clearTimeout(id);
    this.pendingTimers = [];
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
