import * as THREE from 'three';

// ── Poop Types ──
export type PoopId =
  | 'normal'
  | 'tiny'
  | 'long'
  | 'thick'
  | 'softServe'
  | 'pebble'
  | 'fluffy'
  | 'rainbow'
  | 'golden'
  | 'star';

export type SceneType = 'title' | 'play' | 'result' | 'encyclopedia' | 'ranking';

export type BGMMode = 'title' | 'play' | 'result';

export type SFXType = 'push' | 'grow' | 'finish' | 'fanfare' | 'rare' | 'newDiscovery' | 'bonus';

// ── Scene System ──
export interface SceneContext {
  poopId?: PoopId;
  tapCount?: number;
  score?: number;
  sizeCm?: number;
  isNew?: boolean;
}

export interface Scene {
  enter(context: SceneContext): void;
  update(deltaTime: number): void;
  exit(): void;
  getThreeScene(): THREE.Scene;
  getCamera(): THREE.Camera;
}

// ── Input Analysis ──
export interface InputAnalysis {
  tapCount: number;
  rhythmStability: number;   // 0 = chaotic, 1 = perfectly regular
  acceleration: number;       // >0 = speeding up, <0 = slowing down
  lastSecondPattern: 'longPress' | 'rapid' | 'none' | 'normal';
  burstPattern: boolean;      // 2-tap bursts with pauses
  averageInterval: number;    // average ms between taps
}

// ── Encyclopedia ──
export interface PoopEntry {
  id: PoopId;
  name: string;
  emoji: string;
  rarity: number;       // 1-5 stars
  scoreMultiplier: number;
  description: string;
  hint: string;
  color: number;        // Three.js hex color
  secondaryColor?: number;
}

// ── Ranking ──
export interface RankingEntry {
  sizeCm: number;
  poopId: PoopId;
  tapCount: number;
  playedAt: string; // ISO date string
}

// ── Save Data ──
export interface SaveData {
  discoveredPoops: PoopId[];
  totalPlays: number;
  totalScore: number;
  highScore: number;
  ranking: RankingEntry[];
}
