import { describe, expect, it } from 'vitest';
import type { SiteData, SiteSummary } from '../data/contract';
import { earliestViableSite, nextViableWindow } from './nextViable';
import { visibilitySeries } from './visibility';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const START = Date.parse('2027-01-01T00:00:00Z');

/** Site whose Sun is up only on days in `litDays` (Earth always up). */
function site(id: string, days: number, litDays: number[], psrKm = 1): [SiteSummary, SiteData] {
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

describe('next viable landing', () => {
  // 20 days of data; Sun up on days 5-9 only. A 2-day mission is viable landing on days 5-8.
  const [s, d] = site('a', 20, [5, 6, 7, 8, 9]);
  const v = visibilitySeries(d);
  it('finds the first viable day and the window length', () => {
    expect(nextViableWindow(s, d, v, START, 48)).toEqual({
      startMs: START + 5 * DAY,
      windowDays: 4,
    });
  });
  it('is the same day when already viable', () => {
    expect(nextViableWindow(s, d, v, START + 6 * DAY, 48)?.startMs).toBe(START + 6 * DAY);
  });
  it('null when nothing is viable before the data end', () => {
    expect(nextViableWindow(s, d, v, START + 10 * DAY, 48)).toBeNull();
  });
  it('earliest viable site across sites', () => {
    const [s2, d2] = site('b', 20, [3, 4, 5]);
    const data = new Map([
      ['a', d],
      ['b', d2],
    ]);
    const vis = new Map([
      ['a', v],
      ['b', visibilitySeries(d2)],
    ]);
    expect(earliestViableSite([s, s2], data, vis, START, 48)).toEqual({
      siteId: 'b',
      window: { startMs: START + 3 * DAY, windowDays: 2 },
    });
  });
});
