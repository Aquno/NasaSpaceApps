/**
 * What: Stage 6 comparison: share of the data year's hours with some part of the Sun / the Earth
 *   visible above the terrain horizon, from the same visibility series as the dashboard (D9),
 *   to set beside NASA's average illumination and Earth visibility (PGDA product 69).
 * Roadmap stage: 6 — Validation (see docs/ROTEIRO.md); decision D45.
 * Inputs: VisibilitySeries of one site (hourly flags over the whole data interval).
 * Outputs: percentages 0-100 and the number of hours used.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app; reference values from
 *   PGDA product 69 (sites.json).
 */
import { countOn } from './metrics';
import type { VisibilitySeries } from './visibility';

const PERCENT = 100;

export interface YearVisibility {
  hours: number;
  sunPct: number;
  earthPct: number;
}

/** Percent of all records with any part of the Sun / the Earth visible. */
export function yearVisibility(vis: Pick<VisibilitySeries, 'sunAny' | 'earthAny'>): YearVisibility {
  const hours = vis.sunAny.length;
  if (hours === 0) return { hours: 0, sunPct: 0, earthPct: 0 };
  return {
    hours,
    sunPct: (countOn(vis.sunAny, 0, hours) / hours) * PERCENT,
    earthPct: (countOn(vis.earthAny, 0, vis.earthAny.length) / vis.earthAny.length) * PERCENT,
  };
}
