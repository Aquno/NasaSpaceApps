/**
 * What: Engineering and science scores (with their breakdown), verdict with a one-sentence
 *   reason (as a message key + parameters, translated by the interface, D38), and the best
 *   compromise between the two scores. Pure functions.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); rules in docs/DECISOES.md D25, D31, D32.
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
import type { Msg } from '../i18n/translate';
import type { MissionMetrics } from './metrics';

/** Score term; its label is the message `part.<key>`. */
export interface ScorePart {
  key: 'sunlight' | 'sunlightFromLanding' | 'earthContact' | 'contactGaps' | 'psrProximity';
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
const part = (key: ScorePart['key'], value: number, weight: number): ScorePart => {
  const v = clamp01(value);
  return { key, value: v, weight, points: v * weight * 100 };
};

/** Engineering score 0-100 from mission metrics (weights: ENGINEERING_WEIGHTS). */
export function engineeringScore(m: MissionMetrics): Score {
  const w = ENGINEERING_WEIGHTS;
  return toScore([
    part('sunlight', m.sunFraction, w.sunlight),
    part('sunlightFromLanding', m.sunHoursFromLanding / m.durationHours, w.sunlightFromLanding),
    part('earthContact', m.earthFraction, w.earthContact),
    part('contactGaps', 1 - m.longestNoContactHours / m.durationHours, w.contactGaps),
  ]);
}

/** Science score 0-100 from the distance (km) to the nearest PSR; null distance gives null. */
export function scienceScore(psrDistanceKm: number | null): Score | null {
  if (psrDistanceKm === null) return null;
  const value =
    (SCIENCE_ZERO_SCORE_KM - Math.max(psrDistanceKm, SCIENCE_FULL_SCORE_KM)) /
    (SCIENCE_ZERO_SCORE_KM - SCIENCE_FULL_SCORE_KM);
  return toScore([part('psrProximity', value, 1)]);
}

export type VerdictKind = 'viable' | 'marginal' | 'not-viable';

export interface Verdict {
  kind: VerdictKind;
  /** Reason as a message key + parameters (fractions 0-1, hours, degrees, km). */
  reason: Msg;
}

/** Which rule decided the verdict (for the interface to highlight it). */
export type RuleKey =
  | 'sunAtLanding'
  | 'survivalDarkness'
  | 'minSunFraction'
  | 'marginalSunFraction'
  | 'engineering'
  | 'slope'
  | 'allPassed';

const LOWER: Record<VerdictKind, VerdictKind> = {
  viable: 'marginal',
  marginal: 'not-viable',
  'not-viable': 'not-viable',
};

/**
 * Verdict with a one-sentence reason that cites the deciding rule and the measured value
 * (rules: config/scoring.ts MissionRules, team choices, D25, D31, D32). ENGINEERING ONLY: the
 * science score never fails or lowers a site; it enters the ranking and the best compromise.
 * Hard rules (any fails -> not viable): Sun visible at landing; longest darkness below the
 * survival limit; sunlit fraction at least the minimum. Then: sunlit fraction below the
 * marginal threshold, or engineering score (which includes Earth contact) below the viable
 * minimum -> marginal; otherwise viable. Finally, a terrain slope above the limit lowers the
 * verdict by one level (viable -> marginal -> not viable).
 */
export function verdict(
  m: MissionMetrics,
  eng: Score,
  sci: Score | null,
  psrDistanceKm: number | null,
  rules: MissionRules = DEFAULT_RULES,
  slopeDeg = 0,
): Verdict & { rule: RuleKey } {
  const base = baseVerdict(m, eng, sci, psrDistanceKm, rules);
  if (slopeDeg <= rules.maxSlopeDeg || base.kind === 'not-viable') return base;
  return {
    kind: LOWER[base.kind],
    rule: 'slope',
    reason: {
      key: 'reason.slope',
      params: { slope: slopeDeg, limit: rules.maxSlopeDeg, would: base.kind },
    },
  };
}

function baseVerdict(
  m: MissionMetrics,
  eng: Score,
  sci: Score | null,
  psrDistanceKm: number | null,
  rules: MissionRules,
): Verdict & { rule: RuleKey } {
  if (rules.requireSunAtLanding && !m.sunVisibleAtLanding) {
    return { kind: 'not-viable', rule: 'sunAtLanding', reason: { key: 'reason.darkAtLanding' } };
  }
  // A limit of 0 h means no darkness at all is allowed (D53): a mission without darkness passes.
  const noDarkAllowed = rules.survivalDarknessHours <= 0;
  if (noDarkAllowed ? m.longestDarkHours > 0 : m.longestDarkHours >= rules.survivalDarknessHours) {
    return {
      kind: 'not-viable',
      rule: 'survivalDarkness',
      reason: noDarkAllowed
        ? { key: 'reason.noDarkness', params: { h: m.longestDarkHours } }
        : {
            key: 'reason.survivalDarkness',
            params: { h: m.longestDarkHours, limit: rules.survivalDarknessHours },
          },
    };
  }
  if (m.sunFraction < rules.minSunFraction) {
    return {
      kind: 'not-viable',
      rule: 'minSunFraction',
      reason: {
        key: 'reason.minSunFraction',
        params: { p: m.sunFraction, min: rules.minSunFraction },
      },
    };
  }
  void sci; // science never changes the verdict (D32)
  if (m.sunFraction < rules.marginalBelowSunFraction) {
    return {
      kind: 'marginal',
      rule: 'marginalSunFraction',
      reason: {
        key: 'reason.marginalSunFraction',
        params: { p: m.sunFraction, comfort: rules.marginalBelowSunFraction },
      },
    };
  }
  if (eng.total < rules.viableMinEngineering) {
    return {
      kind: 'marginal',
      rule: 'engineering',
      reason: {
        key: 'reason.engineering',
        params: {
          score: eng.total,
          min: rules.viableMinEngineering,
          earth: m.earthFraction,
          gap: m.longestNoContactHours,
        },
      },
    };
  }
  return {
    kind: 'viable',
    rule: 'allPassed',
    reason:
      psrDistanceKm === null
        ? { key: 'reason.viableNoPsr', params: { p: m.sunFraction, earth: m.earthFraction } }
        : {
            key: 'reason.viable',
            params: { p: m.sunFraction, earth: m.earthFraction, km: psrDistanceKm },
          },
  };
}

/**
 * True when the optional science filter is on and the site's science score is below its
 * minimum (D32, D53): the site is then left out of "viable", the best compromise, the earliest
 * viable landing and the viable-day counts, and is shown as "Below science minimum".
 */
export function belowScienceMinimum(sci: Score | null, rules: MissionRules): boolean {
  return rules.minScienceEnabled && (sci?.total ?? 0) < rules.minScienceScore;
}

export interface Candidate {
  id: string;
  engineering: number;
  science: number;
  verdict: VerdictKind;
}

/**
 * Best compromise (D25, D32): among sites that are not "not-viable" (and, when the optional
 * filter is on, whose science score is at least `minScience`), the one with the highest
 * min(engineering, science) — the weaker side decides; ties broken by the higher sum, then id.
 * Returns null when no site is eligible.
 */
export function bestCompromise(
  candidates: Candidate[],
  minScience: number | null = null,
): string | null {
  const eligible = candidates.filter(
    (c) => c.verdict !== 'not-viable' && (minScience === null || c.science >= minScience),
  );
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
export function rankCandidates(
  candidates: Candidate[],
  minScience: number | null = null,
): string[] {
  const best = bestCompromise(candidates, minScience);
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
