/** Tiny WebAudio SFX bed — no asset downloads, always available. */
export class AdventureAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  dispose() {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
