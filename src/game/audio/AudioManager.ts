import type { BGMMode, PoopId } from '@/types';
import { BGMGenerator } from './BGMGenerator';
import { SFXGenerator } from './SFXGenerator';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgm: BGMGenerator | null = null;
  private sfx: SFXGenerator | null = null;
  private currentBGMMode: BGMMode | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.ctx.destination);

    this.bgm = new BGMGenerator(this.ctx, this.bgmGain);
    this.sfx = new SFXGenerator(this.ctx, this.sfxGain);
    this.initialized = true;
  }

  ensureResumed(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startBGM(mode: BGMMode): void {
    if (!this.bgm) return;
    this.ensureResumed();
    this.bgm.stop();
    this.bgm.play(mode);
    this.currentBGMMode = mode;
  }

  stopBGM(): void {
    this.bgm?.stop();
    this.currentBGMMode = null;
  }

  resumeBGM(): void {
    if (this.currentBGMMode) {
      this.startBGM(this.currentBGMMode);
    }
  }

  /** Set BGM playback speed (1.0 = normal, higher = faster) */
  setBGMSpeed(speed: number): void {
    this.bgm?.setSpeed(speed);
  }

  playSFX(type: Parameters<SFXGenerator['play']>[0]): void {
    if (!this.sfx) return;
    this.ensureResumed();
    this.sfx.play(type);
  }

  /** Play a poop-specific "buri buri" voice sound */
  playPoopVoice(poopId: PoopId): void {
    if (!this.sfx) return;
    this.ensureResumed();
    this.sfx.playPoopVoice(poopId);
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }
}
