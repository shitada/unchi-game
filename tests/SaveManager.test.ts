import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '@/game/storage/SaveManager';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty data', () => {
    const sm = new SaveManager();
    expect(sm.getDiscoveredPoops()).toEqual([]);
    expect(sm.getTotalPlays()).toBe(0);
    expect(sm.getHighScore()).toBe(0);
  });

  it('records a play and discovers poop', () => {
    const sm = new SaveManager();
    const isNew = sm.recordPlay('normal', 80);
    expect(isNew).toBe(true);
    expect(sm.getDiscoveredPoops()).toContain('normal');
    expect(sm.getTotalPlays()).toBe(1);
    expect(sm.getHighScore()).toBe(80);
  });

  it('returns false for already discovered poop', () => {
    const sm = new SaveManager();
    sm.recordPlay('normal', 80);
    const isNew = sm.recordPlay('normal', 50);
    expect(isNew).toBe(false);
    expect(sm.getDiscoveredCount()).toBe(1);
  });

  it('tracks high score', () => {
    const sm = new SaveManager();
    sm.recordPlay('normal', 80);
    sm.recordPlay('rainbow', 300);
    expect(sm.getHighScore()).toBe(300);
  });

  it('persists across instances', () => {
    const sm1 = new SaveManager();
    sm1.recordPlay('normal', 80);
    sm1.recordPlay('rainbow', 300);

    const sm2 = new SaveManager();
    expect(sm2.getDiscoveredPoops()).toContain('normal');
    expect(sm2.getDiscoveredPoops()).toContain('rainbow');
    expect(sm2.getTotalPlays()).toBe(2);
  });

  it('resets data', () => {
    const sm = new SaveManager();
    sm.recordPlay('normal', 80);
    sm.resetData();
    expect(sm.getDiscoveredPoops()).toEqual([]);
    expect(sm.getTotalPlays()).toBe(0);
  });
});
