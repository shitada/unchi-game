import { describe, it, expect } from 'vitest';
import { calculateScore } from '@/game/systems/ScoreCalculator';

describe('ScoreCalculator', () => {
  it('calculates score for normal poop', () => {
    const result = calculateScore(30, 'normal');
    expect(result.sizePoints).toBe(30);
    expect(result.rarityBonus).toBe(50);  // multiplier 1 × 50
    expect(result.total).toBe(80);
  });

  it('caps size points at 100', () => {
    const result = calculateScore(150, 'normal');
    expect(result.sizePoints).toBe(100);
    expect(result.total).toBe(150);  // 100 + 50
  });

  it('applies multiplier for rare poops', () => {
    const result = calculateScore(50, 'rainbow');
    expect(result.sizePoints).toBe(50);
    expect(result.rarityBonus).toBe(250);  // multiplier 5 × 50
    expect(result.total).toBe(300);
  });

  it('calculates star poop with max multiplier', () => {
    const result = calculateScore(80, 'star');
    expect(result.sizePoints).toBe(80);
    expect(result.rarityBonus).toBe(500);  // multiplier 10 × 50
    expect(result.total).toBe(580);
  });

  it('handles 0 taps', () => {
    const result = calculateScore(0, 'tiny');
    expect(result.sizePoints).toBe(0);
    expect(result.rarityBonus).toBe(50);
    expect(result.total).toBe(50);
  });
});
