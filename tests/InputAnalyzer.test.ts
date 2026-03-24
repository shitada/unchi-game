import { describe, it, expect, beforeEach } from 'vitest';
import { InputAnalyzer } from '@/game/systems/InputAnalyzer';

describe('InputAnalyzer', () => {
  let analyzer: InputAnalyzer;

  beforeEach(() => {
    analyzer = new InputAnalyzer();
  });

  it('returns 0 taps initially', () => {
    expect(analyzer.getTapCount()).toBe(0);
  });

  it('counts taps correctly', () => {
    analyzer.recordTap();
    analyzer.recordTap();
    analyzer.recordTap();
    expect(analyzer.getTapCount()).toBe(3);
  });

  it('resets properly', () => {
    analyzer.recordTap();
    analyzer.recordTap();
    analyzer.reset();
    expect(analyzer.getTapCount()).toBe(0);
  });

  it('analyzes empty input', () => {
    const result = analyzer.analyze();
    expect(result.tapCount).toBe(0);
    expect(result.rhythmStability).toBe(0);
    expect(result.acceleration).toBe(0);
    expect(result.burstPattern).toBe(false);
  });

  it('analyzes basic input', () => {
    for (let i = 0; i < 10; i++) {
      analyzer.recordTap();
    }
    const result = analyzer.analyze();
    expect(result.tapCount).toBe(10);
  });
});
