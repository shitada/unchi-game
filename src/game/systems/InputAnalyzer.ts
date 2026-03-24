import type { InputAnalysis } from '@/types';
import { GAME_SETTINGS } from '@/game/config/GameSettings';

export type BonusType = 'stableRhythm' | 'acceleration' | 'burstPattern' | 'highSpeed';

export class InputAnalyzer {
  private tapTimestamps: number[] = [];
  private longPressStart: number | null = null;
  private longPressActive = false;
  private triggeredBonuses = new Set<BonusType>();

  reset(): void {
    this.tapTimestamps = [];
    this.longPressStart = null;
    this.longPressActive = false;
    this.triggeredBonuses.clear();
  }

  recordTap(): void {
    this.tapTimestamps.push(performance.now());
  }

  recordPointerDown(): void {
    this.longPressStart = performance.now();
    this.longPressActive = true;
  }

  recordPointerUp(): void {
    this.longPressActive = false;
  }

  analyze(): InputAnalysis {
    const tapCount = this.tapTimestamps.length;
    const intervals = this.getIntervals();
    const rhythmStability = this.calcRhythmStability(intervals);
    const acceleration = this.calcAcceleration(intervals);
    const lastSecondPattern = this.detectLastSecondPattern();
    const burstPattern = this.detectBurstPattern(intervals);
    const averageInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

    return {
      tapCount,
      rhythmStability,
      acceleration,
      lastSecondPattern,
      burstPattern,
      averageInterval,
    };
  }

  private getIntervals(): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimestamps.length; i++) {
      intervals.push(this.tapTimestamps[i] - this.tapTimestamps[i - 1]);
    }
    return intervals;
  }

  private calcRhythmStability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (mean === 0) return 0;
    const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    // Map CV to 0-1 stability (lower CV = more stable)
    return Math.max(0, Math.min(1, 1 - cv));
  }

  private calcAcceleration(intervals: number[]): number {
    if (intervals.length < 4) return 0;
    const half = Math.floor(intervals.length / 2);
    const firstHalf = intervals.slice(0, half);
    const secondHalf = intervals.slice(half);
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avgFirst === 0) return 0;
    // Positive = speeding up (intervals getting shorter)
    return (avgFirst - avgSecond) / avgFirst;
  }

  private detectLastSecondPattern(): InputAnalysis['lastSecondPattern'] {
    const now = performance.now();
    // Check long press first
    if (this.longPressActive && this.longPressStart !== null) {
      const pressDuration = now - this.longPressStart;
      if (pressDuration >= GAME_SETTINGS.longPressMin) {
        return 'longPress';
      }
    }

    const lastSecondTaps = this.tapTimestamps.filter(t => now - t < 1000);
    if (lastSecondTaps.length === 0) return 'none';
    if (lastSecondTaps.length >= 8) return 'rapid';
    return 'normal';
  }

  private detectBurstPattern(intervals: number[]): boolean {
    if (intervals.length < 6) return false;
    let bursts = 0;
    let pauses = 0;

    for (const interval of intervals) {
      if (interval >= GAME_SETTINGS.burstPauseMin) {
        pauses++;
      } else if (interval <= GAME_SETTINGS.burstTapGap) {
        bursts++;
      }
    }

    // Burst pattern: roughly equal bursts and pauses, with enough of each
    return pauses >= 3 && bursts >= 6 && pauses / (bursts + pauses) > 0.2;
  }

  getTapCount(): number {
    return this.tapTimestamps.length;
  }

  /** Check for newly triggered bonuses since last call. Returns labels for newly achieved bonuses. */
  checkNewBonuses(): { type: BonusType; label: string }[] {
    const newBonuses: { type: BonusType; label: string }[] = [];
    const intervals = this.getIntervals();
    const tapCount = this.tapTimestamps.length;

    // Stable rhythm (need enough taps first)
    if (!this.triggeredBonuses.has('stableRhythm') && intervals.length >= 8) {
      const stability = this.calcRhythmStability(intervals);
      if (stability >= (1 - GAME_SETTINGS.stableRhythmMaxCV)) {
        this.triggeredBonuses.add('stableRhythm');
        newBonuses.push({ type: 'stableRhythm', label: '🎵 あんていリズム！' });
      }
    }

    // Acceleration
    if (!this.triggeredBonuses.has('acceleration') && intervals.length >= 8) {
      const accel = this.calcAcceleration(intervals);
      if (accel >= GAME_SETTINGS.accelerationThreshold) {
        this.triggeredBonuses.add('acceleration');
        newBonuses.push({ type: 'acceleration', label: '🚀 かそくボーナス！' });
      }
    }

    // Burst pattern
    if (!this.triggeredBonuses.has('burstPattern') && intervals.length >= 8) {
      if (this.detectBurstPattern(intervals)) {
        this.triggeredBonuses.add('burstPattern');
        newBonuses.push({ type: 'burstPattern', label: '💥 バースト！' });
      }
    }

    // High speed
    if (!this.triggeredBonuses.has('highSpeed') && tapCount >= GAME_SETTINGS.highSpeedMinTaps) {
      this.triggeredBonuses.add('highSpeed');
      newBonuses.push({ type: 'highSpeed', label: '⚡ こうそくれんだ！' });
    }

    return newBonuses;
  }
}
