/**
 * Tests for the final robustness pass (D53): science filter consistency, rule inputs and the
 * zero survival limit, landing days that fit the data, data-load failures, routes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RULES, RULE_LIMITS, type MissionRules } from '../config/scoring';
import { collectSiteData, DataError, loadSiteData, loadSites } from '../data/load';
import type { SiteData } from '../data/contract';
import { landingCensus } from './census';
import { evaluateSite, evaluateSites, isViableLanding, siteStatus } from './evaluate';
import { lastLandingDayMs } from './metrics';
import { earliestViableSite } from './nextViable';
import { site, START } from './testFixtures';
import { visibilitySeries } from './visibility';
import { parseRuleInput } from '../ui/ruleInput';
import { parseRoute } from '../ui/route';
import { lonDisplay } from '../ui/format';
import { placeTip } from '../ui/tipPosition';

const DAY = 86_400_000;
const DURATION_H = 72;
const DAYS = 12;
const ALL = Array.from({ length: DAYS }, (_, d) => d);

// Far from permanent shadow (science ~7) and lit every day; close to it (science 100), lit
// from day 3 on.
const [far, farData] = site('far', DAYS, ALL, 14);
const [near, nearData] = site('near', DAYS, ALL.slice(3), 1);
const sites = [far, near];
const data = new Map([
  ['far', farData],
  ['near', nearData],
]);
const vis = new Map([...data].map(([id, d]) => [id, visibilitySeries(d)]));
const visOf = (id: string) => {
  const v = vis.get(id);
  if (!v) throw new Error(`no visibility for ${id}`);
  return v;
};
const FILTER: MissionRules = { ...DEFAULT_RULES, minScienceEnabled: true, minScienceScore: 50 };

describe('science filter never shows a filtered site as viable (item 1)', () => {
  it('marks the site below the science minimum and leaves it out of the best site', () => {
    const ev = evaluateSites(sites, data, vis, START, DURATION_H, FILTER);
    const f = ev.sites.find((e) => e.siteId === 'far');
    expect(f?.ok && f.verdict.kind).toBe('viable');
    expect(f?.ok && siteStatus(f)).toBe('below-science');
    expect(f && isViableLanding(f)).toBe(false);
    expect(ev.bestId).toBeNull();
  });

  it('is left out of the earliest viable landing and the viable-day census', () => {
    const off = earliestViableSite(sites, data, vis, START, DURATION_H, DEFAULT_RULES);
    expect(off?.siteId).toBe('far');
    const on = earliestViableSite(sites, data, vis, START, DURATION_H, FILTER);
    expect(on?.siteId).toBe('near');
    expect(on?.window.startMs).toBe(START + 3 * DAY);
    const census = landingCensus(sites, data, vis, DURATION_H, FILTER);
    expect(census.perSite.get('far')?.viable).toBe(0);
    expect(census.perSite.get('far')?.belowScience).toBeGreaterThan(0);
    expect(census.noViableDays).toBe(3);
  });

  it('keeps "not viable" when the engineering rules fail', () => {
    const e = evaluateSite(near, nearData, visOf('near'), START, DURATION_H, {
      ...FILTER,
      minScienceScore: 101,
    });
    expect(e.ok && siteStatus(e)).toBe('not-viable');
  });
});

describe('mission rule inputs (item 2)', () => {
  it('rejects empty, text, negative and out-of-range values (the last value is kept)', () => {
    const p = RULE_LIMITS.percent;
    expect(parseRuleInput('', p)).toBeNull();
    expect(parseRuleInput('abc', p)).toBeNull();
    expect(parseRuleInput('-5', p)).toBeNull();
    expect(parseRuleInput('99999', p)).toBeNull();
    expect(parseRuleInput('70', p)).toBe(70);
    expect(parseRuleInput('2,26', RULE_LIMITS.maxSlopeDeg)).toBe(2.5);
    expect(parseRuleInput('721', RULE_LIMITS.survivalDarknessHours)).toBeNull();
  });

  it('reads a zero survival limit as "no darkness allowed"', () => {
    const zero = { ...DEFAULT_RULES, survivalDarknessHours: 0 };
    const lit = evaluateSite(near, nearData, visOf('near'), START + 3 * DAY, DURATION_H, zero);
    expect(lit.ok && lit.verdict.kind).toBe('viable');
    const [dark, darkData] = site('dark', DAYS, [0, 2, 3, 4], 1);
    const e = evaluateSite(dark, darkData, visibilitySeries(darkData), START, DURATION_H, {
      ...zero,
      requireSunAtLanding: false,
    });
    expect(e.ok && e.verdict.reason.key).toBe('reason.noDarkness');
  });
});

describe('landing days that fit the data (item 3)', () => {
  it('gives the last day whose whole mission is inside the data', () => {
    const last = lastLandingDayMs(farData.meta, DURATION_H);
    expect(last).toBe(START + (DAYS - DURATION_H / 24) * DAY);
    const fv = visOf('far');
    expect(evaluateSite(far, farData, fv, last, DURATION_H).ok).toBe(true);
    expect(evaluateSite(far, farData, fv, last + DAY, DURATION_H).ok).toBe(false);
  });
});

describe('data load failures (item 4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tells a network failure from a file outside the contract', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    await expect(loadSites()).rejects.toMatchObject({
      problems: [{ kind: 'network', file: 'sites.json', status: null }],
    });
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })));
    await expect(loadSites()).rejects.toMatchObject({
      problems: [{ kind: 'network', status: 404 }],
    });
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{oops', { status: 200 })));
    await expect(loadSiteData('far')).rejects.toMatchObject({
      problems: [{ kind: 'contract', file: 'sites/far.json' }],
    });
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{}', { status: 200 })));
    await expect(loadSites()).rejects.toBeInstanceOf(DataError);
  });

  it('keeps the other sites when one site file fails', () => {
    const results: PromiseSettledResult<SiteData>[] = [
      { status: 'fulfilled', value: farData },
      {
        status: 'rejected',
        reason: new DataError([{ kind: 'network', file: 'sites/near.json', status: 500 }]),
      },
    ];
    const { data: ok, unavailable } = collectSiteData(['far', 'near'], results);
    expect([...ok.keys()]).toEqual(['far']);
    expect(unavailable.get('near')?.[0]).toMatchObject({ kind: 'network', status: 500 });
  });
});

describe('routes (item 5)', () => {
  it('maps known addresses and sends anything else to "not found"', () => {
    expect(parseRoute('')).toEqual({ name: 'intro' });
    expect(parseRoute('#/')).toEqual({ name: 'intro' });
    expect(parseRoute('#/mission')).toEqual({ name: 'mission' });
    expect(parseRoute('#/roadmap')).toEqual({ name: 'roadmap' });
    expect(parseRoute('#/site/haworth')).toEqual({ name: 'site', id: 'haworth' });
    for (const bad of ['#/nope', '#/site/', '#/mission/extra', '#/ROADMAP', '#/site/a/b']) {
      expect(parseRoute(bad)).toEqual({ name: 'notFound' });
    }
  });
});

describe('display helpers (items 6, 7)', () => {
  it('keeps a tip inside the window and flips it above when there is no room below', () => {
    const vw = { w: 1366, h: 768 };
    const nearRight = placeTip(
      { left: 1350, right: 1360, top: 100, bottom: 116 },
      { w: 340, h: 80 },
      vw,
    );
    expect(nearRight.left + 340).toBeLessThanOrEqual(1366 - 8);
    const nearBottom = placeTip(
      { left: 10, right: 20, top: 740, bottom: 756 },
      { w: 200, h: 80 },
      vw,
    );
    expect(nearBottom.top + 80).toBeLessThanOrEqual(740);
  });

  it('shows longitudes from 0 to 180 with East or West', () => {
    expect(lonDisplay(-162.937)).toEqual({ deg: 162.937, east: false });
    expect(lonDisplay(2.055)).toEqual({ deg: 2.055, east: true });
    expect(lonDisplay(200)).toEqual({ deg: 160, east: false });
    expect(lonDisplay(180)).toEqual({ deg: 180, east: true });
  });
});
