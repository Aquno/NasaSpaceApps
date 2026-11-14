/**
 * What: Mission inputs (planned landing, duration, delay, rules) and the derived evaluations
 *   (now and with no delay, for the scatter trail). Derivations call the calc module only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: loaded data (sites, SiteData).
 * Outputs: inputs, setters and memoised evaluations.
 * NASA data source: data/app (JPL Horizons, PGDA products 69/90).
 */
import { useMemo, useState } from 'react';
import { dailyFractions, type DailyFractions } from '../calc/annual';
import { evaluateSites, rankedSites, type Evaluation } from '../calc/evaluate';
import {
  earliestViableSite,
  nextViableWindow,
  type EarliestViable,
  type ViableWindow,
} from '../calc/nextViable';
import { visibilitySeries, type VisibilitySeries } from '../calc/visibility';
import {
  DEFAULT_LANDING_ISO,
  DEFAULT_MISSION_DURATION_H,
  DEFAULT_RULES,
  type MissionRules,
} from '../config/scoring';
import type { SiteData, SiteSummary } from '../data/contract';

export const DAY_MS = 86_400_000;

export interface MissionInputs {
  plannedMs: number;
  durationH: number;
  delayDays: number;
  rules: MissionRules;
}

export function useMissionInputs() {
  const [inputs, setInputs] = useState<MissionInputs>({
    plannedMs: Date.parse(DEFAULT_LANDING_ISO),
    durationH: DEFAULT_MISSION_DURATION_H,
    delayDays: 0,
    rules: DEFAULT_RULES,
  });
  const update = (patch: Partial<MissionInputs>) => setInputs((s) => ({ ...s, ...patch }));
  return { inputs, update };
}

export interface Derived {
  ranked: SiteSummary[];
  vis: Map<string, VisibilitySeries>;
  daily: Map<string, DailyFractions>;
  landingMs: number;
  now: Evaluation;
  planned: Evaluation;
  /** Next viable landing for sites that are not viable now (null: none before the data end). */
  next: Map<string, ViableWindow | null>;
  /** Earliest viable site from the (delayed) landing date. */
  earliest: EarliestViable | null;
}

/** Visibility and daily fractions are computed once per data set. */
export function usePrecomputed(sites: SiteSummary[], data: Map<string, SiteData>) {
  return useMemo(() => {
    const vis = new Map<string, VisibilitySeries>();
    const daily = new Map<string, DailyFractions>();
    for (const s of sites) {
      const d = data.get(s.id);
      if (!d) continue;
      const v = visibilitySeries(d);
      vis.set(s.id, v);
      daily.set(s.id, dailyFractions(v, d.meta));
    }
    return { vis, daily, ranked: rankedSites(sites) };
  }, [sites, data]);
}

export function useEvaluations(
  pre: ReturnType<typeof usePrecomputed>,
  data: Map<string, SiteData>,
  inputs: MissionInputs,
): Derived {
  const landingMs = inputs.plannedMs + inputs.delayDays * DAY_MS;
  const now = useMemo(
    () => evaluateSites(pre.ranked, data, pre.vis, landingMs, inputs.durationH, inputs.rules),
    [pre, data, landingMs, inputs.durationH, inputs.rules],
  );
  const planned = useMemo(
    () =>
      evaluateSites(pre.ranked, data, pre.vis, inputs.plannedMs, inputs.durationH, inputs.rules),
    [pre, data, inputs.plannedMs, inputs.durationH, inputs.rules],
  );
  const next = useMemo(() => {
    const out = new Map<string, ViableWindow | null>();
    for (const e of now.sites) {
      const site = pre.ranked.find((s) => s.id === e.siteId);
      const d = data.get(e.siteId);
      const v = pre.vis.get(e.siteId);
      if (!site || !d || !v || (e.ok && e.verdict.kind === 'viable')) continue;
      out.set(e.siteId, nextViableWindow(site, d, v, landingMs, inputs.durationH, inputs.rules));
    }
    return out;
  }, [now, pre, data, landingMs, inputs.durationH, inputs.rules]);
  const earliest = useMemo(
    () => earliestViableSite(pre.ranked, data, pre.vis, landingMs, inputs.durationH, inputs.rules),
    [pre, data, landingMs, inputs.durationH, inputs.rules],
  );
  return { ...pre, landingMs, now, planned, next, earliest };
}
