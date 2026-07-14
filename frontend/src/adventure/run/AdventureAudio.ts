/** Tiny WebAudio SFX + looping chiptune bed — no asset downloads. */
export class AdventureAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicNodes: AudioNode[] = [];
  private musicTimer: number | null = null;
  private musicOn = false;

  private ensure() {
    if (this.muted) return null;
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
      if (!this.musicOn || !this.ctx) return;
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
    this.musicTimer = window.setInterval(beat, 320);
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
    this.tone(880, 0.08, 'triangle', 0.07, 1320);
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

  dispose() {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
