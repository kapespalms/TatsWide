/** Lightweight Web Audio SFX — no external deps, MIT-friendly. */
window.ArenaSounds = (function () {
  "use strict";
  let ctx = null;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slide) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }

  function noiseBurst(dur, vol) {
    const c = ac();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol || 0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(g);
    g.connect(c.destination);
    src.start();
  }

  return {
    unlock: function () { ac(); },
    pop: function () { tone(520, 0.12, "triangle", 0.1, 880); },
    slam: function () { tone(110, 0.18, "square", 0.09, 55); noiseBurst(0.08, 0.04); },
    sparkle: function () { tone(880, 0.08, "sine", 0.06); setTimeout(function () { tone(1320, 0.1, "sine", 0.05); }, 60); },
    horn: function () { tone(220, 0.25, "sawtooth", 0.05, 180); },
    chip: function () { noiseBurst(0.06, 0.07); tone(400, 0.05, "square", 0.04); }
  };
})();
