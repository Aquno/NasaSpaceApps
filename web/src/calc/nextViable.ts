/**
 * What: Next viable landing for a site from a given date (same rules, same duration), the length
 *   of that window of viable landing dates, and the earliest viable site among several.
 *   Pure functions built on evaluateSite (the single calc path, D9).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: SiteSummary, SiteData, VisibilitySeries, start time (ms UTC), duration (h), rules.
 * Outputs: { startMs, windowDays } or null when no viable landing exists before the data end.
 * NASA data source: Horizons ephemerides, LOLA horizon and PSRs via data/app.
 *
 * Landing dates are tried every LANDING_STEP_MS (one day) at the same time of day as the input.
 */
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';
import type { SiteData, SiteSummary } from '../data/contract';
import { evaluateSite, isViableLanding } from './evaluate';
import type { VisibilitySeries } from './visibility';

export const LANDING_STEP_MS = 86_400_000;

export interface ViableWindow {
  /** First viable landing time at or after the start, ms UTC. */
  startMs: number;
  /** Number of consecutive viable landing days from startMs. */
  windowDays: number;
}

const isViable = (
  site: SiteSummary,
  data: SiteData,
  vis: VisibilitySeries,
  t: number,
  durationH: number,
  rules: MissionRules,
) => {
  return isViableLanding(evaluateSite(site, data, vis, t, durationH, rules));
};

/** Next viable landing at or after `fromMs` and how many consecutive days stay viable. */
export function nextViableWindow(
  site: SiteSummary,
  data: SiteData,
  vis: VisibilitySeries,
  fromMs: number,
  durationH: number,
  rules: MissionRules = DEFAULT_RULES,
): ViableWindow | null {
  const lastLanding = data.meta.endMs - durationH * 3_600_000 + data.meta.stepMinutes * 60_000;
  let t = fromMs;
  while (t <= lastLanding && !isViable(site, data, vis, t, durationH, rules)) t += LANDING_STEP_MS;
  if (t > lastLanding) return null;
  const startMs = t;
  let days = 0;
  while (t <= lastLanding && isViable(site, data, vis, t, durationH, rules)) {
    days++;
    t += LANDING_STEP_MS;
  }
  return { startMs, windowDays: days };
}

export interface EarliestViable {
  siteId: string;
  window: ViableWindow;
}

/** Site with the earliest next viable landing (ties: order of `sites`). Null if none. */
export function earliestViableSite(
  sites: SiteSummary[],
  data: Map<string, SiteData>,
  vis: Map<string, VisibilitySeries>,
  fromMs: number,
  durationH: number,
  rules: MissionRules = DEFAULT_RULES,
): EarliestViable | null {
  let best: EarliestViable | null = null;
  for (const s of sites) {
    const d = data.get(s.id);
    const v = vis.get(s.id);
    if (!d || !v) continue;
    const w = nextViableWindow(s, d, v, fromMs, durationH, rules);
    if (w && (!best || w.startMs < best.window.startMs)) best = { siteId: s.id, window: w };
  }
  return best;
}
