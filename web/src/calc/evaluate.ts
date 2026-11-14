/**
 * What: Evaluate every site for a landing day (first suitable hour, D36) and mission duration: metrics, scores, verdict,
 *   best compromise and display order. Pure function composing the calc modules.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: site summaries, SiteData and precomputed visibility per site, landing time (ms UTC),
 *   duration (hours).
 * Outputs: Evaluation per site (or the reason it cannot be computed) and the ranking.
 * NASA data source: Horizons ephemerides, LOLA horizon and PSRs via data/app.
 */
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';
import { indexAtOrAfter, type SiteData, type SiteSummary } from '../data/contract';
import { linkStatus, type LinkStatus } from './communication';
import { missionMetrics, missionWindow, type MissionMetrics, type WindowResult } from './metrics';
import {
  bestCompromise,
  engineeringScore,
  rankCandidates,
  scienceScore,
  verdict,
  type RuleKey,
  type Score,
  type Verdict,
} from './scores';
import type { VisibilitySeries } from './visibility';

export type SiteEvaluation =
  | {
      ok: true;
      siteId: string;
      metrics: MissionMetrics;
      engineering: Score;
      science: Score | null;
      verdict: Verdict & { rule: RuleKey };
      /** Landing time used (ms UTC): the first hour of the day that meets the landing rules. */
      landingMs: number;
      /** False when no hour of the day meets them (the 00:00 UTC evaluation is then shown). */
      landingHourFound: boolean;
      /** Direct-to-Earth link summary (D37). */
      link: LinkStatus;
    }
  | { ok: false; siteId: string; window: Extract<WindowResult, { ok: false }> };

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
export const LANDING_HOURS_PER_DAY = 24;

export interface Evaluation {
  sites: SiteEvaluation[];
  bestId: string | null;
  order: string[];
}

/**
 * Evaluate a landing DAY (D36): the date is the day of landing (UTC). Each hour of the day is
 * tried in order and the first one whose verdict is not "not-viable" (it meets the landing
 * rules) is used; if none does, the site is not viable that day and the 00:00 UTC evaluation
 * (with its reason) is returned with landingHourFound = false.
 */
export function evaluateSite(
  site: SiteSummary,
  data: SiteData,
  vis: VisibilitySeries,
  landingDayMs: number,
  durationHours: number,
  rules: MissionRules = DEFAULT_RULES,
): SiteEvaluation {
  const dayStart = Math.floor(landingDayMs / DAY_MS) * DAY_MS;
  for (let h = 0; h < LANDING_HOURS_PER_DAY; h++) {
    const t = dayStart + h * HOUR_MS;
    const i = indexAtOrAfter(data.meta, t);
    // Cheap pre-check of the first landing rule before computing the mission metrics.
    if (rules.requireSunAtLanding && i >= 0 && i < data.meta.count && vis.sunAny[i] === 0) continue;
    const e = evaluateAt(site, data, vis, t, durationHours, rules);
    if (e.ok && e.verdict.kind !== 'not-viable') return e;
  }
  const fallback = evaluateAt(site, data, vis, dayStart, durationHours, rules);
  return fallback.ok ? { ...fallback, landingHourFound: false } : fallback;
}

/** Evaluate a landing at one exact time (ms UTC). */
export function evaluateAt(
  site: SiteSummary,
  data: SiteData,
  vis: VisibilitySeries,
  landingMs: number,
  durationHours: number,
  rules: MissionRules = DEFAULT_RULES,
): SiteEvaluation {
  const w = missionWindow(data.meta, landingMs, durationHours);
  if (!w.ok) return { ok: false, siteId: site.id, window: w };
  const metrics = missionMetrics(data, vis, w.window);
  const engineering = engineeringScore(metrics);
  const science = scienceScore(site.psrDistanceKm);
  return {
    ok: true,
    siteId: site.id,
    metrics,
    engineering,
    science,
    verdict: verdict(
      metrics,
      engineering,
      science,
      site.psrDistanceKm,
      rules,
      site.terrainSlopeDeg,
    ),
    landingMs,
    landingHourFound: true,
    link: linkStatus(metrics, rules),
  };
}

/** Evaluate a set of sites (typically the five ranked ones) and rank them. */
export function evaluateSites(
  sites: SiteSummary[],
  data: Map<string, SiteData>,
  vis: Map<string, VisibilitySeries>,
  landingMs: number,
  durationHours: number,
  rules: MissionRules = DEFAULT_RULES,
): Evaluation {
  const evaluations: SiteEvaluation[] = [];
  for (const s of sites) {
    const d = data.get(s.id);
    const v = vis.get(s.id);
    if (d && v) evaluations.push(evaluateSite(s, d, v, landingMs, durationHours, rules));
  }
  const candidates = evaluations.flatMap((e) =>
    e.ok
      ? [
          {
            id: e.siteId,
            engineering: e.engineering.total,
            science: e.science?.total ?? 0,
            verdict: e.verdict.kind,
          },
        ]
      : [],
  );
  const minScience = rules.minScienceEnabled ? rules.minScienceScore : null;
  const order = rankCandidates(candidates, minScience);
  const missing = evaluations.filter((e) => !e.ok).map((e) => e.siteId);
  return {
    sites: evaluations,
    bestId: bestCompromise(candidates, minScience),
    order: [...order, ...missing],
  };
}

/** Sites in the main comparison: every site except the sensitivity demo point. */
export function rankedSites(sites: SiteSummary[]): SiteSummary[] {
  return sites.filter((s) => s.purpose === null);
}
