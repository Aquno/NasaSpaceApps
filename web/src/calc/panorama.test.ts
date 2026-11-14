import { describe, expect, it } from 'vitest';
import {
  elevationRange,
  fitExaggeration,
  flagRuns,
  trackEvents,
  trackRuns,
  trackSegments,
} from './panorama';

describe('panorama helpers', () => {
  it('splits a path where it crosses azimuth 0/360', () => {
    const segs = trackSegments([350, 355, 2, 8], [1, 1, 1, 1], 0, 4);
    expect(segs.map((s) => s.length)).toEqual([2, 2]);
  });

  it('elevation range covers horizon and paths with margin, whole degrees', () => {
    const r = elevationRange([-2.4, 0.3], [[{ az: 10, el: 5.2 }]], 0.5);
    expect(r).toEqual({ min: -3, max: 6 });
  });

  it('exaggeration fills the height and is at least 1', () => {
    expect(fitExaggeration(10, 400, 4)).toBe(10);
    expect(fitExaggeration(100, 10, 4)).toBe(1);
  });

  it('flag runs with offsets from the mission start', () => {
    expect(flagRuns([0, 1, 1, 0, 0, 1], 1, 4)).toEqual([
      { from: 0, length: 2, on: true },
      { from: 2, length: 2, on: false },
    ]);
  });
});

describe('visible and hidden runs, rises and sets', () => {
  const az = [10, 20, 30, 40, 50];
  const el = [1, 2, 3, 2, 1];
  const flags = [1, 1, 0, 0, 1];
  it('splits the path where the visibility changes, keeping it continuous', () => {
    const runs = trackRuns(az, el, flags, 0, 5);
    expect(runs.map((r) => [r.visible, r.points.length])).toEqual([
      [true, 2],
      [false, 3],
      [true, 2],
    ]);
    expect(runs[1]?.points[0]).toEqual({ az: 20, el: 2 });
  });
  it('marks one set and one rise with their offsets', () => {
    expect(trackEvents(az, el, flags, 0, 5).map((e) => [e.kind, e.offset])).toEqual([
      ['set', 2],
      ['rise', 4],
    ]);
  });
});
