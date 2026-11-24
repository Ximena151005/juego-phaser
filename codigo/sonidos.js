// Efectos de sonido sencillos generados con WebAudio (no necesitan archivos).
const Sfx = {
  ctx: null,
  muted: (() => { try { return localStorage.getItem('mute') === '1'; } catch (e) { return false; } })(),

  setMuted(v) {
    this.muted = v;
    try { localStorage.setItem('mute', v ? '1' : '0'); } catch (e) { /* sin storage */ }
  },

  _c() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur, type, vol, to, delay) {
    if (this.muted) return;
    const c = this._c();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(vol || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },

  jump()  { this.tone(330, 0.16, 'square', 0.05, 660); },
  coin()  { this.tone(988, 0.07, 'square', 0.05); this.tone(1319, 0.16, 'square', 0.05, null, 0.07); },
  pisar() { this.tone(520, 0.09, 'square', 0.06, 180); this.tone(300, 0.12, 'triangle', 0.06, null, 0.06); },
  hit()   { this.tone(180, 0.28, 'sawtooth', 0.09, 60); },
  level() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.08, null, i * 0.1)); },
  over()  { [392, 330, 262].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.09, null, i * 0.16)); }
};
