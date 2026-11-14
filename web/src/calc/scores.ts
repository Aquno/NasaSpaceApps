/**
 * What: Engineering and science scores (with their breakdown), verdict with a one-sentence
 *   reason, and the best compromise between the two scores. Pure functions.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); rules in docs/DECISOES.md D25.
 * Inputs: MissionMetrics; distance to the nearest PSR (km); constants in config/scoring.ts.
 * Outputs: scores 0-100 with named parts, verdict, ranking.
 * NASA data source: none directly. Weights and thresholds are TEAM CHOICES, not NASA criteria.
 */
import {
  ENGINEERING_WEIGHTS,
  SCIENCE_FULL_SCORE_KM,
  DEFAULT_RULES,
  SCIENCE_ZERO_SCORE_KM,
  type MissionRules,
} from '../config/scoring';
import type { MissionMetrics } from './metrics';

export interface ScorePart {
  key: string;
  label: string;
  /** Value of the term in [0, 1]. */
  value: number;
  weight: number;
  /** Points contributed (value * weight * 100). */
  points: number;
}

export interface Score {
  total: number;
  parts: ScorePart[];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const toScore = (parts: ScorePart[]): Score => ({
  total: parts.reduce((s, p) => s + p.points, 0),
  parts,
});
const part = (key: string, label: string, value: number, weight: number): ScorePart => {
  const v = clamp01(value);
  return { key, label, value: v, weight, points: v * weight * 100 };
};

/** Engineering score 0-100 from mission metrics (weights: ENGINEERING_WEIGHTS). */
export function engineeringScore(m: MissionMetrics): Score {
  const w = ENGINEERING_WEIGHTS;
  return toScore([
    part('sunlight', 'Sunlight during mission', m.sunFraction, w.sunlight),
    part(
      'sunlightFromLanding',
      'Continuous sunlight from landing',
      m.sunHoursFromLanding / m.durationHours,
      w.sunlightFromLanding,
    ),
    part('earthContact', 'Earth in view during mission', m.earthFraction, w.earthContact),
    part(
      'contactGaps',
      'Short gaps without Earth contact',
      1 - m.longestNoContactHours / m.durationHours,
      w.contactGaps,
    ),
  ]);
}

/** Science score 0-100 from the distance (km) to the nearest PSR; null distance gives null. */
export function scienceScore(psrDistanceKm: number | null): Score | null {
  if (psrDistanceKm === null) return null;
  const value =
    (SCIENCE_ZERO_SCORE_KM - Math.max(psrDistanceKm, SCIENCE_FULL_SCORE_KM)) /
    (SCIENCE_ZERO_SCORE_KM - SCIENCE_FULL_SCORE_KM);
  return toScore([part('psrProximity', 'Proximity to permanent shadow', value, 1)]);
}

export type VerdictKind = 'viable' | 'marginal' | 'not-viable';

export interface Verdict {
  kind: VerdictKind;
  reason: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const hours = (h: number) => (h >= 48 ? `${Math.round(h / 24)} days` : `${Math.round(h)} h`);

/** Which rule decided the verdict (for the interface to highlight it). */
export type RuleKey =
  | 'sunAtLanding'
  | 'survivalDarkness'
  | 'minSunFraction'
  | 'marginalSunFraction'
  | 'engineering'
  | 'science'
  | 'allPassed';

/**
 * Verdict with a one-sentence reason that cites the deciding rule and the measured value
 * (rules: config/scoring.ts MissionRules, team choices, D25).
 * Hard rules (any fails -> not viable): Sun visible at landing; longest darkness below the
 * survival limit; sunlit fraction at least the minimum. Then: sunlit fraction below the
 * marginal threshold, engineering (which includes Earth contact) or science below the viable
 * minimum -> marginal; otherwise viable.
 */
export function verdict(
  m: MissionMetrics,
  eng: Score,
  sci: Score | null,
  psrDistanceKm: number | null,
  rules: MissionRules = DEFAULT_RULES,
): Verdict & { rule: RuleKey } {
  if (rules.requireSunAtLanding && !m.sunVisibleAtLanding) {
    return {
      kind: 'not-viable',
      rule: 'sunAtLanding',
      reason: 'Dark at landing: the Sun is behind the terrain (rule: Sun visible at landing).',
    };
  }
  if (m.longestDarkHours >= rules.survivalDarknessHours) {
    return {
      kind: 'not-viable',
      rule: 'survivalDarkness',
      reason: `Longest darkness ${hours(m.longestDarkHours)} exceeds the ${hours(rules.survivalDarknessHours)} survival limit.`,
    };
  }
  if (m.sunFraction < rules.minSunFraction) {
    return {
      kind: 'not-viable',
      rule: 'minSunFraction',
      reason: `Only ${pct(m.sunFraction)} of the mission in sunlight (minimum ${pct(rules.minSunFraction)}).`,
    };
  }
  const science = sci?.total ?? 0;
  const distance = psrDistanceKm === null ? 'unknown' : `${psrDistanceKm.toFixed(1)} km`;
  if (m.sunFraction < rules.marginalBelowSunFraction) {
    return {
      kind: 'marginal',
      rule: 'marginalSunFraction',
      reason: `${pct(m.sunFraction)} of the mission in sunlight, below the ${pct(rules.marginalBelowSunFraction)} comfort level.`,
    };
  }
  if (eng.total < rules.viableMinEngineering) {
    return {
      kind: 'marginal',
      rule: 'engineering',
      reason: `Engineering score ${eng.total.toFixed(1)} below ${rules.viableMinEngineering}: Earth in view ${pct(m.earthFraction)}, longest contact gap ${hours(m.longestNoContactHours)}.`,
    };
  }
  if (science < rules.viableMinScience) {
    return {
      kind: 'marginal',
      rule: 'science',
      reason: `Good power and contact, but permanent shadow is ${distance} away (science ${science.toFixed(1)} < ${rules.viableMinScience}).`,
    };
  }
  return {
    kind: 'viable',
    rule: 'allPassed',
    reason: `${pct(m.sunFraction)} sunlit, Earth in view ${pct(m.earthFraction)}, permanent shadow ${distance} away.`,
  };
}

export interface Candidate {
  id: string;
  engineering: number;
  science: number;
  verdict: VerdictKind;
}

/**
 * Best compromise (D25): among sites that are not "not-viable", the one with the highest
 * min(engineering, science) — the weaker side decides; ties broken by the higher sum, then id.
 * Returns null when every site is not viable.
 */
export function bestCompromise(candidates: Candidate[]): string | null {
  const eligible = candidates.filter((c) => c.verdict !== 'not-viable');
  if (eligible.length === 0) return null;
  const sorted = [...eligible].sort(
    (a, b) =>
      Math.min(b.engineering, b.science) - Math.min(a.engineering, a.science) ||
      b.engineering + b.science - (a.engineering + a.science) ||
      a.id.localeCompare(b.id),
  );
  return sorted[0]?.id ?? null;
}

const VERDICT_ORDER: Record<VerdictKind, number> = { viable: 0, marginal: 1, 'not-viable': 2 };

/** Display order: best compromise first, then by verdict, then min score, then sum. */
export function rankCandidates(candidates: Candidate[]): string[] {
  const best = bestCompromise(candidates);
  return [...candidates]
    .sort(
      (a, b) =>
        Number(b.id === best) - Number(a.id === best) ||
        VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] ||
        Math.min(b.engineering, b.science) - Math.min(a.engineering, a.science) ||
        b.engineering + b.science - (a.engineering + a.science) ||
        a.id.localeCompare(b.id),
    )
    .map((c) => c.id);
}
