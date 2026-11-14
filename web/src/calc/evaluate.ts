/**
 * What: Evaluate every site for a landing time and mission duration: metrics, scores, verdict,
 *   best compromise and display order. Pure function composing the calc modules.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: site summaries, SiteData and precomputed visibility per site, landing time (ms UTC),
 *   duration (hours).
 * Outputs: Evaluation per site (or the reason it cannot be computed) and the ranking.
 * NASA data source: Horizons ephemerides, LOLA horizon and PSRs via data/app.
 */
import type { SiteData, SiteSummary } from '../data/contract';
import { missionMetrics, missionWindow, type MissionMetrics, type WindowResult } from './metrics';
import {
  bestCompromise,
  engineeringScore,
  rankCandidates,
  scienceScore,
  verdict,
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
      verdict: Verdict;
    }
  | { ok: false; siteId: string; window: Extract<WindowResult, { ok: false }> };

export interface Evaluation {
  sites: SiteEvaluation[];
  bestId: string | null;
  order: string[];
}

export function evaluateSite(
  site: SiteSummary,
  data: SiteData,
  vis: VisibilitySeries,
  landingMs: number,
  durationHours: number,
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
    verdict: verdict(metrics, engineering, science, site.psrDistanceKm),
  };
}

/** Evaluate a set of sites (typically the five ranked ones) and rank them. */
export function evaluateSites(
  sites: SiteSummary[],
  data: Map<string, SiteData>,
  vis: Map<string, VisibilitySeries>,
  landingMs: number,
  durationHours: number,
): Evaluation {
  const evaluations: SiteEvaluation[] = [];
  for (const s of sites) {
    const d = data.get(s.id);
    const v = vis.get(s.id);
    if (d && v) evaluations.push(evaluateSite(s, d, v, landingMs, durationHours));
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
  const order = rankCandidates(candidates);
  const missing = evaluations.filter((e) => !e.ok).map((e) => e.siteId);
  return { sites: evaluations, bestId: bestCompromise(candidates), order: [...order, ...missing] };
}

/** Sites in the main comparison: every site except the sensitivity demo point. */
export function rankedSites(sites: SiteSummary[]): SiteSummary[] {
  return sites.filter((s) => s.purpose === null);
}
