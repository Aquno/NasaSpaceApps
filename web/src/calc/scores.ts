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
  SCIENCE_ZERO_SCORE_KM,
  VERDICT,
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

/** Verdict with a one-sentence reason (thresholds: VERDICT). */
export function verdict(
  m: MissionMetrics,
  eng: Score,
  sci: Score | null,
  psrDistanceKm: number | null,
): Verdict {
  if (m.sunHoursFromLanding < VERDICT.minSunlightAtLandingHours) {
    return {
      kind: 'not-viable',
      reason: m.sunVisibleAtLanding
        ? `The Sun sets ${hours(m.sunHoursFromLanding)} after landing.`
        : 'Dark at landing: the Sun is behind the terrain.',
    };
  }
  if (eng.total < VERDICT.notViableBelowEngineering) {
    return {
      kind: 'not-viable',
      reason: `Too little power and contact: ${pct(m.sunFraction)} sunlit, Earth in view ${pct(m.earthFraction)}.`,
    };
  }
  const science = sci?.total ?? 0;
  const distance = psrDistanceKm === null ? 'unknown' : `${psrDistanceKm.toFixed(1)} km`;
  if (eng.total >= VERDICT.viableMinEngineering && science >= VERDICT.viableMinScience) {
    return {
      kind: 'viable',
      reason: `${pct(m.sunFraction)} sunlit, Earth in view ${pct(m.earthFraction)}, permanent shadow ${distance} away.`,
    };
  }
  if (eng.total >= VERDICT.viableMinEngineering) {
    return {
      kind: 'marginal',
      reason: `Good power and contact, but permanent shadow is ${distance} away.`,
    };
  }
  return {
    kind: 'marginal',
    reason: `Weak engineering: ${pct(m.sunFraction)} sunlit, longest contact gap ${hours(m.longestNoContactHours)}.`,
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
