/**
 * What: Named constants for mission metrics, scores, verdicts and the best compromise.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision docs/DECISOES.md D25.
 * Inputs/outputs: constants only.
 * NASA data source: none. EVERY value here is a TEAM CHOICE for this demo, not a NASA
 *   requirement or criterion. The interface shows how each score is built from them, and the
 *   mission rules can be changed on screen ("Mission rules").
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

/** Mission rules behind the verdict (adjustable on screen). Fractions in [0, 1], hours. */
export interface MissionRules {
  /** Hard rule: some part of the Sun must be visible at landing. */
  requireSunAtLanding: boolean;
  /** Hard rule: longest continuous darkness during the mission must be below this (h). */
  survivalDarknessHours: number;
  /** Hard rule: sunlit fraction of the mission must be at least this. */
  minSunFraction: number;
  /** Below this sunlit fraction (but above the minimum) the verdict is at best marginal. */
  marginalBelowSunFraction: number;
  /** Viable needs the engineering score at or above this (communication enters through it). */
  viableMinEngineering: number;
  /** Terrain slope (degrees, 20 m DEM) above which the verdict is lowered by one level. */
  maxSlopeDeg: number;
  /**
   * Optional filter (off by default): sites whose science score is below `minScienceScore` are
   * left out of the best compromise. Science never changes the verdict (D25 revised, D32).
   */
  minScienceEnabled: boolean;
  minScienceScore: number;
}

export const DEFAULT_RULES: MissionRules = {
  requireSunAtLanding: true,
  survivalDarknessHours: 24,
  minSunFraction: 0.5,
  marginalBelowSunFraction: 0.7,
  viableMinEngineering: 60,
  maxSlopeDeg: 10,
  minScienceEnabled: false,
  minScienceScore: 40,
};

/** Mission duration choices offered in the interface (hours). Default: 14 days. */
export const MISSION_DURATION_OPTIONS_H = [72, 168, 336, 504, 672] as const;
export const DEFAULT_MISSION_DURATION_H = 336;

/** Default demo scenario (D33): landing 2027-03-04, 14 days, no delay; "Slip launch 21 days" -> 2027-03-25. */
export const DEFAULT_LANDING_ISO = '2027-03-04T00:00:00Z';
export const MAX_DELAY_DAYS = 60;
/** Delay used in the pitch question ("Your launch just slipped three weeks"). */
export const PITCH_DELAY_DAYS = 21;
