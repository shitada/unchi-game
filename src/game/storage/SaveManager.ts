import type { PoopId, SaveData, RankingEntry } from '@/types';
import { GAME_SETTINGS } from '@/game/config/GameSettings';

const STORAGE_KEY = 'unchi-game-save';

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SaveData;
        // Migration: ensure ranking array exists
        if (!data.ranking) data.ranking = [];
        return data;
      }
    } catch { /* corrupt data, reset */ }
    return this.defaultData();
  }

  private defaultData(): SaveData {
    return {
      discoveredPoops: [],
      totalPlays: 0,
      totalScore: 0,
      highScore: 0,
      ranking: [],
    };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  recordPlay(poopId: PoopId, score: number): boolean {
    this.data.totalPlays++;
    this.data.totalScore += score;
    if (score > this.data.highScore) {
      this.data.highScore = score;
    }

    let isNew = false;
    if (!this.data.discoveredPoops.includes(poopId)) {
      this.data.discoveredPoops.push(poopId);
      isNew = true;
    }

    this.save();
    return isNew;
  }

  isDiscovered(poopId: PoopId): boolean {
    return this.data.discoveredPoops.includes(poopId);
  }

  getDiscoveredPoops(): PoopId[] {
    return [...this.data.discoveredPoops];
  }

  getDiscoveredCount(): number {
    return this.data.discoveredPoops.length;
  }

  getTotalPlays(): number {
    return this.data.totalPlays;
  }

  getHighScore(): number {
    return this.data.highScore;
  }

  getData(): SaveData {
    return { ...this.data };
  }

  /** Record a play in the top-5 ranking. Returns the rank (1-5) or 0 if not ranked. */
  recordRanking(sizeCm: number, poopId: PoopId, tapCount: number): number {
    const entry: RankingEntry = {
      sizeCm,
      poopId,
      tapCount,
      playedAt: new Date().toISOString(),
    };
    this.data.ranking.push(entry);
    this.data.ranking.sort((a, b) => b.sizeCm - a.sizeCm);
    this.data.ranking = this.data.ranking.slice(0, GAME_SETTINGS.rankingMaxEntries);
    this.save();

    const rank = this.data.ranking.findIndex(e => e === entry) + 1;
    return rank > 0 && rank <= GAME_SETTINGS.rankingMaxEntries ? rank : 0;
  }

  getRanking(): RankingEntry[] {
    return [...this.data.ranking];
  }

  resetData(): void {
    this.data = this.defaultData();
    this.save();
  }
}
