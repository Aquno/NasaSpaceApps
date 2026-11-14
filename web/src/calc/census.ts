/**
 * What: Landing-day census over the data year: for each site, how many landing days (one per
 *   day, at the data start time of day) give each verdict, and on how many days no site is
 *   viable. Pure function built on evaluateSite (single calc path, D9).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: sites, SiteData and VisibilitySeries per site, mission duration (h), rules.
 * Outputs: LandingCensus (counts of days).
 * NASA data source: Horizons ephemerides, LOLA horizon and PSRs via data/app.
 */
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';
import type { SiteData, SiteSummary } from '../data/contract';
import { evaluateSite } from './evaluate';
import type { VerdictKind } from './scores';
import type { VisibilitySeries } from './visibility';

const DAY_MS = 86_400_000;

export interface LandingCensus {
  /** Landing days whose whole mission fits in the data. */
  daysInData: number;
  perSite: Map<string, Record<VerdictKind, number>>;
  /** Landing days on which no site is viable. */
  noViableDays: number;
}

export function landingCensus(
  sites: SiteSummary[],
  data: Map<string, SiteData>,
  vis: Map<string, VisibilitySeries>,
  durationH: number,
  rules: MissionRules = DEFAULT_RULES,
): LandingCensus {
  const perSite = new Map<string, Record<VerdictKind, number>>();
  for (const s of sites) perSite.set(s.id, { viable: 0, marginal: 0, 'not-viable': 0 });
  const meta = data.values().next().value?.meta;
  if (!meta) return { daysInData: 0, perSite, noViableDays: 0 };
  let daysInData = 0;
  let noViableDays = 0;
  for (
    let t = meta.startMs;
    t + durationH * 3_600_000 <= meta.endMs + meta.stepMinutes * 60_000;
    t += DAY_MS
  ) {
    daysInData++;
    let anyViable = false;
    for (const s of sites) {
      const d = data.get(s.id);
      const v = vis.get(s.id);
      const counts = perSite.get(s.id);
      if (!d || !v || !counts) continue;
      const e = evaluateSite(s, d, v, t, durationH, rules);
      if (!e.ok) continue;
      counts[e.verdict.kind]++;
      if (e.verdict.kind === 'viable') anyViable = true;
    }
    if (!anyViable) noViableDays++;
  }
  return { daysInData, perSite, noViableDays };
}
