import { describe, expect, it } from 'vitest';
import type { SiteData } from '../data/contract';
import {
  countOn,
  longestOffRun,
  missionMetrics,
  missionWindow,
  recordsToNextRise,
  recordsToNextSet,
  runFrom,
} from './metrics';
import { DEFAULT_RULES } from '../config/scoring';
import { en } from '../i18n/en';
import { ptBR } from '../i18n/ptBR';
import { createTranslator } from '../i18n/translate';
import { linkStatus } from './communication';
import { bestCompromise, engineeringScore, scienceScore, verdict } from './scores';
import {
  azimuthBin,
  clearanceDeg,
  horizonAt,
  isAnyPartVisible,
  isFullyVisible,
  visibilitySeries,
} from './visibility';

const EN = createTranslator(en, 'en');
const PT = createTranslator(ptBR, 'pt-BR');
const flat = (h: number) => new Float64Array(360).fill(h);
const flags = (s: string) => Uint8Array.from(s.split('').map(Number));

describe('visibility rule', () => {
  it('rounds azimuth to the whole degree (D19) and wraps', () => {
    expect([azimuthBin(0.49), azimuthBin(0.5), azimuthBin(359.6), azimuthBin(-0.2)]).toEqual([
      0, 1, 0, 0,
    ]);
    const h = flat(0);
    h[90] = 5;
    expect(horizonAt(h, 89.6)).toBe(5);
    expect(horizonAt(h, 89.4)).toBe(0);
  });
  it('any part vs full disc', () => {
    const h = flat(1);
    // Disc of 0.5 deg centred 0.9 deg: top 1.15 > 1 (some part), bottom 0.65 < 1 (not full).
    expect(isAnyPartVisible(h, 10, 0.9, 0.5)).toBe(true);
    expect(isFullyVisible(h, 10, 0.9, 0.5)).toBe(false);
    expect(isFullyVisible(h, 10, 1.3, 0.5)).toBe(true);
    expect(isAnyPartVisible(h, 10, 0.7, 0.5)).toBe(false);
  });
  it('negative horizon is not clamped', () => {
    const h = flat(-2);
    expect(isAnyPartVisible(h, 0, -1, 0.5)).toBe(true);
  });
});

describe('run helpers', () => {
  it('count, runs, gaps', () => {
    const f = flags('1100011101');
    expect(countOn(f, 0, 10)).toBe(6);
    expect(runFrom(f, 0, 10)).toBe(2);
    expect(runFrom(f, 2, 10)).toBe(0);
    expect(longestOffRun(f, 0, 10)).toBe(3);
  });
  it('next set and rise', () => {
    const f = flags('0011100111');
    expect(recordsToNextSet(f, 0)).toBe(5); // rises at 2, sets at 5
    expect(recordsToNextSet(f, 3)).toBe(2);
    expect(recordsToNextSet(f, 8)).toBeNull(); // still up when data ends
    expect(recordsToNextRise(f, 3)).toBe(4);
  });
});

function synthetic(sunEl: number[], earthEl: number[]): SiteData {
  const n = sunEl.length;
  const col = (v: number) => new Float64Array(n).fill(v);
  return {
    horizon: flat(0),
    horizonObstacleKm: flat(1),
    horizonCutKm: new Float64Array(360).fill(Number.NaN),
    series: {
      sunAz: col(10),
      sunEl: Float64Array.from(sunEl),
      sunDiam: col(0.5),
      earthAz: col(20),
      earthEl: Float64Array.from(earthEl),
      earthDiam: col(1.9),
    },
    meta: {
      contractVersion: 2,
      siteId: 'x',
      sources: [],
      demResolutionM: 20,
      horizonBands: [],
      horizonMethod: 'lola',
      terrainHeightM: 0,
      mastHeightM: 2,
      observerHeightM: 2,
      startMs: Date.parse('2027-01-01T00:00:00Z'),
      endMs: Date.parse('2027-01-01T00:00:00Z') + (n - 1) * 3600_000,
      stepMinutes: 60,
      count: n,
      sample: false,
      generatedAt: '2026-11-14',
    },
  };
}

describe('mission metrics', () => {
  // 10 hours: Sun up for the first 6, Earth up except hours 2-4.
  const data = synthetic([1, 1, 1, 1, 1, 1, -1, -1, -1, -1], [1, 1, -2, -2, -2, 1, 1, 1, 1, 1]);
  const vis = visibilitySeries(data);
  it('window refuses missions beyond the data', () => {
    expect(missionWindow(data.meta, data.meta.startMs, 10).ok).toBe(true);
    const late = missionWindow(data.meta, data.meta.startMs + 3600_000, 10);
    expect(late.ok === false && late.reason).toBe('after-data');
  });
  it('known values', () => {
    const w = missionWindow(data.meta, data.meta.startMs, 10);
    if (!w.ok) throw new Error('window');
    const m = missionMetrics(data, vis, w.window);
    expect(m.sunHours).toBe(6);
    expect(m.sunHoursFromLanding).toBe(6);
    expect(m.sunFraction).toBeCloseTo(0.6);
    expect(m.earthFraction).toBeCloseTo(0.7);
    expect(m.longestNoContactHours).toBe(3);
    expect(m.hoursToNextSunset).toBe(6);
    expect(m.sunElMaxDeg).toBe(1);
    expect(m.sunElMeanDeg).toBeCloseTo(0.2);
  });
});

describe('scores', () => {
  const base = {
    durationHours: 100,
    sunHours: 80,
    sunHoursFull: 70,
    sunFraction: 0.8,
    sunHoursFromLanding: 50,
    sunElMeanDeg: 1,
    sunElMaxDeg: 2,
    earthHours: 60,
    earthHoursFull: 50,
    earthFraction: 0.6,
    longestNoContactHours: 20,
    hoursToNextSunset: 50,
    hoursToNextEarthSet: 10,
    sunVisibleAtLanding: true,
    earthVisibleAtLanding: true,
    longestDarkHours: 10,
  };
  it('engineering = weighted sum', () => {
    const s = engineeringScore(base);
    // 0.35*0.8 + 0.25*0.5 + 0.25*0.6 + 0.15*0.8 = 0.675
    expect(s.total).toBeCloseTo(67.5);
    expect(s.parts.map((p) => p.key)).toEqual([
      'sunlight',
      'sunlightFromLanding',
      'earthContact',
      'contactGaps',
    ]);
  });
  it('science: 100 within 1 km, 0 at 15 km, linear between', () => {
    expect(scienceScore(0.5)?.total).toBeCloseTo(100);
    expect(scienceScore(8)?.total).toBeCloseTo(50);
    expect(scienceScore(20)?.total).toBeCloseTo(0);
    expect(scienceScore(null)).toBeNull();
  });
  const check = (m: typeof base, km = 2, rules = DEFAULT_RULES) =>
    verdict(m, engineeringScore(m), scienceScore(km), km, rules);

  it('viable when every rule passes', () => {
    expect(check(base)).toMatchObject({ kind: 'viable', rule: 'allPassed' });
  });
  it('hard rule: Sun visible at landing', () => {
    const v = check({ ...base, sunVisibleAtLanding: false, sunHoursFromLanding: 0 });
    expect(v).toMatchObject({ kind: 'not-viable', rule: 'sunAtLanding' });
    expect(v.reason).toEqual({ key: 'reason.darkAtLanding' });
    expect(EN.msg(v.reason)).toContain('Sun behind the terrain at landing');
  });
  it('a short sunset does not make a well-lit site not viable (old 24 h rule removed)', () => {
    // 95% sunlit, Sun sets 16 h after landing for 5 h: below the 24 h survival limit.
    const v = check({ ...base, sunFraction: 0.95, sunHoursFromLanding: 16, longestDarkHours: 5 });
    expect(v.kind).not.toBe('not-viable');
  });
  it('hard rule: survival darkness, reason cites rule and measured value', () => {
    const v = check({ ...base, longestDarkHours: 30 });
    expect(v).toMatchObject({ kind: 'not-viable', rule: 'survivalDarkness' });
    expect(v.reason).toEqual({ key: 'reason.survivalDarkness', params: { h: 30, limit: 24 } });
    expect(EN.msg(v.reason)).toBe('Longest darkness 30 h exceeds the 24 h survival limit.');
    expect(PT.msg(v.reason)).toBe(
      'A maior escuridão, 30 h, passa do limite de sobrevivência de 24 h.',
    );
  });
  it('hard rule: minimum sunlit fraction', () => {
    const v = check({ ...base, sunFraction: 0.4 });
    expect(v).toMatchObject({ kind: 'not-viable', rule: 'minSunFraction' });
    expect(EN.msg(v.reason)).toContain('Only 40%');
  });
  it('marginal: sunlight between minimum and comfort level', () => {
    expect(check({ ...base, sunFraction: 0.6 })).toMatchObject({
      kind: 'marginal',
      rule: 'marginalSunFraction',
    });
  });
  it('marginal: weak Earth contact lowers engineering', () => {
    const weak = { ...base, earthFraction: 0.05, longestNoContactHours: 90 };
    expect(check(weak)).toMatchObject({ kind: 'marginal', rule: 'engineering' });
  });
  it('science never fails or lowers a site (D32): far from permanent shadow is still viable', () => {
    expect(check(base, 14)).toMatchObject({ kind: 'viable', rule: 'allPassed' });
    expect(check(base, 50)).toMatchObject({ kind: 'viable', rule: 'allPassed' });
  });
  it('optional science filter only affects the best compromise', () => {
    const c = [
      { id: 'near', engineering: 60, science: 90, verdict: 'viable' as const },
      { id: 'far', engineering: 95, science: 30, verdict: 'viable' as const },
    ];
    expect(bestCompromise(c)).toBe('near');
    expect(bestCompromise(c, 95)).toBeNull();
    const far = c.filter((x) => x.id === 'far');
    expect(bestCompromise(far, null)).toBe('far');
    expect(bestCompromise(far, 40)).toBeNull();
  });
  it('slope above the limit lowers the verdict by one level and cites the value', () => {
    const v = verdict(base, engineeringScore(base), scienceScore(2), 2, DEFAULT_RULES, 12.3);
    expect(v).toMatchObject({ kind: 'marginal', rule: 'slope' });
    expect(EN.msg(v.reason)).toBe(
      'Terrain slope 12.3° exceeds the 10.0° limit (would otherwise be Viable).',
    );
    expect(PT.msg(v.reason)).toBe(
      'Inclinação do terreno 12,3° acima do limite de 10,0° (sem isso seria Viável).',
    );
    const marginal = { ...base, sunFraction: 0.6 };
    expect(
      verdict(marginal, engineeringScore(marginal), scienceScore(2), 2, DEFAULT_RULES, 31).kind,
    ).toBe('not-viable');
    expect(verdict(base, engineeringScore(base), scienceScore(2), 2, DEFAULT_RULES, 9.9).kind).toBe(
      'viable',
    );
  });
  it('rules are adjustable', () => {
    const lenient = { ...DEFAULT_RULES, survivalDarknessHours: 48 };
    expect(check({ ...base, longestDarkHours: 30 }, 2, lenient).kind).toBe('viable');
  });
  it('best compromise = highest min(eng, sci), ignoring not-viable', () => {
    expect(
      bestCompromise([
        { id: 'a', engineering: 90, science: 30, verdict: 'marginal' },
        { id: 'b', engineering: 60, science: 55, verdict: 'viable' },
        { id: 'c', engineering: 95, science: 95, verdict: 'not-viable' },
      ]),
    ).toBe('b');
    expect(
      bestCompromise([{ id: 'c', engineering: 1, science: 1, verdict: 'not-viable' }]),
    ).toBeNull();
  });
});

describe('direct link status (D37)', () => {
  it('continuous, gaps, low', () => {
    expect(linkStatus({ earthFraction: 1, longestNoContactHours: 0 }).kind).toBe('continuous');
    expect(linkStatus({ earthFraction: 0.86, longestNoContactHours: 9 })).toEqual({
      kind: 'gaps',
      fraction: 0.86,
      longestGapHours: 9,
    });
    expect(linkStatus({ earthFraction: 0.3, longestNoContactHours: 120 }).kind).toBe('low');
  });
});

describe('clearanceDeg (D52)', () => {
  it('gives the disc centre height above the terrain in its direction', () => {
    const horizon = new Array<number>(360).fill(-0.9);
    expect(clearanceDeg(horizon, 120.4, -0.4)).toBeCloseTo(0.5, 9);
    expect(clearanceDeg(horizon, 120.4, -1.2)).toBeCloseTo(-0.3, 9);
  });
});
