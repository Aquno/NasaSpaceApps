import { describe, expect, it } from 'vitest';
import type { SiteData, SiteSummary } from '../data/contract';
import { delayChangeDays } from './census';
import { evaluateSite } from './evaluate';
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

describe('landing hour within the day (D36)', () => {
  it('uses the first hour of the day that meets the landing rules', () => {
    // Sun up from hour 5 of day 0 through day 3.
    const [s, d] = site('h', 6, []);
    d.series.sunEl.fill(2, 5, 4 * 24);
    const v = visibilitySeries(d);
    const e = evaluateSite(s, d, v, START, 48);
    expect(e.ok && e.landingMs).toBe(START + 5 * HOUR);
    expect(e.ok && e.landingHourFound).toBe(true);
    expect(e.ok && e.verdict.kind).toBe('viable');
  });
  it('not viable when no hour of the day meets them', () => {
    const [s, d] = site('n', 6, []);
    const e = evaluateSite(s, d, visibilitySeries(d), START, 48);
    expect(e.ok && e.landingHourFound).toBe(false);
    expect(e.ok && e.verdict.kind).toBe('not-viable');
  });
});

describe('delay change days', () => {
  // Lit on days 0-9 only: a 3-day mission landing on days 0-7 is viable, later it is not.
  const [s, d] = site('a', 30, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const data = new Map([[s.id, d]]);
  const vis = new Map([[s.id, visibilitySeries(d)]]);
  it('no delay changes nothing', () => {
    expect(delayChangeDays([s], data, vis, 72, 0).changed).toBe(0);
  });
  it('a delay that moves the landing out of the lit days changes the best site', () => {
    const r = delayChangeDays([s], data, vis, 72, 10);
    expect(r.changed).toBeGreaterThan(0);
    expect(r.changed).toBeLessThanOrEqual(r.compared);
    // One site only: every change is to or from "no site".
    expect(r.siteToSite).toBe(0);
  });
});
