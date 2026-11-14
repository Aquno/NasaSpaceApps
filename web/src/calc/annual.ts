/**
 * What: Daily fractions of hours with the Sun / the Earth visible, for the annual strips.
 *   Pure function over the visibility flags (same rule as everything else, D9/D24).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: VisibilitySeries (hourly flags) and the series meta (start, step, count).
 * Outputs: per day (UTC), fraction 0-1 of hours with some part of the Sun / Earth visible.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app.
 */
import type { SiteMeta } from '../data/contract';
import type { VisibilitySeries } from './visibility';

export interface DailyFractions {
  /** UTC midnight of day 0, ms. */
  firstDayMs: number;
  sun: Float32Array;
  earth: Float32Array;
}

const DAY_MS = 86_400_000;

export function dailyFractions(
  vis: VisibilitySeries,
  meta: Pick<SiteMeta, 'startMs' | 'stepMinutes' | 'count'>,
): DailyFractions {
  const perDay = Math.round(DAY_MS / (meta.stepMinutes * 60_000));
  const days = Math.ceil(meta.count / perDay);
  const sun = new Float32Array(days);
  const earth = new Float32Array(days);
  for (let d = 0; d < days; d++) {
    const start = d * perDay;
    const end = Math.min(start + perDay, meta.count);
    let s = 0;
    let e = 0;
    for (let i = start; i < end; i++) {
      s += vis.sunAny[i] as number;
      e += vis.earthAny[i] as number;
    }
    sun[d] = s / (end - start);
    earth[d] = e / (end - start);
  }
  return { firstDayMs: meta.startMs, sun, earth };
}
