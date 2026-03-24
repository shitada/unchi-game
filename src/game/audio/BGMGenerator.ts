import type { BGMMode } from '@/types';

interface ChordNote {
  freqs: number[];
  dur: number;
}

export class BGMGenerator {
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private timeoutIds: number[] = [];
  private playing = false;
  private speed = 1.0;

  constructor(
    private ctx: AudioContext,
    private destination: AudioNode,
  ) {}

  play(mode: BGMMode): void {
    this.stop();
    this.playing = true;
    this.speed = 1.0;
    this.scheduleLoop(mode, 0);
  }

  stop(): void {
    this.playing = false;
    for (const id of this.timeoutIds) clearTimeout(id);
    this.timeoutIds = [];
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.oscillators = [];
    this.gains = [];
  }

  /** Set playback speed multiplier (1.0 = normal, higher = faster) */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.5, Math.min(speed, 3.0));
  }

  private scheduleLoop(mode: BGMMode, noteIndex: number): void {
    if (!this.playing) return;
    const pattern = this.getPattern(mode);
    const chord = pattern[noteIndex % pattern.length];
    this.playChord(chord, mode);
    const interval = (chord.dur * 1000) / this.speed;
    const id = window.setTimeout(() => this.scheduleLoop(mode, noteIndex + 1), interval);
    this.timeoutIds.push(id);
  }

  private playChord(chord: ChordNote, mode: BGMMode): void {
    const dur = chord.dur / this.speed;
    // Play mode uses triangle for warmer pop sound; others use triangle too
    const waveType: OscillatorType = mode === 'play' ? 'triangle' : 'triangle';
    const gainPerVoice = 0.12 / Math.sqrt(chord.freqs.length);
    for (const freq of chord.freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = waveType;
      osc.frequency.value = freq;
      // Punchy attack, smooth decay for pop feel
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainPerVoice, this.ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(gainPerVoice, this.ctx.currentTime + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + dur * 0.95);
      osc.connect(gain); gain.connect(this.destination);
      osc.start(); osc.stop(this.ctx.currentTime + dur);
      this.oscillators.push(osc); this.gains.push(gain);
      osc.onended = () => {
        const i = this.oscillators.indexOf(osc);
        if (i >= 0) { this.oscillators.splice(i, 1); this.gains.splice(i, 1); }
      };
    }
    // Add a sub-bass for play mode to give it more body
    if (mode === 'play' && chord.freqs.length > 0) {
      const bassFreq = chord.freqs[0] / 2;
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = bassFreq;
      bassGain.gain.setValueAtTime(0, this.ctx.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.01);
      bassGain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + dur * 0.8);
      bassOsc.connect(bassGain); bassGain.connect(this.destination);
      bassOsc.start(); bassOsc.stop(this.ctx.currentTime + dur);
      this.oscillators.push(bassOsc); this.gains.push(bassGain);
      bassOsc.onended = () => {
        const i = this.oscillators.indexOf(bassOsc);
        if (i >= 0) { this.oscillators.splice(i, 1); this.gains.splice(i, 1); }
      };
    }
  }

  private getPattern(mode: BGMMode): ChordNote[] {
    switch (mode) {
      case 'title':
        // C → Am → F → G chord progression
        return [
          { freqs: [262, 330, 392], dur: 0.4 },
          { freqs: [330, 392, 523], dur: 0.3 },
          { freqs: [220, 262, 330], dur: 0.4 },
          { freqs: [262, 330, 440], dur: 0.3 },
          { freqs: [175, 262, 349], dur: 0.4 },
          { freqs: [262, 349, 440], dur: 0.3 },
          { freqs: [196, 247, 392], dur: 0.4 },
          { freqs: [247, 392, 494], dur: 0.3 },
          { freqs: [262, 330, 523], dur: 0.5 },
          { freqs: [330, 392, 523], dur: 0.3 },
          { freqs: [175, 262, 349], dur: 0.3 },
          { freqs: [196, 294, 392], dur: 0.3 },
          { freqs: [262, 330, 392, 523], dur: 0.6 },
        ];
      case 'play':
        // Pop & bouncy — C → G → Am → F with syncopation
        // Longer base durations so initial tempo feels relaxed
        return [
          // C major bounce
          { freqs: [262, 330, 392], dur: 0.28 },
          { freqs: [262, 330, 392], dur: 0.14 },
          { freqs: [330, 392, 523], dur: 0.28 },
          // G major lift
          { freqs: [196, 247, 392], dur: 0.28 },
          { freqs: [247, 392, 494], dur: 0.14 },
          { freqs: [294, 392, 587], dur: 0.28 },
          // Am groove
          { freqs: [220, 330, 440], dur: 0.28 },
          { freqs: [262, 330, 523], dur: 0.14 },
          { freqs: [220, 330, 440], dur: 0.28 },
          // F resolve + pickup
          { freqs: [175, 262, 349], dur: 0.28 },
          { freqs: [220, 349, 440], dur: 0.14 },
          { freqs: [262, 349, 523], dur: 0.28 },
          // C high energy
          { freqs: [262, 392, 523], dur: 0.14 },
          { freqs: [330, 392, 659], dur: 0.28 },
          // G power
          { freqs: [196, 392, 587], dur: 0.28 },
          { freqs: [247, 494, 587], dur: 0.14 },
          // Am → F → G turnaround
          { freqs: [220, 330, 523], dur: 0.28 },
          { freqs: [175, 349, 440], dur: 0.14 },
          { freqs: [196, 392, 494], dur: 0.28 },
          { freqs: [247, 392, 587], dur: 0.14 },
          // C resolution
          { freqs: [262, 330, 392, 523], dur: 0.35 },
          { freqs: [330, 523, 659], dur: 0.28 },
        ];
      case 'result':
        // Triumphant fanfare chords
        return [
          { freqs: [262, 330, 392], dur: 0.35 },
          { freqs: [349, 440, 523], dur: 0.35 },
          { freqs: [392, 494, 587], dur: 0.4 },
          { freqs: [523, 659, 784], dur: 0.6 },
          { freqs: [440, 523, 659], dur: 0.35 },
          { freqs: [349, 440, 523], dur: 0.35 },
          { freqs: [262, 330, 392], dur: 0.4 },
          { freqs: [196, 247, 392], dur: 0.35 },
          { freqs: [262, 330, 392, 523], dur: 0.5 },
          { freqs: [330, 392, 523, 659], dur: 0.5 },
        ];
    }
  }
}
