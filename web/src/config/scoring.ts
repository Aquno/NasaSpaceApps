/**
 * What: Named constants for mission metrics, scores, verdicts and the best compromise.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision docs/DECISOES.md D25.
 * Inputs/outputs: constants only.
 * NASA data source: none. EVERY value here is a TEAM CHOICE for this demo, not a NASA
 *   requirement or criterion. The interface shows how each score is built from them.
 */

/** Engineering score weights (sum = 1). Each term is a fraction in [0, 1] of the mission. */
export const ENGINEERING_WEIGHTS = {
  /** Fraction of mission hours with some part of the Sun above the terrain. */
  sunlight: 0.35,
  /** Continuous sunlight from landing, as a fraction of the mission duration. */
  sunlightFromLanding: 0.25,
  /** Fraction of mission hours with some part of the Earth above the terrain. */
  earthContact: 0.25,
  /** 1 - (longest gap without Earth contact / mission duration). */
  contactGaps: 0.15,
} as const;

/**
 * Science score from the distance to the nearest permanently shadowed region (>= 1 km2):
 * 100 at or below SCIENCE_FULL_SCORE_KM, falling linearly to 0 at SCIENCE_ZERO_SCORE_KM.
 * Proximity to permanent shadow as a science indicator is itself a team choice (D21).
 */
export const SCIENCE_FULL_SCORE_KM = 1;
export const SCIENCE_ZERO_SCORE_KM = 15;

/** Verdict thresholds (scores 0-100; hours). */
export const VERDICT = {
  /** Below this many hours of continuous sunlight right after landing: not viable. */
  minSunlightAtLandingHours: 24,
  /** Engineering score below this: not viable. */
  notViableBelowEngineering: 35,
  /** Both scores at or above these: viable. Anything in between: marginal. */
  viableMinEngineering: 60,
  viableMinScience: 40,
} as const;

/** Mission duration choices offered in the interface (hours). Default: 14 days. */
export const MISSION_DURATION_OPTIONS_H = [72, 168, 336, 504, 672] as const;
export const DEFAULT_MISSION_DURATION_H = 336;

/** Default planned landing date (UTC) and delay range offered in the interface (days). */
export const DEFAULT_LANDING_ISO = '2027-03-01T00:00:00Z';
export const MAX_DELAY_DAYS = 60;
