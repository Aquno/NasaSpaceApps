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
import { evaluateSite, evaluateSites, isViableLanding, siteStatus } from './evaluate';
import type { VerdictKind } from './scores';
import type { VisibilitySeries } from './visibility';

const DAY_MS = 86_400_000;

export interface LandingCensus {
  /** Landing days whose whole mission fits in the data. */
  daysInData: number;
  /** Days per verdict; `belowScience` counts days excluded by the science filter (D53). */
  perSite: Map<string, Record<VerdictKind | 'belowScience', number>>;
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
  const perSite = new Map<string, Record<VerdictKind | 'belowScience', number>>();
  for (const s of sites) {
    perSite.set(s.id, { viable: 0, marginal: 0, 'not-viable': 0, belowScience: 0 });
  }
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
      counts[siteStatus(e) === 'below-science' ? 'belowScience' : e.verdict.kind]++;
      if (isViableLanding(e)) anyViable = true;
    }
    if (!anyViable) noViableDays++;
  }
  return { daysInData, perSite, noViableDays };
}

/**
 * Landing days on which a launch delay changes the best compromise (from one site to another,
 * or to or from "no site"). Only days whose two missions (planned and delayed) fit in the data
 * are compared. Same calc path as the dashboard (evaluateSites, D9).
 * @param delayDays delay in whole days
 * @returns compared: landing days compared; changed: days whose best compromise differs;
 *   siteToSite: days where it moves from one site to a different site (both exist)
 */
export function delayChangeDays(
  sites: SiteSummary[],
  data: Map<string, SiteData>,
  vis: Map<string, VisibilitySeries>,
  durationH: number,
  delayDays: number,
  rules: MissionRules = DEFAULT_RULES,
): { compared: number; changed: number; siteToSite: number } {
  const meta = data.values().next().value?.meta;
  if (!meta) return { compared: 0, changed: 0, siteToSite: 0 };
  const best: (string | null | undefined)[] = [];
  for (let t = meta.startMs; t <= meta.endMs; t += DAY_MS) {
    const ev = evaluateSites(sites, data, vis, t, durationH, rules);
    // undefined: the mission does not fit in the data.
    best.push(ev.sites.every((s) => s.ok) ? ev.bestId : undefined);
  }
  let compared = 0;
  let changed = 0;
  let siteToSite = 0;
  for (let k = 0; k + delayDays < best.length; k++) {
    const b0 = best[k];
    const b1 = best[k + delayDays];
    if (b0 === undefined || b1 === undefined) continue;
    compared++;
    if (b0 !== b1) changed++;
    if (b0 !== b1 && b0 !== null && b1 !== null) siteToSite++;
  }
  return { compared, changed, siteToSite };
}
