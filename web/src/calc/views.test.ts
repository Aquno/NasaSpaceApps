import { describe, expect, it } from 'vitest';
import type { Terrain } from '../data/contract';
import { dailyFractions } from './annual';
import { hillshade, surfaceDistanceKm, toMapXY, toPixel } from './mapGeometry';
import { yearVisibility } from './validation';

describe('daily fractions', () => {
  it('fraction of lit hours per day', () => {
    const n = 48;
    const sunAny = new Uint8Array(n);
    sunAny.fill(1, 0, 12); // day 0: 12 of 24
    sunAny.fill(1, 24, 48); // day 1: all
    const vis = { sunAny, sunFull: sunAny, earthAny: new Uint8Array(n), earthFull: sunAny };
    const d = dailyFractions(vis, { startMs: 0, stepMinutes: 60, count: n });
    expect(Array.from(d.sun)).toEqual([0.5, 1]);
    expect(Array.from(d.earth)).toEqual([0, 0]);
  });
});

describe('map geometry', () => {
  const R = 1_737_400;
  it('pole at origin; longitude 0 up, 90 E right', () => {
    const pole = toMapXY(-90, 0, R);
    expect(Math.hypot(pole.x, pole.y)).toBeLessThan(1e-6);
    const up = toMapXY(-89, 0, R);
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeGreaterThan(0);
    const right = toMapXY(-89, 90, R);
    expect(right.x).toBeGreaterThan(0);
    expect(right.y).toBeCloseTo(0);
  });
  it('matches the Site04 centre used by the pipeline', () => {
    const p = toMapXY(-89.7668, -171.87, R);
    expect(p.x).toBeCloseTo(-1000, -1);
    expect(p.y).toBeCloseTo(-7000, -1);
  });
  const terrain = (heights: number[], w: number): Terrain => ({
    width: w,
    height: heights.length / w,
    pixelM: 100,
    xMinM: 0,
    xMaxM: w * 100,
    yMinM: 0,
    yMaxM: (heights.length / w) * 100,
    sphereRadiusM: R,
    minHeightM: 0,
    maxHeightM: 0,
    heights: Int16Array.from(heights),
    source: 'test',
  });
  it('pixel of a map point', () => {
    expect(toPixel(terrain([0, 0, 0, 0], 2), 150, 50)).toEqual({ col: 1, row: 1 });
  });
  it('slope facing the light is brighter', () => {
    // Heights rise to the east (+x): a light from the east (az 90) lights the slope less than
    // a light from the west (az 270), which faces it.
    const t = terrain([0, 100, 200, 0, 100, 200, 0, 100, 200], 3);
    const fromEast = hillshade(t, 90, 30, 1)[4] as number;
    const fromWest = hillshade(t, 270, 30, 1)[4] as number;
    expect(fromWest).toBeGreaterThan(fromEast);
  });
});

describe('surface distance', () => {
  it('one degree of latitude is R * pi / 180', () => {
    const R = 1_737_400;
    expect(surfaceDistanceKm(-89, 0, -90, 0, R)).toBeCloseTo((R * Math.PI) / 180 / 1000, 6);
  });
  it('across the pole: 0.5 deg on each side is one degree', () => {
    const R = 1_737_400;
    expect(surfaceDistanceKm(-89.5, 0, -89.5, 180, R)).toBeCloseTo((R * Math.PI) / 180 / 1000, 6);
  });
});

describe('year visibility (stage 6)', () => {
  it('percent of hours with the body visible', () => {
    const r = yearVisibility({
      sunAny: Uint8Array.from([1, 1, 1, 0]),
      earthAny: Uint8Array.from([0, 1, 0, 0]),
    });
    expect(r).toEqual({ hours: 4, sunPct: 75, earthPct: 25 });
  });
});
