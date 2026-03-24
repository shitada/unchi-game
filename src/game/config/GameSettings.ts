export const GAME_SETTINGS = {
  /** Game duration in seconds */
  gameDuration: 10,

  /** Score calculation */
  maxSizePoints: 100,
  rarityBonusBase: 50,

  /** Size calculation (cm) */
  baseSizeCm: 1.0,           // minimum size in cm
  cmPerTap: 0.3,             // cm gained per tap (primary factor)
  maxTapSizeCm: 30,          // cap for tap-based size
  stableRhythmBonus: 3.0,    // bonus cm for stable rhythm
  accelerationBonus: 4.0,    // bonus cm for acceleration pattern
  burstPatternBonus: 2.5,    // bonus cm for burst pattern
  highSpeedBonus: 5.0,       // bonus cm for 60+ taps
  longPressBonus: 2.0,       // bonus cm for long press at end
  rankingMaxEntries: 5,      // top N rankings to keep

  /** Input analysis thresholds */
  tinyMaxTaps: 15,
  highSpeedMinTaps: 60,
  slowTapMinInterval: 400,   // ms — "slow & strong" threshold
  stableRhythmMaxCV: 0.25,   // coefficient of variation for "stable"
  veryStableRhythmMaxCV: 0.15,
  accelerationThreshold: 0.3,
  burstPauseMin: 300,         // ms — pause between bursts
  burstTapGap: 120,           // ms — max gap within a burst
  longPressMin: 500,          // ms — long press detection

  /** Camera settings */
  cameraFov: 50,
  cameraZ: 6,
  cameraY: 3,

  /** Colors */
  bgColor: 0x3E2723,
  bgColorLight: 0x4E342E,
} as const;
