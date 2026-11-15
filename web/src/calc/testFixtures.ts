/**
 * What: Synthetic site fixtures shared by the calc tests (not used by the app).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteData, SiteSummary } from '../data/contract';

const HOUR = 3_600_000;
export const START = Date.parse('2027-01-01T00:00:00Z');

/** Site whose Sun is up only on days in `litDays` (Earth always up). */
export function site(
  id: string,
  days: number,
  litDays: number[],
  psrKm = 1,
): [SiteSummary, SiteData] {
  const n = days * 24;
  const sunEl = new Float64Array(n).fill(-5);
  for (const d of litDays) sunEl.fill(2, d * 24, d * 24 + 24);
  const col = (v: number) => new Float64Array(n).fill(v);
  const summary: SiteSummary = {
    id,
    name: id,
    lat: -89,
    lon: 0,
    description: '',
    sourceType: 'derived_point',
    purpose: null,
    terrainHeightM: 0,
    terrainSlopeDeg: 1,
    observerHeightM: 2,
    psrDistanceKm: psrKm,
    psrAreaKm2: 1,
    psrName: 'x',
    nasaAvgIlluminationPct: null,
    nasaAvgEarthVisibilityPct: null,
  };
  const data: SiteData = {
    horizon: new Float64Array(360),
    horizonObstacleKm: new Float64Array(360),
    horizonCutKm: new Float64Array(360).fill(Number.NaN),
    series: {
      sunAz: col(10),
      sunEl,
      sunDiam: col(0.5),
      earthAz: col(20),
      earthEl: col(5),
      earthDiam: col(1.9),
    },
    meta: {
      contractVersion: 3,
      siteId: id,
      sources: [],
      demResolutionM: 20,
      horizonBands: [],
      horizonMethod: 'lola',
      terrainHeightM: 0,
      mastHeightM: 2,
      observerHeightM: 2,
      startMs: START,
      endMs: START + (n - 1) * HOUR,
      stepMinutes: 60,
      count: n,
      sample: false,
      generatedAt: '2026-11-14',
    },
  };
  return [summary, data];
}
