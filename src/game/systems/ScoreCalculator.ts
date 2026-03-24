import type { PoopId, InputAnalysis } from '@/types';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { POOP_ENCYCLOPEDIA } from '@/game/config/PoopEncyclopedia';

export interface ScoreBreakdown {
  sizePoints: number;
  rarityBonus: number;
  total: number;
}

export function calculateScore(tapCount: number, poopId: PoopId): ScoreBreakdown {
  const entry = POOP_ENCYCLOPEDIA[poopId];
  const sizePoints = Math.min(tapCount, GAME_SETTINGS.maxSizePoints);
  const rarityBonus = entry.scoreMultiplier * GAME_SETTINGS.rarityBonusBase;
  const total = sizePoints + rarityBonus;

  return { sizePoints, rarityBonus, total };
}

export interface SizeBreakdown {
  tapSizeCm: number;
  bonusCm: number;
  totalCm: number;
  bonusLabels: string[];
}

/** Calculate poop size in cm. Tap count is the primary factor; pattern bonuses add extra. */
export function calculateSizeCm(analysis: InputAnalysis): SizeBreakdown {
  const S = GAME_SETTINGS;

  // Primary: tap-based size (capped)
  const tapSizeCm = Math.min(analysis.tapCount * S.cmPerTap, S.maxTapSizeCm);

  // Bonuses from input patterns
  let bonusCm = 0;
  const bonusLabels: string[] = [];

  if (analysis.rhythmStability >= (1 - S.stableRhythmMaxCV)) {
    bonusCm += S.stableRhythmBonus;
    bonusLabels.push('あんていリズム');
  }
  if (analysis.acceleration >= S.accelerationThreshold) {
    bonusCm += S.accelerationBonus;
    bonusLabels.push('かそくボーナス');
  }
  if (analysis.burstPattern) {
    bonusCm += S.burstPatternBonus;
    bonusLabels.push('バーストボーナス');
  }
  if (analysis.tapCount >= S.highSpeedMinTaps) {
    bonusCm += S.highSpeedBonus;
    bonusLabels.push('こうそくれんだ');
  }
  if (analysis.lastSecondPattern === 'longPress') {
    bonusCm += S.longPressBonus;
    bonusLabels.push('ながおしフィニッシュ');
  }

  const totalCm = Math.round((S.baseSizeCm + tapSizeCm + bonusCm) * 10) / 10;
  return { tapSizeCm: Math.round(tapSizeCm * 10) / 10, bonusCm: Math.round(bonusCm * 10) / 10, totalCm, bonusLabels };
}
