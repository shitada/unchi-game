import type { SFXType, PoopId } from '@/types';

export class SFXGenerator {
  constructor(
    private ctx: AudioContext,
    private destination: AudioNode,
  ) {}

  play(type: SFXType): void {
    switch (type) {
      case 'push': this.playPush(); break;
      case 'grow': this.playGrow(); break;
      case 'finish': this.playFinish(); break;
      case 'fanfare': this.playFanfare(); break;
      case 'rare': this.playRare(); break;
      case 'newDiscovery': this.playNewDiscovery(); break;
      case 'bonus': this.playBonus(); break;
    }
  }

  /** Play a unique "buri buri" sound for each poop type */
  playPoopVoice(poopId: PoopId): void {
    switch (poopId) {
      case 'normal':  this.playBuriBuri(200, 120, 'sawtooth', 4, 0.10); break;
      case 'tiny':    this.playBuriBuri(400, 300, 'sine', 2, 0.06); break;
      case 'long':    this.playBuriBuri(180, 80, 'sawtooth', 6, 0.12); break;
      case 'thick':   this.playBuriBuri(120, 60, 'sawtooth', 3, 0.15); break;
      case 'softServe': this.playBuriBuriSlide(350, 150, 'triangle', 0.5); break;
      case 'pebble':  this.playPebbleSound(); break;
      case 'fluffy':  this.playBuriBuriSlide(250, 180, 'sine', 0.4); break;
      case 'rainbow': this.playRainbowBuri(); break;
      case 'golden':  this.playGoldenBuri(); break;
      case 'star':    this.playStarBuri(); break;
    }
  }

  private playBuriBuri(
    startFreq: number, endFreq: number, type: OscillatorType,
    repeats: number, interval: number,
  ): void {
    for (let i = 0; i < repeats; i++) {
      const delay = i * interval;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      const f = startFreq - (i / repeats) * (startFreq - endFreq) * 0.5;
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + delay + interval * 0.9);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + interval * 0.85);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + interval);
    }
  }

  private playBuriBuriSlide(
    startFreq: number, endFreq: number, type: OscillatorType, duration: number,
  ): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 12; lfoGain.gain.value = 30;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    lfo.start(); lfo.stop(this.ctx.currentTime + duration);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  private playPebbleSound(): void {
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 250 + Math.sin(i * 2.3) * 80;
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.05);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.05);
    }
  }

  private playRainbowBuri(): void {
    [200, 250, 300, 350, 400, 450].forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.ctx.currentTime + delay + 0.07);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.07);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.08);
    });
  }

  private playGoldenBuri(): void {
    const harmonics = [1, 2, 3, 5];
    for (let r = 0; r < 3; r++) {
      const delay = r * 0.15;
      harmonics.forEach((h) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180 * h, this.ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(180 * h * 0.6, this.ctx.currentTime + delay + 0.12);
        gain.gain.setValueAtTime(0.15 / h, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.12);
        osc.connect(gain); gain.connect(this.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.13);
      });
    }
  }

  private playStarBuri(): void {
    this.playBuriBuri(300, 150, 'triangle', 3, 0.12);
    [1047, 1319, 1568, 2093].forEach((freq, i) => {
      const delay = i * 0.1 + 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.15);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.15);
    });
  }

  private playPush(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  private playBonus(): void {
    // Bright power-up jingle
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = this.ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.18);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(start); osc.stop(start + 0.18);
    });
    // Shimmer overlay
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1568;
    shimmerGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    shimmer.connect(shimmerGain); shimmerGain.connect(this.destination);
    shimmer.start(); shimmer.stop(this.ctx.currentTime + 0.4);
  }

  private playGrow(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  private playFinish(): void {
    // "ブリブリ〜" descending tone sequence
    [0, 0.12, 0.24, 0.36].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const freq = 300 - i * 50;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + delay + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.15);
      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.15);
    });
  }

  private playFanfare(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = this.ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  private playRare(): void {
    // Sparkle ascending arpeggio
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = this.ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  private playNewDiscovery(): void {
    // Ta-da! two rising chords
    const chords = [[262, 330, 392], [523, 659, 784]];
    chords.forEach((chord, ci) => {
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + ci * 0.25;
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    });
  }
}
