/** Procedural rain ambience via Web Audio API (no external files). */
export class AmbientSound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this._nodes = [];
  }

  async start() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }
    this._buildRain();
    this._buildWater();
  }

  _buildRain() {
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this._nodes.push({ noise, gain, kind: 'rain' });
  }

  _buildWater() {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 42;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.04;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    this._nodes.push({ gain, kind: 'water' });
  }

  setMuted(muted) {
    this.muted = muted;
    const vol = muted ? 0 : 1;
    for (const n of this._nodes) {
      if (n.kind === 'rain') n.gain.gain.value = 0.08 * vol;
      if (n.kind === 'water') n.gain.gain.value = 0.04 * vol;
    }
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }
}
