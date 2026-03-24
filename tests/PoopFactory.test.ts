import { describe, it, expect } from 'vitest';
import { determinePoopType } from '@/game/entities/poops/PoopFactory';
import type { InputAnalysis } from '@/types';

function makeAnalysis(overrides: Partial<InputAnalysis> = {}): InputAnalysis {
  return {
    tapCount: 30,
    rhythmStability: 0.5,
    acceleration: 0,
    lastSecondPattern: 'normal',
    burstPattern: false,
    averageInterval: 200,
    ...overrides,
  };
}

describe('PoopFactory - determinePoopType', () => {
  it('returns tiny for few taps', () => {
    expect(determinePoopType(makeAnalysis({ tapCount: 10 }))).toBe('tiny');
  });

  it('returns normal for average input', () => {
    expect(determinePoopType(makeAnalysis())).toBe('normal');
  });

  it('returns rainbow for ultra-fast tapping', () => {
    expect(determinePoopType(makeAnalysis({ tapCount: 70 }))).toBe('rainbow');
  });

  it('returns golden for accelerating pattern', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 30,
      acceleration: 0.4,
    }))).toBe('golden');
  });

  it('returns star for stable rhythm + long press', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 25,
      rhythmStability: 0.8,
      lastSecondPattern: 'longPress',
    }))).toBe('star');
  });

  it('returns thick for slow tapping', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 12,
      averageInterval: 500,
    }))).toBe('thick');
  });

  it('returns long for stable moderate rhythm', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 25,
      rhythmStability: 0.8,
    }))).toBe('long');
  });

  it('returns softServe for very stable rhythm', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 30,
      rhythmStability: 0.9,
    }))).toBe('softServe');
  });

  it('returns fluffy for burst pattern', () => {
    expect(determinePoopType(makeAnalysis({
      burstPattern: true,
    }))).toBe('fluffy');
  });

  it('returns pebble for irregular rhythm', () => {
    expect(determinePoopType(makeAnalysis({
      tapCount: 25,
      rhythmStability: 0.3,
    }))).toBe('pebble');
  });
});
