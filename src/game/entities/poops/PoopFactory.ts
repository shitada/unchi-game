import type { InputAnalysis, PoopId } from '@/types';
import { GAME_SETTINGS } from '@/game/config/GameSettings';

export function determinePoopType(analysis: InputAnalysis): PoopId {
  const {
    tapCount,
    rhythmStability,
    acceleration,
    lastSecondPattern,
    burstPattern,
    averageInterval,
  } = analysis;

  // ★★★★★ ほしのうんち — stable rhythm + long press at end
  if (
    rhythmStability >= (1 - GAME_SETTINGS.stableRhythmMaxCV) &&
    lastSecondPattern === 'longPress' &&
    tapCount >= 20
  ) {
    return 'star';
  }

  // ★★★★ ゴールデンうんち — accelerating pattern
  if (
    acceleration >= GAME_SETTINGS.accelerationThreshold &&
    tapCount >= 25
  ) {
    return 'golden';
  }

  // ★★★★ カラフルうんち — ultra fast tapping
  if (tapCount >= GAME_SETTINGS.highSpeedMinTaps) {
    return 'rainbow';
  }

  // ★★★ もこもこうんち — burst pattern
  if (burstPattern) {
    return 'fluffy';
  }

  // ★★★ つぶつぶうんち — irregular rhythm
  if (
    tapCount >= 20 &&
    rhythmStability < (1 - GAME_SETTINGS.stableRhythmMaxCV * 2)
  ) {
    return 'pebble';
  }

  // ★★★ ソフトクリームうんち — very stable rhythm
  if (
    rhythmStability >= (1 - GAME_SETTINGS.veryStableRhythmMaxCV) &&
    tapCount >= 25
  ) {
    return 'softServe';
  }

  // ★★ ぶっというんち — slow, strong taps
  if (
    averageInterval >= GAME_SETTINGS.slowTapMinInterval &&
    tapCount >= 8
  ) {
    return 'thick';
  }

  // ★★ ながーいうんち — stable rhythm (moderate)
  if (
    rhythmStability >= (1 - GAME_SETTINGS.stableRhythmMaxCV) &&
    tapCount >= 20
  ) {
    return 'long';
  }

  // ★ ちびうんち — very few taps
  if (tapCount <= GAME_SETTINGS.tinyMaxTaps) {
    return 'tiny';
  }

  // ★ ノーマルうんち — everything else
  return 'normal';
}
